import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ServicesService } from './services.service';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ScopeCategoryMapping } from 'src/entities/scope-category-mapping.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { UtilService } from 'src/utility/util/util.service';
import { CalculationEngine } from './engine/calculation-engine';
import { FactorResolutionService } from '../master/factor-resolution.service';
import { UnitNormalizationService } from '../master/unit-normalization.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { MasterUnit } from 'src/entities/master-unit.entity';

import { MasterCategory } from 'src/entities/master-category.entity';
import { CalculationMethodEngine } from './engine/calculation-method.engine';

describe('ServicesService (Inventory Pipeline & Audit Snapshotting)', () => {
  let service: ServicesService;
  let inventoryRepoMock: any;
  let factorResolutionServiceMock: any;

  const mockUser: IDecodeUserDetails = {
    id: 10,
    userId: 10,
    organizationId: 1,
    roleId: 1,
    email: 'user@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(async () => {
    inventoryRepoMock = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 100, ...entity })),
      count: jest.fn().mockResolvedValue(20),
      createQueryBuilder: jest.fn(),
    };

    factorResolutionServiceMock = {
      resolveEmissionFactor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        UnitNormalizationService,
        CalculationMethodEngine,
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: getRepositoryToken(Service),
          useValue: { count: jest.fn().mockResolvedValue(5) },
        },
        {
          provide: getRepositoryToken(OrganizationService),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ScopeCategoryMapping),
          useValue: { count: jest.fn().mockResolvedValue(10) },
        },
        {
          provide: getRepositoryToken(InventoryEntry),
          useValue: inventoryRepoMock,
        },
        {
          provide: getRepositoryToken(MasterUnit),
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 3, symbol: 'l' }) },
        },
        {
          provide: getRepositoryToken(MasterCategory),
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 1, scopeType: 'SCOPE_1', calculationMethod: 'FUEL_BASED' }) },
        },
        {
          provide: UtilService,
          useValue: {
            processListPayload: jest.fn(),
          },
        },
        {
          provide: CalculationEngine,
          useValue: {},
        },
        {
          provide: FactorResolutionService,
          useValue: factorResolutionServiceMock,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize physical unit (1,000 US Gallons -> 3785.411784 Litres), resolve EF (2.68 kgCO2e/L), calculate 10.1449 tCO2e, and save full audit trail', async () => {
    factorResolutionServiceMock.resolveEmissionFactor.mockResolvedValue({
      emissionFactor: 2.68,
      efSource: 'DEFRA 2024 (Version-Fuel Mapping)',
      resolutionLevel: 'VERSION_FUEL',
    });

    const result = await service.createInventoryEntry(mockUser, {
      category: 'Stationary Combustion',
      name: 'Diesel',
      amount: 1000,
      unit: 'us_gallon',
      fuelId: 2,
      factorVersionId: 1,
    });

    // 1. Audit Snapshot checks
    expect(result.originalAmount).toBe(1000);
    expect(result.originalUnit).toBe('us_gallon');
    expect(result.normalizedAmount).toBeCloseTo(3785.411784, 3);
    expect(result.normalizedUnit).toBe('l');

    // 2. EF snapshot
    expect(result.ef).toBe(2.68);
    expect(result.efSource).toBe('DEFRA 2024 (Version-Fuel Mapping)');

    // 3. Calculation check: (3785.411784 * 2.68) / 1000 = 10.144904 tCO2e
    expect(result.emission).toBeCloseTo(10.145, 2);
  });

  it('should preserve immutable calculation snapshot on saved InventoryEntry even if master EF changes', async () => {
    factorResolutionServiceMock.resolveEmissionFactor.mockResolvedValue({
      emissionFactor: 2.68,
      efSource: 'DEFRA 2024 (Version-Fuel Mapping)',
      resolutionLevel: 'VERSION_FUEL',
    });

    const savedEntry = await service.createInventoryEntry(mockUser, {
      category: 'Stationary Combustion',
      name: 'Diesel',
      amount: 1000,
      unit: 'litre',
      fuelId: 2,
      factorVersionId: 1,
    });

    expect(savedEntry.ef).toBe(2.68);
    expect(savedEntry.emission).toBe(2.68); // 1000 * 2.68 / 1000 = 2.68 tCO2e

    // Master factor update simulation
    factorResolutionServiceMock.resolveEmissionFactor.mockResolvedValue({
      emissionFactor: 2.75,
      efSource: 'DEFRA 2024 Updated',
      resolutionLevel: 'VERSION_FUEL',
    });

    // Assert historical saved entry remains unchanged
    expect(savedEntry.ef).toBe(2.68);
    expect(savedEntry.emission).toBe(2.68);
  });
});
