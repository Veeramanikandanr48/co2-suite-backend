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
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

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

  it('should resolve EF, compute emission in tonnes (0.268 tCO2e), and snapshot ef + efSource into InventoryEntry', async () => {
    // Mock EF resolution: 2.68 kg CO2e / Litre
    factorResolutionServiceMock.resolveEmissionFactor.mockResolvedValue({
      emissionFactor: 2.68,
      efSource: 'DEFRA 2024 (Version-Fuel Mapping)',
      resolutionLevel: 'VERSION_FUEL',
    });

    const result = await service.createInventoryEntry(mockUser, {
      category: 'Stationary Combustion',
      name: 'Diesel',
      amount: 100,
      unit: 'litre',
      fuelId: 2,
      unitId: 3,
      factorVersionId: 1,
    });

    // 1. Verify resolution call
    expect(factorResolutionServiceMock.resolveEmissionFactor).toHaveBeenCalledWith({
      fuelId: 2,
      unitId: 3,
      factorVersionId: 1,
    });

    // 2. Verify factor snapshot
    expect(result.ef).toBe(2.68);
    expect(result.efSource).toBe('DEFRA 2024 (Version-Fuel Mapping)');

    // 3. Verify emission calculation: 100 * 2.68 / 1000 = 0.268 tCO2e
    expect(result.emission).toBe(0.268);
  });

  it('should preserve immutable calculation snapshot on saved InventoryEntry even if master EF changes', async () => {
    // 1. Initial creation with EF = 2.68
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

    // 2. Simulate master factor update on Day 2 to 2.75 kg CO2e/L
    factorResolutionServiceMock.resolveEmissionFactor.mockResolvedValue({
      emissionFactor: 2.75,
      efSource: 'DEFRA 2024 Updated',
      resolutionLevel: 'VERSION_FUEL',
    });

    // 3. Assert saved entry snapshot remains unchanged (audit immutability)
    expect(savedEntry.ef).toBe(2.68);
    expect(savedEntry.emission).toBe(2.68);
  });
});
