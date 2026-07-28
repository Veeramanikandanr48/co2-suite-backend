import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { AssignServicesDto, CreateScopeItemDto, CreateServiceDto } from 'src/dto/service.dto';
import { CreateEmissionFactorDto, CreateInventoryEntryDto, UpdateEmissionFactorDto } from 'src/dto/inventory.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { ICommonSortFieldObject } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import {
  SEED_SERVICES,
  SEED_SCOPE_ITEMS,
  SEED_EMISSION_FACTORS,
  SEED_INVENTORY_ENTRIES,
} from 'src/seeds/initial-data.seed';

@Injectable()
export class ServicesService implements OnApplicationBootstrap {
  constructor(
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
  ) {}

  /**
   * Seeds initial DB tables from separate seed file on application startup if empty.
   */
  async onApplicationBootstrap(): Promise<void> {
    const serviceCount = await this.serviceRepo.count();
    if (serviceCount === 0) {
      await this.serviceRepo.save(this.serviceRepo.create(SEED_SERVICES as Partial<Service>[]));
    }

    const scopeCount = await this.scopeItemRepo.count();
    if (scopeCount === 0) {
      await this.scopeItemRepo.save(this.scopeItemRepo.create(SEED_SCOPE_ITEMS as Partial<ServiceScopeItem>[]));
    }

    const efCount = await this.efRepo.count();
    if (efCount === 0) {
      await this.efRepo.save(this.efRepo.create(SEED_EMISSION_FACTORS as Partial<EmissionFactor>[]));
    }

    const invCount = await this.inventoryRepo.count();
    if (invCount === 0) {
      await this.inventoryRepo.save(this.inventoryRepo.create(SEED_INVENTORY_ENTRIES as Partial<InventoryEntry>[]));
    }
  }

  // --- SERVICE METHODS ---

  async createService(dto: CreateServiceDto): Promise<Service> {
    const codeUpper = dto.code.trim().toUpperCase();
    const existing = await this.serviceRepo.findOne({ where: { code: codeUpper } });
    if (existing) {
      throw new ConflictException(`Service with code "${codeUpper}" already exists`);
    }

    const entity = this.serviceRepo.create({
      ...dto,
      code: codeUpper,
      isActive: true,
    });
    return this.serviceRepo.save(entity);
  }

  async getAllServices(): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async getOrgServices(orgId: number): Promise<OrganizationService[]> {
    return this.orgServiceRepo.find({
      where: { organizationId: orgId, isActive: true },
      relations: { service: true },
      order: { id: 'ASC' },
    });
  }

  async assignServices(
    orgId: number,
    dto: AssignServicesDto,
    subscribedBy: number,
  ): Promise<OrganizationService[]> {
    const results: OrganizationService[] = [];

    for (const serviceId of dto.serviceIds) {
      const service = await this.serviceRepo.findOne({ where: { id: serviceId, isActive: true } });
      if (!service) {
        throw new BadRequestException(`Service with ID ${serviceId} not found`);
      }

      const existing = await this.orgServiceRepo.findOne({
        where: { organizationId: orgId, serviceId },
      });

      if (existing) {
        if (existing.isActive) {
          throw new ConflictException(`Service "${service.name}" is already assigned to this organization`);
        }
        existing.isActive = true;
        existing.subscribedBy = subscribedBy;
        results.push(await this.orgServiceRepo.save(existing));
      } else {
        const entity = this.orgServiceRepo.create({
          organizationId: orgId,
          serviceId,
          subscribedBy,
          isActive: true,
        });
        results.push(await this.orgServiceRepo.save(entity));
      }
    }

    return results;
  }

  async removeOrgService(orgId: number, serviceId: number): Promise<{ message: string }> {
    const existing = await this.orgServiceRepo.findOne({
      where: { organizationId: orgId, serviceId, isActive: true },
    });
    if (!existing) {
      throw new BadRequestException('This service subscription does not exist');
    }
    existing.isActive = false;
    await this.orgServiceRepo.save(existing);
    return { message: 'Service removed from organization successfully' };
  }

  // --- SERVICE SCOPE ITEMS METHODS ---

  async createScopeItem(dto: CreateScopeItemDto): Promise<ServiceScopeItem> {
    const serviceCode = dto.serviceCode.trim().toUpperCase();
    const itemCode = dto.code.trim().toUpperCase();

    const existing = await this.scopeItemRepo.findOne({
      where: { serviceCode, code: itemCode, isActive: true },
    });

    if (existing) {
      throw new ConflictException(`Scope item with code "${itemCode}" already exists for service "${serviceCode}"`);
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
    const codeUpper = serviceCode ? serviceCode.trim().toUpperCase() : undefined;
    const where: any = { isActive: true };
    if (codeUpper) {
      where.serviceCode = codeUpper;
    }

    return this.scopeItemRepo.find({
      where,
      order: { scopeCode: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async deleteScopeItem(id: number): Promise<{ message: string }> {
    const existing = await this.scopeItemRepo.findOne({ where: { id, isActive: true } });
    if (!existing) {
      throw new BadRequestException(`Service scope item with ID ${id} not found`);
    }
    existing.isActive = false;
    await this.scopeItemRepo.save(existing);
    return { message: 'Service scope item deleted successfully' };
  }

  // --- EMISSION FACTORS METHODS ---

  async getEmissionFactors(category?: string): Promise<EmissionFactor[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    return this.efRepo.find({
      where,
      order: { category: 'ASC', source: 'ASC', fuelOrGasType: 'ASC' },
    });
  }

  async createEmissionFactor(dto: CreateEmissionFactorDto): Promise<EmissionFactor> {
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
      'createdOn',
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
      createdOn: 'ef.createdOn',
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

    const query = this.efRepo.createQueryBuilder(tableName);

    if (additionalFilter && typeof additionalFilter === 'object') {
      const { category, source, isActive } = additionalFilter as any;
      if (category) {
        query.andWhere('ef.category = :category', { category });
      }
      if (source) {
        query.andWhere('ef.source = :source', { source });
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
  ): Promise<EmissionFactor> {
    const existing = await this.efRepo.findOne({ where: { id } });
    if (!existing) {
      throw new BadRequestException(`Emission factor with ID ${id} not found`);
    }

    Object.assign(existing, dto);
    return this.efRepo.save(existing);
  }

  async deleteEmissionFactor(id: number): Promise<{ message: string }> {
    const existing = await this.efRepo.findOne({ where: { id } });
    if (!existing) {
      throw new BadRequestException(`Emission factor with ID ${id} not found`);
    }
    await this.efRepo.remove(existing);
    return { message: 'Emission factor deleted successfully' };
  }

  // --- INVENTORY ENTRIES METHODS ---

  async getInventoryEntries(
    orgId: number,
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
    const page = Number(queryParams?.page) || 1;
    const limit = Number(queryParams?.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.inventoryRepo
      .createQueryBuilder('entry')
      .where('entry.organizationId = :orgId', { orgId });

    if (queryParams?.category) {
      queryBuilder.andWhere('entry.category = :category', { category: queryParams.category });
    }

    if (queryParams?.facility) {
      queryBuilder.andWhere('entry.facility = :facility', { facility: queryParams.facility });
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
    const sortDirection = (queryParams?.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

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

  async getInventoryFilterList(payload: CommonListPayloadDto) {
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
      'createdOn',
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
      createdOn: 'entry.createdOn',
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

    const query = this.inventoryRepo.createQueryBuilder(tableName);

    if (additionalFilter && typeof additionalFilter === 'object') {
      const { category, facility, status, organizationId } = additionalFilter as any;
      if (organizationId) {
        query.andWhere('entry.organizationId = :organizationId', { organizationId });
      }
      if (category) {
        query.andWhere('entry.category = :category', { category });
      }
      if (facility) {
        query.andWhere('entry.facility = :facility', { facility });
      }
      if (status) {
        query.andWhere(
          '(entry.status = :status OR entry.approvalStatus = :status)',
          { status },
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

  async createInventoryEntry(
    orgId: number,
    userId: number,
    dto: CreateInventoryEntryDto,
  ): Promise<InventoryEntry> {
    let efVal = dto.ef;
    if (efVal === undefined || efVal === null) {
      const efRecord = await this.efRepo.findOne({
        where: { category: dto.category, fuelOrGasType: dto.name, isActive: true },
      });
      efVal = efRecord?.factor ?? 0;
    }

    const amountVal = Number(dto.amount) || 0;
    const unitLower = (dto.unit || '').toLowerCase();

    let calculatedEmission = 0;
    if (unitLower === 'tonne' || unitLower === 'ton') {
      // If EF is in kg/tonne (e.g. > 1.0), divide by 1000 to convert to metric tonnes CO2-e
      if (efVal > 1.0) {
        calculatedEmission = Number(((amountVal * efVal) / 1000).toFixed(3));
      } else {
        // If EF is already in t CO2-e / tonne (e.g. <= 1.0)
        calculatedEmission = Number((amountVal * efVal).toFixed(3));
      }
    } else {
      // Standard kg, kWh, L, sm3, km, ton.km: (amount * factor) / 1000
      calculatedEmission = Number(((amountVal * efVal) / 1000).toFixed(3));
    }

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

  async deleteInventoryEntry(orgId: number, id: number): Promise<{ message: string }> {
    const existing = await this.inventoryRepo.findOne({ where: { id, organizationId: orgId } });
    if (!existing) {
      throw new BadRequestException(`Inventory entry with ID ${id} not found`);
    }
    await this.inventoryRepo.remove(existing);
    return { message: 'Inventory entry deleted successfully' };
  }
}
