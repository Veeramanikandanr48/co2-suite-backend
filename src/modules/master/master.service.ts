import { BadRequestException, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { MasterRoles, MasterApprovalStatus } from 'src/entities/master.entity';
import { MasterScope } from 'src/entities/master-scope.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { MasterUnit } from 'src/entities/master-unit.entity';
import { MasterDatasource } from 'src/entities/master-datasource.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFormula } from 'src/entities/master-formula.entity';
import { ScopeCategoryMapping } from 'src/entities/scope-category-mapping.entity';
import { CategoryDatasourceMapping } from 'src/entities/category-datasource-mapping.entity';
import { VersionFuelMapping } from 'src/entities/version-fuel-mapping.entity';
import { FuelUnitMapping } from 'src/entities/fuel-unit-mapping.entity';
import { UnitFormulaMapping } from 'src/entities/unit-formula-mapping.entity';
import { UtilService } from 'src/utility/util/util.service';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import {
  CreateMasterScopeDto,
  CreateMasterCategoryDto,
  CreateMasterFuelDto,
  CreateMasterUnitDto,
  CreateMasterDatasourceDto,
  CreateMasterFactorVersionDto,
  CreateMasterFormulaDto,
  CreateScopeCategoryMappingDto,
  CreateCategoryDatasourceMappingDto,
  CreateVersionFuelMappingDto,
  CreateFuelUnitMappingDto,
  CreateUnitFormulaMappingDto,
} from 'src/dto/master.dto';
import {
  SEED_MASTER_SCOPES,
  SEED_MASTER_CATEGORIES,
  SEED_MASTER_DATASOURCES,
  SEED_MASTER_FACTOR_VERSIONS,
  SEED_MASTER_FUELS,
  SEED_MASTER_UNITS,
} from 'src/seeds/master-data.seed';

export type MasterEntityType =
  | 'scope'
  | 'category'
  | 'fuel'
  | 'unit'
  | 'datasource'
  | 'factor-version'
  | 'formula'
  | 'scope-category-mapping'
  | 'category-datasource-mapping'
  | 'version-fuel-mapping'
  | 'fuel-unit-mapping'
  | 'unit-formula-mapping';

export interface IMasterListResult<T> {
  listData: T[];
  dataCount: number;
}

@Injectable()
export class MasterService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MasterRoles)
    private readonly masterRolesRepo: Repository<MasterRoles>,

    @InjectRepository(MasterApprovalStatus)
    private readonly masterApprovalStatusRepo: Repository<MasterApprovalStatus>,

    @InjectRepository(MasterScope)
    private readonly masterScopeRepo: Repository<MasterScope>,

    @InjectRepository(MasterCategory)
    private readonly masterCategoryRepo: Repository<MasterCategory>,

    @InjectRepository(MasterFuel)
    private readonly masterFuelRepo: Repository<MasterFuel>,

    @InjectRepository(MasterUnit)
    private readonly masterUnitRepo: Repository<MasterUnit>,

    @InjectRepository(MasterDatasource)
    private readonly masterDatasourceRepo: Repository<MasterDatasource>,

    @InjectRepository(MasterFactorVersion)
    private readonly masterFactorVersionRepo: Repository<MasterFactorVersion>,

    @InjectRepository(MasterFormula)
    private readonly masterFormulaRepo: Repository<MasterFormula>,

    @InjectRepository(ScopeCategoryMapping)
    private readonly scopeCategoryMappingRepo: Repository<ScopeCategoryMapping>,

    @InjectRepository(CategoryDatasourceMapping)
    private readonly categoryDatasourceMappingRepo: Repository<CategoryDatasourceMapping>,

    @InjectRepository(VersionFuelMapping)
    private readonly versionFuelMappingRepo: Repository<VersionFuelMapping>,

    @InjectRepository(FuelUnitMapping)
    private readonly fuelUnitMappingRepo: Repository<FuelUnitMapping>,

    @InjectRepository(UnitFormulaMapping)
    private readonly unitFormulaMappingRepo: Repository<UnitFormulaMapping>,

    private readonly utilService: UtilService,
  ) { }

  /**
   * Seeds master database tables on application bootstrap if empty.
   */
  async onApplicationBootstrap(): Promise<void> {
    const scopeCount = await this.masterScopeRepo.count();
    if (scopeCount === 0) {
      await this.masterScopeRepo.save(
        this.masterScopeRepo.create(SEED_MASTER_SCOPES as Partial<MasterScope>[]),
      );
    }

    const catCount = await this.masterCategoryRepo.count();
    if (catCount === 0) {
      await this.masterCategoryRepo.save(
        this.masterCategoryRepo.create(SEED_MASTER_CATEGORIES as Partial<MasterCategory>[]),
      );
    } else {
      // Sync formConfig for existing DB categories if missing
      for (const seedCat of SEED_MASTER_CATEGORIES) {
        if (seedCat.name && seedCat.formConfig) {
          const existing = await this.masterCategoryRepo.findOne({ where: { name: seedCat.name } });
          if (existing && !existing.formConfig) {
            existing.formConfig = seedCat.formConfig;
            await this.masterCategoryRepo.save(existing);
          }
        }
      }
    }

    const dsCount = await this.masterDatasourceRepo.count();
    if (dsCount === 0) {
      await this.masterDatasourceRepo.save(
        this.masterDatasourceRepo.create(SEED_MASTER_DATASOURCES as Partial<MasterDatasource>[]),
      );
    }

    const verCount = await this.masterFactorVersionRepo.count();
    if (verCount === 0) {
      await this.masterFactorVersionRepo.save(
        this.masterFactorVersionRepo.create(SEED_MASTER_FACTOR_VERSIONS as Partial<MasterFactorVersion>[]),
      );
    }

    const fuelCount = await this.masterFuelRepo.count();
    if (fuelCount === 0) {
      await this.masterFuelRepo.save(
        this.masterFuelRepo.create(SEED_MASTER_FUELS as Partial<MasterFuel>[]),
      );
    }

    const unitCount = await this.masterUnitRepo.count();
    if (unitCount === 0) {
      await this.masterUnitRepo.save(
        this.masterUnitRepo.create(SEED_MASTER_UNITS as Partial<MasterUnit>[]),
      );
    }

    // Seed default Category to Datasource mappings if empty
    const catDsCount = await this.categoryDatasourceMappingRepo.count();
    if (catDsCount === 0) {
      const allCats = await this.masterCategoryRepo.find();
      const allDs = await this.masterDatasourceRepo.find();
      const mappings: Partial<CategoryDatasourceMapping>[] = [];

      for (const cat of allCats) {
        for (const ds of allDs) {
          mappings.push({
            categoryId: cat.id,
            datasourceId: ds.id,
            isActive: true,
          });
        }
      }
      if (mappings.length > 0) {
        await this.categoryDatasourceMappingRepo.save(
          this.categoryDatasourceMappingRepo.create(mappings as Partial<CategoryDatasourceMapping>[]),
        );
      }
    }
  }

  /**
   * Reusable paginated GET for any master table repository.
   * Supports offset/limit pagination, sort field/order, and optional search.
   *
   * @param repo - TypeORM repository for the target master entity
   * @param alias - Query builder alias (must match the table entity name)
   * @param sortableFields - Allowed sort field names for this entity
   * @param defaultSortField - Fallback sort field when none is provided
   * @param payload - Pagination/sort/search payload from the request
   * @param searchColumns - Entity columns to apply LIKE search on
   * @param relations - Optional eager relations to load (e.g. ['scope'])
   * @param extraWhere - Optional extra WHERE conditions (e.g. { isActive: true })
   */
  async getMasterList<T extends object>(
    repo: Repository<T>,
    alias: string,
    sortableFields: string[],
    defaultSortField: string,
    payload: CommonListPayloadDto,
    searchColumns: string[] = [],
    relations: string[] = [],
    extraWhere: FindOptionsWhere<T> = {},
  ): Promise<IMasterListResult<T>> {
    const sortFieldObject = Object.fromEntries(
      sortableFields.map((f) => [f, `${alias}.${f}`]),
    );

    const { offSet, limit, sortField, sortOrder } =
      await this.utilService.processListPayload(
        payload ?? {},
        alias,
        sortableFields,
        sortFieldObject,
        20,
        defaultSortField,
      );

    const query = repo.createQueryBuilder(alias);

    // Apply active filter
    query.where(`${alias}.isActive = :isActive`, { isActive: true });

    // Apply extra WHERE conditions
    Object.entries(extraWhere).forEach(([key, value]) => {
      query.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
    });

    // Apply search across provided columns
    if (payload?.searchInput && searchColumns.length > 0) {
      const searchConditions = searchColumns
        .map((col) => `${alias}.${col} LIKE :search`)
        .join(' OR ');
      query.andWhere(`(${searchConditions})`, {
        search: `%${payload.searchInput}%`,
      });
    }

    // Load relations (supports nested relations e.g. 'categoryMappings.masterCategory')
    relations.forEach((relation) => {
      if (relation.includes('.')) {
        const parts = relation.split('.');
        const parentAlias = parts[parts.length - 2];
        const prop = parts[parts.length - 1];
        query.leftJoinAndSelect(`${parentAlias}.${prop}`, prop);
      } else {
        query.leftJoinAndSelect(`${alias}.${relation}`, relation);
      }
    });

    // Apply sort and pagination
    const orderDirection = sortOrder === -1 ? 'DESC' : 'ASC';
    query.orderBy(sortField, orderDirection);
    query.skip(offSet).take(limit);

    const [listData, dataCount] = await query.getManyAndCount();
    return { listData, dataCount };
  }

  // ─── Master Scope ─────────────────────────────────────────────────────────

  async getMasterScopes(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<MasterScope>> {
    return this.getMasterList(
      this.masterScopeRepo,
      'masterScope',
      ['id', 'scope', 'name', 'code', 'createdAt'],
      'id',
      payload,
      ['scope', 'name', 'code', 'description'],
    );
  }

  // ─── Master Category ──────────────────────────────────────────────────────

  async getMasterCategories(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<MasterCategory>> {
    return this.getMasterList(
      this.masterCategoryRepo,
      'masterCategory',
      ['id', 'scope', 'name', 'code', 'createdAt'],
      'id',
      payload,
      ['scope', 'name', 'code', 'description'],
    );
  }

  // ─── Master Fuel ──────────────────────────────────────────────────────────

  async getMasterFuels(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<MasterFuel>> {
    return this.getMasterList(
      this.masterFuelRepo,
      'masterFuel',
      ['id', 'name', 'code', 'createdAt'],
      'id',
      payload,
      ['name', 'code', 'description'],
      ['scope', 'unitMappings', 'unitMappings.masterUnit', 'versionMappings', 'versionMappings.masterFactorVersion'],
    );
  }

  // ─── Master Unit ──────────────────────────────────────────────────────────

  async getMasterUnits(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<MasterUnit>> {
    return this.getMasterList(
      this.masterUnitRepo,
      'masterUnit',
      ['id', 'name', 'symbol', 'createdAt'],
      'id',
      payload,
      ['name', 'symbol', 'description'],
      ['fuelMappings', 'fuelMappings.masterFuel', 'formulaMappings', 'formulaMappings.masterFormula'],
    );
  }

  // ─── Master Datasource ────────────────────────────────────────────────────

  async getMasterDatasources(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<MasterDatasource>> {
    return this.getMasterList(
      this.masterDatasourceRepo,
      'masterDatasource',
      ['id', 'name', 'code', 'createdAt'],
      'id',
      payload,
      ['name', 'code', 'description'],
      ['categoryMappings', 'categoryMappings.masterCategory', 'versions'],
    );
  }

  // ─── Master Factor Version ────────────────────────────────────────────────

  async getMasterFactorVersions(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<MasterFactorVersion>> {
    return this.getMasterList(
      this.masterFactorVersionRepo,
      'masterFactorVersion',
      ['id', 'version', 'year', 'createdAt'],
      'id',
      payload,
      ['version', 'description'],
      ['datasource', 'fuelMappings', 'fuelMappings.masterFuel'],
    );
  }

  // ─── Master Formula ───────────────────────────────────────────────────────

  async getMasterFormulas(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<MasterFormula>> {
    return this.getMasterList(
      this.masterFormulaRepo,
      'masterFormula',
      ['id', 'name', 'outputUnit', 'createdAt'],
      'id',
      payload,
      ['name', 'formula', 'description'],
      ['unitMappings', 'unitMappings.masterUnit'],
    );
  }

  // ─── Master Scope Category Mapping ─────────────────────────────────────────

  async getMasterScopeCategoryMappings(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<ScopeCategoryMapping>> {
    return this.getMasterList(
      this.scopeCategoryMappingRepo,
      'scopeCategoryMapping',
      ['id', 'name', 'code', 'scope', 'scopeCode', 'createdAt'],
      'id',
      payload,
      ['name', 'code', 'scope', 'scopeCode', 'description'],
      ['masterScope', 'masterCategory'],
    );
  }

  // ─── Master Category Datasource Mapping ───────────────────────────────────

  async getMasterCategoryDatasourceMappings(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<CategoryDatasourceMapping>> {
    return this.getMasterList(
      this.categoryDatasourceMappingRepo,
      'categoryDatasourceMapping',
      ['id', 'createdAt'],
      'id',
      payload,
      ['description'],
      ['masterCategory', 'masterDatasource'],
    );
  }

  // ─── Version Fuel Mapping List ──────────────────────────────────────────

  async getMasterVersionFuelMappings(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<VersionFuelMapping>> {
    return this.getMasterList(
      this.versionFuelMappingRepo,
      'versionFuelMapping',
      ['id', 'createdAt'],
      'id',
      payload,
      ['description'],
      ['masterFactorVersion', 'masterFuel'],
    );
  }

  // ─── Fuel Unit Mapping List ─────────────────────────────────────────────

  async getMasterFuelUnitMappings(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<FuelUnitMapping>> {
    return this.getMasterList(
      this.fuelUnitMappingRepo,
      'fuelUnitMapping',
      ['id', 'createdAt'],
      'id',
      payload,
      ['description'],
      ['masterFuel', 'masterUnit'],
    );
  }

  // ─── Unit Formula Mapping List ──────────────────────────────────────────

  async getMasterUnitFormulaMappings(
    payload: CommonListPayloadDto,
  ): Promise<IMasterListResult<UnitFormulaMapping>> {
    return this.getMasterList(
      this.unitFormulaMappingRepo,
      'unitFormulaMapping',
      ['id', 'createdAt'],
      'id',
      payload,
      ['description'],
      ['masterUnit', 'masterFormula'],
    );
  }

  // ─── Reusable Create ─────────────────────────────────────────────────────

  /**
   * Reusable create for any master table repository.
   * Checks for an existing active record matching uniqueCheck fields before saving.
   *
   * @param repo - TypeORM repository for the target master entity
   * @param dto - Validated create DTO
   * @param uniqueCheck - Field(s) used to detect duplicates (e.g. { name: 'Natural Gas' })
   * @param createdBy - ID of the user performing the action
   */
  async createMaster<T extends object>(
    repo: Repository<T>,
    dto: Partial<T>,
    uniqueCheck: FindOptionsWhere<T>,
    createdBy: number,
  ): Promise<T> {
    const existing = await repo.findOne({ where: uniqueCheck });
    if (existing) {
      throw new BadRequestException(
        'A record with the same identifier already exists.',
      );
    }
    const entity = repo.create({ ...dto, isActive: true, createdBy } as T);
    return repo.save(entity);
  }

  // ─── Master Scope Create ──────────────────────────────────────────────────

  async createMasterScope(
    dto: CreateMasterScopeDto,
    createdBy: number,
  ): Promise<MasterScope> {
    return this.createMaster(
      this.masterScopeRepo,
      dto as Partial<MasterScope>,
      { name: dto.name } as FindOptionsWhere<MasterScope>,
      createdBy,
    );
  }

  // ─── Master Category Create ───────────────────────────────────────────────

  async createMasterCategory(
    dto: CreateMasterCategoryDto,
    createdBy: number,
  ): Promise<MasterCategory> {
    return this.createMaster(
      this.masterCategoryRepo,
      dto as Partial<MasterCategory>,
      { name: dto.name } as FindOptionsWhere<MasterCategory>,
      createdBy,
    );
  }

  // ─── Master Fuel Create ───────────────────────────────────────────────────

  // ─── Master Fuel Create ───────────────────────────────────────────────────

  private async syncFuelUnitMappings(
    fuelId: number,
    unitIds: number[],
    userId: number,
  ): Promise<void> {
    await this.fuelUnitMappingRepo.delete({ fuelId });
    if (unitIds.length > 0) {
      const mappings = unitIds.map((unitId) =>
        this.fuelUnitMappingRepo.create({
          fuelId,
          unitId,
          createdBy: userId,
          isActive: true,
        }),
      );
      await this.fuelUnitMappingRepo.save(mappings);
    }
  }

  async createMasterFuel(
    dto: CreateMasterFuelDto,
    createdBy: number,
  ): Promise<MasterFuel> {
    const { unitIds, ...rest } = dto;
    const fuel = await this.createMaster(
      this.masterFuelRepo,
      rest as Partial<MasterFuel>,
      { name: dto.name } as FindOptionsWhere<MasterFuel>,
      createdBy,
    );

    if (Array.isArray(unitIds)) {
      await this.syncFuelUnitMappings(fuel.id, unitIds, createdBy);
    }

    return fuel;
  }

  // ─── Master Unit Create ───────────────────────────────────────────────────

  private async syncUnitFormulaMappings(
    unitId: number,
    formulaIds: number[],
    userId: number,
  ): Promise<void> {
    await this.unitFormulaMappingRepo.delete({ unitId });
    if (formulaIds.length > 0) {
      const mappings = formulaIds.map((formulaId) =>
        this.unitFormulaMappingRepo.create({
          unitId,
          formulaId,
          createdBy: userId,
          isActive: true,
        }),
      );
      await this.unitFormulaMappingRepo.save(mappings);
    }
  }

  async createMasterUnit(
    dto: CreateMasterUnitDto,
    createdBy: number,
  ): Promise<MasterUnit> {
    const { formulaIds, ...rest } = dto;
    const unit = await this.createMaster(
      this.masterUnitRepo,
      rest as Partial<MasterUnit>,
      { symbol: dto.symbol } as FindOptionsWhere<MasterUnit>,
      createdBy,
    );

    if (Array.isArray(formulaIds)) {
      await this.syncUnitFormulaMappings(unit.id, formulaIds, createdBy);
    }

    return unit;
  }

  // ─── Master Datasource Create ─────────────────────────────────────────────

  private async syncCategoryDatasourceMappings(
    datasourceId: number,
    categoryIds: number[],
    userId: number,
  ): Promise<void> {
    await this.categoryDatasourceMappingRepo.delete({ datasourceId });
    if (categoryIds.length > 0) {
      const mappings = categoryIds.map((categoryId) =>
        this.categoryDatasourceMappingRepo.create({
          datasourceId,
          categoryId,
          createdBy: userId,
          isActive: true,
        }),
      );
      await this.categoryDatasourceMappingRepo.save(mappings);
    }
  }

  private async syncDatasourceVersions(
    datasourceId: number,
    versionIds: number[] | undefined,
    versions: string[] | undefined,
    userId: number,
  ): Promise<void> {
    if (Array.isArray(versionIds)) {
      const existing = await this.masterFactorVersionRepo.find({
        where: { datasourceId },
      });
      for (const ver of existing) {
        if (!versionIds.includes(ver.id)) {
          ver.datasourceId = null as any;
          ver.updatedBy = userId;
          await this.masterFactorVersionRepo.save(ver);
        }
      }

      for (const verId of versionIds) {
        const ver = await this.masterFactorVersionRepo.findOne({ where: { id: verId } });
        if (ver && ver.datasourceId !== datasourceId) {
          ver.datasourceId = datasourceId;
          ver.updatedBy = userId;
          await this.masterFactorVersionRepo.save(ver);
        }
      }
    } else if (Array.isArray(versions)) {
      const cleanVersions = versions.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);

      const existing = await this.masterFactorVersionRepo.find({
        where: { datasourceId, isActive: true },
      });
      const existingNames = existing.map((e) => e.version);

      for (const vStr of cleanVersions) {
        if (!existingNames.includes(vStr)) {
          const yearVal = parseInt(vStr, 10);
          const newVersion = this.masterFactorVersionRepo.create({
            version: vStr,
            year: isNaN(yearVal) ? undefined : yearVal,
            datasourceId,
            createdBy: userId,
            isActive: true,
          });
          await this.masterFactorVersionRepo.save(newVersion);
        }
      }
    }
  }

  async createMasterDatasource(
    dto: CreateMasterDatasourceDto,
    createdBy: number,
  ): Promise<MasterDatasource> {
    const { categoryIds, versionIds, versions, ...rest } = dto;
    const ds = await this.createMaster(
      this.masterDatasourceRepo,
      rest as Partial<MasterDatasource>,
      { code: dto.code } as FindOptionsWhere<MasterDatasource>,
      createdBy,
    );

    if (Array.isArray(categoryIds)) {
      await this.syncCategoryDatasourceMappings(ds.id, categoryIds, createdBy);
    }
    if (Array.isArray(versionIds) || Array.isArray(versions)) {
      await this.syncDatasourceVersions(ds.id, versionIds, versions, createdBy);
    }

    return ds;
  }

  // ─── Master Factor Version Create ─────────────────────────────────────────

  private async syncVersionFuelMappings(
    factorVersionId: number,
    fuelIds: number[],
    userId: number,
  ): Promise<void> {
    await this.versionFuelMappingRepo.delete({ factorVersionId });
    if (fuelIds.length > 0) {
      const mappings = fuelIds.map((fuelId) =>
        this.versionFuelMappingRepo.create({
          factorVersionId,
          fuelId,
          createdBy: userId,
          isActive: true,
        }),
      );
      await this.versionFuelMappingRepo.save(mappings);
    }
  }

  async createMasterFactorVersion(
    dto: CreateMasterFactorVersionDto,
    createdBy: number,
  ): Promise<MasterFactorVersion> {
    const { fuelIds, ...rest } = dto;
    const fv = await this.createMaster(
      this.masterFactorVersionRepo,
      rest as Partial<MasterFactorVersion>,
      { version: dto.version, datasourceId: dto.datasourceId } as FindOptionsWhere<MasterFactorVersion>,
      createdBy,
    );

    if (Array.isArray(fuelIds)) {
      await this.syncVersionFuelMappings(fv.id, fuelIds, createdBy);
    }

    return fv;
  }

  // ─── Master Formula Create ────────────────────────────────────────────────

  async createMasterFormula(
    dto: CreateMasterFormulaDto,
    createdBy: number,
  ): Promise<MasterFormula> {
    return this.createMaster(
      this.masterFormulaRepo,
      dto as Partial<MasterFormula>,
      { name: dto.name } as FindOptionsWhere<MasterFormula>,
      createdBy,
    );
  }

  // ─── Scope Category Mapping Create ────────────────────────────────────────

  async createScopeCategoryMapping(
    dto: CreateScopeCategoryMappingDto,
    createdBy: number,
  ): Promise<ScopeCategoryMapping> {
    return this.createMaster(
      this.scopeCategoryMappingRepo,
      dto as Partial<ScopeCategoryMapping>,
      { scopeId: dto.scopeId, categoryId: dto.categoryId } as FindOptionsWhere<ScopeCategoryMapping>,
      createdBy,
    );
  }

  // ─── Category Datasource Mapping Create ───────────────────────────────────

  async createCategoryDatasourceMapping(
    dto: CreateCategoryDatasourceMappingDto,
    createdBy: number,
  ): Promise<CategoryDatasourceMapping> {
    return this.createMaster(
      this.categoryDatasourceMappingRepo,
      dto as Partial<CategoryDatasourceMapping>,
      { categoryId: dto.categoryId, datasourceId: dto.datasourceId } as FindOptionsWhere<CategoryDatasourceMapping>,
      createdBy,
    );
  }

  // ─── Version Fuel Mapping Create ──────────────────────────────────────────

  async createVersionFuelMapping(
    dto: CreateVersionFuelMappingDto,
    createdBy: number,
  ): Promise<VersionFuelMapping> {
    return this.createMaster(
      this.versionFuelMappingRepo,
      dto as Partial<VersionFuelMapping>,
      { factorVersionId: dto.factorVersionId, fuelId: dto.fuelId } as FindOptionsWhere<VersionFuelMapping>,
      createdBy,
    );
  }

  // ─── Fuel Unit Mapping Create ─────────────────────────────────────────────

  async createFuelUnitMapping(
    dto: CreateFuelUnitMappingDto,
    createdBy: number,
  ): Promise<FuelUnitMapping> {
    return this.createMaster(
      this.fuelUnitMappingRepo,
      dto as Partial<FuelUnitMapping>,
      { fuelId: dto.fuelId, unitId: dto.unitId } as FindOptionsWhere<FuelUnitMapping>,
      createdBy,
    );
  }

  // ─── Unit Formula Mapping Create ──────────────────────────────────────────

  async createUnitFormulaMapping(
    dto: CreateUnitFormulaMappingDto,
    createdBy: number,
  ): Promise<UnitFormulaMapping> {
    return this.createMaster(
      this.unitFormulaMappingRepo,
      dto as Partial<UnitFormulaMapping>,
      { unitId: dto.unitId, formulaId: dto.formulaId } as FindOptionsWhere<UnitFormulaMapping>,
      createdBy,
    );
  }

  // ─── Reusable Update ─────────────────────────────────────────────────────

  /**
   * Single update handler for all master tables.
   * Resolves the correct repository via a repo map keyed by entityType,
   * finds the record by ID, merges the partial DTO, and saves.
   *
   * @param entityType - 'scope' | 'category' | 'fuel' | 'unit' | 'datasource' | 'factor-version' | 'formula' | 'scope-category-mapping' | 'category-datasource-mapping' | 'version-fuel-mapping' | 'fuel-unit-mapping' | 'unit-formula-mapping'
   * @param id         - Primary key of the record to update
   * @param dto        - Partial fields to apply (only provided keys are changed)
   * @param updatedBy  - ID of the user performing the action
   */
  async updateMasterRecord(
    entityType: MasterEntityType,
    id: number,
    dto: Record<string, unknown>,
    updatedBy: number,
  ): Promise<unknown> {
    const { categoryIds, versionIds, versions, fuelIds, unitIds, formulaIds, ...fields } = dto as Record<string, unknown> & {
      categoryIds?: number[];
      versionIds?: number[];
      versions?: string[];
      fuelIds?: number[];
      unitIds?: number[];
      formulaIds?: number[];
    };
    const repoMap: Record<MasterEntityType, Repository<{ id: number }>> = {
      scope: this.masterScopeRepo as Repository<{ id: number }>,
      category: this.masterCategoryRepo as Repository<{ id: number }>,
      fuel: this.masterFuelRepo as Repository<{ id: number }>,
      unit: this.masterUnitRepo as Repository<{ id: number }>,
      datasource: this.masterDatasourceRepo as Repository<{ id: number }>,
      'factor-version': this.masterFactorVersionRepo as Repository<{ id: number }>,
      formula: this.masterFormulaRepo as Repository<{ id: number }>,
      'scope-category-mapping': this.scopeCategoryMappingRepo as Repository<{ id: number }>,
      'category-datasource-mapping': this.categoryDatasourceMappingRepo as Repository<{ id: number }>,
      'version-fuel-mapping': this.versionFuelMappingRepo as Repository<{ id: number }>,
      'fuel-unit-mapping': this.fuelUnitMappingRepo as Repository<{ id: number }>,
      'unit-formula-mapping': this.unitFormulaMappingRepo as Repository<{ id: number }>,
    };

    const repo = repoMap[entityType];
    const record = await repo.findOne({
      where: { id } as FindOptionsWhere<{ id: number }>,
    });

    Object.assign(record, fields, { updatedBy });

    if (fields.isActive === false) {
      (record as any).isActive = false;
      (record as any).deletedAt = new Date();
      (record as any).deletedBy = updatedBy;
    } else if (fields.isActive === true) {
      (record as any).isActive = true;
      (record as any).deletedAt = null;
      (record as any).deletedBy = null;
    }

    const saved = await repo.save(record);

    if (entityType === 'datasource') {
      if (Array.isArray(categoryIds)) {
        await this.syncCategoryDatasourceMappings(id, categoryIds, updatedBy);
      }
      if (Array.isArray(versionIds) || Array.isArray(versions)) {
        await this.syncDatasourceVersions(id, versionIds, versions, updatedBy);
      }
    } else if (entityType === 'factor-version' && Array.isArray(fuelIds)) {
      await this.syncVersionFuelMappings(id, fuelIds, updatedBy);
    } else if (entityType === 'fuel' && Array.isArray(unitIds)) {
      await this.syncFuelUnitMappings(id, unitIds, updatedBy);
    } else if (entityType === 'unit' && Array.isArray(formulaIds)) {
      await this.syncUnitFormulaMappings(id, formulaIds, updatedBy);
    }

    return saved;
  }
  // ─── Upsert: Create or Update based on presence of id ────────────────────

  /**
   * Single upsert handler for all master tables.
   * - If dto.id is provided → update the existing record.
   * - If dto.id is absent   → create a new record.
   *
   * @param entityType - The master entity key (scope | category | fuel | unit | …)
   * @param dto        - DTO with optional id field
   * @param userId     - ID of the calling user
   */
  async upsertMasterRecord(
    entityType: MasterEntityType,
    dto: Record<string, unknown>,
    userId: number,
  ): Promise<unknown> {
    const { id, ...fields } = dto;
    if (id !== undefined && id !== null) {
      return this.updateMasterRecord(entityType, id as number, fields, userId);
    }

    const createMap: Record<MasterEntityType, () => Promise<unknown>> = {
      scope: () => this.createMasterScope(fields as unknown as CreateMasterScopeDto, userId),
      category: () => this.createMasterCategory(fields as unknown as CreateMasterCategoryDto, userId),
      fuel: () => this.createMasterFuel(fields as unknown as CreateMasterFuelDto, userId),
      unit: () => this.createMasterUnit(fields as unknown as CreateMasterUnitDto, userId),
      datasource: () => this.createMasterDatasource(fields as unknown as CreateMasterDatasourceDto, userId),
      'factor-version': () => this.createMasterFactorVersion(fields as unknown as CreateMasterFactorVersionDto, userId),
      formula: () => this.createMasterFormula(fields as unknown as CreateMasterFormulaDto, userId),
      'scope-category-mapping': () => this.createScopeCategoryMapping(fields as unknown as CreateScopeCategoryMappingDto, userId),
      'category-datasource-mapping': () => this.createCategoryDatasourceMapping(fields as unknown as CreateCategoryDatasourceMappingDto, userId),
      'version-fuel-mapping': () => this.createVersionFuelMapping(fields as unknown as CreateVersionFuelMappingDto, userId),
      'fuel-unit-mapping': () => this.createFuelUnitMapping(fields as unknown as CreateFuelUnitMappingDto, userId),
      'unit-formula-mapping': () => this.createUnitFormulaMapping(fields as unknown as CreateUnitFormulaMappingDto, userId),
    };

    return createMap[entityType]();
  }
}