import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  OnApplicationBootstrap,
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
import {
  SEED_SERVICES,
  SEED_SCOPE_CATEGORY_MAPPINGS,
  SEED_INVENTORY_ENTRIES,
} from 'src/seeds/initial-data.seed';
import { FactorResolutionService } from '../master/factor-resolution.service';
import { UnitNormalizationService } from '../master/unit-normalization.service';
import { CalculationEngine } from './engine/calculation-engine';
import { MasterUnit } from 'src/entities/master-unit.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { ReportingPeriod } from 'src/entities/reporting-period.entity';
import { InventoryAuditLog } from 'src/entities/inventory-audit-log.entity';
import { CalculationMethodEngine } from './engine/calculation-method.engine';

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
    @InjectRepository(MasterUnit)
    private readonly masterUnitRepo: Repository<MasterUnit>,
    @InjectRepository(MasterCategory)
    private readonly masterCategoryRepo: Repository<MasterCategory>,
    @InjectRepository(ReportingPeriod)
    private readonly reportingPeriodRepo: Repository<ReportingPeriod>,
    @InjectRepository(InventoryAuditLog)
    private readonly auditLogRepo: Repository<InventoryAuditLog>,
    private readonly utilService: UtilService,
    private readonly calculationEngine: CalculationEngine,
    private readonly factorResolutionService: FactorResolutionService,
    private readonly unitNormalizationService: UnitNormalizationService,
    private readonly calculationMethodEngine: CalculationMethodEngine,
  ) {}

  private async resolveAndAssertReportingPeriod(
    orgId: number,
    dateStr?: string,
  ): Promise<ReportingPeriod | null> {
    if (!dateStr) return null;
    const yearMatch = dateStr.match(/\b(20\d\d)\b/);
    if (!yearMatch) return null;
    const year = Number(yearMatch[1]);
    const period = await this.reportingPeriodRepo.findOne({
      where: { organizationId: orgId, year },
    });

    if (period) {
      if (period.status === 'LOCKED') {
        throw new ForbiddenException(
          `Reporting Period ${year} is LOCKED. Data mutations are strictly prohibited for audit compliance.`,
        );
      }
      if (period.status === 'CLOSED') {
        throw new ForbiddenException(
          `Reporting Period ${year} is CLOSED for review freeze. Data mutations are prohibited until period is reopened.`,
        );
      }
    }

    return period;
  }

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
      .andWhere('mapping.categoryId = :categoryId', {
        categoryId: dto.categoryId,
      })
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
        'entry.rejectionReason',
        'entry.createdBy',
        'entry.createdAt',
        'entry.updatedAt',
      ])
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true });

    if (queryParams?.category) {
      queryBuilder.andWhere('entry.category = :category', {
        category: queryParams.category,
      });
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
        'entry.rejectionReason',
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
        query.andWhere('entry.organizationId = :organizationId', {
          organizationId,
        });
      }
      if (category) {
        query.andWhere('entry.category = :category', { category });
      }
      if (facility && facility !== 'All Facilities' && facility !== 'all') {
        query.andWhere('entry.facility = :facility', { facility });
      }
      if (status && status !== 'All Statuses' && status !== 'all') {
        query.andWhere(
          '(LOWER(entry.status) = LOWER(:status) OR LOWER(entry.approvalStatus) = LOWER(:status))',
          { status },
        );
      }
      if (year && year !== 'All Years' && year !== 'all') {
        query.andWhere(
          '(entry.dateFrom LIKE :yearTerm OR entry.dateTo LIKE :yearTerm)',
          { yearTerm: `%${year}%` },
        );
      }
    }

    if (searchInput && searchInput.trim()) {
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

  /**
   * Evaluates a mathematical formula expression safely with amount and factor variables.
   * e.g. "(amount * factor) / 1000", "amount * factor", "amount * factor * 0.001"
   */
  private evaluateFormulaExpression(
    formula: string,
    amount: number,
    factor: number,
  ): number | null {
    if (!formula || !formula.trim()) return null;

    try {
      let expr = formula.toLowerCase().trim();

      // Replace variable names with actual numeric values
      expr = expr.replace(/\bamount\b/g, String(amount));
      expr = expr.replace(/\bfactor\b/g, String(factor));
      expr = expr.replace(/\bef\b/g, String(factor));

      // Sanitize: only allow numbers, whitespace, +, -, *, /, (, ), .
      if (!/^[0-9\s\+\-\*\/\(\)\.]+$/.test(expr)) {
        return null;
      }

      const result = new Function(`"use strict"; return (${expr})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Number(result.toFixed(3));
      }
    } catch {
      // Return null on parsing or evaluation error to fallback to standard formula rules
    }
    return null;
  }

  /**
   * Calculates emission (in metric tonnes CO2-e) using formula string or GHG standard rules
   */
  private calculateEmissionValue(
    amount: number,
    efVal: number,
    formula?: string,
    unit?: string,
  ): number {
    const amountVal = Number(amount) || 0;
    const factorVal = Number(efVal) || 0;

    if (amountVal === 0 || factorVal === 0) return 0;

    // 1. Evaluate explicit formula expression if configured
    if (formula && formula.trim()) {
      const evaluated = this.evaluateFormulaExpression(
        formula,
        amountVal,
        factorVal,
      );
      if (evaluated !== null) {
        return evaluated;
      }
    }

    // 2. Fallback standard: if unit is 'tonne' or 'ton' and factor is in tCO2e/tonne (factor <= 10)
    const unitLower = (unit || '').toLowerCase();
    if ((unitLower === 'tonne' || unitLower === 'ton') && factorVal <= 10.0) {
      return Number((amountVal * factorVal).toFixed(3));
    }

    // Standard default: (amount * factor) / 1000 (kg CO2e -> metric tonnes CO2e)
    return Number(((amountVal * factorVal) / 1000).toFixed(3));
  }

  async createInventoryEntry(
    user: IDecodeUserDetails,
    dto: CreateInventoryEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const userId = user.id;

    // Reporting Period Lock Enforcement & Resolution
    const period = await this.resolveAndAssertReportingPeriod(
      orgId,
      dto.dateFrom || dto.dateTo,
    );

    // 1. Physical Unit Normalization
    const normResult = this.unitNormalizationService.normalizeUnit(
      dto.amount,
      dto.unit || 'l',
    );

    let efVal = dto.ef ?? 0;
    let efSourceVal = dto.efSource;

    // 2. Factor Resolution Engine (resolves EF for normalized unit)
    let targetUnitId = dto.unitId;
    if (normResult.normalizedUnit) {
      const normUnitEntity = await this.masterUnitRepo.findOne({
        where: [
          { symbol: normResult.normalizedUnit },
          { name: normResult.normalizedUnit },
        ],
      });
      if (normUnitEntity) {
        targetUnitId = normUnitEntity.id;
      }
    }

    if (
      (dto.fuelId || targetUnitId || dto.factorVersionId) &&
      (dto.ef == null || dto.ef === 0)
    ) {
      try {
        const resolved =
          await this.factorResolutionService.resolveEmissionFactor({
            fuelId: dto.fuelId,
            unitId: targetUnitId,
            factorVersionId: dto.factorVersionId,
          });
        efVal = resolved.emissionFactor;
        efSourceVal = resolved.efSource;
      } catch {
        // Fallback to provided ef or 0
      }
    }

    // 3. Category & Scope Method Resolution
    const categoryEntity = await this.masterCategoryRepo.findOne({
      where: [{ name: dto.category }, { code: dto.category }],
    });

    const scopeTypeVal =
      dto.scopeType || categoryEntity?.scopeType || 'SCOPE_1';
    const scope3CatNumVal =
      dto.scope3CategoryNumber ?? categoryEntity?.scope3CategoryNumber;
    const calcMethodVal =
      dto.calculationMethod ||
      categoryEntity?.calculationMethod ||
      'FUEL_BASED';

    // Scope 1 Mobile Ownership Boundary Validation
    if (
      (scopeTypeVal === 'SCOPE_1' ||
        dto.category?.toLowerCase().includes('mobile')) &&
      dto.ownershipControl &&
      (dto.ownershipControl === 'EMPLOYEE_OWNED' ||
        dto.ownershipControl === 'THIRD_PARTY')
    ) {
      throw new BadRequestException(
        `Operational control boundary violation: ${dto.ownershipControl} vehicles belong to Scope 3 (Category 6 Business Travel or Category 7 Commuting) and cannot be recorded under Scope 1 direct emissions.`,
      );
    }

    // 4. Calculation Strategy Engine Execution
    const calcResult = this.calculationMethodEngine.calculateEmission({
      amount: normResult.normalizedAmount,
      ef: efVal,
      unit: normResult.normalizedUnit,
      formula: dto.formula,
      method: calcMethodVal,
      radiativeForcingType: dto.radiativeForcingType,
      distanceType: dto.distanceType as any,
      factorBasis: dto.factorBasis as any,
      efType:
        (dto.efType as any) ||
        (calcMethodVal.includes('GAS') ? 'GAS_SPECIFIC' : 'CO2E'),
      ch4Origin: dto.ch4Origin as any,
      gwpSource: dto.gwpSource,
      gwpVersion: dto.gwpVersion,
      gwpHorizon: dto.gwpHorizon,
      isBiogenic: dto.isBiogenic,
      emissionMode: dto.emissionMode as any,
      ownershipControl: dto.ownershipControl as any,
      rechargedAmount: dto.rechargedAmount,
      equipmentCapacity: dto.equipmentCapacity,
      leakageRatePercent: dto.leakageRatePercent,
      inventoryStart: dto.inventoryStart,
      purchasedRefrigerant: dto.purchasedRefrigerant,
      recoveredRefrigerant: dto.recoveredRefrigerant,
      inventoryEnd: dto.inventoryEnd,
      numberOfRooms: dto.numberOfRooms,
      numberOfNights: dto.numberOfNights,
      wastewaterVolume: dto.wastewaterVolume,
      treatmentMethod: dto.treatmentMethod,
      employeeCount: dto.employeeCount,
      travelDays: dto.travelDays,
      dailyDistance: dto.dailyDistance,
      methodologyInputsSnapshot: dto.methodologyInputsSnapshot,
    });

    // 5. Complete Audit Snapshot Creation
    const entity = this.inventoryRepo.create({
      ...dto,
      organizationId: orgId,
      reportingPeriodId: period?.id,
      reportingPeriodYear: period?.year,
      reportingPeriodName: period?.name,
      createdBy: userId,
      originalAmount: dto.originalAmount ?? dto.amount,
      originalUnit: dto.originalUnit ?? dto.unit,
      normalizedAmount: calcResult.derivedAmount,
      normalizedUnit: normResult.normalizedUnit,
      ef: calcResult.exactEF,
      efSource: efSourceVal,
      emission: calcResult.emission,
      biogenicEmission: calcResult.biogenicEmission,
      isBiogenic: Boolean(
        dto.isBiogenic || calcResult.inputsSnapshot?.isBiogenic,
      ),
      emissionMode: calcResult.inputsSnapshot?.emissionMode || dto.emissionMode,
      ownershipControl: dto.ownershipControl,
      scopeType: scopeTypeVal,
      scope3CategoryNumber: scope3CatNumVal,
      calculationMethod: calcResult.methodUsed,
      calculationEngineVersion: calcResult.calculationEngineVersion,
      activityTypeCode: dto.activityTypeCode,
      radiativeForcingType: dto.radiativeForcingType,
      efType: calcResult.gasBreakdown.efType,
      factorBasis: calcResult.gasBreakdown.factorBasis,
      factorDataset: dto.factorDataset,
      factorVersion: dto.factorVersion,
      factorYear: dto.factorYear,
      ch4Origin: calcResult.gasBreakdown.ch4Origin,
      gwpSource: calcResult.gasBreakdown.gwpSource || dto.gwpSource,
      gwpVersion: calcResult.gasBreakdown.gwpVersion || dto.gwpVersion,
      gwpHorizon: calcResult.gasBreakdown.gwpHorizon || dto.gwpHorizon,
      gwpValuesSnapshot: calcResult.gasBreakdown.gwpValuesSnapshot,
      gasCO2: calcResult.gasBreakdown.CO2,
      gasCH4: calcResult.gasBreakdown.CH4,
      gasN2O: calcResult.gasBreakdown.N2O,
      methodologyInputsSnapshot: calcResult.inputsSnapshot,
    });

    const savedEntity = await this.inventoryRepo.save(entity);

    // Automated Immutable Audit Log Tracking
    try {
      await this.auditLogRepo.save(
        this.auditLogRepo.create({
          inventoryEntryId: savedEntity.id,
          organizationId: orgId,
          action: 'CREATE',
          changedBy: userId,
          calculationEngineVersion:
            savedEntity.calculationEngineVersion || '1.0.0',
          beforeSnapshot: null,
          afterSnapshot: { ...savedEntity },
          changeReason: dto.comment || 'Initial entry creation',
        }),
      );
    } catch {
      // Non-blocking audit log creation
    }

    return savedEntity;
  }

  /**
   * Authoritative Backend Real-Time Calculation Preview Endpoint
   * Does NOT persist an InventoryEntry to DB.
   */
  async calculateInventoryPreview(dto: CreateInventoryEntryDto) {
    const rawAmount = Number(dto.originalAmount ?? dto.amount) || 0;
    const rawUnit = dto.originalUnit ?? dto.unit ?? 'Litre';

    const normResult = this.unitNormalizationService.normalizeUnit(
      rawAmount,
      rawUnit,
    );

    let efVal = Number(dto.ef) || 0;
    let efSourceVal = dto.efSource || 'DEFRA 2025';

    if (efVal === 0) {
      try {
        const resolved =
          await this.factorResolutionService.resolveEmissionFactor({
            fuelId: dto.fuelId,
            unitId: dto.unitId,
            factorVersionId: dto.factorVersionId,
          });
        efVal = resolved.emissionFactor;
        efSourceVal = resolved.efSource;
      } catch {
        // Fallback to provided ef or 0
      }
    }

    const categoryEntity = await this.masterCategoryRepo.findOne({
      where: [{ name: dto.category }, { code: dto.category }],
    });

    const calcMethodVal =
      dto.calculationMethod ||
      categoryEntity?.calculationMethod ||
      'FUEL_BASED';

    const calcResult = this.calculationMethodEngine.calculateEmission({
      amount: normResult.normalizedAmount,
      ef: efVal,
      unit: normResult.normalizedUnit,
      formula: dto.formula,
      method: calcMethodVal,
      radiativeForcingType: dto.radiativeForcingType,
      distanceType: dto.distanceType as any,
      factorBasis: dto.factorBasis as any,
      efType:
        (dto.efType as any) ||
        (calcMethodVal.includes('GAS') ? 'GAS_SPECIFIC' : 'CO2E'),
      ch4Origin: dto.ch4Origin as any,
      gwpSource: dto.gwpSource,
      gwpVersion: dto.gwpVersion,
      gwpHorizon: dto.gwpHorizon,
      isBiogenic: dto.isBiogenic,
      emissionMode: dto.emissionMode as any,
      ownershipControl: dto.ownershipControl as any,
      rechargedAmount: dto.rechargedAmount,
      equipmentCapacity: dto.equipmentCapacity,
      leakageRatePercent: dto.leakageRatePercent,
      inventoryStart: dto.inventoryStart,
      purchasedRefrigerant: dto.purchasedRefrigerant,
      recoveredRefrigerant: dto.recoveredRefrigerant,
      inventoryEnd: dto.inventoryEnd,
      methodologyInputsSnapshot: dto.methodologyInputsSnapshot,
      numberOfRooms: dto.numberOfRooms,
      numberOfNights: dto.numberOfNights,
      wastewaterVolume: dto.wastewaterVolume,
      treatmentMethod: dto.treatmentMethod,
      employeeCount: dto.employeeCount,
      travelDays: dto.travelDays,
      dailyDistance: dto.dailyDistance,
    });

    return {
      derivedAmount: calcResult.derivedAmount,
      normalizedUnit: normResult.normalizedUnit,
      exactEF: calcResult.exactEF,
      efUnit: `kg CO2e / ${normResult.normalizedUnit}`,
      factorBasis: calcResult.gasBreakdown.factorBasis,
      factorRepresentation: calcResult.gasBreakdown.factorRepresentation,
      factorDataset: dto.factorDataset || 'DEFRA 2025',
      factorVersion: dto.factorVersion || 'v1.0',
      factorYear: dto.factorYear || '2025',
      calculationMethod: calcResult.methodUsed,
      calculationEngineVersion: calcResult.calculationEngineVersion,
      gasBreakdownAvailable: calcResult.gasBreakdown.gasBreakdownAvailable,
      ch4Origin: calcResult.gasBreakdown.ch4Origin,
      gwpSource: calcResult.gasBreakdown.gwpSource,
      gwpVersion: calcResult.gasBreakdown.gwpVersion,
      gwpHorizon: calcResult.gasBreakdown.gwpHorizon,
      gwpValuesSnapshot: calcResult.gasBreakdown.gwpValuesSnapshot,
      gasCO2: calcResult.gasBreakdown.CO2,
      gasCH4: calcResult.gasBreakdown.CH4,
      gasN2O: calcResult.gasBreakdown.N2O,
      emission: calcResult.emission,
      biogenicEmission: calcResult.biogenicEmission,
      fossilEmission: calcResult.fossilEmission,
      emissionUnit: 'tCO2e',
    };
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
        'entry.originalAmount',
        'entry.originalUnit',
        'entry.normalizedAmount',
        'entry.normalizedUnit',
        'entry.ef',
        'entry.efSource',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.facility',
        'entry.emission',
        'entry.scopeType',
        'entry.scope3CategoryNumber',
        'entry.calculationMethod',
        'entry.activityTypeCode',
        'entry.radiativeForcingType',
        'entry.efType',
        'entry.ch4Origin',
        'entry.gwpSource',
        'entry.gwpVersion',
        'entry.gwpHorizon',
        'entry.gwpValuesSnapshot',
        'entry.gasBreakdownAvailable',
        'entry.gasCO2',
        'entry.gasCH4',
        'entry.gasN2O',
        'entry.gasHFC',
        'entry.gasPFC',
        'entry.gasSF6',
        'entry.gasNF3',
        'entry.methodologyInputsSnapshot',
        'entry.status',
        'entry.comment',
        'entry.approvalStatus',
        'entry.isActive',
      ])
      .where('entry.id = :id', { id })
      .andWhere('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException(`Inventory entry with ID ${id} not found`);
    }

    if (!dto.comment && !(dto as any).changeReason) {
      throw new BadRequestException(
        'changeReason (comment) is required when updating an inventory entry for audit history compliance',
      );
    }

    const period = await this.resolveAndAssertReportingPeriod(
      orgId,
      existing.dateFrom || existing.dateTo || dto.dateFrom || dto.dateTo,
    );
    if (period) {
      existing.reportingPeriodId = period.id;
      existing.reportingPeriodYear = period.year;
      existing.reportingPeriodName = period.name;
    }

    Object.assign(existing, dto);

    // Physical Unit Normalization on update
    const normResult = this.unitNormalizationService.normalizeUnit(
      existing.amount,
      existing.unit || 'l',
    );

    existing.originalAmount = dto.originalAmount ?? existing.amount;
    existing.originalUnit = dto.originalUnit ?? existing.unit;
    existing.normalizedAmount = normResult.normalizedAmount;
    existing.normalizedUnit = normResult.normalizedUnit;

    let targetUnitId = dto.unitId;
    if (normResult.normalizedUnit) {
      const normUnitEntity = await this.masterUnitRepo.findOne({
        where: [
          { symbol: normResult.normalizedUnit },
          { name: normResult.normalizedUnit },
        ],
      });
      if (normUnitEntity) {
        targetUnitId = normUnitEntity.id;
      }
    }

    if (dto.fuelId || targetUnitId || dto.factorVersionId) {
      try {
        const resolved =
          await this.factorResolutionService.resolveEmissionFactor({
            fuelId: dto.fuelId,
            unitId: targetUnitId,
            factorVersionId: dto.factorVersionId,
          });
        existing.ef = resolved.emissionFactor;
        existing.efSource = resolved.efSource;
      } catch {
        // Retain existing ef & efSource if resolution fails
      }
    }

    const categoryEntity = await this.masterCategoryRepo.findOne({
      where: [{ name: existing.category }, { code: existing.category }],
    });

    existing.scopeType =
      dto.scopeType ||
      existing.scopeType ||
      categoryEntity?.scopeType ||
      'SCOPE_1';
    existing.scope3CategoryNumber =
      dto.scope3CategoryNumber ??
      existing.scope3CategoryNumber ??
      categoryEntity?.scope3CategoryNumber;
    existing.calculationMethod =
      dto.calculationMethod ||
      existing.calculationMethod ||
      categoryEntity?.calculationMethod ||
      'FUEL_BASED';

    if (dto.ownershipControl !== undefined) {
      existing.ownershipControl = dto.ownershipControl;
    }
    if (dto.emissionMode !== undefined) {
      existing.emissionMode = dto.emissionMode;
    }
    if (dto.isBiogenic !== undefined) {
      existing.isBiogenic = dto.isBiogenic;
    }

    // Scope 1 Mobile Ownership Boundary Validation
    if (
      (existing.scopeType === 'SCOPE_1' ||
        existing.category?.toLowerCase().includes('mobile')) &&
      existing.ownershipControl &&
      (existing.ownershipControl === 'EMPLOYEE_OWNED' ||
        existing.ownershipControl === 'THIRD_PARTY')
    ) {
      throw new BadRequestException(
        `Operational control boundary violation: ${existing.ownershipControl} vehicles belong to Scope 3 (Category 6 Business Travel or Category 7 Commuting) and cannot be recorded under Scope 1 direct emissions.`,
      );
    }

    const efVal = existing.ef ?? 0;
    const calcResult = this.calculationMethodEngine.calculateEmission({
      amount: normResult.normalizedAmount,
      ef: efVal,
      unit: normResult.normalizedUnit,
      formula: dto.formula,
      method: existing.calculationMethod,
      radiativeForcingType: existing.radiativeForcingType,
      efType: existing.efType as any,
      ch4Origin: existing.ch4Origin as any,
      gwpSource: existing.gwpSource,
      gwpVersion: existing.gwpVersion,
      gwpHorizon: existing.gwpHorizon,
      isBiogenic: existing.isBiogenic,
      emissionMode: existing.emissionMode as any,
      ownershipControl: existing.ownershipControl as any,
      rechargedAmount: dto.rechargedAmount,
      equipmentCapacity: dto.equipmentCapacity,
      leakageRatePercent: dto.leakageRatePercent,
      inventoryStart: dto.inventoryStart,
      purchasedRefrigerant: dto.purchasedRefrigerant,
      recoveredRefrigerant: dto.recoveredRefrigerant,
      inventoryEnd: dto.inventoryEnd,
      numberOfRooms: dto.numberOfRooms,
      numberOfNights: dto.numberOfNights,
      wastewaterVolume: dto.wastewaterVolume,
      treatmentMethod: dto.treatmentMethod,
      employeeCount: dto.employeeCount,
      travelDays: dto.travelDays,
      dailyDistance: dto.dailyDistance,
      methodologyInputsSnapshot: existing.methodologyInputsSnapshot,
    });

    existing.ef = calcResult.exactEF;
    existing.emission = calcResult.emission;
    existing.biogenicEmission = calcResult.biogenicEmission;
    existing.isBiogenic = Boolean(
      existing.isBiogenic || calcResult.inputsSnapshot?.isBiogenic,
    );
    existing.emissionMode =
      calcResult.inputsSnapshot?.emissionMode || existing.emissionMode;
    existing.normalizedAmount = calcResult.derivedAmount;
    existing.calculationMethod = calcResult.methodUsed;
    existing.calculationEngineVersion = calcResult.calculationEngineVersion;
    existing.efType = calcResult.gasBreakdown.efType;
    existing.factorBasis = calcResult.gasBreakdown.factorBasis;
    existing.ch4Origin = calcResult.gasBreakdown.ch4Origin;
    existing.gwpHorizon = calcResult.gasBreakdown.gwpHorizon;
    existing.gwpValuesSnapshot = calcResult.gasBreakdown.gwpValuesSnapshot;
    existing.gasBreakdownAvailable =
      calcResult.gasBreakdown.gasBreakdownAvailable;
    existing.gasCO2 = calcResult.gasBreakdown.CO2;
    existing.gasCH4 = calcResult.gasBreakdown.CH4;
    existing.gasN2O = calcResult.gasBreakdown.N2O;
    existing.gasHFC = calcResult.gasBreakdown.HFC;
    existing.gasPFC = calcResult.gasBreakdown.PFC;
    existing.gasSF6 = calcResult.gasBreakdown.SF6;
    existing.gasNF3 = calcResult.gasBreakdown.NF3;
    existing.methodologyInputsSnapshot = calcResult.inputsSnapshot;
    const beforeSnapshot = { ...existing };
    const saved = await this.inventoryRepo.save(existing);

    // Automated Immutable Audit Log Tracking
    try {
      await this.auditLogRepo.save(
        this.auditLogRepo.create({
          inventoryEntryId: saved.id,
          organizationId: orgId,
          action: 'UPDATE',
          changedBy: user.id,
          calculationEngineVersion: saved.calculationEngineVersion || '1.0.0',
          beforeSnapshot,
          afterSnapshot: { ...saved },
          changeReason: dto.comment || 'Entry updated and recalculated',
        }),
      );
    } catch {
      // Non-blocking audit log tracking
    }

    return saved;
  }

  async deactivateInventoryEntry(
    user: IDecodeUserDetails,
    id: number,
    changeReason?: string,
  ): Promise<{ message: string }> {
    const orgId = this.resolveOrgId(user);
    const existing = await this.inventoryRepo
      .createQueryBuilder('entry')
      .select([
        'entry.id',
        'entry.organizationId',
        'entry.isActive',
        'entry.dateFrom',
        'entry.dateTo',
        'entry.calculationEngineVersion',
      ])
      .where('entry.id = :id', { id })
      .andWhere('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException('Inventory entry not found');
    }

    await this.resolveAndAssertReportingPeriod(
      orgId,
      existing.dateFrom || existing.dateTo,
    );

    const beforeSnapshot = { ...existing };
    existing.isActive = false;
    const saved = await this.inventoryRepo.save(existing);

    try {
      await this.auditLogRepo.save(
        this.auditLogRepo.create({
          inventoryEntryId: saved.id,
          organizationId: orgId,
          action: 'DEACTIVATE',
          changedBy: user.id,
          calculationEngineVersion: saved.calculationEngineVersion || '1.0.0',
          beforeSnapshot,
          afterSnapshot: { ...saved },
          changeReason: 'Entry deactivated from inventory table',
        }),
      );
    } catch {
      // Non-blocking audit log creation
    }

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

    const sourcesSet = new Set<string>([
      'IPCC (Commercial & Institutional Use)',
      'DEFRA 2024',
      'IEA 2023',
    ]);
    const versionsSet = new Set<string>(['AR6', '2024', '2023']);
    const unitsSet = new Set<string>([
      'sm3',
      'L',
      'kWh',
      'kg',
      'm3',
      'ton',
      'km',
      'passenger.km',
    ]);
    const defaultFormula = '(amount * factor) / 1000';

    return {
      statusCode: 200,
      scope: String(
        scopeId ||
          (scopeItem?.masterScope?.scope
            ? scopeItem.masterScope.scope.replace(/\D/g, '')
            : '1'),
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
      scope: item.masterScope?.scope
        ? item.masterScope.scope.replace(/\D/g, '')
        : '1',
      scopeCode: item.masterScope?.code || '',
    }));
  }

  async getReportingPeriods(user: IDecodeUserDetails) {
    const orgId = this.resolveOrgId(user);
    const list = await this.reportingPeriodRepo.find({
      where: { organizationId: orgId },
      order: { year: 'DESC' },
    });

    if (list.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultPeriods = [
        this.reportingPeriodRepo.create({
          organizationId: orgId,
          year: currentYear,
          name: `Reporting Period ${currentYear}`,
          startDate: `${currentYear}-01-01`,
          endDate: `${currentYear}-12-31`,
          status: 'OPEN',
        }),
        this.reportingPeriodRepo.create({
          organizationId: orgId,
          year: currentYear - 1,
          name: `Reporting Period ${currentYear - 1}`,
          startDate: `${currentYear - 1}-01-01`,
          endDate: `${currentYear - 1}-12-31`,
          status: 'LOCKED',
          lockedAt: new Date(),
          lockReason: 'Historical reporting period locked for audit compliance',
        }),
      ];
      return this.reportingPeriodRepo.save(defaultPeriods);
    }

    return list;
  }

  async closeReportingPeriod(
    user: IDecodeUserDetails,
    periodId: number,
    reason?: string,
  ) {
    const orgId = this.resolveOrgId(user);
    const period = await this.reportingPeriodRepo.findOne({
      where: { id: periodId, organizationId: orgId },
    });

    if (!period) {
      throw new BadRequestException('Reporting period not found');
    }

    if (period.status === 'LOCKED') {
      throw new ForbiddenException(
        'Reporting period is LOCKED and cannot be changed to CLOSED',
      );
    }

    period.status = 'CLOSED';
    period.lockReason = reason || 'Period closed for review freeze';
    return this.reportingPeriodRepo.save(period);
  }

  async lockReportingPeriod(
    user: IDecodeUserDetails,
    periodId: number,
    lockReason?: string,
  ) {
    const orgId = this.resolveOrgId(user);
    const period = await this.reportingPeriodRepo.findOne({
      where: { id: periodId, organizationId: orgId },
    });

    if (!period) {
      throw new BadRequestException('Reporting period not found');
    }

    period.status = 'LOCKED';
    period.lockedBy = user.id;
    period.lockedAt = new Date();
    period.lockReason =
      lockReason || 'Period locked for GHG Protocol audit verification';

    return this.reportingPeriodRepo.save(period);
  }

  async reopenReportingPeriod(
    user: IDecodeUserDetails,
    periodId: number,
    reason?: string,
  ) {
    this.assertSuperAdmin(user);
    const orgId = this.resolveOrgId(user);
    const period = await this.reportingPeriodRepo.findOne({
      where: { id: periodId, organizationId: orgId },
    });

    if (!period) {
      throw new BadRequestException('Reporting period not found');
    }

    if (period.status === 'LOCKED') {
      throw new ForbiddenException(
        'LOCKED reporting period cannot be reopened. Hard audit lock in effect.',
      );
    }

    period.status = 'OPEN';
    period.lockReason = reason || 'Period reopened by Super Admin';
    return this.reportingPeriodRepo.save(period);
  }

  async getInventoryAuditLogs(user: IDecodeUserDetails, entryId: number) {
    const orgId = this.resolveOrgId(user);
    return this.auditLogRepo.find({
      where: { inventoryEntryId: entryId, organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async exportInventoryReport(
    user: IDecodeUserDetails,
    format: 'csv' | 'json' = 'csv',
    periodYear?: number,
  ) {
    const orgId = this.resolveOrgId(user);
    const query = this.inventoryRepo
      .createQueryBuilder('entry')
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = true');

    if (periodYear) {
      query.andWhere('entry.reportingPeriodYear = :periodYear', { periodYear });
    }

    const entries = await query.getMany();
    const timestamp = new Date().toISOString();

    const metadata = {
      calculationEngineVersion: '1.0.0',
      reportingPeriod: periodYear ? `FY${periodYear}` : 'All Periods',
      generatedAt: timestamp,
      generatedBy: user.email || `User #${user.id}`,
      totalEntries: entries.length,
      totalEmissionsTCO2e: entries.reduce(
        (acc, curr) => acc + (curr.emission || 0),
        0,
      ),
    };

    if (format === 'json' || (format as string) === 'xlsx') {
      return { metadata, entries };
    }

    if ((format as string) === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      doc
        .fontSize(18)
        .text('GHG Protocol Audit Report Certificate', { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(10)
        .text(
          `Calculation Engine Version: ${metadata.calculationEngineVersion}`,
        );
      doc.text(`Reporting Period: ${metadata.reportingPeriod}`);
      doc.text(`Generated At: ${metadata.generatedAt}`);
      doc.text(`Generated By: ${metadata.generatedBy}`);
      doc.text(`Total Entries: ${metadata.totalEntries}`);
      doc.text(
        `Total Carbon Footprint: ${metadata.totalEmissionsTCO2e.toFixed(4)} tCO2e`,
      );
      doc.moveDown();
      doc.text(
        '--------------------------------------------------------------------------------',
      );
      doc.moveDown();

      entries.forEach((e: any, idx: number) => {
        doc
          .fontSize(9)
          .text(
            `${idx + 1}. [${e.scopeType}] ${e.category} - ${e.name}: ${e.emission} tCO2e (EF: ${e.ef} kgCO2e/${e.unit || 'unit'})`,
          );
      });

      doc.end();

      return new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });
    }

    // CSV format generation
    const csvHeader =
      '# GHG PROTOCOL AUDIT REPORT METADATA\n' +
      `# Calculation Engine Version,${metadata.calculationEngineVersion}\n` +
      `# Reporting Period,${metadata.reportingPeriod}\n` +
      `# Generated At,${metadata.generatedAt}\n` +
      `# Generated By,${metadata.generatedBy}\n` +
      `# Total Entries,${metadata.totalEntries}\n` +
      `# Total Emissions (tCO2e),${metadata.totalEmissionsTCO2e.toFixed(4)}\n\n` +
      'ID,Scope,Category,Activity,Original Amount,Original Unit,Normalized Amount,Normalized Unit,EF (kgCO2e/unit),EF Dataset,EF Version,Factor Basis,GWP Source,Emission (tCO2e),Status,Calculation Engine Version\n';

    const csvRows = entries
      .map(
        (e) =>
          `"${e.id}","${e.scopeType}","${e.category}","${e.name}",${e.originalAmount ?? e.amount},"${e.originalUnit ?? e.unit}",${e.normalizedAmount ?? e.amount},"${e.normalizedUnit ?? e.unit}",${e.ef},"${e.factorDataset || ''}","${e.factorVersion || ''}","${e.factorBasis || 'CO2E_TOTAL'}","${e.gwpSource || 'IPCC AR6'}",${e.emission},"${e.status}","${e.calculationEngineVersion || '1.0.0'}"`,
      )
      .join('\n');

    return csvHeader + csvRows;
  }
  /**
   * Assembles authoritative entries + ExportMetadata for the export pipeline.
   * Provenance (organization, generatedBy) is derived from explicit authoritative
   * sources — never inferred from arbitrary inventory row fields.
   *
   * DB Consistency Guarantee: this is the only method that fetches inventory
   * entries for export. The controller and ExportService both receive the same
   * entries[] without any mutation.
   */
  async getEntriesForExport(
    user: IDecodeUserDetails,
    periodYear?: number,
  ): Promise<{
    entries: InventoryEntry[];
    metadata: import('./export.service').ExportMetadata;
  }> {
    const orgId = this.resolveOrgId(user);

    const query = this.inventoryRepo
      .createQueryBuilder('entry')
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = true')
      .orderBy('entry.scopeType', 'ASC')
      .addOrderBy('entry.scope3CategoryNumber', 'ASC', 'NULLS LAST')
      .addOrderBy('entry.createdAt', 'DESC');

    if (periodYear) {
      query.andWhere('entry.reportingPeriodYear = :periodYear', { periodYear });
    }

    const entries = await query.getMany();

    // Resolve organization name safely from user context (no extra repo injection needed)
    const organizationName =
      (user as any).organizationName ??
      (user as any).orgName ??
      (user.email
        ? (user.email.split('@')[1]?.split('.')[0] ?? `Org #${orgId}`)
        : `Org #${orgId}`);

    const totalEmissions = entries.reduce(
      (acc, e) => acc + (e.emission ?? 0),
      0,
    );

    const metadata: import('./export.service').ExportMetadata = {
      organization: organizationName,
      organizationId: orgId,
      reportingPeriod: periodYear ? `FY${periodYear}` : 'All Periods',
      reportingPeriodYear: periodYear,
      generatedAt: new Date().toISOString(),
      generatedBy: user.email || `User #${user.id}`,
      calculationEngineVersion: '1.0.0',
      exportVersion: '1.0',
      totalEntries: entries.length,
      totalEmissionsTCO2e: totalEmissions,
    };

    return { entries, metadata };
  }
}
