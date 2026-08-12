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
import { CalculationEngine } from './engine/calculation-engine';
import { CalculationPipelineService } from 'src/modules/calculation/calculation-pipeline.service';
import { AuditService } from 'src/modules/common/audit/audit.service';
import { ApprovalService } from 'src/modules/common/approval/approval.service';
import { AuditAction } from 'src/enums/ghg.enum';

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
    private readonly calculationPipeline: CalculationPipelineService,
    private readonly auditService: AuditService,
    private readonly approvalService: ApprovalService,
  ) {}

  /** Approval module id for inventory entries (seeded in approval_modules). */
  private static readonly INVENTORY_APPROVAL_MODULE_ID = 2;

  /** Extracts the reporting year (YYYY) from a dd.MM.yyyy date string. */
  private extractReportingYear(dateFrom?: string): number | undefined {
    if (!dateFrom) return undefined;
    const parts = String(dateFrom).split('.');
    if (parts.length === 3) {
      const year = Number(parts[2]);
      if (!Number.isNaN(year)) return year;
    }
    const matched = String(dateFrom).match(/(\d{4})/);
    return matched ? Number(matched[1]) : undefined;
  }

  /**
   * Enterprise entry creation: runs the full calculation pipeline
   * (validation → normalization → factor resolution → GWP → gas math),
   * records an audit trail, and raises an approval workflow when the
   * approval matrix exists. If no master factor can be resolved the legacy
   * path is preserved and the entry is created with a pending review marker.
   */
  async createInventoryEntry(
    user: IDecodeUserDetails,
    dto: CreateInventoryEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const userId = user.id;

    const outcome = await this.calculationPipeline.run({
      organizationId: orgId,
      category: dto.category,
      name: dto.name,
      amount: dto.amount,
      unit: dto.unit,
      fuelKey: dto.name,
      reportingYear: this.extractReportingYear(dto.dateFrom),
      basedOption: 'activity',
      runType: 'SAVE',
      reason: dto.comment,
    });

    let entity: InventoryEntry;
    if (outcome.ok) {
      entity = this.inventoryRepo.create({
        ...dto,
        organizationId: orgId,
        createdBy: userId,
        ef: outcome.factorValue,
        efSource: outcome.fallbackUsed
          ? `RESOLVED (fallback) — ${outcome.fallbackReason}`
          : 'RESOLVED via factor resolution',
        emission: outcome.totalEmission,
        status: dto.status || 'completed',
        scopeNumber: this.resolveScopeNumber(dto.category),
        factorId: outcome.factorId,
        factorVersionId: outcome.factorVersionId,
        gwpSetId: outcome.gwpSetId,
        calculationRunId: outcome.calculationRunId,
        latestCalculationResultId: outcome.calculationResultId,
        inclusionStatus:
          dto.status === 'pending' ? 'PENDING_REVIEW' : 'INCLUDED',
        dataQuality: outcome.fallbackUsed ? 'ESTIMATED' : 'AVERAGE_DATA',
        methodology: 'ACTIVITY_BASED',
      });
    } else {
      const blocked = outcome.errors.some(
        (e) => e.code === 'FACTOR_NOT_FOUND' || e.code === 'UNIT_INCOMPATIBLE',
      );
      entity = this.inventoryRepo.create({
        ...dto,
        organizationId: orgId,
        createdBy: userId,
        ef: dto.ef ?? 0,
        emission: blocked
          ? 0
          : this.calculateEmissionValue(
              dto.amount,
              dto.ef ?? 0,
              dto.formula,
              dto.unit,
            ),
        status: blocked ? 'pending' : dto.status || 'completed',
        comment: blocked
          ? `Awaiting master data: ${outcome.errors.map((e) => e.message).join(' ')}`
          : dto.comment,
        scopeNumber: this.resolveScopeNumber(dto.category),
        inclusionStatus: 'PENDING_REVIEW',
      });
    }

    const saved = await this.inventoryRepo.save(entity);

    // ── Audit trail ──────────────────────────────────────────────────────────
    await this.auditService.record({
      organizationId: orgId,
      entityType: 'inventory_entries',
      entityId: saved.id,
      entityLabel: `${dto.category} / ${dto.name}`,
      action: AuditAction.CREATE,
      afterJson: {
        amount: saved.amount,
        unit: saved.unit,
        emission: saved.emission,
        factorId: saved.factorId,
        gwpSetId: saved.gwpSetId,
        calculationRunId: saved.calculationRunId,
      },
      actorId: userId,
      reason: dto.comment,
    });

    if (outcome.fallbackUsed) {
      await this.auditService.record({
        organizationId: orgId,
        entityType: 'inventory_entries',
        entityId: saved.id,
        entityLabel: `${dto.category} / ${dto.name}`,
        action: AuditAction.FALLBACK,
        reason: outcome.fallbackReason,
        afterJson: { resolution: outcome.trace },
        actorId: userId,
      });
    }

    // ── Approval workflow (only when matrix configured) ─────────────────────
    await this.approvalService.insertDynamicApproval({
      approvalModuleId: ServicesService.INVENTORY_APPROVAL_MODULE_ID,
      primaryId: saved.id,
      userId,
      userRoleId: user.roleId,
      branchId: (user as { branchId?: number }).branchId ?? 1,
      notificationTitle: 'Inventory entry awaiting approval',
      notificationBody: `${dto.category} / ${dto.name} — ${saved.emission.toFixed(4)} tCO2e`,
      isNeedNotify: true,
    });

    return saved;
  }

  private resolveScopeNumber(category: string): number | undefined {
    const map: Record<string, number> = {
      'Stationary Combustion': 1,
      'Mobile Combustion': 1,
      'Fugitive Emissions': 1,
      'Process Emissions': 1,
      'Purchased Electricity': 2,
      'Purchased Heating & Steam': 2,
      'Purchased Goods and Services': 3,
      'Capital Goods': 3,
      'Energy and Fuel Related Activities': 3,
      'Upstream Transportation': 3,
      'Waste Generated in Operations': 3,
      'Business Travel': 3,
      'Employee Commuting': 3,
      'Downstream Transportation': 3,
      'Processing of Sold Products': 3,
      'Use of Sold Products': 3,
      'EOL Treatment of Sold Products': 3,
      Franchise: 3,
      Investments: 3,
    };
    return map[category] ?? 1;
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

  /**
   * Update with revision control: approved entries become a new revision via
   * the pipeline (runType UPDATE); the audit trail records before/after.
   */
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
        'entry.inclusionStatus',
        'entry.isActive',
      ])
      .where('entry.id = :id', { id })
      .andWhere('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException(`Inventory entry with ID ${id} not found`);
    }

    const before = { ...existing } as unknown as Record<string, unknown>;
    Object.assign(existing, dto);

    const merged = {
      ...existing,
      ...dto,
    } as InventoryEntry;

    // Full pipeline on update (revised inputs → revised emissions, versioned)
    const outcome = await this.calculationPipeline.run({
      organizationId: orgId,
      inventoryEntryId: id,
      category: merged.category,
      name: merged.name,
      amount: merged.amount,
      unit: merged.unit,
      fuelKey: merged.name,
      reportingYear: this.extractReportingYear(merged.dateFrom),
      basedOption: 'activity',
      inclusionStatus: merged.inclusionStatus,
      runType: 'UPDATE',
      reason: dto.comment,
    });

    if (outcome.ok) {
      existing.emission = outcome.totalEmission;
      existing.ef = outcome.factorValue;
      existing.efSource = outcome.fallbackUsed
        ? `RESOLVED (fallback) — ${outcome.fallbackReason}`
        : 'RESOLVED via factor resolution';
      existing.factorId = outcome.factorId;
      existing.factorVersionId = outcome.factorVersionId;
      existing.gwpSetId = outcome.gwpSetId;
      existing.calculationRunId = outcome.calculationRunId;
      existing.latestCalculationResultId = outcome.calculationResultId;
    } else {
      const blocked = outcome.errors.some(
        (e) => e.code === 'FACTOR_NOT_FOUND' || e.code === 'UNIT_INCOMPATIBLE',
      );
      if (blocked) {
        existing.emission = 0;
        existing.status = 'pending';
        existing.comment = `Awaiting master data: ${outcome.errors.map((e) => e.message).join(' ')}`;
      }
    }

    const saved = await this.inventoryRepo.save(existing);

    await this.auditService.record({
      organizationId: orgId,
      entityType: 'inventory_entries',
      entityId: id,
      entityLabel: `${saved.category} / ${saved.name}`,
      action: AuditAction.UPDATE,
      beforeJson: before,
      afterJson: {
        amount: saved.amount,
        unit: saved.unit,
        emission: saved.emission,
        factorId: saved.factorId,
        calculationRunId: saved.calculationRunId,
      },
      actorId: user.id,
      reason: dto.comment,
    });

    if (outcome.fallbackUsed) {
      await this.auditService.record({
        organizationId: orgId,
        entityType: 'inventory_entries',
        entityId: id,
        entityLabel: `${saved.category} / ${saved.name}`,
        action: AuditAction.FALLBACK,
        reason: outcome.fallbackReason,
        afterJson: { resolution: outcome.trace },
        actorId: user.id,
      });
    }

    return saved;
  }

  async deactivateInventoryEntry(
    user: IDecodeUserDetails,
    id: number,
  ): Promise<{ message: string }> {
    const orgId = this.resolveOrgId(user);
    const existing = await this.inventoryRepo
      .createQueryBuilder('entry')
      .select(['entry.id', 'entry.organizationId', 'entry.isActive'])
      .where('entry.id = :id', { id })
      .andWhere('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException('Inventory entry not found');
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
}
