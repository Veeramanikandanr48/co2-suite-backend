import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SummaryService } from './summary.service';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ScopeCategoryMapping } from 'src/entities/scope-category-mapping.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { Facility } from 'src/entities/facility.entity';
import { Organization } from 'src/entities/organization.entity';
import { UserDetails } from 'src/entities/user.entity';

describe('SummaryService (Facility, Org & Scope Aggregation Rollups)', () => {
  let service: SummaryService;

  const mockFacilities = [
    { id: 1, organizationId: 1, name: 'Chennai Facility', isActive: true },
    { id: 2, organizationId: 1, name: 'London HQ', isActive: true },
  ];

  const mockInventoryEntries = [
    {
      id: 1,
      organizationId: 1,
      serviceCode: 'CARBON',
      category: 'Stationary Combustion',
      name: 'Diesel Generator',
      facility: 'Chennai Facility',
      scopeType: 'SCOPE_1',
      emission: 12.4,
      dateFrom: '01.01.2026',
      isActive: true,
    },
    {
      id: 2,
      organizationId: 1,
      serviceCode: 'CARBON',
      category: 'Purchased Electricity',
      name: 'Grid Electricity',
      facility: 'Chennai Facility',
      scopeType: 'SCOPE_2',
      emission: 42.7,
      dateFrom: '01.01.2026',
      isActive: true,
    },
    {
      id: 3,
      organizationId: 1,
      serviceCode: 'CARBON',
      category: 'Business Travel',
      name: 'Flight Travel',
      facility: 'Chennai Facility',
      scopeType: 'SCOPE_3',
      scope3CategoryNumber: 6,
      emission: 5.1,
      dateFrom: '01.01.2026',
      isActive: true,
    },
    {
      id: 4,
      organizationId: 1,
      serviceCode: 'CARBON',
      category: 'Upstream Transportation',
      name: 'Sea Freight',
      facility: 'London HQ',
      scopeType: 'SCOPE_3',
      scope3CategoryNumber: 4,
      emission: 9.8,
      dateFrom: '01.01.2026',
      isActive: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(OrganizationService),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(ScopeCategoryMapping),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(InventoryEntry),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockInventoryEntries),
            }),
          },
        },
        {
          provide: getRepositoryToken(Facility),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockFacilities),
            }),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Org', code: 'TEST' }]),
            }),
          },
        },
        {
          provide: getRepositoryToken(UserDetails),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockResolvedValue(5),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SummaryService>(SummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should aggregate total emissions (70.00 tCO2e), Scope 1 (12.4), Scope 2 (42.7), Scope 3 (14.9) from saved entries without recalculating', async () => {
    const summary = await service.getCarbonSummary(1, 'CARBON');

    expect(summary.kpis.totalEmissions).toBe(70.00);
    expect(summary.kpis.scope1Emissions).toBe(12.40);
    expect(summary.kpis.scope2Emissions).toBe(42.70);
    expect(summary.kpis.scope3Emissions).toBe(14.90);
  });

  it('should aggregate emissions accurately per Facility (Chennai Facility: 60.2 tCO2e, London HQ: 9.8 tCO2e)', async () => {
    const summary = await service.getCarbonSummary(1, 'CARBON');

    const chennai = summary.emissionsByFacility.find((f) => f.facility === 'Chennai Facility');
    const london = summary.emissionsByFacility.find((f) => f.facility === 'London HQ');

    expect(chennai).toBeDefined();
    expect(chennai?.emission).toBe(60.20);
    expect(london).toBeDefined();
    expect(london?.emission).toBe(9.80);
  });
});
