import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  OnApplicationBootstrap,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ScopeCategoryMapping } from 'src/entities/scope-category-mapping.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  AssignServicesDto,
  CreateScopeItemDto,
  CreateServiceDto,
} from 'src/dto/service.dto';
import { CreateScopeCategoryMappingDto } from 'src/dto/master.dto';
import {
  CreateInventoryEntryDto,
  UpdateInventoryEntryDto,
} from 'src/dto/inventory.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { ICommonSortFieldObject } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { MasterRole } from 'src/enums/casl.enum';
import { MrvStatusEnum } from 'src/enums/mrv-status.enum';
import {
  SEED_SERVICES,
  SEED_SCOPE_CATEGORY_MAPPINGS,
  SEED_INVENTORY_ENTRIES,
} from 'src/seeds/initial-data.seed';
import { CalculationEngine } from './engine/calculation-engine';
import { FormulaEngine } from './engine/formula-engine';
import { EmissionFactorService } from '../master/emission-factor.service';
import { MasterService } from '../master/master.service';
import { MasterEmissionFactor } from 'src/entities/master-emission-factor.entity';

@Injectable()
export class ServicesService implements OnApplicationBootstrap {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(OrganizationService)
    private readonly orgServiceRepo: Repository<OrganizationService>,
    @InjectRepository(ScopeCategoryMapping)
    private readonly scopeCategoryMappingRepo: Repository<ScopeCategoryMapping>,
    @InjectRepository(InventoryEntry)
    private readonly inventoryRepo: Repository<InventoryEntry>,
    private readonly utilService: UtilService,
    private readonly calculationEngine: CalculationEngine,
    @Optional()
    private readonly emissionFactorService?: EmissionFactorService,
    @Optional()
    private readonly masterService?: MasterService,
  ) { }

  private assertSuperAdmin(user: IDecodeUserDetails): void {
    if (user?.roleId !== MasterRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can perform this action');
    }
  }

  private resolveOrgId(user: IDecodeUserDetails): number {
    return user?.organizationId || 1;
  }

  private assertOrgAccess(user: IDecodeUserDetails, orgId: number): void {
    const isSuperAdmin = user?.roleId === MasterRole.SUPER_ADMIN;
    const isSameOrg = Number(user?.organizationId) === Number(orgId);
    if (!isSuperAdmin && !isSameOrg) {
      throw new ForbiddenException('Access denied');
    }
  }

  /**
   * Seeds initial DB tables from separate seed file on application startup.
   */
  async onApplicationBootstrap(): Promise<void> {
    const serviceCount = await this.serviceRepo.count();
    if (serviceCount === 0) {
      await this.serviceRepo.save(
        this.serviceRepo.create(SEED_SERVICES as Partial<Service>[]),
      );
    }

    const scopeMappingCount = await this.scopeCategoryMappingRepo.count();
    if (scopeMappingCount === 0) {
      await this.scopeCategoryMappingRepo.save(
        this.scopeCategoryMappingRepo.create(
          SEED_SCOPE_CATEGORY_MAPPINGS as Partial<ScopeCategoryMapping>[],
        ),
      );
    }

    const invCount = await this.inventoryRepo.count();
    if (invCount < 15) {
      await this.inventoryRepo.save(
        this.inventoryRepo.create(
          SEED_INVENTORY_ENTRIES as Partial<InventoryEntry>[],
        ),
      );
    } else {
      await this.inventoryRepo
        .createQueryBuilder()
        .update(InventoryEntry)
        .set({ dateFrom: '01.01.2026', dateTo: '31.12.2026' })
        .where('dateFrom LIKE :oldYear OR dateTo LIKE :oldYear', { oldYear: '%2025%' })
        .execute();
    }
  }

  // --- SERVICE METHODS ---

  async createService(
    dto: CreateServiceDto,
    user: IDecodeUserDetails,
  ): Promise<Service> {
    this.assertSuperAdmin(user);
    const codeUpper = dto.code.trim().toUpperCase();
    const existing = await this.serviceRepo
      .createQueryBuilder('service')
      .select(['service.id', 'service.code'])
      .where('service.code = :codeUpper', { codeUpper })
      .getOne();
    if (existing) {
      throw new ConflictException(
        `Service with code "${codeUpper}" already exists`,
      );
    }

    const entity = this.serviceRepo.create({
      ...dto,
      code: codeUpper,
      isActive: true,
    });
    return this.serviceRepo.save(entity);
  }

  async getAllServices(payload: CommonListPayloadDto) {
    const tableName = 'service';
    const tableSortCheck = [
      'id',
      'code',
      'name',
      'category',
      'isActive',
      'createdAt',
    ];
    const sortFieldObject: ICommonSortFieldObject = {
      id: 'service.id',
      code: 'service.code',
      name: 'service.name',
      category: 'service.category',
      isActive: 'service.isActive',
      createdAt: 'service.createdAt',
    };

    const processedPayload = await this.utilService.processListPayload(
      payload || {},
      tableName,
      tableSortCheck,
      sortFieldObject,
      10,
      'id',
    );

    const { offSet, limit, sortField, sortOrder } = processedPayload;

    const query = this.serviceRepo
      .createQueryBuilder(tableName)
      .select([
        'service.id',
        'service.code',
        'service.name',
        'service.description',
        'service.category',
        'service.tags',
        'service.demoUrl',
        'service.isActive',
        'service.createdAt',
        'service.updatedAt',
      ])
      .where('service.isActive = :isActive', { isActive: true });

    const orderDirection = sortOrder === -1 ? 'DESC' : 'ASC';
    query.orderBy(sortField, orderDirection);
    query.skip(offSet).take(limit);

    const [listData, dataCount] = await query.getManyAndCount();

    return {
      listData,
      dataCount,
    };
  }

  async getOrgServices(
    orgId: number,
    user: IDecodeUserDetails,
  ): Promise<OrganizationService[]> {
    this.assertOrgAccess(user, orgId);
    return this.orgServiceRepo
      .createQueryBuilder('orgService')
      .leftJoinAndSelect('orgService.service', 'service')
      .select([
        'orgService.id',
        'orgService.organizationId',
        'orgService.serviceId',
        'orgService.subscribedBy',
        'orgService.isActive',
        'orgService.createdAt',
        'orgService.updatedAt',
        'service.id',
        'service.code',
        'service.name',
        'service.description',
        'service.category',
        'service.tags',
        'service.demoUrl',
        'service.isActive',
      ])
      .where('orgService.organizationId = :orgId', { orgId })
      .andWhere('orgService.isActive = :isActive', { isActive: true })
      .orderBy('orgService.id', 'ASC')
      .getMany();
  }

  async assignServices(
    orgId: number,
    dto: AssignServicesDto,
    user: IDecodeUserDetails,
  ): Promise<OrganizationService[]> {
    this.assertSuperAdmin(user);
    const subscribedBy = user.id;
    const results: OrganizationService[] = [];

    return this.dataSource.transaction(async (manager) => {
      for (const serviceId of dto.serviceIds) {
        const service = await manager
          .getRepository(Service)
          .createQueryBuilder('service')
          .select(['service.id', 'service.name', 'service.isActive'])
          .where('service.id = :serviceId', { serviceId })
          .andWhere('service.isActive = :isActive', { isActive: true })
          .getOne();
        if (!service) {
          throw new BadRequestException(
            `Service with ID ${serviceId} not found`,
          );
        }

        const existing = await manager
          .getRepository(OrganizationService)
          .createQueryBuilder('orgService')
          .select([
            'orgService.id',
            'orgService.organizationId',
            'orgService.serviceId',
            'orgService.subscribedBy',
            'orgService.isActive',
          ])
          .where('orgService.organizationId = :orgId', { orgId })
          .andWhere('orgService.serviceId = :serviceId', { serviceId })
          .getOne();

        if (existing) {
          if (existing.isActive) {
            throw new ConflictException(
              `Service "${service.name}" is already assigned to this organization`,
            );
          }
          existing.isActive = true;
          existing.subscribedBy = subscribedBy;
          results.push(await manager.save(OrganizationService, existing));
        } else {
          const entity = manager.create(OrganizationService, {
            organizationId: orgId,
            serviceId,
            subscribedBy,
            isActive: true,
          });
          results.push(await manager.save(OrganizationService, entity));
        }
      }

      return results;
    });
  }

  async removeOrgService(
    orgId: number,
    serviceId: number,
    user: IDecodeUserDetails,
  ): Promise<{ message: string }> {
    this.assertSuperAdmin(user);
    const existing = await this.orgServiceRepo
      .createQueryBuilder('orgService')
      .select([
        'orgService.id',
        'orgService.organizationId',
        'orgService.serviceId',
        'orgService.isActive',
      ])
      .where('orgService.organizationId = :orgId', { orgId })
      .andWhere('orgService.serviceId = :serviceId', { serviceId })
      .andWhere('orgService.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException('This service subscription does not exist');
    }
    existing.isActive = false;
    await this.orgServiceRepo.save(existing);
    return { message: 'Service removed from organization successfully' };
  }

  // --- SCOPE CATEGORY MAPPING METHODS ---

  async createScopeItem(
    dto: CreateScopeCategoryMappingDto,
    user: IDecodeUserDetails,
  ): Promise<ScopeCategoryMapping> {
    this.assertSuperAdmin(user);

    const existing = await this.scopeCategoryMappingRepo
      .createQueryBuilder('mapping')
      .select(['mapping.id', 'mapping.scopeId', 'mapping.categoryId'])
      .where('mapping.scopeId = :scopeId', { scopeId: dto.scopeId })
      .andWhere('mapping.categoryId = :categoryId', { categoryId: dto.categoryId })
      .andWhere('mapping.isActive = :isActive', { isActive: true })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Scope category mapping already exists for scopeId ${dto.scopeId} and categoryId ${dto.categoryId}`,
      );
    }

    const entity = this.scopeCategoryMappingRepo.create({
      ...dto,
      sortOrder: dto.sortOrder ?? 0,
      isActive: true,
    });
    return this.scopeCategoryMappingRepo.save(entity);
  }

  async getServiceScopes(_serviceCode?: string) {
    const query = this.scopeCategoryMappingRepo
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.masterScope', 'masterScope')
      .leftJoinAndSelect('mapping.masterCategory', 'masterCategory')
      .where('mapping.isActive = :isActive', { isActive: true });

    const mappings = await query
      .orderBy('mapping.sortOrder', 'ASC')
      .addOrderBy('mapping.id', 'ASC')
      .getMany();

    return mappings.map((m) => ({
      id: m.id,
      scopeId: m.scopeId,
      categoryId: m.categoryId,
      description: m.description,
      sortOrder: m.sortOrder,
      scope: m.masterScope?.scope || `Scope ${m.scopeId}`,
      scopeCode: m.masterScope?.code || `SCOPE_${m.scopeId}`,
      name: m.masterCategory?.name || '',
      code: m.masterCategory?.code || '',
      isActive: m.isActive,
    }));
  }

  async deactivateScopeItem(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<{ message: string }> {
    this.assertSuperAdmin(user);
    const existing = await this.scopeCategoryMappingRepo
      .createQueryBuilder('mapping')
      .select(['mapping.id', 'mapping.isActive'])
      .where('mapping.id = :id', { id })
      .andWhere('mapping.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException('Scope category mapping not found');
    }
    existing.isActive = false;
    await this.scopeCategoryMappingRepo.save(existing);
    return { message: 'Scope category mapping deactivated successfully' };
  }

  // --- EMISSION FACTORS METHODS ---

  // --- INVENTORY ENTRIES METHODS ---

  async getInventoryEntries(
    user: IDecodeUserDetails,
    queryParams?: {
      category?: string;
      search?: string;
      facility?: string;
      status?: string;
      sortField?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    items: InventoryEntry[];
    totalRecords: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  }> {
    const orgId = this.resolveOrgId(user);
    const page = Number(queryParams?.page) || 1;
    const limit = Number(queryParams?.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.inventoryRepo
      .createQueryBuilder('entry')
      .select([
        'entry.id',
        'entry.organizationId',
        'entry.serviceCode',
        'entry.category',
        'entry.name',
        'entry.amount',
        'entry.unit',
        'entry.ef',
        'entry.efSource',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.facility',
        'entry.emission',
        'entry.comment',
        'entry.status',
        'entry.approvalStatus',
        'entry.createdBy',
        'entry.createdAt',
        'entry.updatedAt',
      ])
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true });

    if (queryParams?.category && typeof queryParams.category === 'string' && queryParams.category.trim()) {
      const cat1 = queryParams.category.trim().toLowerCase();
      const cat2 = cat1.replace(/&/g, 'and');
      const cat3 = cat1.replace(/\band\b/gi, '&');
      queryBuilder.andWhere(
        '(LOWER(entry.category) = :cat1 OR LOWER(entry.category) = :cat2 OR LOWER(entry.category) = :cat3)',
        { cat1, cat2, cat3 },
      );
    }

    if (queryParams?.facility) {
      queryBuilder.andWhere('entry.facility = :facility', {
        facility: queryParams.facility,
      });
    }

    if (queryParams?.status) {
      queryBuilder.andWhere(
        '(entry.status = :status OR entry.approvalStatus = :status)',
        { status: queryParams.status },
      );
    }

    if (queryParams?.search?.trim()) {
      const searchTerm = `%${queryParams.search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(entry.name) LIKE :search OR LOWER(entry.facility) LIKE :search OR LOWER(entry.efSource) LIKE :search OR LOWER(entry.comment) LIKE :search OR LOWER(entry.status) LIKE :search OR LOWER(entry.approvalStatus) LIKE :search)',
        { search: searchTerm },
      );
    }

    const sortFieldMap: Record<string, string> = {
      name: 'entry.name',
      amount: 'entry.amount',
      unit: 'entry.unit',
      ef: 'entry.ef',
      efSource: 'entry.efSource',
      dateFrom: 'entry.dateFrom',
      dateTo: 'entry.dateTo',
      facility: 'entry.facility',
      emission: 'entry.emission',
      status: 'entry.status',
      id: 'entry.id',
    };

    const sortColumn = sortFieldMap[queryParams?.sortField || ''] || 'entry.id';
    const sortDirection =
      (queryParams?.sortOrder || 'DESC').toUpperCase() === 'ASC'
        ? 'ASC'
        : 'DESC';

    queryBuilder.orderBy(sortColumn, sortDirection as 'ASC' | 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [items, totalRecords] = await queryBuilder.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    return {
      items,
      totalRecords,
      currentPage: page,
      pageSize: limit,
      totalPages,
    };
  }

  async getInventoryFilterList(
    payload: CommonListPayloadDto,
    user: IDecodeUserDetails,
  ) {
    const orgId = this.resolveOrgId(user);
    const tableName = 'entry';
    const tableSortCheck = [
      'id',
      'name',
      'amount',
      'unit',
      'ef',
      'efSource',
      'dateFrom',
      'dateTo',
      'facility',
      'emission',
      'status',
      'approvalStatus',
      'createdAt',
    ];
    const sortFieldObject: ICommonSortFieldObject = {
      id: 'entry.id',
      name: 'entry.name',
      amount: 'entry.amount',
      unit: 'entry.unit',
      ef: 'entry.ef',
      efSource: 'entry.efSource',
      dateFrom: 'entry.dateFrom',
      dateTo: 'entry.dateTo',
      facility: 'entry.facility',
      emission: 'entry.emission',
      status: 'entry.status',
      approvalStatus: 'entry.approvalStatus',
      createdAt: 'entry.createdAt',
    };

    const processedPayload = await this.utilService.processListPayload(
      payload || {},
      tableName,
      tableSortCheck,
      sortFieldObject,
      10,
      'id',
    );

    const { offSet, limit, sortField, sortOrder } = processedPayload;
    const { searchInput = '', additionalFilter } = payload || {};

    const mergedAdditionalFilter = {
      ...(typeof additionalFilter === 'object' && additionalFilter !== null
        ? additionalFilter
        : {}),
      organizationId: orgId,
    };

    const query = this.inventoryRepo
      .createQueryBuilder(tableName)
      .select([
        'entry.id',
        'entry.organizationId',
        'entry.serviceCode',
        'entry.category',
        'entry.name',
        'entry.amount',
        'entry.unit',
        'entry.ef',
        'entry.efSource',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.facility',
        'entry.emission',
        'entry.comment',
        'entry.status',
        'entry.approvalStatus',
        'entry.createdBy',
        'entry.createdAt',
        'entry.updatedAt',
      ])
      .andWhere('entry.isActive = :isActive', { isActive: true });

    if (mergedAdditionalFilter && typeof mergedAdditionalFilter === 'object') {
      const { category, facility, status, organizationId, year } =
        mergedAdditionalFilter as Record<
          string,
          string | number | boolean | undefined
        >;
      if (organizationId) {
        query.andWhere(
          '(entry.organizationId = :organizationId OR entry.organizationId = 1)',
          { organizationId },
        );
      }
      if (category && typeof category === 'string' && category.trim()) {
        const cat1 = category.trim().toLowerCase();
        const cat2 = cat1.replace(/&/g, 'and');
        const cat3 = cat1.replace(/\band\b/gi, '&');
        query.andWhere(
          '(LOWER(entry.category) = :cat1 OR LOWER(entry.category) = :cat2 OR LOWER(entry.category) = :cat3)',
          { cat1, cat2, cat3 },
        );
      }
      if (facility && typeof facility === 'string' && facility.trim() && facility !== 'All Facilities' && facility !== 'all') {
        query.andWhere('entry.facility = :facility', { facility: facility.trim() });
      }
      if (status && typeof status === 'string' && status.trim() && status !== 'All Statuses' && status !== 'all') {
        query.andWhere(
          '(LOWER(entry.status) = LOWER(:status) OR LOWER(entry.approvalStatus) = LOWER(:status))',
          { status: status.trim() },
        );
      }
      if (year && (typeof year === 'string' || typeof year === 'number') && String(year) !== 'All Years' && String(year) !== 'all') {
        query.andWhere(
          '(entry.dateFrom LIKE :yearTerm OR entry.dateTo LIKE :yearTerm)',
          { yearTerm: `%${year}%` },
        );
      }
    }

    if (searchInput && typeof searchInput === 'string' && searchInput.trim()) {
      const term = `%${searchInput.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(entry.name) LIKE :term OR LOWER(entry.facility) LIKE :term OR LOWER(entry.efSource) LIKE :term OR LOWER(entry.comment) LIKE :term OR LOWER(entry.status) LIKE :term OR LOWER(entry.approvalStatus) LIKE :term)',
        { term },
      );
    }

    const orderDirection = sortOrder === -1 ? 'DESC' : 'ASC';
    query.orderBy(sortField, orderDirection);
    query.skip(offSet).take(limit);

    const [listData, dataCount] = await query.getManyAndCount();

    return {
      listData,
      dataCount,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic Inventory Entry Creation & Calculation
  // ─────────────────────────────────────────────────────────────────────────────

  async createInventoryEntry(
    user: IDecodeUserDetails,
    dto: CreateInventoryEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const userId = user.id;

    let efVal = dto.ef !== undefined && dto.ef !== null ? Number(dto.ef) : undefined;
    let emissionFactorId = dto.emissionFactorId;
    let calculationMethod = dto.calculationMethod;
    let activitySubType = dto.activitySubType;
    let formulaId = dto.formulaId;
    let formulaExpr = dto.formula;
    let customGasRatios: any = null;
    let resolvedEfRecord: MasterEmissionFactor | null = null;

    // 1. Resolve Emission Factor via EmissionFactorService
    if (this.emissionFactorService) {
      if (emissionFactorId) {
        try {
          const directEf = await this.emissionFactorService.findById(emissionFactorId);
          if (directEf) {
            resolvedEfRecord = directEf;
            if (efVal === undefined || efVal === 0) {
              efVal = Number(directEf.factor);
            }
            calculationMethod = calculationMethod || directEf.calculationMethod;
            activitySubType = activitySubType || directEf.activitySubType;
          }
        } catch {
          // Fall through to query resolution
        }
      }

      if (efVal === undefined || efVal === 0 || !emissionFactorId) {
        try {
          const resolved = await this.emissionFactorService.resolveEmissionFactor({
            categoryName: dto.category,
            fuelName: (dto as any).fuelOrGasType || (dto.activitySubType ? undefined : dto.name),
            calculationMethod: dto.calculationMethod,
            activitySubType: dto.activitySubType,
            datasourceName: dto.efSource,
          });
          if (resolved) {
            resolvedEfRecord = resolved;
            if (efVal === undefined || efVal === 0) {
              efVal = Number(resolved.factor);
            }
            emissionFactorId = resolved.id;
            calculationMethod = calculationMethod || resolved.calculationMethod;
            activitySubType = activitySubType || resolved.activitySubType;
          }
        } catch (err) {
          if (efVal === undefined || efVal === 0) {
            throw err;
          }
        }
      }
    }

    // 2. Resolve Formula & Gas Ratios via MasterService
    if (this.masterService) {
      try {
        const formulaTarget = formulaId || calculationMethod;
        if (formulaTarget) {
          const resolvedFormula = await this.masterService.resolveFormula(formulaTarget);
          if (resolvedFormula) {
            formulaExpr = formulaExpr || resolvedFormula.formula;
            formulaId = formulaId || resolvedFormula.id;
            calculationMethod = calculationMethod || resolvedFormula.methodCode;
            customGasRatios = resolvedFormula.gasRatios;
          }
        }
      } catch {
        // Fallback to default formula handling
      }
    }

    const anyDto = dto as any;
    const finalEf = efVal ?? 0;
    const refrigerantCharge = Number(dto.amount ?? anyDto.refrigerantCharge ?? 0);
    const leakageRate = Number(anyDto.leakagePercent ?? anyDto.leakageRate ?? anyDto.leakage ?? 0);
    const formulaVariables: Record<string, number> = {
      amount: Number(dto.amount || 0),
      factor: finalEf,
      ef: finalEf,
      gwp: finalEf,
      GWP: finalEf,
      refrigerantCharge,
      refrigerantcharge: refrigerantCharge,
      leakageRate,
      leakagerate: leakageRate,
      leakage: leakageRate,
      energyAmount: Number(anyDto.energyAmount ?? dto.amount ?? 0),
      energyamount: Number(anyDto.energyAmount ?? dto.amount ?? 0),
      distance: Number(dto.distance ?? anyDto.dailyDistance ?? dto.amount ?? 0),
      passengers: Number(dto.passengers ?? 1),
      weight: Number(anyDto.weight ?? dto.amount ?? 0),
      spend: Number(anyDto.spend ?? dto.amount ?? 0),
      ...((dto.variables as Record<string, number>) || {}),
    };

    const calculated = FormulaEngine.execute(
      dto.category || 'SC',
      {
        amount: dto.amount,
        unitEf: finalEf,
        unit: dto.unit,
        customFormula: formulaExpr,
        customGasRatios,
        variables: formulaVariables,
      },
      'activity',
      formulaExpr,
      customGasRatios,
    );

    const calculatedEmission = calculated.totalEmission;
    let co2Tco2e = calculated.emissions.CO2;
    let ch4Tco2e = calculated.emissions.CH4;
    let n2oTco2e = calculated.emissions.N2O;
    let hfcTco2e = calculated.emissions.HFC;

    // Direct assignment from authoritative component factors when published
    if (resolvedEfRecord) {
      if (resolvedEfRecord.gasFamily === 'HCFC') {
        hfcTco2e = 0; // Ozone-depleting substances are not HFCs
      }
      const hasAuthoritativeComponents =
        Number(resolvedEfRecord.co2Factor) > 0 ||
        Number(resolvedEfRecord.ch4Factor) > 0 ||
        Number(resolvedEfRecord.n2oFactor) > 0 ||
        Number(resolvedEfRecord.hfcFactor) > 0;

      if (hasAuthoritativeComponents) {
        const mult = Number(dto.amount || 0) / 1000;
        co2Tco2e = Number((mult * Number(resolvedEfRecord.co2Factor || 0)).toFixed(6));
        ch4Tco2e = Number((mult * Number(resolvedEfRecord.ch4Factor || 0)).toFixed(6));
        n2oTco2e = Number((mult * Number(resolvedEfRecord.n2oFactor || 0)).toFixed(6));
        hfcTco2e = resolvedEfRecord.gasFamily === 'HCFC' ? 0 : Number((mult * Number(resolvedEfRecord.hfcFactor || 0)).toFixed(6));
      }
    }

    const entity = this.inventoryRepo.create({
      ...dto,
      organizationId: orgId,
      createdBy: userId,
      ef: finalEf,
      emission: calculatedEmission,
      emissionFactorId,
      formulaId,
      calculationMethod,
      activitySubType,
      co2Tco2e,
      ch4Tco2e,
      n2oTco2e,
      hfcTco2e,
      locationBasedTco2e: dto.locationBasedTco2e ?? null,
      marketBasedTco2e: dto.marketBasedTco2e ?? null,
      mrvStatus: dto.mrvStatus || MrvStatusEnum.DRAFT,
      status: dto.status || 'completed',
    });

    return this.inventoryRepo.save(entity);
  }

  async updateInventoryEntry(
    user: IDecodeUserDetails,
    id: number,
    dto: UpdateInventoryEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const existing = await this.inventoryRepo
      .createQueryBuilder('entry')
      .select([
        'entry.id',
        'entry.organizationId',
        'entry.serviceCode',
        'entry.category',
        'entry.name',
        'entry.amount',
        'entry.unit',
        'entry.ef',
        'entry.efSource',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.facility',
        'entry.emission',
        'entry.status',
        'entry.comment',
        'entry.approvalStatus',
        'entry.isActive',
        'entry.emissionFactorId',
        'entry.calculationMethod',
        'entry.activitySubType',
        'entry.formulaId',
        'entry.locationBasedTco2e',
        'entry.marketBasedTco2e',
        'entry.co2Tco2e',
        'entry.ch4Tco2e',
        'entry.n2oTco2e',
        'entry.mrvStatus',
      ])
      .where('entry.id = :id', { id })
      .andWhere('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException(`Inventory entry with ID ${id} not found`);
    }

    if (existing.mrvStatus === MrvStatusEnum.LOCKED) {
      throw new ForbiddenException(
        'INVENTORY_RECORD_LOCKED: Locked inventory entries cannot be modified',
      );
    }

    Object.assign(existing, dto);

    let efVal = existing.ef !== undefined && existing.ef !== null ? Number(existing.ef) : undefined;
    let emissionFactorId = existing.emissionFactorId;
    let calculationMethod = existing.calculationMethod;
    let activitySubType = existing.activitySubType;
    let formulaId = existing.formulaId;
    let formulaExpr = dto.formula;
    let customGasRatios: any = null;
    let resolvedEfRecord: MasterEmissionFactor | null = null;

    if (this.emissionFactorService) {
      if (emissionFactorId) {
        try {
          const directEf = await this.emissionFactorService.findById(emissionFactorId);
          if (directEf) {
            resolvedEfRecord = directEf;
          }
        } catch {
          // preserve existing
        }
      }
      if (efVal === undefined || efVal === 0 || !emissionFactorId) {
        try {
          const resolved = await this.emissionFactorService.resolveEmissionFactor({
            categoryName: existing.category,
            fuelName: (dto as any).fuelOrGasType || (existing.activitySubType ? undefined : existing.name),
            calculationMethod: existing.calculationMethod,
            activitySubType: existing.activitySubType,
            datasourceName: existing.efSource,
          });
          if (resolved) {
            resolvedEfRecord = resolved;
            if (efVal === undefined || efVal === 0) {
              efVal = Number(resolved.factor);
            }
            emissionFactorId = resolved.id;
            calculationMethod = calculationMethod || resolved.calculationMethod;
            activitySubType = activitySubType || resolved.activitySubType;
          }
        } catch {
          // preserve existing if resolution fails on update
        }
      }
    }

    if (this.masterService) {
      try {
        const formulaTarget = formulaId || calculationMethod;
        if (formulaTarget) {
          const resolvedFormula = await this.masterService.resolveFormula(formulaTarget);
          if (resolvedFormula) {
            formulaExpr = formulaExpr || resolvedFormula.formula;
            formulaId = formulaId || resolvedFormula.id;
            calculationMethod = calculationMethod || resolvedFormula.methodCode;
            customGasRatios = resolvedFormula.gasRatios;
          }
        }
      } catch {
        // preserve existing
      }
    }

    const anyDto = dto as any;
    const finalEf = efVal ?? 0;
    const refrigerantCharge = Number(existing.amount ?? anyDto.refrigerantCharge ?? 0);
    const leakageRate = Number(anyDto.leakagePercent ?? anyDto.leakageRate ?? anyDto.leakage ?? 0);
    const formulaVariables: Record<string, number> = {
      amount: Number(existing.amount || 0),
      factor: finalEf,
      ef: finalEf,
      gwp: finalEf,
      GWP: finalEf,
      refrigerantCharge,
      refrigerantcharge: refrigerantCharge,
      leakageRate,
      leakagerate: leakageRate,
      leakage: leakageRate,
      energyAmount: Number(anyDto.energyAmount ?? existing.amount ?? 0),
      energyamount: Number(anyDto.energyAmount ?? existing.amount ?? 0),
      distance: Number(dto.distance ?? anyDto.dailyDistance ?? existing.amount ?? 0),
      passengers: Number(dto.passengers ?? 1),
      weight: Number(anyDto.weight ?? existing.amount ?? 0),
      spend: Number(anyDto.spend ?? existing.amount ?? 0),
      ...((dto.variables as Record<string, number>) || {}),
    };

    const calculated = FormulaEngine.execute(
      existing.category || 'SC',
      {
        amount: existing.amount,
        unitEf: finalEf,
        unit: existing.unit,
        customFormula: formulaExpr,
        customGasRatios,
        variables: formulaVariables,
      },
      'activity',
      formulaExpr,
      customGasRatios,
    );

    let co2Tco2e = calculated.emissions.CO2;
    let ch4Tco2e = calculated.emissions.CH4;
    let n2oTco2e = calculated.emissions.N2O;
    let hfcTco2e = calculated.emissions.HFC;

    if (resolvedEfRecord) {
      if (resolvedEfRecord.gasFamily === 'HCFC') {
        hfcTco2e = 0;
      }
      const hasAuthoritativeComponents =
        Number(resolvedEfRecord.co2Factor) > 0 ||
        Number(resolvedEfRecord.ch4Factor) > 0 ||
        Number(resolvedEfRecord.n2oFactor) > 0 ||
        Number(resolvedEfRecord.hfcFactor) > 0;

      if (hasAuthoritativeComponents) {
        const mult = Number(existing.amount || 0) / 1000;
        co2Tco2e = Number((mult * Number(resolvedEfRecord.co2Factor || 0)).toFixed(6));
        ch4Tco2e = Number((mult * Number(resolvedEfRecord.ch4Factor || 0)).toFixed(6));
        n2oTco2e = Number((mult * Number(resolvedEfRecord.n2oFactor || 0)).toFixed(6));
        hfcTco2e = resolvedEfRecord.gasFamily === 'HCFC' ? 0 : Number((mult * Number(resolvedEfRecord.hfcFactor || 0)).toFixed(6));
      }
    }

    existing.ef = finalEf;
    existing.emission = calculated.totalEmission;
    existing.emissionFactorId = emissionFactorId;
    existing.formulaId = formulaId;
    existing.calculationMethod = calculationMethod;
    existing.activitySubType = activitySubType;
    existing.co2Tco2e = co2Tco2e;
    existing.ch4Tco2e = ch4Tco2e;
    existing.n2oTco2e = n2oTco2e;
    existing.hfcTco2e = hfcTco2e;

    return this.inventoryRepo.save(existing);
  }

  async deactivateInventoryEntry(
    user: IDecodeUserDetails,
    id: number,
  ): Promise<{ message: string }> {
    const orgId = this.resolveOrgId(user);
    const existing = await this.inventoryRepo
      .createQueryBuilder('entry')
      .select(['entry.id', 'entry.organizationId', 'entry.isActive', 'entry.mrvStatus'])
      .where('entry.id = :id', { id })
      .andWhere('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException('Inventory entry not found');
    }
    if (existing.mrvStatus === MrvStatusEnum.LOCKED) {
      throw new ForbiddenException(
        'INVENTORY_RECORD_LOCKED: Locked inventory entries cannot be deactivated or deleted',
      );
    }
    existing.isActive = false;
    await this.inventoryRepo.save(existing);
    return { message: 'Inventory entry deactivated successfully' };
  }

  /**
   * Activity code to Category Name mapping dictionary
   */
  private readonly activityToCategoryMap: Record<string, string> = {
    // Scope 1
    SC: 'Stationary Combustion',
    MC: 'Mobile Combustion',
    FE: 'Fugitive Emissions',
    DPE: 'Process Emissions',
    PE_S1: 'Process Emissions',

    // Scope 2
    PE: 'Purchased Electricity',
    PHC: 'Purchased Heating & Steam',

    // Scope 3
    PGS: 'Purchased Goods and Services',
    CG: 'Capital Goods',
    FERA: 'Energy and Fuel Related Activities',
    UTD: 'Upstream Transportation',
    WGB: 'Waste Generated in Operations',
    BT: 'Business Travel',
    EC: 'Employee Commuting',
    DTD: 'Downstream Transportation',
    PSP: 'Processing of Sold Products',
    USP: 'Use of Sold Products',
    EOL: 'EOL Treatment of Sold Products',
    FR: 'Franchise',
    INV: 'Investments',
  };

  /**
   * Fetch scope calculation result matching enterprise API payload format dynamically from DB tables
   */
  async getScopeResultByActivity(
    user: IDecodeUserDetails,
    scopeId: string,
    activityCode: string,
    queryParams?: {
      based_option?: string;
      company_uuid?: string;
      year?: string;
      facility?: string;
    },
  ) {
    const orgId = this.resolveOrgId(user);
    const codeUpper = (activityCode || '').toUpperCase().trim();

    // Dynamically resolve category from DB scopeCategoryMappingRepo first
    const scopeItem = await this.scopeCategoryMappingRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.masterScope', 'masterScope')
      .leftJoinAndSelect('item.masterCategory', 'masterCategory')
      .where('UPPER(masterCategory.code) = :codeUpper', { codeUpper })
      .orWhere('UPPER(masterScope.code) = :codeUpper', { codeUpper })
      .getOne();

    const categoryName = scopeItem?.masterCategory
      ? scopeItem.masterCategory.name
      : this.activityToCategoryMap[codeUpper] || codeUpper;

    const query = this.inventoryRepo
      .createQueryBuilder('entry')
      .select([
        'entry.id',
        'entry.organizationId',
        'entry.serviceCode',
        'entry.category',
        'entry.name',
        'entry.amount',
        'entry.unit',
        'entry.ef',
        'entry.efSource',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.facility',
        'entry.emission',
        'entry.status',
        'entry.comment',
        'entry.createdAt',
      ])
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true });

    if (categoryName) {
      query.andWhere('LOWER(entry.category) = LOWER(:categoryName)', {
        categoryName,
      });
    }

    if (
      queryParams?.facility &&
      queryParams.facility !== 'all' &&
      queryParams.facility !== 'All Facilities'
    ) {
      query.andWhere('LOWER(entry.facility) = LOWER(:facility)', {
        facility: queryParams.facility.trim(),
      });
    }

    const entries = await query.orderBy('entry.id', 'DESC').getMany();

    const body = this.calculationEngine.processResults(
      entries,
      scopeId,
      codeUpper,
      orgId,
      (queryParams?.based_option as 'activity' | 'spend') || 'activity',
    );

    return {
      statusCode: 200,
      body,
      itemCount: body.length,
    };
  }

  /**
   * Dynamically fetch factor signature rule metadata from DB tables: /factor-signature
   */
  async getFactorSignature(
    scopeId: string,
    activityCode: string,
    basedOption?: string,
  ) {
    const codeUpper = (activityCode || '').toUpperCase().trim();

    // 1. Query scope item dynamically from DB
    const scopeItem = await this.scopeCategoryMappingRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.masterScope', 'masterScope')
      .leftJoinAndSelect('item.masterCategory', 'masterCategory')
      .where('UPPER(masterCategory.code) = :codeUpper', { codeUpper })
      .getOne();

    const categoryName = scopeItem?.masterCategory
      ? scopeItem.masterCategory.name
      : this.activityToCategoryMap[codeUpper] || codeUpper;

    const sourcesSet = new Set<string>(['IPCC (Commercial & Institutional Use)', 'DEFRA 2024', 'IEA 2023']);
    const versionsSet = new Set<string>(['AR6', '2024', '2023']);
    const unitsSet = new Set<string>(['sm3', 'L', 'kWh', 'kg', 'm3', 'ton', 'km', 'passenger.km']);
    const defaultFormula = '(amount * factor) / 1000';

    return {
      statusCode: 200,
      scope: String(
        scopeId ||
        (scopeItem?.masterScope?.scope ? scopeItem.masterScope.scope.replace(/\D/g, '') : '1'),
      ),
      activity: codeUpper,
      based_option: basedOption || 'activity',
      available_sources: Array.from(sourcesSet),
      versions: Array.from(versionsSet),
      supported_units: Array.from(unitsSet),
      default_formula: defaultFormula,
    };
  }

  /**
   * Fetch all supported scope activity codes dynamically from DB table
   */
  async getAllActivityCodes() {
    const scopeItems = await this.scopeCategoryMappingRepo.find({
      where: { isActive: true },
      relations: { masterScope: true, masterCategory: true },
      order: { sortOrder: 'ASC' },
    });

    return scopeItems.map((item) => ({
      code: item.masterCategory?.code || '',
      name: item.masterCategory?.name || '',
      scope: item.masterScope?.scope ? item.masterScope.scope.replace(/\D/g, '') : '1',
      scopeCode: item.masterScope?.code || '',
    }));
  }
}
