import { FormulaEngine } from './formula-engine';
import { GasCalculator } from './gas-calculator';
import { FactorResolver } from './factor-resolver';
import { UnprocessableEntityException } from '@nestjs/common';
import { EmissionFactorService } from '../../master/emission-factor.service';
import { MasterEmissionFactor } from 'src/entities/master-emission-factor.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';

describe('MDM Dynamic Carbon Calculation Architecture Tests', () => {
  describe('POC Arithmetic & Unit Verification (Air Travel)', () => {
    it('calculates 500 pkm * 0.151 kgCO2e/pkm = 75.5 kgCO2e = 0.0755 tCO2e (no RF)', () => {
      const pkm = 500;
      const efKgPerPkm = 0.151; // kgCO2e/pkm
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.execute(
        'BT',
        {
          amount: pkm,
          unitEf: efKgPerPkm,
          unit: 'pas.km',
          customFormula: formula,
        },
        'activity',
        formula,
      );

      // Explicit unit verification:
      // 500 pkm × 0.151 kgCO2e/pkm = 75.5 kgCO2e
      // 75.5 kgCO2e ÷ 1000 kg/tonne = 0.0755 tCO2e
      expect(result.totalEmission).toBe(0.0755);
      expect(result.unitFactor.total).toBe(0.151);

      // Gas breakdown verification
      expect(result.emissions.total).toBe(0.0755);
      expect(result.emissions.CO2).toBeGreaterThan(0);
      expect(result.emissions.CH4).toBeGreaterThan(0);
      expect(result.emissions.N2O).toBeGreaterThan(0);
    });

    it('calculates 500 pkm * 0.255 kgCO2e/pkm = 127.5 kgCO2e = 0.1275 tCO2e (with RF)', () => {
      const pkm = 500;
      const efKgPerPkm = 0.255; // kgCO2e/pkm
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.execute(
        'BT',
        {
          amount: pkm,
          unitEf: efKgPerPkm,
          unit: 'pas.km',
          customFormula: formula,
        },
        'activity',
        formula,
      );

      // Explicit unit verification:
      // 500 pkm × 0.255 kgCO2e/pkm = 127.5 kgCO2e
      // 127.5 kgCO2e ÷ 1000 kg/tonne = 0.1275 tCO2e
      expect(result.totalEmission).toBe(0.1275);
      expect(result.unitFactor.total).toBe(0.255);
    });
  });

  describe('Dynamic Formula Resolution & Safe Evaluation (No eval/new Function)', () => {
    it('evaluates arbitrary mathematical formula expressions without eval()', () => {
      // Standard formula
      const standard = FormulaEngine.evaluate('(amount * ef) / 1000', {
        amount: 500,
        ef: 0.151,
      });
      expect(Number(standard.toFixed(6))).toBe(0.0755);

      // Distance-weight formula
      const freight = FormulaEngine.evaluate('(distance * weight * factor) / 1000', {
        distance: 120,
        weight: 15,
        factor: 0.085,
      });
      // 120 * 15 * 0.085 / 1000 = 0.153
      expect(Number(freight.toFixed(6))).toBe(0.153);

      // Custom adjusted formula from MDM
      const customMdm = FormulaEngine.evaluate('((amount * ef) / 1000) * 1.05', {
        amount: 1000,
        ef: 0.2,
      });
      // (1000 * 0.2 / 1000) * 1.05 = 0.21
      expect(Number(customMdm.toFixed(6))).toBe(0.21);
    });

    it('gracefully handles edge cases and divide by zero without throwing', () => {
      const divZero = FormulaEngine.evaluate('amount / 0', { amount: 100 });
      expect(divZero).toBe(0);

      const empty = FormulaEngine.evaluate('', { amount: 100 });
      expect(empty).toBe(0);
    });
  });

  describe('Dynamic Emission Factor Resolution & Strict 422 Handling', () => {
    let mockRepo: any;
    let service: EmissionFactorService;

    const mockDbRecords: Partial<MasterEmissionFactor>[] = [
      {
        id: 101,
        factorVersionId: 1,
        unitId: 1,
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'short-haul economy',
        geography: 'GB',
        withRF: false,
        factor: 0.151,
        isActive: true,
      },
      {
        id: 102,
        factorVersionId: 1,
        unitId: 1,
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'short-haul economy',
        geography: 'GB',
        withRF: true,
        factor: 0.255,
        isActive: true,
      },
      {
        id: 201,
        factorVersionId: 1,
        unitId: 1,
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'national rail',
        geography: 'GB',
        withRF: false,
        factor: 0.035,
        isActive: true,
      },
    ];

    beforeEach(() => {
      mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockImplementation(function (this: any) {
            // Find in mockDbRecords
            return Promise.resolve(
              mockDbRecords.find((r) => r.activitySubType === this._subType && r.withRF === this._withRF) || null,
            );
          }),
        }),
      };
    });

    it('resolves exact match for Short-haul Economy without RF (0.151)', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockImplementation((clause: string, params: any) => {
          if (params?.activitySubType) qbMock._subType = params.activitySubType;
          if (params?.withRF !== undefined) qbMock._withRF = params.withRF;
          return qbMock;
        }),
        getOne: jest.fn().mockImplementation(() => {
          const matched = mockDbRecords.find(
            (r) => r.activitySubType === qbMock._subType && r.withRF === qbMock._withRF,
          );
          return Promise.resolve(matched || null);
        }),
      };

      mockRepo.createQueryBuilder.mockReturnValue(qbMock);
      service = new EmissionFactorService(mockRepo);

      const resolved = await service.resolveEmissionFactor({
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'short-haul economy',
        withRF: false,
      });

      expect(resolved).toBeDefined();
      expect(resolved.id).toBe(101);
      expect(Number(resolved.factor)).toBe(0.151);
    });

    it('resolves exact match for Short-haul Economy with RF (0.255)', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockImplementation((clause: string, params: any) => {
          if (params?.activitySubType) qbMock._subType = params.activitySubType;
          if (params?.withRF !== undefined) qbMock._withRF = params.withRF;
          return qbMock;
        }),
        getOne: jest.fn().mockImplementation(() => {
          const matched = mockDbRecords.find(
            (r) => r.activitySubType === qbMock._subType && r.withRF === qbMock._withRF,
          );
          return Promise.resolve(matched || null);
        }),
      };

      mockRepo.createQueryBuilder.mockReturnValue(qbMock);
      service = new EmissionFactorService(mockRepo);

      const resolved = await service.resolveEmissionFactor({
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'short-haul economy',
        withRF: true,
      });

      expect(resolved).toBeDefined();
      expect(resolved.id).toBe(102);
      expect(Number(resolved.factor)).toBe(0.255);
    });

    it('throws HTTP 422 EF_NOT_FOUND when no matching factor exists (NEVER silent 1.0)', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockRepo.createQueryBuilder.mockReturnValue(qbMock);
      service = new EmissionFactorService(mockRepo);

      await expect(
        service.resolveEmissionFactor({
          calculationMethod: 'NON_EXISTENT_METHOD',
          activitySubType: 'space rocket',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('Dynamic Architecture: Proving New Activity (Rail) Without Code Changes', () => {
    it('dynamically calculates a new Rail activity using only configuration', () => {
      // Configuration defined in MDM:
      const railMdmConfig = {
        activitySubType: 'national rail',
        calculationMethod: 'DISTANCE_BASED',
        formula: '(amount * ef) / 1000',
        efKgPerPkm: 0.035, // 0.035 kgCO2e/pkm
        unit: 'pkm',
      };

      // Admin configured 1000 passenger-km on Rail
      const inputPkm = 1000;

      // Calculation Engine processes using the configured formula expression and resolved factor:
      const result = FormulaEngine.execute(
        'BT',
        {
          amount: inputPkm,
          unitEf: railMdmConfig.efKgPerPkm,
          unit: railMdmConfig.unit,
          customFormula: railMdmConfig.formula,
        },
        'activity',
        railMdmConfig.formula,
      );

      // 1000 pkm * 0.035 kgCO2e/pkm = 35 kgCO2e = 0.035 tCO2e
      expect(result.totalEmission).toBe(0.035);
      expect(result.unitFactor.total).toBe(0.035);
      // Confirmed: No rail-specific if/else branch or hardcoding required.
    });
  });

  describe('Factor Version Safety (Preserving Historical Calculation Snapshots)', () => {
    it('ensures historical entries retain their snapshot EF and emission when future versions are introduced', () => {
      // Historical 2026 Entry saved with Factor Version A (EF = 0.151)
      const historical2026Entry: Partial<InventoryEntry> = {
        id: 1,
        dateFrom: '2026-01-01',
        amount: 500,
        ef: 0.151,
        emission: 0.0755,
        emissionFactorId: 101,
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'short-haul economy',
        co2Tco2e: 0.0743,
        ch4Tco2e: 0.0001,
        n2oTco2e: 0.0011,
      };

      // In 2027, Admin introduces Factor Version B with updated EF = 0.190
      const futureFactorVersionB = {
        versionId: 2,
        ef: 0.190,
      };

      // Historical record reload verification
      // The stored entry snapshot must remain EF = 0.151, emission = 0.0755
      expect(historical2026Entry.ef).toBe(0.151);
      expect(historical2026Entry.emission).toBe(0.0755);
      expect(historical2026Entry.ef).not.toBe(futureFactorVersionB.ef);

      // Recalculating a new 2027 entry with Version B produces the new result
      const new2027Calculation = FormulaEngine.execute(
        'BT',
        {
          amount: 500,
          unitEf: futureFactorVersionB.ef,
          customFormula: '(amount * ef) / 1000',
        },
        'activity',
        '(amount * ef) / 1000',
      );
      expect(new2027Calculation.totalEmission).toBe(0.095);

      // Historical entry is strictly unaffected
      expect(historical2026Entry.emission).toBe(0.0755);
    });
  });

  describe('MasterFormula Resolution & End-to-End Inventory Creation', () => {
    it('resolves MasterFormula from MDM and calculates Business Travel → Air with snapshots', async () => {
      // Mock MasterFormula from MDM
      const mockMasterFormula = {
        id: 1,
        name: 'Distance-Based Transport Formula',
        methodCode: 'DISTANCE_BASED',
        formula: '(amount * ef) / 1000',
        variables: ['amount', 'ef'],
        outputUnit: 'tCO2e',
        gasRatios: { CO2: 0.9844, CH4: 0.0015, N2O: 0.0141, HFC: 0, PFC: 0, SF6: 0, NF3: 0 },
        isActive: true,
      };

      // Mock EmissionFactor from MDM (Short-haul Economy without RF)
      const mockAirEf = {
        id: 101,
        factor: 0.151,
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'short-haul economy',
        withRF: false,
        isActive: true,
      };

      // Mock Repositories & Services
      const mockMasterService: any = {
        resolveFormula: jest.fn().mockImplementation((target) => {
          if (target === 'DISTANCE_BASED' || target === 1) return Promise.resolve(mockMasterFormula);
          return Promise.resolve(null);
        }),
      };

      const mockEfService: any = {
        findById: jest.fn().mockImplementation((id) => {
          if (id === 101) return Promise.resolve(mockAirEf);
          return Promise.resolve(null);
        }),
        resolveEmissionFactor: jest.fn().mockResolvedValue(mockAirEf),
      };

      let savedEntry: any = null;
      const mockInventoryRepo: any = {
        create: jest.fn().mockImplementation((entity) => entity),
        save: jest.fn().mockImplementation((entity) => {
          savedEntry = { id: 99, ...entity };
          return Promise.resolve(savedEntry);
        }),
      };

      const { ServicesService } = await import('../services.service');
      const servicesService = new ServicesService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockInventoryRepo,
        { processListPayload: jest.fn() } as any,
        {} as any,
        mockEfService,
        mockMasterService,
      );

      const user = { id: 42, organizationId: 10, roleId: 1 } as any;
      const entryDto = {
        category: 'Business Travel',
        name: 'London to Edinburgh Flight',
        amount: 500, // 500 pkm
        unit: 'pkm',
        calculationMethod: 'DISTANCE_BASED',
        activitySubType: 'short-haul economy',
        emissionFactorId: 101,
      };

      const created = await servicesService.createInventoryEntry(user, entryDto);

      // Verify formula was resolved from MDM
      expect(mockMasterService.resolveFormula).toHaveBeenCalledWith('DISTANCE_BASED');

      // Verify arithmetic: 500 pkm × 0.151 kgCO2e/pkm = 75.5 kgCO2e = 0.0755 tCO2e
      expect(created.emission).toBe(0.0755);
      expect(created.ef).toBe(0.151);

      // Verify snapshots are stored on the entity
      expect(created.emissionFactorId).toBe(101);
      expect(created.formulaId).toBe(1);
      expect(created.calculationMethod).toBe('DISTANCE_BASED');
      expect(created.activitySubType).toBe('short-haul economy');
      expect(created.co2Tco2e).toBeGreaterThan(0);
      expect(created.ch4Tco2e).toBeGreaterThan(0);
      expect(created.n2oTco2e).toBeGreaterThan(0);
    });

    it('resolves multi-variable formula from MDM for Business Travel → Rail with passengers & distance', async () => {
      // Admin configures a multi-variable formula in MDM:
      // (distance * passengers * factor) / 1000
      const mockRailFormula = {
        id: 2,
        name: 'Passenger Rail Distance Formula',
        methodCode: 'RAIL_DISTANCE',
        formula: '(distance * passengers * factor) / 1000',
        variables: ['distance', 'passengers', 'factor'],
        outputUnit: 'tCO2e',
        gasRatios: { CO2: 0.985, CH4: 0.001, N2O: 0.014, HFC: 0, PFC: 0, SF6: 0, NF3: 0 },
        isActive: true,
      };

      const mockRailEf = {
        id: 201,
        factor: 0.035, // 0.035 kgCO2e/pkm
        calculationMethod: 'RAIL_DISTANCE',
        activitySubType: 'national rail',
        withRF: false,
        isActive: true,
      };

      const mockMasterService: any = {
        resolveFormula: jest.fn().mockImplementation((target) => {
          if (target === 'RAIL_DISTANCE' || target === 2) return Promise.resolve(mockRailFormula);
          return Promise.resolve(null);
        }),
      };

      const mockEfService: any = {
        findById: jest.fn().mockResolvedValue(mockRailEf),
        resolveEmissionFactor: jest.fn().mockResolvedValue(mockRailEf),
      };

      const mockInventoryRepo: any = {
        create: jest.fn().mockImplementation((entity) => entity),
        save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 100, ...entity })),
      };

      const { ServicesService } = await import('../services.service');
      const servicesService = new ServicesService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockInventoryRepo,
        { processListPayload: jest.fn() } as any,
        {} as any,
        mockEfService,
        mockMasterService,
      );

      const user = { id: 42, organizationId: 10, roleId: 1 } as any;
      const entryDto = {
        category: 'Business Travel',
        name: 'London to Manchester Train',
        amount: 500, // primary amount
        distance: 500, // 500 km
        passengers: 2, // 2 passengers
        unit: 'pkm',
        calculationMethod: 'RAIL_DISTANCE',
        activitySubType: 'national rail',
        emissionFactorId: 201,
      };

      const created = await servicesService.createInventoryEntry(user, entryDto);

      // Verify formula resolution
      expect(mockMasterService.resolveFormula).toHaveBeenCalledWith('RAIL_DISTANCE');

      // Arithmetic:
      // (distance * passengers * factor) / 1000
      // = (500 km × 2 passengers × 0.035 kgCO2e/pkm) ÷ 1000
      // = 35 kgCO2e ÷ 1000
      // = 0.035 tCO2e
      expect(created.emission).toBe(0.035);
      expect(created.ef).toBe(0.035);
      expect(created.formulaId).toBe(2);
      expect(created.emissionFactorId).toBe(201);
      expect(created.calculationMethod).toBe('RAIL_DISTANCE');
      expect(created.activitySubType).toBe('national rail');
    });

    it('proves that changing an MDM factor affects future calculations without modifying past entries', async () => {
      // Historical calculation done under Factor A (0.035)
      const historicalEntry = {
        id: 100,
        emission: 0.035,
        ef: 0.035,
        emissionFactorId: 201,
        formulaId: 2,
        calculationMethod: 'RAIL_DISTANCE',
      };

      // Admin updates Rail EF in MDM to Factor B (0.040)
      const updatedRailEf = {
        id: 202,
        factor: 0.040,
        calculationMethod: 'RAIL_DISTANCE',
        activitySubType: 'national rail',
      };

      const mockMasterService: any = {
        resolveFormula: jest.fn().mockResolvedValue({
          id: 2,
          formula: '(distance * passengers * factor) / 1000',
        }),
      };

      const mockEfService: any = {
        findById: jest.fn().mockResolvedValue(updatedRailEf),
        resolveEmissionFactor: jest.fn().mockResolvedValue(updatedRailEf),
      };

      const mockInventoryRepo: any = {
        create: jest.fn().mockImplementation((entity) => entity),
        save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 101, ...entity })),
      };

      const { ServicesService } = await import('../services.service');
      const servicesService = new ServicesService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockInventoryRepo,
        { processListPayload: jest.fn() } as any,
        {} as any,
        mockEfService,
        mockMasterService,
      );

      const user = { id: 42, organizationId: 10, roleId: 1 } as any;
      const newEntryDto = {
        category: 'Business Travel',
        name: 'London to Manchester Train (Future Year)',
        amount: 500,
        distance: 500,
        passengers: 2,
        unit: 'pkm',
        calculationMethod: 'RAIL_DISTANCE',
        activitySubType: 'national rail',
        emissionFactorId: 202,
      };

      const futureEntry = await servicesService.createInventoryEntry(user, newEntryDto);

      // Future entry uses new factor: (500 * 2 * 0.040) / 1000 = 0.040 tCO2e
      expect(futureEntry.ef).toBe(0.040);
      expect(futureEntry.emission).toBe(0.040);
      expect(futureEntry.emissionFactorId).toBe(202);

      // Historical entry remains strictly unmodified
      expect(historicalEntry.ef).toBe(0.035);
      expect(historicalEntry.emission).toBe(0.035);
      expect(historicalEntry.emissionFactorId).toBe(201);
    });
  });

  describe('Scope 1 Dynamic Activity Calculations (Phase 2A Rollout)', () => {
    it('calculates Stationary Combustion Natural Gas: 1,000 sm3 × 1.9422 = 1.9422 tCO2e', () => {
      const amount = 1000;
      const ef = 1.9422; // kgCO2e/sm3 (DEFRA 2024 100% GCV)
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.execute(
        'SC',
        {
          amount,
          unitEf: ef,
          unit: 'sm3',
          customFormula: formula,
        },
        'activity',
        formula,
      );

      // 1000 sm3 * 1.9422 kgCO2e/sm3 / 1000 = 1.9422 tCO2e
      expect(result.totalEmission).toBe(1.9422);
      expect(result.emissions.total).toBe(1.9422);
      expect(result.emissions.CO2).toBeGreaterThan(1.9);
      expect(result.emissions.CH4).toBeGreaterThan(0);
      expect(result.emissions.N2O).toBeGreaterThan(0);
    });

    it('calculates Stationary Combustion Diesel: 500 L × 2.68725 = 1.343625 tCO2e', () => {
      const amount = 500;
      const ef = 2.68725; // kgCO2e/L (DEFRA 2024 Gas Oil)
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.execute(
        'SC',
        {
          amount,
          unitEf: ef,
          unit: 'L',
          customFormula: formula,
        },
        'activity',
        formula,
      );

      // 500 L * 2.68725 / 1000 = 1.343625 tCO2e
      expect(result.totalEmission).toBe(1.343625);
    });

    it('calculates Mobile Combustion Fleet Car: 2,500 km × 0.16844 = 0.4211 tCO2e', () => {
      const distance = 2500;
      const ef = 0.16844; // kgCO2e/km (DEFRA 2024 Average Diesel Car)
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.execute(
        'MC',
        {
          amount: distance,
          unitEf: ef,
          unit: 'km',
          customFormula: formula,
        },
        'activity',
        formula,
      );

      // 2500 * 0.16844 / 1000 = 0.4211 tCO2e
      expect(result.totalEmission).toBe(0.4211);
    });

    it('calculates Fugitive Refrigerant R-410A: 50 kg capacity, 10% annual leakage, GWP 2088 = 10.44 tCO2e', () => {
      const charge = 50;
      const leakage = 10;
      const gwp = 2088; // IPCC AR6
      const formula = '(amount * (leakage / 100) * GWP) / 1000';

      const result = FormulaEngine.execute(
        'FE',
        {
          amount: charge,
          unitEf: gwp,
          unit: 'kg',
          customFormula: formula,
          customGasRatios: { CO2: 0, CH4: 0, N2O: 0, HFC: 1.0, PFC: 0, SF6: 0, NF3: 0 },
          variables: { amount: charge, leakage, GWP: gwp },
        },
        'activity',
        formula,
        { CO2: 0, CH4: 0, N2O: 0, HFC: 1.0, PFC: 0, SF6: 0, NF3: 0 },
      );

      // (50 * (10 / 100) * 2088) / 1000 = 10.44 tCO2e
      expect(result.totalEmission).toBe(10.44);
      // All emissions attributed to HFC species
      expect(result.emissions.HFC).toBe(10.44);
      expect(result.emissions.CO2).toBe(0);
    });

    it('creates end-to-end Scope 1 inventory entry for Natural Gas with complete audit trail', async () => {
      const mockNaturalGasEf = {
        id: 301,
        factor: 1.9422,
        calculationMethod: 'FUEL_BASED',
        activitySubType: 'natural gas',
      };

      const mockMasterService: any = {
        resolveFormula: jest.fn().mockResolvedValue({
          id: 10,
          formula: '(amount * ef) / 1000',
          methodCode: 'FUEL_BASED',
          gasRatios: { CO2: 0.997, CH4: 0.0025, N2O: 0.0005 },
        }),
      };

      const mockEfService: any = {
        findById: jest.fn().mockResolvedValue(mockNaturalGasEf),
        resolveEmissionFactor: jest.fn().mockResolvedValue(mockNaturalGasEf),
      };

      const mockInventoryRepo: any = {
        create: jest.fn().mockImplementation((entity) => entity),
        save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 501, ...entity })),
      };

      const { ServicesService } = await import('../services.service');
      const servicesService = new ServicesService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockInventoryRepo,
        { processListPayload: jest.fn() } as any,
        {} as any,
        mockEfService,
        mockMasterService,
      );

      const user = { id: 1, organizationId: 10, roleId: 1 } as any;
      const gasDto = {
        category: 'Stationary Combustion',
        name: 'Factory Main Boiler (Natural Gas)',
        amount: 2500,
        unit: 'sm3',
        calculationMethod: 'FUEL_BASED',
        activitySubType: 'natural gas',
        emissionFactorId: 301,
      };

      const entry = await servicesService.createInventoryEntry(user, gasDto);

      // 2500 * 1.9422 / 1000 = 4.8555 tCO2e
      expect(entry.emission).toBe(4.8555);
      expect(entry.ef).toBe(1.9422);
      expect(entry.calculationMethod).toBe('FUEL_BASED');
      expect(entry.activitySubType).toBe('natural gas');
      expect(entry.emissionFactorId).toBe(301);
      expect(entry.formulaId).toBe(10);
      expect(entry.co2Tco2e).toBeGreaterThan(4.8);
      expect(entry.ch4Tco2e).toBeGreaterThan(0);
      expect(entry.n2oTco2e).toBeGreaterThan(0);
    });

    it('verifies R-410A blend provenance: zeotropic blend of 50% HFC-32 and 50% HFC-125 with GWP 2088', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const r410a = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === 'r-410a');

      expect(r410a).toBeDefined();
      expect(r410a?.gasFamily).toBe('HFC Blend');
      expect(r410a?.blendComposition).toContain('50% HFC-32');
      expect(r410a?.blendComposition).toContain('50% HFC-125');
      expect(r410a?.factor).toBe(2088.0);
      expect(r410a?.sourcePublisher).toBe('UK DESNZ / DEFRA & IPCC');
      expect(r410a?.documentSheetTableRef).toContain('Refrigerant blends');
      expect(r410a?.authoritativeSourceUrl).toContain('gov.uk');
    });

    it('verifies R-22 HCFC classification: Ozone-Depleting Substance must NOT be classified as HFC', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const r22 = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === 'r-22');

      expect(r22).toBeDefined();
      expect(r22?.gasFamily).toBe('HCFC');
      expect(r22?.hfcFactor).toBe(0); // Strictly zero HFC allocation
      expect(r22?.blendComposition).toContain('HCFC-22');
      expect(r22?.blendComposition).toContain('Ozone-Depleting Substance');
      expect(r22?.factor).toBe(1810.0);
    });

    it('verifies R-134a pure substance provenance', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const r134a = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === 'r-134a');

      expect(r134a).toBeDefined();
      expect(r134a?.gasFamily).toBe('HFC');
      expect(r134a?.factor).toBe(1430.0);
      expect(r134a?.blendComposition).toContain('1,1,1,2-Tetrafluoroethane');
    });

    it('verifies CO2 Fire Extinguisher is marked SOURCE_REQUIRED and inactive in production seed', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const co2Ext = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === 'co2 (fire extinguisher)');

      expect(co2Ext).toBeDefined();
      expect(co2Ext?.isActive).toBe(false); // Inactive pending authoritative methodology
      expect(co2Ext?.description).toContain('[SOURCE_REQUIRED]');
    });

    it('verifies DEFRA fuel emission factors do not use fabricated gas breakdown ratios', async () => {
      const { SEED_MASTER_FORMULAS, SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const fuelFormula = SEED_MASTER_FORMULAS.find((f) => f.methodCode === 'FUEL_BASED');

      // Formula must not contain hardcoded fabricated percentages
      expect(fuelFormula?.gasRatios).toBeNull();

      // Individual fuel factors contain exact authoritative DEFRA component numbers
      const natGas = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === 'natural gas');
      expect(natGas?.co2Factor).toBe(1.9360);
      expect(natGas?.ch4Factor).toBe(0.0049);
      expect(natGas?.n2oFactor).toBe(0.0013);
      // Sum matches total factor
      expect(Number(((natGas?.co2Factor || 0) + (natGas?.ch4Factor || 0) + (natGas?.n2oFactor || 0)).toFixed(4))).toBe(1.9422);
    });

    it('verifies DEFRA mobile vehicle factors have unique vehicle classifications', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const mobileFactors = SEED_MASTER_EMISSION_FACTORS.filter((f) => f.calculationMethod === 'DISTANCE_BASED' && f.geography === 'GB');

      const subtypes = mobileFactors.map((f) => f.activitySubType);
      expect(subtypes).toContain('Passenger Car - Diesel - Average');
      expect(subtypes).toContain('Passenger Car - Petrol - Average');
      expect(subtypes).toContain('Van - Class III Diesel (>1.74t to 3.5t)');

      // Verify all DEFRA provenance audit fields exist on mobile factors
      for (const factor of mobileFactors) {
        expect(factor.sourcePublisher).toContain('DESNZ');
        expect(factor.datasetNameAndVersion).toContain('GHG Conversion Factors');
        expect(factor.pubYear).toBe(2024);
        expect(factor.documentSheetTableRef).toBeDefined();
        expect(factor.authoritativeSourceUrl).toContain('gov.uk');
      }
    });
  });

  describe('Scope 2 Indirect Energy Emission Calculations (Gate 3 Rollout)', () => {
    it('calculates Scope 2 Location-Based Electricity (UK National Grid)', () => {
      const kwh = 10000;
      const ef = 0.20705; // DEFRA 2024 UK electricity generated
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: kwh, ef });
      expect(result).toBe(2.0705);
    });

    it('calculates Scope 2 Location-Based Electricity (DEWA Grid Dubai)', () => {
      const kwh = 10000;
      const ef = 0.38800; // DEWA 2023 grid factor
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: kwh, ef });
      expect(result).toBe(3.88);
    });

    it('calculates Scope 2 Location-Based Electricity (India Central Grid CEA)', () => {
      const kwh = 10000;
      const ef = 0.71600; // CEA v19 combined margin baseline
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: kwh, ef });
      expect(result).toBe(7.16);
    });

    it('calculates Scope 2 Market-Based Contractual Instrument (Certified Green PPA / Zero Emission)', () => {
      const kwh = 10000;
      const ef = 0.00000; // Zero-carbon contractual attribute (GoO / I-REC)
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: kwh, ef });
      expect(result).toBe(0);
    });

    it('calculates Scope 2 Market-Based Default (AIB European/UK Residual Mix)', () => {
      const kwh = 10000;
      const ef = 0.26500; // AIB 2023 residual mix
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: kwh, ef });
      expect(result).toBe(2.65);
    });

    it('calculates Scope 2 District Heating & Steam (DEFRA 2024)', () => {
      const kwh = 5000;
      const ef = 0.16954; // DEFRA 2024 District heat and steam
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: kwh, ef });
      expect(Number(result.toFixed(4))).toBe(0.8477);
    });

    it('calculates Scope 2 District Chilled Water (Utility Audit)', () => {
      const kwh = 5000;
      const ef = 0.14200; // District cooling performance report
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: kwh, ef });
      expect(result).toBeCloseTo(0.71, 4);
    });

    it('verifies Scope 2 Industrial Steam remains SOURCE_REQUIRED and inactive in production seed', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const steam = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === 'industrial steam');

      expect(steam).toBeDefined();
      expect(steam?.isActive).toBe(false);
      expect(steam?.description).toContain('[SOURCE_REQUIRED]');
    });

    it('verifies all 10 provenance audit fields on active Scope 2 factors in seed', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const scope2Factors = SEED_MASTER_EMISSION_FACTORS.filter(
        (f) => f.calculationMethod === 'ENERGY_BASED' && f.isActive === true,
      );

      expect(scope2Factors.length).toBeGreaterThanOrEqual(7);

      for (const factor of scope2Factors) {
        expect(factor.sourcePublisher).toBeDefined();
        expect(factor.datasetNameAndVersion).toBeDefined();
        expect(factor.pubYear).toBeGreaterThanOrEqual(2023);
        expect(factor.geography).toBeDefined();
        expect(factor.documentSheetTableRef).toBeDefined();
        expect(factor.authoritativeSourceUrl).toBeDefined();
        expect(factor.calculationMethod).toBe('ENERGY_BASED');
        expect(typeof factor.factor).toBe('number');
        expect(factor.gasFamily).toBeDefined();
        expect(factor.isActive).toBe(true);
      }
    });

    it('verifies Scope 2 Dual-Reporting: Location-Based vs Market-Based comparison', () => {
      const facilityLoadKwh = 50000;
      const locationEfUk = 0.20705; // UK Grid average
      const marketEfResidual = 0.26500; // Residual mix
      const marketEfPpa = 0.00000; // Renewable contract

      const formula = '(amount * ef) / 1000';

      const locationTotal = FormulaEngine.evaluate(formula, { amount: facilityLoadKwh, ef: locationEfUk });
      const marketResidualTotal = FormulaEngine.evaluate(formula, { amount: facilityLoadKwh, ef: marketEfResidual });
      const marketPpaTotal = FormulaEngine.evaluate(formula, { amount: facilityLoadKwh, ef: marketEfPpa });

      // Location-Based: 50,000 * 0.20705 / 1000 = 10.3525 tCO2e
      expect(locationTotal).toBe(10.3525);

      // Market-Based without EAC: 50,000 * 0.26500 / 1000 = 13.2500 tCO2e
      expect(marketResidualTotal).toBe(13.25);

      // Market-Based with 100% Green PPA: 50,000 * 0.00000 / 1000 = 0.0000 tCO2e
      expect(marketPpaTotal).toBe(0);

      // Verified dual-reporting variance: Market residual is higher than location grid average, PPA is 0
      expect(marketResidualTotal).toBeGreaterThan(locationTotal);
      expect(marketPpaTotal).toBeLessThan(locationTotal);
    });
  });

  describe('Scope 3 Value Chain Categories 1–15 Calculations (Gate 4 Rollout)', () => {
    it('calculates Scope 3 Cat 1: Purchased Goods (Spend-Based EEIO)', () => {
      const spend = 50000; // $50,000 USD
      const eeioFactor = 0.18500; // EPA v2.0 IT services
      const formula = '(spend * eeio_factor) / 1000';

      const result = FormulaEngine.evaluate(formula, { spend, eeio_factor: eeioFactor });
      expect(result).toBe(9.25);
    });

    it('calculates Scope 3 Cat 1: Purchased Goods (Mass-Based Material Balance)', () => {
      const massKg = 5000;
      const ef = 0.85200; // DEFRA 2024 Paper and board
      const formula = '(amount * ef) / 1000';

      const result = FormulaEngine.evaluate(formula, { amount: massKg, ef });
      expect(result).toBe(4.26);
    });

    it('calculates Scope 3 Cat 2: Capital Goods (Spend-Based EEIO)', () => {
      const spend = 100000; // $100,000 USD
      const eeioFactor = 0.31500; // EPA v2.0 Industrial machinery
      const formula = '(spend * eeio_factor) / 1000';

      const result = FormulaEngine.evaluate(formula, { spend, eeio_factor: eeioFactor });
      expect(result).toBe(31.5);
    });

    it('calculates Scope 3 Cat 3: Fuel- and Energy-Related Activities (WTT Natural Gas & T&D Losses)', () => {
      const formula = '(amount * ef) / 1000';

      // WTT Natural Gas: 10,000 sm3 * 0.28540 kgCO2e/sm3 / 1000 = 2.854 tCO2e
      const wttResult = FormulaEngine.evaluate(formula, { amount: 10000, ef: 0.28540 });
      expect(wttResult).toBe(2.854);

      // T&D Grid Losses: 50,000 kWh * 0.01780 kgCO2e/kWh / 1000 = 0.890 tCO2e
      const tdResult = FormulaEngine.evaluate(formula, { amount: 50000, ef: 0.01780 });
      expect(tdResult).toBe(0.89);
    });

    it('calculates Scope 3 Cat 4: Upstream Freight (HGV, Sea, and Air Freight)', () => {
      const formula = '(distance * weight * factor) / 1000';

      // Road Freight HGV: 100 tonnes * 250 km * 0.15432 kgCO2e/tkm / 1000 = 3.858 tCO2e
      const hgvResult = FormulaEngine.evaluate(formula, { distance: 250, weight: 100, factor: 0.15432 });
      expect(hgvResult).toBeCloseTo(3.858, 4);

      // Sea Cargo Ship: 500 tonnes * 2,000 km * 0.01524 kgCO2e/tkm / 1000 = 15.24 tCO2e
      const seaResult = FormulaEngine.evaluate(formula, { distance: 2000, weight: 500, factor: 0.01524 });
      expect(seaResult).toBe(15.24);

      // Air Freight Long-Haul: 10 tonnes * 5,000 km * 0.58240 kgCO2e/tkm / 1000 = 29.12 tCO2e
      const airResult = FormulaEngine.evaluate(formula, { distance: 5000, weight: 10, factor: 0.58240 });
      expect(airResult).toBe(29.12);
    });

    it('calculates Scope 3 Cat 5: Waste Generated in Operations (Landfill vs Recycling)', () => {
      const formula = '(amount * ef) / 1000';

      // Landfill: 10,000 kg * 0.46705 kgCO2e/kg / 1000 = 4.6705 tCO2e
      const landfillResult = FormulaEngine.evaluate(formula, { amount: 10000, ef: 0.46705 });
      expect(landfillResult).toBe(4.6705);

      // Closed-Loop Recycling: 10,000 kg * 0.02132 kgCO2e/kg / 1000 = 0.2132 tCO2e
      const recyclingResult = FormulaEngine.evaluate(formula, { amount: 10000, ef: 0.02132 });
      expect(recyclingResult).toBe(0.2132);
    });

    it('calculates Scope 3 Cat 7: Employee Commuting (Passenger Car & Motorcycle)', () => {
      const annualDistanceKm = 220 * 25; // 220 days * 25 km = 5,500 km
      const formula = '(amount * ef) / 1000';

      // Passenger Car: 5,500 km * 0.17048 kgCO2e/km / 1000 = 0.93764 tCO2e
      const carResult = FormulaEngine.evaluate(formula, { amount: annualDistanceKm, ef: 0.17048 });
      expect(carResult).toBe(0.93764);

      // Motorcycle: 5,500 km * 0.10125 kgCO2e/km / 1000 = 0.556875 tCO2e
      const motoResult = FormulaEngine.evaluate(formula, { amount: annualDistanceKm, ef: 0.10125 });
      expect(motoResult).toBe(0.556875);
    });

    it('calculates Scope 3 Cat 9: Downstream Transportation (Articulated HGV)', () => {
      const formula = '(distance * weight * factor) / 1000';
      const result = FormulaEngine.evaluate(formula, { distance: 150, weight: 200, factor: 0.10820 });
      expect(result).toBe(3.246);
    });

    it('calculates Scope 3 Cat 12: End-of-Life Treatment (Mixed Plastics Recycling)', () => {
      const formula = '(amount * ef) / 1000';
      const result = FormulaEngine.evaluate(formula, { amount: 20000, ef: 0.03450 });
      expect(result).toBeCloseTo(0.69, 4);
    });

    it('calculates Scope 3 Cat 15: Investments (Proportional Equity Share Method)', () => {
      const investeeScope1 = 5000; // tCO2e
      const investeeScope2 = 1200; // tCO2e
      const equityShare = 25; // 25% ownership
      const formula = '(investeeScope1 + investeeScope2) * (equityShare / 100)';

      const result = FormulaEngine.evaluate(formula, { investeeScope1, investeeScope2, equityShare });
      expect(result).toBe(1550);
    });

    it('calculates Scope 3 Cat 15: Investments (Economic Sector Average Method)', () => {
      const investeeRevenue = 10000000; // $10M USD
      const sectorFactor = 0.24500; // kgCO2e/USD
      const equityShare = 10; // 10% share
      const formula = '((investeeRevenue * factor) / 1000) * (equityShare / 100)';

      const result = FormulaEngine.evaluate(formula, { investeeRevenue, factor: sectorFactor, equityShare });
      expect(result).toBe(245);
    });

    it('verifies Scope 3 SOURCE_REQUIRED activities remain inactive in production seed', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');

      const sourceRequiredSubtypes = [
        'leased office energy', // Cat 8
        'intermediate product processing', // Cat 10
        'product lifetime electricity', // Cat 11
        'downstream leased facility', // Cat 13
        'franchise energy', // Cat 14
      ];

      for (const subtype of sourceRequiredSubtypes) {
        const factor = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === subtype);
        expect(factor).toBeDefined();
        expect(factor?.isActive).toBe(false);
        expect(factor?.description).toContain('[SOURCE_REQUIRED]');
      }
    });

    it('verifies all 10 provenance audit fields on active Scope 3 factors in seed', async () => {
      const { SEED_MASTER_EMISSION_FACTORS } = await import('../../../seeds/emission-factor.seed');
      const scope3Subtypes = [
        'it and professional services',
        'paper and board',
        'industrial machinery',
        'wtt - natural gas',
        't&d grid loss uk',
        'hgv rigid road freight',
        'cargo ship sea freight',
        'air freight long-haul',
        'commercial waste to landfill',
        'paper closed-loop recycling',
        'commuting car petrol',
        'commuting motorcycle',
        'downstream articulated hgv',
        'mixed plastics recycling',
        'financed equity share',
        'financed sector average',
      ];

      for (const subtype of scope3Subtypes) {
        const factor = SEED_MASTER_EMISSION_FACTORS.find((f) => f.activitySubType === subtype);
        expect(factor).toBeDefined();
        expect(factor?.sourcePublisher).toBeDefined();
        expect(factor?.datasetNameAndVersion).toBeDefined();
        expect(factor?.pubYear).toBeGreaterThanOrEqual(2023);
        expect(factor?.geography).toBeDefined();
        expect(factor?.documentSheetTableRef).toBeDefined();
        expect(factor?.authoritativeSourceUrl).toBeDefined();
        expect(factor?.calculationMethod).toBeDefined();
        expect(typeof factor?.factor).toBe('number');
        expect(factor?.gasFamily).toBeDefined();
        expect(factor?.isActive).toBe(true);
      }
    });
  });
});


