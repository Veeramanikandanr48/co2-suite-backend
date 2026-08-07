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
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  AssignServicesDto,
  CreateScopeItemDto,
  CreateServiceDto,
} from 'src/dto/service.dto';
import {
  CreateEmissionFactorDto,
  CreateInventoryEntryDto,
  UpdateEmissionFactorDto,
  UpdateInventoryEntryDto,
} from 'src/dto/inventory.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { ICommonSortFieldObject } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { MasterRole } from 'src/enums/casl.enum';
import {
  SEED_SERVICES,
  SEED_SCOPE_ITEMS,
  SEED_EMISSION_FACTORS,
  SEED_INVENTORY_ENTRIES,
} from 'src/seeds/initial-data.seed';
import { CalculationEngine } from './engine/calculation-engine';

@Injectable()
export class ServicesService implements OnApplicationBootstrap {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(OrganizationService)
    private readonly orgServiceRepo: Repository<OrganizationService>,
    @InjectRepository(ServiceScopeItem)
    private readonly scopeItemRepo: Repository<ServiceScopeItem>,
    @InjectRepository(EmissionFactor)
    private readonly efRepo: Repository<EmissionFactor>,
    @InjectRepository(InventoryEntry)
    private readonly inventoryRepo: Repository<InventoryEntry>,
    private readonly utilService: UtilService,
    private readonly calculationEngine: CalculationEngine,
  ) {}

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

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.dataSource.query(`
        DROP TABLE IF EXISTS 
          master_items, master_types, master_categories, master_configs, 
          gas_types, gwp_versions, gwp_values, factor_sets, calculation_formulas, 
          calculation_policies, supplementary_fields, data_quality, master_change_requests, 
          master_item_versions, master_schemas, master_type_schema_versions, 
          master_type_statistics, unit_conversions, activity_category_fuel_types, 
          fuel_type_measurement_units CASCADE;
      `);
    } catch {
      // Ignore if tables do not exist
    }

    const serviceCount = await this.serviceRepo.count();
    if (serviceCount === 0) {
      await this.serviceRepo.save(
        this.serviceRepo.create(SEED_SERVICES as Partial<Service>[]),
      );
    }

    const scopeCount = await this.scopeItemRepo.count();
    if (scopeCount === 0) {
      await this.scopeItemRepo.save(
        this.scopeItemRepo.create(
          SEED_SCOPE_ITEMS as Partial<ServiceScopeItem>[],
        ),
      );
    }

    const efCount = await this.efRepo.count();
    if (efCount < SEED_EMISSION_FACTORS.length) {
      for (const ef of SEED_EMISSION_FACTORS) {
        const existing = await this.efRepo
          .createQueryBuilder('ef')
          .select(['ef.id', 'ef.category', 'ef.fuelOrGasType', 'ef.source'])
          .where('ef.category = :category', { category: ef.category })
          .andWhere('ef.fuelOrGasType = :fuelOrGasType', {
            fuelOrGasType: ef.fuelOrGasType,
          })
          .andWhere('ef.source = :source', { source: ef.source })
          .getOne();
        if (!existing) {
          await this.efRepo.save(
            this.efRepo.create(ef as Partial<EmissionFactor>),
          );
        }
      }
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

  // --- SERVICE SCOPE ITEMS METHODS ---

  async createScopeItem(
    dto: CreateScopeItemDto,
    user: IDecodeUserDetails,
  ): Promise<ServiceScopeItem> {
    this.assertSuperAdmin(user);
    const serviceCode = dto.serviceCode.trim().toUpperCase();
    const itemCode = dto.code.trim().toUpperCase();

    const existing = await this.scopeItemRepo
      .createQueryBuilder('scopeItem')
      .select(['scopeItem.id', 'scopeItem.serviceCode', 'scopeItem.code'])
      .where('scopeItem.serviceCode = :serviceCode', { serviceCode })
      .andWhere('scopeItem.code = :itemCode', { itemCode })
      .andWhere('scopeItem.isActive = :isActive', { isActive: true })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Scope item with code "${itemCode}" already exists for service "${serviceCode}"`,
      );
    }

    const entity = this.scopeItemRepo.create({
      ...dto,
      serviceCode,
      code: itemCode,
      scopeCode: dto.scopeCode.trim().toUpperCase(),
      sortOrder: dto.sortOrder ?? 0,
      isActive: true,
    });
    return this.scopeItemRepo.save(entity);
  }

  async getServiceScopes(serviceCode?: string): Promise<ServiceScopeItem[]> {
    const codeUpper = serviceCode
      ? serviceCode.trim().toUpperCase()
      : undefined;

    const query = this.scopeItemRepo
      .createQueryBuilder('scopeItem')
      .select([
        'scopeItem.id',
        'scopeItem.serviceCode',
        'scopeItem.scope',
        'scopeItem.scopeCode',
        'scopeItem.name',
        'scopeItem.code',
        'scopeItem.description',
        'scopeItem.sortOrder',
        'scopeItem.isActive',
        'scopeItem.createdAt',
      ])
      .where('scopeItem.isActive = :isActive', { isActive: true });

    if (codeUpper) {
      query.andWhere('scopeItem.serviceCode = :codeUpper', { codeUpper });
    }

    return query
      .orderBy('scopeItem.scopeCode', 'ASC')
      .addOrderBy('scopeItem.sortOrder', 'ASC')
      .addOrderBy('scopeItem.id', 'ASC')
      .getMany();
  }

  async deactivateScopeItem(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<{ message: string }> {
    this.assertSuperAdmin(user);
    const existing = await this.scopeItemRepo
      .createQueryBuilder('scopeItem')
      .select(['scopeItem.id', 'scopeItem.isActive'])
      .where('scopeItem.id = :id', { id })
      .andWhere('scopeItem.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException('Service scope item not found');
    }
    existing.isActive = false;
    await this.scopeItemRepo.save(existing);
    return { message: 'Service scope item deactivated successfully' };
  }

  // --- EMISSION FACTORS METHODS ---

  async getEmissionFactors(category?: string): Promise<EmissionFactor[]> {
    const query = this.efRepo
      .createQueryBuilder('ef')
      .select([
        'ef.id',
        'ef.category',
        'ef.source',
        'ef.version',
        'ef.fuelOrGasType',
        'ef.unit',
        'ef.factor',
        'ef.formula',
        'ef.isActive',
        'ef.createdAt',
      ])
      .where('ef.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('ef.category = :category', { category });
    }

    return query
      .orderBy('ef.category', 'ASC')
      .addOrderBy('ef.source', 'ASC')
      .addOrderBy('ef.fuelOrGasType', 'ASC')
      .getMany();
  }

  async createEmissionFactor(
    dto: CreateEmissionFactorDto,
    user: IDecodeUserDetails,
  ): Promise<EmissionFactor> {
    this.assertSuperAdmin(user);
    const entity = this.efRepo.create({
      ...dto,
      isActive: true,
    });
    return this.efRepo.save(entity);
  }

  async getEmissionFactorsFilterList(payload: CommonListPayloadDto) {
    const tableName = 'ef';
    const tableSortCheck = [
      'id',
      'category',
      'source',
      'version',
      'fuelOrGasType',
      'unit',
      'factor',
      'isActive',
      'createdAt',
    ];
    const sortFieldObject: ICommonSortFieldObject = {
      id: 'ef.id',
      category: 'ef.category',
      source: 'ef.source',
      version: 'ef.version',
      fuelOrGasType: 'ef.fuelOrGasType',
      unit: 'ef.unit',
      factor: 'ef.factor',
      isActive: 'ef.isActive',
      createdAt: 'ef.createdAt',
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

    const query = this.efRepo
      .createQueryBuilder(tableName)
      .select([
        'ef.id',
        'ef.category',
        'ef.source',
        'ef.fuelOrGasType',
        'ef.unit',
        'ef.factor',
        'ef.version',
        'ef.formula',
        'ef.isActive',
        'ef.createdAt',
      ])
      .andWhere('ef.isActive = :isActive', { isActive: true });

    if (additionalFilter && typeof additionalFilter === 'object') {
      const { category, source, isActive } = additionalFilter as Record<
        string,
        string | boolean | undefined
      >;
      if (category) {
        query.andWhere('ef.category = :category', { category });
      }
      if (source && typeof source === 'string') {
        query.andWhere('LOWER(ef.source) LIKE :source', {
          source: `%${source.toLowerCase()}%`,
        });
      }
      if (isActive !== undefined) {
        query.andWhere('ef.isActive = :isActive', { isActive });
      }
    }

    if (searchInput && searchInput.trim()) {
      const term = `%${searchInput.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(ef.category) LIKE :term OR LOWER(ef.source) LIKE :term OR LOWER(ef.fuelOrGasType) LIKE :term OR LOWER(ef.version) LIKE :term OR LOWER(ef.unit) LIKE :term)',
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

  async updateEmissionFactor(
    id: number,
    dto: UpdateEmissionFactorDto,
    user: IDecodeUserDetails,
  ): Promise<EmissionFactor> {
    this.assertSuperAdmin(user);
    const existing = await this.efRepo
      .createQueryBuilder('ef')
      .select([
        'ef.id',
        'ef.category',
        'ef.source',
        'ef.version',
        'ef.fuelOrGasType',
        'ef.unit',
        'ef.factor',
        'ef.formula',
        'ef.isActive',
      ])
      .where('ef.id = :id', { id })
      .andWhere('ef.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException(`Emission factor with ID ${id} not found`);
    }

    Object.assign(existing, dto);
    return this.efRepo.save(existing);
  }

  async deactivateEmissionFactor(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<{ message: string }> {
    this.assertSuperAdmin(user);
    const existing = await this.efRepo
      .createQueryBuilder('ef')
      .select(['ef.id', 'ef.isActive'])
      .where('ef.id = :id', { id })
      .andWhere('ef.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException('Emission factor not found');
    }
    existing.isActive = false;
    await this.efRepo.save(existing);
    return { message: 'Emission factor deactivated successfully' };
  }

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
    const efRecord = await this.efRepo
      .createQueryBuilder('ef')
      .select(['ef.id', 'ef.factor', 'ef.formula'])
      .where('ef.category = :category', { category: dto.category })
      .andWhere('ef.fuelOrGasType = :name', { name: dto.name })
      .andWhere('ef.isActive = :isActive', { isActive: true })
      .getOne();

    let efVal = dto.ef;
    if (efVal === undefined || efVal === null) {
      efVal = efRecord?.factor ?? 0;
    }

    const calculatedEmission = this.calculateEmissionValue(
      dto.amount,
      efVal,
      dto.formula || efRecord?.formula,
      dto.unit,
    );

    const entity = this.inventoryRepo.create({
      ...dto,
      organizationId: orgId,
      createdBy: userId,
      ef: efVal,
      emission: calculatedEmission,
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
      ])
      .where('entry.id = :id', { id })
      .andWhere('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true })
      .getOne();
    if (!existing) {
      throw new BadRequestException(`Inventory entry with ID ${id} not found`);
    }

    Object.assign(existing, dto);

    const efRecord = await this.efRepo
      .createQueryBuilder('ef')
      .select(['ef.id', 'ef.factor', 'ef.formula'])
      .where('ef.category = :category', { category: existing.category })
      .andWhere('ef.fuelOrGasType = :name', { name: existing.name })
      .andWhere('ef.isActive = :isActive', { isActive: true })
      .getOne();

    if (dto.ef === undefined || dto.ef === null) {
      if (efRecord?.factor) {
        existing.ef = efRecord.factor;
      }
    } else {
      existing.ef = dto.ef;
    }

    existing.emission = this.calculateEmissionValue(
      existing.amount,
      existing.ef,
      dto.formula || efRecord?.formula,
      existing.unit,
    );

    return this.inventoryRepo.save(existing);
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

    // Dynamically resolve category from DB scopeItemRepo first
    const scopeItem = await this.scopeItemRepo
      .createQueryBuilder('item')
      .select(['item.name', 'item.code', 'item.scope', 'item.scopeCode'])
      .where('UPPER(item.code) = :codeUpper', { codeUpper })
      .orWhere('UPPER(item.scopeCode) = :codeUpper', { codeUpper })
      .getOne();

    const categoryName = scopeItem
      ? scopeItem.name
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
    const scopeItem = await this.scopeItemRepo
      .createQueryBuilder('item')
      .select(['item.name', 'item.code', 'item.scope', 'item.scopeCode'])
      .where('UPPER(item.code) = :codeUpper', { codeUpper })
      .getOne();

    const categoryName = scopeItem
      ? scopeItem.name
      : this.activityToCategoryMap[codeUpper] || codeUpper;

    // 2. Query distinct emission factors dynamically from DB
    const efRecords = await this.efRepo
      .createQueryBuilder('ef')
      .select(['ef.source', 'ef.version', 'ef.unit', 'ef.formula'])
      .where('LOWER(ef.category) = LOWER(:categoryName)', { categoryName })
      .andWhere('ef.isActive = :isActive', { isActive: true })
      .getMany();

    const sourcesSet = new Set<string>();
    const versionsSet = new Set<string>();
    const unitsSet = new Set<string>();
    let defaultFormula = '(amount * factor) / 1000';

    efRecords.forEach((ef) => {
      if (ef.source) sourcesSet.add(ef.source);
      if (ef.version) versionsSet.add(ef.version);
      if (ef.unit) unitsSet.add(ef.unit);
      if (ef.formula) defaultFormula = ef.formula;
    });

    if (sourcesSet.size === 0)
      sourcesSet.add('IPCC (Commercial & Institutional Use)');
    if (versionsSet.size === 0) versionsSet.add('AR6');
    if (unitsSet.size === 0) unitsSet.add('sm3');

    return {
      statusCode: 200,
      scope: String(
        scopeId ||
          (scopeItem?.scope ? scopeItem.scope.replace(/\D/g, '') : '1'),
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
    const scopeItems = await this.scopeItemRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    return scopeItems.map((item) => ({
      code: item.code,
      name: item.name,
      scope: item.scope ? item.scope.replace(/\D/g, '') : '1',
      scopeCode: item.scopeCode,
    }));
  }
}
