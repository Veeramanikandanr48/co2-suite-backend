import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
} from 'src/dto/master.dto';

export type MasterEntityType =
  | 'scope'
  | 'category'
  | 'fuel'
  | 'unit'
  | 'datasource'
  | 'factor-version'
  | 'formula';

export interface IMasterListResult<T> {
  listData: T[];
  dataCount: number;
}

@Injectable()
export class MasterService {
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

    private readonly utilService: UtilService,
  ) { }

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

    // Load relations
    relations.forEach((relation) => {
      query.leftJoinAndSelect(`${alias}.${relation}`, relation);
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
      ['scope'],
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
      ['datasource'],
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

  async createMasterFuel(
    dto: CreateMasterFuelDto,
    createdBy: number,
  ): Promise<MasterFuel> {
    return this.createMaster(
      this.masterFuelRepo,
      dto as Partial<MasterFuel>,
      { name: dto.name } as FindOptionsWhere<MasterFuel>,
      createdBy,
    );
  }

  // ─── Master Unit Create ───────────────────────────────────────────────────

  async createMasterUnit(
    dto: CreateMasterUnitDto,
    createdBy: number,
  ): Promise<MasterUnit> {
    return this.createMaster(
      this.masterUnitRepo,
      dto as Partial<MasterUnit>,
      { symbol: dto.symbol } as FindOptionsWhere<MasterUnit>,
      createdBy,
    );
  }

  // ─── Master Datasource Create ─────────────────────────────────────────────

  async createMasterDatasource(
    dto: CreateMasterDatasourceDto,
    createdBy: number,
  ): Promise<MasterDatasource> {
    return this.createMaster(
      this.masterDatasourceRepo,
      dto as Partial<MasterDatasource>,
      { code: dto.code } as FindOptionsWhere<MasterDatasource>,
      createdBy,
    );
  }

  // ─── Master Factor Version Create ─────────────────────────────────────────

  async createMasterFactorVersion(
    dto: CreateMasterFactorVersionDto,
    createdBy: number,
  ): Promise<MasterFactorVersion> {
    return this.createMaster(
      this.masterFactorVersionRepo,
      dto as Partial<MasterFactorVersion>,
      { version: dto.version, datasourceId: dto.datasourceId } as FindOptionsWhere<MasterFactorVersion>,
      createdBy,
    );
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

  // ─── Reusable Update ─────────────────────────────────────────────────────

  /**
   * Single update handler for all master tables.
   * Resolves the correct repository via a repo map keyed by entityType,
   * finds the record by ID, merges the partial DTO, and saves.
   *
   * @param entityType - 'scope' | 'category' | 'fuel' | 'unit' | 'datasource' | 'factor-version' | 'formula'
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
    const repoMap: Record<MasterEntityType, Repository<{ id: number }>> = {
      scope: this.masterScopeRepo as Repository<{ id: number }>,
      category: this.masterCategoryRepo as Repository<{ id: number }>,
      fuel: this.masterFuelRepo as Repository<{ id: number }>,
      unit: this.masterUnitRepo as Repository<{ id: number }>,
      datasource: this.masterDatasourceRepo as Repository<{ id: number }>,
      'factor-version': this.masterFactorVersionRepo as Repository<{ id: number }>,
      formula: this.masterFormulaRepo as Repository<{ id: number }>,
    };

    const repo = repoMap[entityType];
    const record = await repo.findOne({
      where: { id } as FindOptionsWhere<{ id: number }>,
    });

    if (!record) {
      throw new NotFoundException(`Record with id ${id} not found.`);
    }

    Object.assign(record, dto, { updatedBy });
    return repo.save(record);
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
    };

    return createMap[entityType]();
  }
}