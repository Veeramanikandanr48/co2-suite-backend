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
import { Facility } from 'src/entities/facility.entity';
import { Organization } from 'src/entities/organization.entity';
import { UserDetails } from 'src/entities/user.entity';
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
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(UserDetails)
    private readonly userRepo: Repository<UserDetails>,
    private readonly utilService: UtilService,
  ) {}

  /**
   * Seeds initial DB tables from separate seed file on application startup.
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
    if (efCount < 15) {
      await this.efRepo.save(this.efRepo.create(SEED_EMISSION_FACTORS as Partial<EmissionFactor>[]));
    }

    const invCount = await this.inventoryRepo.count();
    if (invCount < 15) {
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

  /**
   * Calculate dynamic Carbon Summary metrics, graphs, charts, and activities strictly from DB data.
   */
  async getCarbonSummary(
    orgId: number,
    serviceCode: string,
    queryParams?: { year?: string; facility?: string },
  ) {
    const codeUpper = (serviceCode || 'CARBON').trim().toUpperCase();

    // 1. Fetch available facilities for this org from DB
    const dbFacilities = await this.facilityRepo.find({
      where: { organizationId: orgId, isActive: true },
      order: { name: 'ASC' },
    });
    const facilityList = dbFacilities.map((f) => f.name);

    // 2. Fetch all inventory entries for this org & service code from DB
    const allEntries = await this.inventoryRepo.find({
      where: { organizationId: orgId, serviceCode: codeUpper },
      order: { id: 'DESC' },
    });

    // Include any additional facilities found in inventory entries
    allEntries.forEach((e) => {
      if (e.facility && !facilityList.includes(e.facility)) {
        facilityList.push(e.facility);
      }
    });

    // 3. Extract all available years from DB records
    const availableYearsSet = new Set<string>();
    allEntries.forEach((e) => {
      const yearFromDate = e.dateFrom ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0] : null;
      if (yearFromDate && yearFromDate.length === 4) {
        availableYearsSet.add(yearFromDate);
      } else if (e.createdOn) {
        availableYearsSet.add(new Date(e.createdOn).getFullYear().toString());
      }
    });
    if (availableYearsSet.size === 0) {
      availableYearsSet.add(new Date().getFullYear().toString());
    }
    const availableYears = Array.from(availableYearsSet).sort((a, b) => Number(b) - Number(a));

    // 4. Fetch service scope items from DB
    const scopeItems = await this.scopeItemRepo.find({
      where: { serviceCode: codeUpper, isActive: true },
      order: { scopeCode: 'ASC', sortOrder: 'ASC' },
    });

    const categoryToScopeMap = new Map<string, string>();
    const scope1CategoriesSet = new Set<string>();
    const scope2CategoriesSet = new Set<string>();
    const scope3CategoriesSet = new Set<string>();

    scopeItems.forEach((item) => {
      categoryToScopeMap.set(item.name.toLowerCase(), item.scope);
      if (item.scope === 'Scope 1') scope1CategoriesSet.add(item.name.toLowerCase());
      if (item.scope === 'Scope 2') scope2CategoriesSet.add(item.name.toLowerCase());
      if (item.scope === 'Scope 3') scope3CategoriesSet.add(item.name.toLowerCase());
    });

    // 5. Filter entries based on queryParams
    let filteredEntries = allEntries;
    if (queryParams?.facility && queryParams.facility !== 'all' && queryParams.facility !== 'All Facilities') {
      const selectedFac = queryParams.facility.toLowerCase().trim();
      filteredEntries = filteredEntries.filter(
        (e) => (e.facility || '').toLowerCase().trim() === selectedFac,
      );
    }

    if (queryParams?.year && queryParams.year !== 'all' && queryParams.year !== 'All Years') {
      const selectedYr = queryParams.year.trim();
      filteredEntries = filteredEntries.filter((e) => {
        const entryYear = e.dateFrom
          ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0]
          : e.createdOn
          ? new Date(e.createdOn).getFullYear().toString()
          : '';
        return entryYear === selectedYr;
      });
    }

    // 6. Calculate KPIs & Chart data from DB filtered entries
    let totalEmissions = 0;
    let scope1Emissions = 0;
    let scope2Emissions = 0;
    let scope3Emissions = 0;

    const recordedScope1Categories = new Set<string>();
    const recordedScope2Categories = new Set<string>();
    const recordedScope3Categories = new Set<string>();

    const categoryAggregationMap = new Map<string, { category: string; scope: string; emission: number; count: number }>();
    const facilityAggregationMap = new Map<string, { facility: string; emission: number; count: number }>();
    const monthlyAggregationMap = new Map<string, { period: string; scope1: number; scope2: number; scope3: number; total: number }>();

    filteredEntries.forEach((entry) => {
      const em = entry.emission || 0;
      totalEmissions += em;

      const catLower = (entry.category || '').toLowerCase();
      let scopeName = categoryToScopeMap.get(catLower);
      if (!scopeName) {
        if (catLower.includes('purchased electricity') || catLower.includes('heating')) {
          scopeName = 'Scope 2';
        } else if (
          catLower.includes('goods') ||
          catLower.includes('capital') ||
          catLower.includes('travel') ||
          catLower.includes('commuting') ||
          catLower.includes('transportation') ||
          catLower.includes('waste') ||
          catLower.includes('sold')
        ) {
          scopeName = 'Scope 3';
        } else {
          scopeName = 'Scope 1';
        }
      }

      if (scopeName === 'Scope 1') {
        scope1Emissions += em;
        recordedScope1Categories.add(catLower);
      } else if (scopeName === 'Scope 2') {
        scope2Emissions += em;
        recordedScope2Categories.add(catLower);
      } else {
        scope3Emissions += em;
        recordedScope3Categories.add(catLower);
      }

      // Aggregate by category
      const existingCat = categoryAggregationMap.get(entry.category || 'Other') || {
        category: entry.category || 'Other',
        scope: scopeName,
        emission: 0,
        count: 0,
      };
      existingCat.emission += em;
      existingCat.count += 1;
      categoryAggregationMap.set(entry.category || 'Other', existingCat);

      // Aggregate by facility
      const facName = entry.facility || 'Unassigned Facility';
      const existingFac = facilityAggregationMap.get(facName) || {
        facility: facName,
        emission: 0,
        count: 0,
      };
      existingFac.emission += em;
      existingFac.count += 1;
      facilityAggregationMap.set(facName, existingFac);

      // Aggregate by month/period
      let monthLabel = 'Recent';
      if (entry.dateFrom) {
        const parts = entry.dateFrom.split('.');
        if (parts.length === 3) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          if (monthIndex >= 0 && monthIndex < 12) {
            monthLabel = `${monthNames[monthIndex]} ${parts[2]}`;
          }
        }
      } else if (entry.createdOn) {
        const d = new Date(entry.createdOn);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      const existingMonth = monthlyAggregationMap.get(monthLabel) || {
        period: monthLabel,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        total: 0,
      };
      if (scopeName === 'Scope 1') existingMonth.scope1 += em;
      else if (scopeName === 'Scope 2') existingMonth.scope2 += em;
      else existingMonth.scope3 += em;
      existingMonth.total += em;
      monthlyAggregationMap.set(monthLabel, existingMonth);
    });

    totalEmissions = Number(totalEmissions.toFixed(2));
    scope1Emissions = Number(scope1Emissions.toFixed(2));
    scope2Emissions = Number(scope2Emissions.toFixed(2));
    scope3Emissions = Number(scope3Emissions.toFixed(2));

    const scope1Percentage = totalEmissions > 0 ? Number(((scope1Emissions / totalEmissions) * 100).toFixed(1)) : 0;
    const scope2Percentage = totalEmissions > 0 ? Number(((scope2Emissions / totalEmissions) * 100).toFixed(1)) : 0;
    const scope3Percentage = totalEmissions > 0 ? Number(((scope3Emissions / totalEmissions) * 100).toFixed(1)) : 0;

    const emissionsByCategory = Array.from(categoryAggregationMap.values())
      .map((cat) => ({
        ...cat,
        emission: Number(cat.emission.toFixed(2)),
        percentage: totalEmissions > 0 ? Number(((cat.emission / totalEmissions) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsByFacility = Array.from(facilityAggregationMap.values())
      .map((fac) => ({
        ...fac,
        emission: Number(fac.emission.toFixed(2)),
        percentage: totalEmissions > 0 ? Number(((fac.emission / totalEmissions) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsTrend = Array.from(monthlyAggregationMap.values()).map((m) => ({
      period: m.period,
      scope1: Number(m.scope1.toFixed(2)),
      scope2: Number(m.scope2.toFixed(2)),
      scope3: Number(m.scope3.toFixed(2)),
      total: Number(m.total.toFixed(2)),
    }));

    const latestActivities = filteredEntries.slice(0, 10).map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      facility: entry.facility || 'Unassigned',
      amount: entry.amount,
      unit: entry.unit,
      ef: entry.ef,
      efSource: entry.efSource,
      emission: entry.emission,
      status: entry.status || 'Approved',
      dateFrom: entry.dateFrom,
      dateTo: entry.dateTo,
      createdOn: entry.createdOn,
    }));

    return {
      serviceCode: codeUpper,
      unit: 'tonne CO₂-e',
      availableYears,
      availableFacilities: ['All Facilities', ...facilityList],
      totalEntries: filteredEntries.length,
      kpis: {
        totalEmissions,
        scope1Emissions,
        scope1Percentage,
        scope1CategoryCount: {
          recorded: recordedScope1Categories.size,
          total: Math.max(scope1CategoriesSet.size, recordedScope1Categories.size, 4),
        },
        scope2Emissions,
        scope2Percentage,
        scope2CategoryCount: {
          recorded: recordedScope2Categories.size,
          total: Math.max(scope2CategoriesSet.size, recordedScope2Categories.size, 2),
        },
        scope3Emissions,
        scope3Percentage,
        scope3CategoryCount: {
          recorded: recordedScope3Categories.size,
          total: Math.max(scope3CategoriesSet.size, recordedScope3Categories.size, 13),
        },
      },
      emissionsByCategory,
      emissionsByFacility,
      emissionsTrend,
      latestActivities,
    };
  }

  /**
   * Calculate overall Executive Main Dashboard summary metrics, active services, graphs, and activity stream from DB.
   * Differentiates Super Admin (Role 1) platform view from Org Admin/User (Role 2/3) tenant view.
   */
  async getExecutiveDashboardSummary(
    userRoleId: number,
    orgId: number,
    queryParams?: { year?: string; facility?: string },
  ) {
    const isSuperAdmin = Number(userRoleId) === 1;

    // 1. Fetch Master Services
    const allMasterServices = await this.serviceRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });

    const serviceConfigMap: Record<string, { daysLeft: number; demoUrl: string }> = {
      CARBON: { daysLeft: 2863, demoUrl: '/services/carbon' },
      CBAM: { daysLeft: 1420, demoUrl: '/services/cbam' },
      PEF_TEXTILES: { daysLeft: 980, demoUrl: '/services/pef_textiles' },
      LCA_PLASTICS: { daysLeft: 1840, demoUrl: '/services/lca_plastics' },
      LCA_METALS: { daysLeft: 2100, demoUrl: '/services/lca_metals' },
      ESG: { daysLeft: 3120, demoUrl: '/services/esg' },
      EPD_CABLES: { daysLeft: 1650, demoUrl: '/services/epd_cables' },
    };

    if (isSuperAdmin) {
      // ─── SUPER ADMIN PLATFORM GOVERNANCE DASHBOARD DATA ───────────────────
      const allOrgs = await this.orgRepo.find({
        where: { isActive: true },
        order: { id: 'ASC' },
      });

      const totalUsersCount = await this.userRepo.count({
        where: { isActive: true },
      });

      const allFacilities = await this.facilityRepo.find({
        where: { isActive: true },
      });

      const allOrgServices = await this.orgServiceRepo.find({
        where: { isActive: true },
        relations: { service: true },
      });

      const allEntries = await this.inventoryRepo.find({
        order: { id: 'DESC' },
      });

      // Map organization id to org details
      const orgMap = new Map<number, Organization>();
      allOrgs.forEach((o) => orgMap.set(o.id, o));

      // Calculate portfolio metrics & facility details per organization
      const orgSummaryList = await Promise.all(
        allOrgs.map(async (org) => {
          const orgFacs = allFacilities.filter((f) => f.organizationId === org.id);
          const orgSvcs = allOrgServices.filter((s) => s.organizationId === org.id);
          const orgEntries = allEntries.filter((e) => e.organizationId === org.id);
          const orgTotalEmissions = Number(
            orgEntries.reduce((sum, e) => sum + (e.emission || 0), 0).toFixed(2),
          );

          const orgFacDetails = orgFacs.map((f) => {
            const facEntries = orgEntries.filter((e) => (e.facility || '').toLowerCase() === f.name.toLowerCase());
            const facEmissions = Number(facEntries.reduce((sum, e) => sum + (e.emission || 0), 0).toFixed(2));
            return {
              id: f.id,
              name: f.name,
              address: f.address || 'Facility Site Location',
              countryCode: f.countryCode || 'UK',
              postCode: f.postCode || 'N/A',
              unLocode: f.unLocode || 'N/A',
              totalEmissions: facEmissions,
              entriesCount: facEntries.length,
            };
          });

          return {
            id: org.id,
            name: org.name,
            code: org.code,
            contactEmail: org.contactEmail || 'N/A',
            industry: org.industry || 'Enterprise Sustainability',
            facilitiesCount: orgFacs.length,
            subscribedServicesCount: orgSvcs.length || allMasterServices.length,
            totalEmissions: orgTotalEmissions,
            entriesCount: orgEntries.length,
            facilities: orgFacDetails,
          };
        }),
      );

      // Global platform KPIs
      let globalEmissions = 0;
      let scope1Emissions = 0;
      let scope2Emissions = 0;
      let scope3Emissions = 0;

      const monthlyMap = new Map<string, { period: string; scope1: number; scope2: number; scope3: number; total: number }>();
      const categoryMap = new Map<string, { category: string; scope: string; emission: number; count: number }>();

      allEntries.forEach((entry) => {
        const em = entry.emission || 0;
        globalEmissions += em;

        const catLower = (entry.category || '').toLowerCase();
        let scopeName = 'Scope 1';
        if (catLower.includes('purchased electricity') || catLower.includes('heating')) scopeName = 'Scope 2';
        else if (
          catLower.includes('goods') || catLower.includes('capital') || catLower.includes('travel') ||
          catLower.includes('commuting') || catLower.includes('transportation') || catLower.includes('waste') || catLower.includes('sold')
        ) scopeName = 'Scope 3';

        if (scopeName === 'Scope 1') scope1Emissions += em;
        else if (scopeName === 'Scope 2') scope2Emissions += em;
        else scope3Emissions += em;

        const existingCat = categoryMap.get(entry.category || 'Other') || {
          category: entry.category || 'Other',
          scope: scopeName,
          emission: 0,
          count: 0,
        };
        existingCat.emission += em;
        existingCat.count += 1;
        categoryMap.set(entry.category || 'Other', existingCat);

        let monthLabel = 'Recent';
        if (entry.dateFrom) {
          const parts = entry.dateFrom.split('.');
          if (parts.length === 3) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) monthLabel = `${monthNames[mIdx]} ${parts[2]}`;
          }
        }
        const existingMonth = monthlyMap.get(monthLabel) || { period: monthLabel, scope1: 0, scope2: 0, scope3: 0, total: 0 };
        if (scopeName === 'Scope 1') existingMonth.scope1 += em;
        else if (scopeName === 'Scope 2') existingMonth.scope2 += em;
        else existingMonth.scope3 += em;
        existingMonth.total += em;
        monthlyMap.set(monthLabel, existingMonth);
      });

      globalEmissions = Number(globalEmissions.toFixed(2));
      scope1Emissions = Number(scope1Emissions.toFixed(2));
      scope2Emissions = Number(scope2Emissions.toFixed(2));
      scope3Emissions = Number(scope3Emissions.toFixed(2));

      const recentActivities = allEntries.slice(0, 10).map((e) => {
        const org = orgMap.get(e.organizationId);
        return {
          id: e.id,
          orgName: org?.name || `Org #${e.organizationId}`,
          name: e.name,
          serviceCode: e.serviceCode,
          category: e.category,
          facility: e.facility || 'Unassigned',
          amount: e.amount,
          unit: e.unit,
          emission: e.emission,
          status: e.status || 'Approved',
          createdOn: e.createdOn,
        };
      });

      const subscribedServices = allMasterServices.map((svc) => {
        const codeUpper = svc.code.toUpperCase();
        const cfg = serviceConfigMap[codeUpper] || { daysLeft: 2800, demoUrl: `/services/${svc.code.toLowerCase()}` };
        const totalSvcEmissions = Number(
          allEntries.filter((e) => (e.serviceCode || 'CARBON').toUpperCase() === codeUpper)
            .reduce((sum, e) => sum + (e.emission || 0), 0).toFixed(2),
        );
        const subCount = allOrgServices.filter((s) => s.service?.code?.toUpperCase() === codeUpper).length || allOrgs.length;

        return {
          id: svc.id,
          code: svc.code,
          name: svc.name,
          category: svc.category,
          description: svc.description,
          demoUrl: svc.demoUrl || cfg.demoUrl,
          daysLeft: cfg.daysLeft,
          isSubscribed: true,
          totalEmissions: totalSvcEmissions,
          subscriberCount: subCount,
          entriesCount: allEntries.filter((e) => (e.serviceCode || 'CARBON').toUpperCase() === codeUpper).length,
        };
      });

      return {
        isSuperAdmin: true,
        unit: 'tonne CO₂-e',
        availableYears: ['2026', '2025', '2024'],
        availableFacilities: ['All Facilities', ...allFacilities.map((f) => f.name)],
        kpis: {
          totalEmissions: globalEmissions,
          scope1Emissions,
          scope1Percentage: globalEmissions > 0 ? Number(((scope1Emissions / globalEmissions) * 100).toFixed(1)) : 0,
          scope2Emissions,
          scope2Percentage: globalEmissions > 0 ? Number(((scope2Emissions / globalEmissions) * 100).toFixed(1)) : 0,
          scope3Emissions,
          scope3Percentage: globalEmissions > 0 ? Number(((scope3Emissions / globalEmissions) * 100).toFixed(1)) : 0,
          totalOrganizations: allOrgs.length,
          totalUsers: totalUsersCount,
          totalInventoryEntries: allEntries.length,
          activeServicesCount: allMasterServices.length,
          facilitiesCount: allFacilities.length,
          dataCompletenessPercent: 100,
        },
        organizationsSummary: orgSummaryList,
        subscribedServices,
        emissionsByCategory: Array.from(categoryMap.values()).map((c) => ({
          ...c,
          emission: Number(c.emission.toFixed(2)),
          percentage: globalEmissions > 0 ? Number(((c.emission / globalEmissions) * 100).toFixed(1)) : 0,
        })),
        emissionsTrend: Array.from(monthlyMap.values()).map((m) => ({
          period: m.period,
          scope1: Number(m.scope1.toFixed(2)),
          scope2: Number(m.scope2.toFixed(2)),
          scope3: Number(m.scope3.toFixed(2)),
          total: Number(m.total.toFixed(2)),
        })),
        recentActivities,
      };
    }

    // ─── ORGANIZATION ADMIN & USER SUSTAINABILITY DASHBOARD DATA ─────────
    const dbFacilities = await this.facilityRepo.find({
      where: { organizationId: orgId, isActive: true },
      order: { name: 'ASC' },
    });
    const facilityList = dbFacilities.map((f) => f.name);

    const orgServices = await this.orgServiceRepo.find({
      where: { organizationId: orgId, isActive: true },
      relations: { service: true },
    });

    const assignedServiceCodes = new Set<string>();
    orgServices.forEach((os) => {
      if (os.service?.code) {
        assignedServiceCodes.add(os.service.code.toUpperCase());
      }
    });
    if (assignedServiceCodes.size === 0) {
      allMasterServices.forEach((s) => assignedServiceCodes.add(s.code.toUpperCase()));
    }

    const allEntries = await this.inventoryRepo.find({
      where: { organizationId: orgId },
      order: { id: 'DESC' },
    });

    allEntries.forEach((e) => {
      if (e.facility && !facilityList.includes(e.facility)) {
        facilityList.push(e.facility);
      }
    });

    const availableYearsSet = new Set<string>();
    allEntries.forEach((e) => {
      const yearFromDate = e.dateFrom ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0] : null;
      if (yearFromDate && yearFromDate.length === 4) {
        availableYearsSet.add(yearFromDate);
      } else if (e.createdOn) {
        availableYearsSet.add(new Date(e.createdOn).getFullYear().toString());
      }
    });
    if (availableYearsSet.size === 0) {
      availableYearsSet.add(new Date().getFullYear().toString());
    }
    const availableYears = Array.from(availableYearsSet).sort((a, b) => Number(b) - Number(a));

    let filteredEntries = allEntries;
    if (queryParams?.facility && queryParams.facility !== 'all' && queryParams.facility !== 'All Facilities') {
      const selectedFac = queryParams.facility.toLowerCase().trim();
      filteredEntries = filteredEntries.filter(
        (e) => (e.facility || '').toLowerCase().trim() === selectedFac,
      );
    }

    if (queryParams?.year && queryParams.year !== 'all' && queryParams.year !== 'All Years') {
      const selectedYr = queryParams.year.trim();
      filteredEntries = filteredEntries.filter((e) => {
        const entryYear = e.dateFrom
          ? e.dateFrom.split('.').pop() || e.dateFrom.split('-')[0]
          : e.createdOn
          ? new Date(e.createdOn).getFullYear().toString()
          : '';
        return entryYear === selectedYr;
      });
    }

    let totalEmissions = 0;
    let scope1Emissions = 0;
    let scope2Emissions = 0;
    let scope3Emissions = 0;

    const serviceEmissionsMap = new Map<string, { totalEmissions: number; count: number }>();
    const categoryAggregationMap = new Map<string, { category: string; scope: string; emission: number; count: number }>();
    const facilityAggregationMap = new Map<string, { facility: string; emission: number; count: number }>();
    const monthlyAggregationMap = new Map<string, { period: string; scope1: number; scope2: number; scope3: number; total: number }>();

    filteredEntries.forEach((entry) => {
      const em = entry.emission || 0;
      totalEmissions += em;

      const sCode = (entry.serviceCode || 'CARBON').toUpperCase();
      const existingSvc = serviceEmissionsMap.get(sCode) || { totalEmissions: 0, count: 0 };
      existingSvc.totalEmissions += em;
      existingSvc.count += 1;
      serviceEmissionsMap.set(sCode, existingSvc);

      const catLower = (entry.category || '').toLowerCase();
      let scopeName = 'Scope 1';
      if (catLower.includes('purchased electricity') || catLower.includes('heating')) scopeName = 'Scope 2';
      else if (
        catLower.includes('goods') || catLower.includes('capital') || catLower.includes('travel') ||
        catLower.includes('commuting') || catLower.includes('transportation') || catLower.includes('waste') || catLower.includes('sold')
      ) scopeName = 'Scope 3';

      if (scopeName === 'Scope 1') scope1Emissions += em;
      else if (scopeName === 'Scope 2') scope2Emissions += em;
      else scope3Emissions += em;

      const existingCat = categoryAggregationMap.get(entry.category || 'Other') || {
        category: entry.category || 'Other',
        scope: scopeName,
        emission: 0,
        count: 0,
      };
      existingCat.emission += em;
      existingCat.count += 1;
      categoryAggregationMap.set(entry.category || 'Other', existingCat);

      const facName = entry.facility || 'Unassigned Facility';
      const existingFac = facilityAggregationMap.get(facName) || {
        facility: facName,
        emission: 0,
        count: 0,
      };
      existingFac.emission += em;
      existingFac.count += 1;
      facilityAggregationMap.set(facName, existingFac);

      let monthLabel = 'Recent';
      if (entry.dateFrom) {
        const parts = entry.dateFrom.split('.');
        if (parts.length === 3) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          if (monthIndex >= 0 && monthIndex < 12) monthLabel = `${monthNames[monthIndex]} ${parts[2]}`;
        }
      } else if (entry.createdOn) {
        const d = new Date(entry.createdOn);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      const existingMonth = monthlyAggregationMap.get(monthLabel) || {
        period: monthLabel, scope1: 0, scope2: 0, scope3: 0, total: 0,
      };
      if (scopeName === 'Scope 1') existingMonth.scope1 += em;
      else if (scopeName === 'Scope 2') existingMonth.scope2 += em;
      else existingMonth.scope3 += em;
      existingMonth.total += em;
      monthlyAggregationMap.set(monthLabel, existingMonth);
    });

    totalEmissions = Number(totalEmissions.toFixed(2));
    scope1Emissions = Number(scope1Emissions.toFixed(2));
    scope2Emissions = Number(scope2Emissions.toFixed(2));
    scope3Emissions = Number(scope3Emissions.toFixed(2));

    const orgFacDetails = dbFacilities.map((f) => {
      const facEntries = allEntries.filter((e) => (e.facility || '').toLowerCase() === f.name.toLowerCase());
      const facEmissions = Number(facEntries.reduce((sum, e) => sum + (e.emission || 0), 0).toFixed(2));
      return {
        id: f.id,
        name: f.name,
        address: f.address || 'Facility Installation Address',
        countryCode: f.countryCode || 'UK',
        postCode: f.postCode || 'N/A',
        unLocode: f.unLocode || 'N/A',
        totalEmissions: facEmissions,
        entriesCount: facEntries.length,
      };
    });

    const subscribedServices = allMasterServices.map((svc) => {
      const codeUpper = svc.code.toUpperCase();
      const isSubscribed = assignedServiceCodes.has(codeUpper);
      const aggData = serviceEmissionsMap.get(codeUpper) || { totalEmissions: 0, count: 0 };
      const cfg = serviceConfigMap[codeUpper] || { daysLeft: 2800, demoUrl: `/services/${svc.code.toLowerCase()}` };

      return {
        id: svc.id,
        code: svc.code,
        name: svc.name,
        category: svc.category,
        description: svc.description,
        demoUrl: svc.demoUrl || cfg.demoUrl,
        daysLeft: cfg.daysLeft,
        isSubscribed,
        totalEmissions: Number(aggData.totalEmissions.toFixed(2)),
        entriesCount: aggData.count,
      };
    });

    const emissionsByCategory = Array.from(categoryAggregationMap.values())
      .map((cat) => ({
        ...cat,
        emission: Number(cat.emission.toFixed(2)),
        percentage: totalEmissions > 0 ? Number(((cat.emission / totalEmissions) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsByFacility = Array.from(facilityAggregationMap.values())
      .map((fac) => ({
        ...fac,
        emission: Number(fac.emission.toFixed(2)),
        percentage: totalEmissions > 0 ? Number(((fac.emission / totalEmissions) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.emission - a.emission);

    const emissionsTrend = Array.from(monthlyAggregationMap.values()).map((m) => ({
      period: m.period,
      scope1: Number(m.scope1.toFixed(2)),
      scope2: Number(m.scope2.toFixed(2)),
      scope3: Number(m.scope3.toFixed(2)),
      total: Number(m.total.toFixed(2)),
    }));

    const recentActivities = filteredEntries.slice(0, 8).map((e) => ({
      id: e.id,
      name: e.name,
      serviceCode: e.serviceCode,
      category: e.category,
      facility: e.facility || 'Unassigned',
      amount: e.amount,
      unit: e.unit,
      emission: e.emission,
      status: e.status || 'Approved',
      createdOn: e.createdOn,
    }));

    return {
      isSuperAdmin: false,
      unit: 'tonne CO₂-e',
      availableYears,
      availableFacilities: ['All Facilities', ...facilityList],
      kpis: {
        totalEmissions,
        scope1Emissions,
        scope1Percentage: totalEmissions > 0 ? Number(((scope1Emissions / totalEmissions) * 100).toFixed(1)) : 0,
        scope2Emissions,
        scope2Percentage: totalEmissions > 0 ? Number(((scope2Emissions / totalEmissions) * 100).toFixed(1)) : 0,
        scope3Emissions,
        scope3Percentage: totalEmissions > 0 ? Number(((scope3Emissions / totalEmissions) * 100).toFixed(1)) : 0,
        totalInventoryEntries: filteredEntries.length,
        activeServicesCount: assignedServiceCodes.size,
        facilitiesCount: facilityList.length,
        dataCompletenessPercent: filteredEntries.length > 0 ? 100 : 0,
      },
      facilities: orgFacDetails,
      subscribedServices,
      emissionsByCategory,
      emissionsByFacility,
      emissionsTrend,
      recentActivities,
    };
  }
}


