import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MasterApprovalStatus, MasterRoles } from 'src/entities/master.entity';
import { MasterItem, MasterItemType } from 'src/entities/master-item.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import {
  CalculationPolicy,
  EmissionFactorRow,
  EmissionFactorSet,
  EmissionFactorValue,
  FormulaLibrary,
  FormulaVersion,
  GasMultiplier,
  GasType,
  GwpVersion,
  NotificationTemplate,
  SupplementaryFieldDefinition,
} from 'src/entities/master-config.entity';
import { Repository } from 'typeorm';
import {
  SEED_GAS_TYPES,
  SEED_GWP_VERSIONS,
  SEED_GAS_MULTIPLIERS,
  SEED_FORMULA_LIBRARIES,
  SEED_SUPPLEMENTARY_FIELDS,
} from 'src/seeds/master-config.seed';
import {
  CreateCalculationPolicyDto,
  CreateEmissionFactorRowDto,
  CreateEmissionFactorSetDto,
  CreateEmissionFactorValueDto,
  CreateFormulaLibraryDto,
  CreateGasMultiplierDto,
  CreateGasTypeDto,
  CreateGwpVersionDto,
  CreateMasterItemDto,
  CreateSupplementaryFieldDto,
  UpdateCalculationPolicyDto,
  UpdateEmissionFactorSetDto,
  UpdateGasTypeDto,
  UpdateMasterItemDto,
} from 'src/dto/master-config.dto';

@Injectable()
export class MastersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MastersService.name);

  constructor(
    @InjectRepository(MasterRoles)
    private readonly masterRolesRepository: Repository<MasterRoles>,
    @InjectRepository(MasterApprovalStatus)
    private readonly masterApprovalStatusRepository: Repository<MasterApprovalStatus>,
    @InjectRepository(MasterItem)
    private readonly masterItemRepo: Repository<MasterItem>,
    @InjectRepository(EmissionFactor)
    private readonly efRepo: Repository<EmissionFactor>,
    @InjectRepository(ServiceScopeItem)
    private readonly scopeItemRepo: Repository<ServiceScopeItem>,
    @InjectRepository(GasType)
    private readonly gasTypeRepo: Repository<GasType>,
    @InjectRepository(GwpVersion)
    private readonly gwpVersionRepo: Repository<GwpVersion>,
    @InjectRepository(GasMultiplier)
    private readonly gasMultiplierRepo: Repository<GasMultiplier>,
    @InjectRepository(EmissionFactorSet)
    private readonly factorSetRepo: Repository<EmissionFactorSet>,
    @InjectRepository(EmissionFactorRow)
    private readonly factorRowRepo: Repository<EmissionFactorRow>,
    @InjectRepository(EmissionFactorValue)
    private readonly factorValueRepo: Repository<EmissionFactorValue>,
    @InjectRepository(FormulaLibrary)
    private readonly formulaLibraryRepo: Repository<FormulaLibrary>,
    @InjectRepository(FormulaVersion)
    private readonly formulaVersionRepo: Repository<FormulaVersion>,
    @InjectRepository(CalculationPolicy)
    private readonly policyRepo: Repository<CalculationPolicy>,
    @InjectRepository(SupplementaryFieldDefinition)
    private readonly suppFieldRepo: Repository<SupplementaryFieldDefinition>,
    @InjectRepository(NotificationTemplate)
    private readonly notifTemplateRepo: Repository<NotificationTemplate>,
  ) { }

  async onApplicationBootstrap() {
    try {
      await this.seedMasterConfigs();
      await this.masterItemRepo.update(
        { type: MasterItemType.GAS_TYPE as any },
        { type: MasterItemType.FUEL_TYPE, subType: 'Gas' }
      );
      await this.syncAllMasterItemsToScopeItems();
    } catch (err) {
      this.logger.error('Failed to seed master configuration data', err);
    }
  }

  // ============================================================================
  // SEEDING LOGIC
  // ============================================================================

  private async seedMasterConfigs() {
    // 1. Seed Gas Types
    const gasTypeCount = await this.gasTypeRepo.count();
    if (gasTypeCount === 0) {
      this.logger.log('Seeding Gas Types...');
      await this.gasTypeRepo.save(SEED_GAS_TYPES);
    }

    // 2. Seed GWP Versions & Multipliers
    const gwpCount = await this.gwpVersionRepo.count();
    if (gwpCount === 0) {
      this.logger.log('Seeding GWP Versions & Multipliers...');
      await this.gwpVersionRepo.save(SEED_GWP_VERSIONS);

      const allGasTypes = await this.gasTypeRepo.find();
      const allGwpVersions = await this.gwpVersionRepo.find();

      const gasTypeMap = new Map(allGasTypes.map((g) => [g.code, g.id]));
      const gwpMap = new Map(allGwpVersions.map((v) => [v.code, v.id]));

      const multipliersToSave = SEED_GAS_MULTIPLIERS.map((m) => ({
        gwpVersionId: gwpMap.get(m.gwpVersionCode),
        gasTypeId: gasTypeMap.get(m.gasTypeCode),
        multiplier: m.multiplier,
      })).filter((m) => m.gwpVersionId && m.gasTypeId);

      if (multipliersToSave.length > 0) {
        await this.gasMultiplierRepo.save(multipliersToSave);
      }
    }

    // 3. Seed Formula Library
    const formulaCount = await this.formulaLibraryRepo.count();
    if (formulaCount === 0) {
      this.logger.log('Seeding Formula Libraries...');
      for (const item of SEED_FORMULA_LIBRARIES) {
        const savedLibrary = await this.formulaLibraryRepo.save(item.library);
        await this.formulaVersionRepo.save({
          ...item.defaultVersion,
          formulaLibraryId: savedLibrary.id,
        });
      }
    }

    // 4. Seed Supplementary Fields
    const suppCount = await this.suppFieldRepo.count();
    if (suppCount === 0) {
      this.logger.log('Seeding Supplementary Field Definitions...');
      await this.suppFieldRepo.save(SEED_SUPPLEMENTARY_FIELDS);
    }

    // 5. Seed Initial Master Scopes
    const masterItemCount = await this.masterItemRepo.count();
    if (masterItemCount === 0) {
      this.logger.log('Seeding initial Master Item Scopes...');
      await this.masterItemRepo.save([
        { type: MasterItemType.SCOPE, code: 'SCOPE_1', name: 'Scope 1', description: 'Direct Operations & Combustion', sortOrder: 1, isActive: true },
        { type: MasterItemType.SCOPE, code: 'SCOPE_2', name: 'Scope 2', description: 'Purchased Electricity, Heating, Cooling', sortOrder: 2, isActive: true },
        { type: MasterItemType.SCOPE, code: 'SCOPE_3', name: 'Scope 3', description: 'Value Chain & Indirect Emissions', sortOrder: 3, isActive: true },
      ]);
    }

    // 6. Seed Initial Factor Sources and Factor Versions
    const sourceCount = await this.masterItemRepo.count({ where: { type: MasterItemType.FACTOR_SOURCE } });
    if (sourceCount === 0) {
      this.logger.log('Seeding initial Emission Factor Sources...');
      await this.masterItemRepo.save([
        { type: MasterItemType.FACTOR_SOURCE, code: 'DEFRA_2024', name: 'DEFRA 2024', description: 'UK Department for Environment, Food & Rural Affairs', sortOrder: 1, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'IPCC_AR6', name: 'IPCC-AR6', description: 'Intergovernmental Panel on Climate Change Sixth Assessment Report', sortOrder: 2, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'IEA_2023', name: 'IEA Grid Factors 2023', description: 'International Energy Agency National Grid Factors', sortOrder: 3, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'ECOINVENT_39', name: 'Ecoinvent 3.9', description: 'Global Life Cycle Inventory Database', sortOrder: 4, isActive: true },
        { type: MasterItemType.FACTOR_SOURCE, code: 'EXIOBASE_38', name: 'EXIOBASE v3.8', description: 'Multi-Regional Environmentally Extended Input-Output Database', sortOrder: 5, isActive: true },
      ]);
    }

    const versionCount = await this.masterItemRepo.count({ where: { type: MasterItemType.FACTOR_VERSION } });
    if (versionCount === 0) {
      this.logger.log('Seeding initial Factor Versions...');
      await this.masterItemRepo.save([
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_AR6', name: 'AR6', description: 'IPCC Sixth Assessment Report 100-year GWP', sortOrder: 1, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_2024', name: '2024', description: '2024 Annual Release Standard', sortOrder: 2, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_2023', name: '2023', description: '2023 Annual Release Standard', sortOrder: 3, isActive: true },
        { type: MasterItemType.FACTOR_VERSION, code: 'VER_V39', name: 'v3.9', description: 'Version 3.9 Database Standard', sortOrder: 4, isActive: true },
      ]);
    }
  }

  private async syncAllMasterItemsToScopeItems() {
    try {
      const masterCategories = await this.masterItemRepo.find({
        where: { type: MasterItemType.ACTIVITY_CATEGORY, isActive: true },
      });

      for (const cat of masterCategories) {
        if (!cat.scope) continue;
        const targetScope = cat.scope;
        const targetScopeCode = targetScope.toUpperCase().replace(/\s+/g, '_');

        const existingScope = await this.scopeItemRepo.findOne({
          where: [
            { serviceCode: 'CARBON', name: cat.name },
            { serviceCode: 'CARBON', code: cat.code },
          ],
        });

        if (existingScope) {
          existingScope.scope = targetScope;
          existingScope.scopeCode = targetScopeCode;
          existingScope.name = cat.name;
          existingScope.isActive = true;
          await this.scopeItemRepo.save(existingScope);
        } else {
          const newScope = this.scopeItemRepo.create({
            serviceCode: 'CARBON',
            scope: targetScope,
            scopeCode: targetScopeCode,
            name: cat.name,
            code: cat.code,
            description: cat.description || `Dynamic category for ${cat.name}`,
            sortOrder: cat.sortOrder || 99,
            isActive: true,
          });
          await this.scopeItemRepo.save(newScope);
        }
      }
    } catch (err) {
      this.logger.error('Failed to sync master items to service scope items', err);
    }
  }

  // ============================================================================
  // READ METHODS
  // ============================================================================

  async getMasterRoles() {
    return await this.masterRolesRepository
      .createQueryBuilder('role')
      .select(['role.id', 'role.roleName', 'role.roleShortName', 'role.isActive', 'role.createdAt'])
      .where('role.isActive = :isActive', { isActive: true })
      .orderBy('role.id', 'ASC')
      .getMany();
  }

  async getMasterApprovalStatuses() {
    return await this.masterApprovalStatusRepository
      .createQueryBuilder('status')
      .select(['status.id', 'status.name', 'status.isActive', 'status.createdAt'])
      .where('status.isActive = :isActive', { isActive: true })
      .orderBy('status.id', 'ASC')
      .getMany();
  }

  async getGasTypes(): Promise<GasType[]> {
    return this.gasTypeRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getGwpVersions(): Promise<GwpVersion[]> {
    return this.gwpVersionRepo.find({
      where: { isActive: true },
      relations: { multipliers: { gasType: true } },
      order: { id: 'ASC' },
    });
  }

  async getEmissionFactorSets(): Promise<EmissionFactorSet[]> {
    return this.factorSetRepo.find({
      where: { isActive: true },
      relations: { rows: { values: { gasType: true } } },
      order: { id: 'DESC' },
    });
  }

  async getFormulaLibraries(): Promise<FormulaLibrary[]> {
    return this.formulaLibraryRepo.find({
      where: { isActive: true },
      relations: { versions: true },
      order: { id: 'ASC' },
    });
  }

  async getCalculationPolicies(organizationId?: number): Promise<CalculationPolicy[]> {
    const query = this.policyRepo.createQueryBuilder('policy')
      .leftJoinAndSelect('policy.factorSet', 'factorSet')
      .leftJoinAndSelect('policy.gwpVersion', 'gwpVersion')
      .leftJoinAndSelect('policy.formulaVersion', 'formulaVersion')
      .where('policy.isActive = :isActive', { isActive: true });

    if (organizationId) {
      query.andWhere(
        '(policy.organizationId = :orgId OR policy.organizationId IS NULL)',
        { orgId: organizationId },
      );
    } else {
      query.andWhere('policy.organizationId IS NULL');
    }

    return query.orderBy('policy.id', 'ASC').getMany();
  }

  async getSupplementaryFields(category?: string): Promise<SupplementaryFieldDefinition[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    return this.suppFieldRepo.find({
      where,
      order: { sortOrder: 'ASC' },
    });
  }

  // ============================================================================
  // WRITE METHODS (ADMIN APIs)
  // ============================================================================

  async createGasType(dto: CreateGasTypeDto): Promise<GasType> {
    const entity = this.gasTypeRepo.create(dto);
    return this.gasTypeRepo.save(entity);
  }

  async createGwpVersion(dto: CreateGwpVersionDto): Promise<GwpVersion> {
    const entity = this.gwpVersionRepo.create(dto);
    return this.gwpVersionRepo.save(entity);
  }

  async addGasMultiplier(dto: CreateGasMultiplierDto): Promise<GasMultiplier> {
    const entity = this.gasMultiplierRepo.create(dto);
    return this.gasMultiplierRepo.save(entity);
  }

  async createEmissionFactorSet(dto: CreateEmissionFactorSetDto): Promise<EmissionFactorSet> {
    const entity = this.factorSetRepo.create(dto);
    return this.factorSetRepo.save(entity);
  }

  async createEmissionFactorRow(dto: CreateEmissionFactorRowDto): Promise<EmissionFactorRow> {
    const entity = this.factorRowRepo.create(dto);
    return this.factorRowRepo.save(entity);
  }

  async addEmissionFactorValue(dto: CreateEmissionFactorValueDto): Promise<EmissionFactorValue> {
    const entity = this.factorValueRepo.create(dto);
    return this.factorValueRepo.save(entity);
  }

  async createFormulaLibrary(dto: CreateFormulaLibraryDto): Promise<FormulaLibrary> {
    const library = this.formulaLibraryRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      category: dto.category || 'General',
    });
    const savedLibrary = await this.formulaLibraryRepo.save(library);

    const version = this.formulaVersionRepo.create({
      formulaLibraryId: savedLibrary.id,
      version: 1,
      expression: dto.expression,
      variables: JSON.stringify(['amount', 'factor']),
      isDefault: true,
    });
    await this.formulaVersionRepo.save(version);

    return this.formulaLibraryRepo.findOne({
      where: { id: savedLibrary.id },
      relations: { versions: true },
    });
  }

  async createCalculationPolicy(dto: CreateCalculationPolicyDto): Promise<CalculationPolicy> {
    const entity = this.policyRepo.create(dto);
    return this.policyRepo.save(entity);
  }

  async createSupplementaryField(dto: CreateSupplementaryFieldDto): Promise<SupplementaryFieldDefinition> {
    const entity = this.suppFieldRepo.create(dto);
    return this.suppFieldRepo.save(entity);
  }

  // ============================================================================
  // GENERIC MASTER ITEM CRUD
  // ============================================================================

  async getMasterItems(type?: string, parentId?: number, search?: string): Promise<MasterItem[]> {
    if ((await this.masterItemRepo.count()) === 0) {
      await this.seedMasterConfigs();
    }

    const query = this.masterItemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.parent', 'parent')
      .where('item.isActive = :isActive', { isActive: true });

    if (type) {
      query.andWhere('item.type = :type', { type });
    }

    if (parentId) {
      query.andWhere('item.parentId = :parentId', { parentId });
    }

    if (search) {
      query.andWhere('(item.name ILIKE :search OR item.code ILIKE :search)', { search: `%${search}%` });
    }

    return query.orderBy('item.sortOrder', 'ASC').addOrderBy('item.name', 'ASC').getMany();
  }

  private generateCodeFromName(name: string): string {
    if (!name) return 'ITEM_' + Date.now();
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async createMasterItem(dto: CreateMasterItemDto): Promise<MasterItem> {
    if (!dto.code && dto.name) {
      dto.code = this.generateCodeFromName(dto.name);
    }
    const entity = this.masterItemRepo.create(dto as unknown as MasterItem);
    const saved = await this.masterItemRepo.save(entity);

    // Auto-sync dynamic Activity Category to ServiceScopeItem so it appears under /services/carbon
    if (saved.type === MasterItemType.ACTIVITY_CATEGORY || (saved.type as string) === 'ACTIVITY_CATEGORY') {
      try {
        const targetScope = saved.scope || dto.scope || 'Scope 1';
        const targetScopeCode = targetScope.toUpperCase().replace(/\s+/g, '_');
        const existingScope = await this.scopeItemRepo.findOne({
          where: { serviceCode: 'CARBON', name: saved.name },
        });
        if (!existingScope) {
          const newScope = this.scopeItemRepo.create({
            serviceCode: 'CARBON',
            scope: targetScope,
            scopeCode: targetScopeCode,
            name: saved.name,
            code: saved.code,
            description: saved.description || `Dynamic category for ${saved.name}`,
            sortOrder: saved.sortOrder || 99,
            isActive: true,
          });
          await this.scopeItemRepo.save(newScope);
        } else {
          existingScope.scope = targetScope;
          existingScope.scopeCode = targetScopeCode;
          existingScope.isActive = true;
          await this.scopeItemRepo.save(existingScope);
        }
      } catch (err) {
        this.logger.error('Failed to sync master item to service scope items', err);
      }
    }

    return saved;
  }

  async updateMasterItem(id: number, dto: UpdateMasterItemDto): Promise<MasterItem> {
    if (!dto.code && dto.name) {
      dto.code = this.generateCodeFromName(dto.name);
    }
    const oldItem = await this.masterItemRepo.findOneBy({ id });
    await this.masterItemRepo.update(id, dto as any);
    const updated = await this.masterItemRepo.findOne({ where: { id }, relations: { parent: true } });

    if (updated && (updated.type === MasterItemType.ACTIVITY_CATEGORY || (updated.type as string) === 'ACTIVITY_CATEGORY')) {
      try {
        const targetScope = updated.scope || 'Scope 1';
        const targetScopeCode = targetScope.toUpperCase().replace(/\s+/g, '_');
        const oldName = oldItem?.name || updated.name;

        const existingScope = await this.scopeItemRepo.findOne({
          where: [
            { serviceCode: 'CARBON', name: oldName },
            { serviceCode: 'CARBON', code: updated.code },
          ],
        });

        if (existingScope) {
          existingScope.name = updated.name;
          existingScope.scope = targetScope;
          existingScope.scopeCode = targetScopeCode;
          existingScope.isActive = updated.isActive !== false;
          await this.scopeItemRepo.save(existingScope);
        } else {
          const newScope = this.scopeItemRepo.create({
            serviceCode: 'CARBON',
            scope: targetScope,
            scopeCode: targetScopeCode,
            name: updated.name,
            code: updated.code,
            description: updated.description || `Dynamic category for ${updated.name}`,
            sortOrder: updated.sortOrder || 99,
            isActive: true,
          });
          await this.scopeItemRepo.save(newScope);
        }
      } catch (err) {
        this.logger.error('Failed to sync updated master item to service scope items', err);
      }
    }

    return updated;
  }

  async softDeleteMasterItem(id: number): Promise<void> {
    const item = await this.masterItemRepo.findOneBy({ id });
    await this.masterItemRepo.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });

    if (item && item.name) {
      try {
        await this.scopeItemRepo.update(
          { serviceCode: 'CARBON', name: item.name },
          { isActive: false, deletedAt: new Date() },
        );
      } catch (err) {
        this.logger.error('Failed to deactivate corresponding scope item', err);
      }
    }
  }

  async filterMasterItems(payload: CommonListPayloadDto) {
    const { offSet = 0, limit = 10, searchInput = '', additionalFilter } = payload;
    const query = this.masterItemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.parent', 'parent')
      .where('item.isActive = :isActive', { isActive: true });

    if (additionalFilter?.type) {
      if (additionalFilter.type === 'FUEL_TYPE' || additionalFilter.type === 'GAS_TYPE') {
        query.andWhere('item.type IN (:...types)', { types: ['FUEL_TYPE', 'GAS_TYPE'] });
      } else {
        query.andWhere('item.type = :type', { type: additionalFilter.type });
      }
    }

    if (additionalFilter?.parentId) {
      query.andWhere('item.parentId = :parentId', { parentId: additionalFilter.parentId });
    }

    if (searchInput && searchInput.trim()) {
      query.andWhere('(item.name ILIKE :search OR item.code ILIKE :search)', {
        search: `%${searchInput.trim()}%`,
      });
    }

    query.orderBy('item.sortOrder', 'ASC').addOrderBy('item.name', 'ASC');

    const [listData, dataCount] = await query
      .skip(offSet)
      .take(limit)
      .getManyAndCount();

    return { listData, dataCount };
  }
}
