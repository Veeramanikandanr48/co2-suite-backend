import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { FactorResolutionService } from './factor-resolution.service';
import { VersionFuelMapping } from 'src/entities/version-fuel-mapping.entity';
import { FuelUnitMapping } from 'src/entities/fuel-unit-mapping.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';

describe('FactorResolutionService', () => {
  let service: FactorResolutionService;
  let versionFuelRepoMock: any;
  let fuelUnitRepoMock: any;
  let versionRepoMock: any;
  let fuelRepoMock: any;
  let emissionFactorRepoMock: any;

  beforeEach(async () => {
    versionFuelRepoMock = { findOne: jest.fn() };
    fuelUnitRepoMock = { findOne: jest.fn() };
    versionRepoMock = { findOne: jest.fn() };
    fuelRepoMock = { findOne: jest.fn() };
    emissionFactorRepoMock = { findOne: jest.fn(), find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactorResolutionService,
        {
          provide: getRepositoryToken(VersionFuelMapping),
          useValue: versionFuelRepoMock,
        },
        {
          provide: getRepositoryToken(FuelUnitMapping),
          useValue: fuelUnitRepoMock,
        },
        {
          provide: getRepositoryToken(MasterFactorVersion),
          useValue: versionRepoMock,
        },
        {
          provide: getRepositoryToken(MasterFuel),
          useValue: fuelRepoMock,
        },
        {
          provide: getRepositoryToken(EmissionFactor),
          useValue: emissionFactorRepoMock,
        },
      ],
    }).compile();

    service = module.get<FactorResolutionService>(FactorResolutionService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Tier 1 Test ─────────────────────────────────────────────────────────────
  it('should resolve Tier 1: VERSION_FUEL_UNIT when both version-fuel and fuel-unit mappings exist', async () => {
    versionFuelRepoMock.findOne.mockResolvedValue({
      emissionFactor: 1.938,
      masterFactorVersion: { version: '2024', datasource: { name: 'DEFRA' } },
    });
    fuelUnitRepoMock.findOne.mockResolvedValue({
      emissionFactor: 2.15,
      masterUnit: { symbol: 'L', name: 'Litre' },
    });

    const result = await service.resolveEmissionFactor({
      factorVersionId: 1,
      fuelId: 2,
      unitId: 3,
    });

    expect(result.resolutionLevel).toBe('VERSION_FUEL_UNIT');
    expect(result.emissionFactor).toBe(2.15);
    expect(result.efSource).toContain('DEFRA (2024) - L');
  });

  // ─── Tier 2 Test ─────────────────────────────────────────────────────────────
  it('should resolve Tier 2: VERSION_FUEL when version-fuel mapping exists but no fuel-unit mapping', async () => {
    versionFuelRepoMock.findOne.mockResolvedValue({
      emissionFactor: 1.938,
      masterFactorVersion: { version: '2024', datasource: { name: 'DEFRA' } },
    });
    fuelUnitRepoMock.findOne.mockResolvedValue(null);

    const result = await service.resolveEmissionFactor({
      factorVersionId: 1,
      fuelId: 2,
      unitId: 3,
    });

    expect(result.resolutionLevel).toBe('VERSION_FUEL');
    expect(result.emissionFactor).toBe(1.938);
    expect(result.efSource).toBe('DEFRA 2024 (Version-Fuel Mapping)');
  });

  // ─── Tier 3 Test ─────────────────────────────────────────────────────────────
  it('should resolve Tier 3: FUEL_UNIT when fuel-unit mapping exists but version mapping is absent', async () => {
    versionFuelRepoMock.findOne.mockResolvedValue(null);
    fuelUnitRepoMock.findOne.mockResolvedValue({
      emissionFactor: 2.68,
      masterFuel: { name: 'Diesel' },
      masterUnit: { symbol: 'kWh' },
    });

    const result = await service.resolveEmissionFactor({
      factorVersionId: 1,
      fuelId: 2,
      unitId: 3,
    });

    expect(result.resolutionLevel).toBe('FUEL_UNIT');
    expect(result.emissionFactor).toBe(2.68);
    expect(result.efSource).toBe('Diesel per kWh (Fuel-Unit Mapping)');
  });

  // ─── Tier 4 Test ─────────────────────────────────────────────────────────────
  it('should resolve Tier 4: FACTOR_VERSION_BASELINE when version baseline exists but no fuel mappings exist', async () => {
    versionFuelRepoMock.findOne.mockResolvedValue(null);
    fuelUnitRepoMock.findOne.mockResolvedValue(null);
    versionRepoMock.findOne.mockResolvedValue({
      emissionFactor: 1.5,
      version: '2024',
      datasource: { name: 'IPCC' },
    });

    const result = await service.resolveEmissionFactor({
      factorVersionId: 1,
      fuelId: 2,
      unitId: 3,
    });

    expect(result.resolutionLevel).toBe('FACTOR_VERSION_BASELINE');
    expect(result.emissionFactor).toBe(1.5);
    expect(result.efSource).toBe('IPCC 2024 Baseline');
  });

  // ─── Tier 5 Test ─────────────────────────────────────────────────────────────
  it('should resolve Tier 5: MASTER_FUEL_BASELINE when only master fuel fallback emission factor exists', async () => {
    versionFuelRepoMock.findOne.mockResolvedValue(null);
    fuelUnitRepoMock.findOne.mockResolvedValue(null);
    versionRepoMock.findOne.mockResolvedValue(null);
    fuelRepoMock.findOne.mockResolvedValue({
      emissionFactor: 2.31,
      name: 'Petrol',
    });

    const result = await service.resolveEmissionFactor({
      fuelId: 2,
    });

    expect(result.resolutionLevel).toBe('MASTER_FUEL_BASELINE');
    expect(result.emissionFactor).toBe(2.31);
    expect(result.efSource).toBe('Petrol Baseline Factor');
  });

  // ─── Phase 2 Adversarial Scenario Tests ─────────────────────────────────────
  describe('Adversarial & Edge Case Factor Resolution', () => {
    it('1. Exact V2 factor exists -> V2 selected', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        {
          datasetVersionId: 1,
          fuelId: 2,
          unitId: 3,
          factorValue: 2.68,
          isActive: true,
          unit: { symbol: 'kg' },
          datasetVersion: { datasource: { name: 'DEFRA' }, version: '2024' },
        },
      ]);

      const result = await service.resolveEmissionFactor({
        factorVersionId: 1,
        fuelId: 2,
        unitId: 3,
      });

      expect(result.resolutionLevel).toBe('V2_EMISSION_FACTOR');
      expect(result.emissionFactor).toBe(2.68);
    });

    it('2. Two V2 factors match -> Ambiguity error thrown', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        { id: 10, factorValue: 2.68, isActive: true },
        { id: 11, factorValue: 2.75, isActive: true },
      ]);

      await expect(
        service.resolveEmissionFactor({
          factorVersionId: 1,
          fuelId: 2,
          unitId: 3,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('3. V2 factor exists but wrong geography -> Fallback or empty', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        { id: 10, geographyId: 99, factorValue: 2.68, isActive: true },
      ]);

      // When searching for geographyId 1, non-matching geography factor is excluded
      versionFuelRepoMock.findOne.mockResolvedValue(null);
      fuelUnitRepoMock.findOne.mockResolvedValue(null);
      versionRepoMock.findOne.mockResolvedValue(null);
      fuelRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.resolveEmissionFactor({
          factorVersionId: 1,
          fuelId: 2,
          unitId: 3,
          geographyId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('4. V2 factor exists but wrong unit -> Rejected from V2', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([]);

      versionFuelRepoMock.findOne.mockResolvedValue(null);
      fuelUnitRepoMock.findOne.mockResolvedValue(null);
      versionRepoMock.findOne.mockResolvedValue(null);
      fuelRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.resolveEmissionFactor({
          factorVersionId: 1,
          fuelId: 2,
          unitId: 999,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5. V2 factor expired -> Rejected due to activityDate', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        {
          id: 10,
          validFrom: '2020-01-01',
          validTo: '2022-12-31',
          factorValue: 2.68,
          isActive: true,
        },
      ]);

      versionFuelRepoMock.findOne.mockResolvedValue(null);
      fuelUnitRepoMock.findOne.mockResolvedValue(null);
      versionRepoMock.findOne.mockResolvedValue(null);
      fuelRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.resolveEmissionFactor({
          factorVersionId: 1,
          fuelId: 2,
          unitId: 3,
          activityDate: '2024-06-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('6. V2 factor not applicable to activity type -> Rejected', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        {
          id: 10,
          activityTypeId: 5,
          factorValue: 2.68,
          isActive: true,
        },
      ]);

      versionFuelRepoMock.findOne.mockResolvedValue(null);
      fuelUnitRepoMock.findOne.mockResolvedValue(null);
      versionRepoMock.findOne.mockResolvedValue(null);
      fuelRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.resolveEmissionFactor({
          factorVersionId: 1,
          fuelId: 2,
          unitId: 3,
          activityTypeId: 99,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('7. V2 factor exists and legacy factor exists -> V2 wins', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        {
          datasetVersionId: 1,
          fuelId: 2,
          unitId: 3,
          factorValue: 3.14,
          isActive: true,
          unit: { symbol: 'L' },
          datasetVersion: { datasource: { name: 'EPA' }, version: '2024' },
        },
      ]);

      versionFuelRepoMock.findOne.mockResolvedValue({
        emissionFactor: 1.938,
        masterFactorVersion: { version: '2024', datasource: { name: 'DEFRA' } },
      });

      const result = await service.resolveEmissionFactor({
        factorVersionId: 1,
        fuelId: 2,
        unitId: 3,
      });

      expect(result.resolutionLevel).toBe('V2_EMISSION_FACTOR');
      expect(result.emissionFactor).toBe(3.14);
    });

    it('8. V2 factor exists but inactive -> Must not resolve', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        { id: 10, factorValue: 2.68, isActive: false },
      ]);

      versionFuelRepoMock.findOne.mockResolvedValue(null);
      fuelUnitRepoMock.findOne.mockResolvedValue(null);
      versionRepoMock.findOne.mockResolvedValue(null);
      fuelRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.resolveEmissionFactor({
          factorVersionId: 1,
          fuelId: 2,
          unitId: 3,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('9. Dataset is future-dated -> Must not resolve', async () => {
      emissionFactorRepoMock.find.mockResolvedValue([
        {
          id: 10,
          factorValue: 2.68,
          isActive: true,
          datasetVersion: {
            effectiveFrom: '2030-01-01',
            effectiveTo: '2030-12-31',
          },
        },
      ]);

      versionFuelRepoMock.findOne.mockResolvedValue(null);
      fuelUnitRepoMock.findOne.mockResolvedValue(null);
      versionRepoMock.findOne.mockResolvedValue(null);
      fuelRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.resolveEmissionFactor({
          factorVersionId: 1,
          fuelId: 2,
          unitId: 3,
          activityDate: '2024-06-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Error Exception Test ───────────────────────────────────────────────────
  it('should throw BadRequestException when no factor exists across all 5 tiers', async () => {
    emissionFactorRepoMock.find.mockResolvedValue([]);
    versionFuelRepoMock.findOne.mockResolvedValue(null);
    fuelUnitRepoMock.findOne.mockResolvedValue(null);
    versionRepoMock.findOne.mockResolvedValue(null);
    fuelRepoMock.findOne.mockResolvedValue(null);

    await expect(
      service.resolveEmissionFactor({
        factorVersionId: 99,
        fuelId: 99,
        unitId: 99,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
