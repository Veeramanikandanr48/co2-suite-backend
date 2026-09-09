import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { MasterEmissionFactor } from 'src/entities/master-emission-factor.entity';
import {
  ResolveEmissionFactorQueryDto,
  UpsertEmissionFactorDto,
} from 'src/dto/emission-factor.dto';

export interface EFResolveQuery {
  fuelId?: number | null;
  fuelName?: string | null;
  categoryName?: string | null;
  datasourceName?: string | null;
  factorVersionId?: number;
  unitId?: number;
  calculationMethod?: string;
  activitySubType?: string | null;
  geography?: string | null;
  withRF?: boolean | null;
}

const EF_RELATIONS = {
  masterFuel: true,
  masterFactorVersion: true,
  masterUnit: true,
};

@Injectable()
export class EmissionFactorService {
  constructor(
    @InjectRepository(MasterEmissionFactor)
    private readonly efRepo: Repository<MasterEmissionFactor>,
  ) {}

  // ─── Resolve ──────────────────────────────────────────────────────────────

  /**
   * Resolves the best matching MasterEmissionFactor for a given query.
   *
   * Resolution waterfall (most → least specific):
   *   1. Exact match: all specified discriminator dimensions
   *   2. Drop activitySubType → match without sub-type
   *   3. Drop geography → match globally (geography IS NULL / wildcard)
   *
   * Throws UnprocessableEntityException (HTTP 422) with code EF_NOT_FOUND
   * if no record matches. NEVER returns a silent ef=1.0 default.
   */
  async resolveEmissionFactor(query: EFResolveQuery): Promise<MasterEmissionFactor> {
    const {
      fuelId,
      fuelName,
      factorVersionId,
      unitId,
      calculationMethod,
      activitySubType,
      geography,
      withRF,
    } = query;

    const buildQuery = (dropSubType = false, dropGeography = false) => {
      const qb = this.efRepo
        .createQueryBuilder('ef')
        .leftJoinAndSelect('ef.masterFuel', 'fuel')
        .leftJoinAndSelect('ef.masterFactorVersion', 'factorVersion')
        .leftJoinAndSelect('ef.masterUnit', 'unit')
        .where('ef.isActive = :isActive', { isActive: true });

      if (factorVersionId) {
        qb.andWhere('ef.factorVersionId = :factorVersionId', { factorVersionId });
      }

      if (unitId) {
        qb.andWhere('ef.unitId = :unitId', { unitId });
      }

      if (calculationMethod) {
        qb.andWhere('UPPER(ef.calculationMethod) = UPPER(:calculationMethod)', {
          calculationMethod: calculationMethod.trim(),
        });
      }

      if (fuelId !== undefined && fuelId !== null) {
        qb.andWhere('ef.fuelId = :fuelId', { fuelId });
      } else if (fuelName) {
        qb.andWhere('LOWER(fuel.fuelName) = LOWER(:fuelName)', {
          fuelName: fuelName.trim(),
        });
      }

      if (withRF !== undefined && withRF !== null) {
        qb.andWhere('ef.withRF = :withRF', { withRF });
      }

      if (!dropSubType && activitySubType) {
        qb.andWhere('LOWER(ef.activitySubType) = LOWER(:activitySubType)', {
          activitySubType: activitySubType.trim(),
        });
      }

      if (!dropGeography && geography) {
        qb.andWhere('UPPER(ef.geography) = UPPER(:geography)', {
          geography: geography.trim(),
        });
      }

      return qb;
    };

    // Step 1: full match
    const fullMatch = await buildQuery(false, false).getOne();
    if (fullMatch) return fullMatch;

    // Step 2: drop activitySubType
    if (activitySubType) {
      const noSubType = await buildQuery(true, false).getOne();
      if (noSubType) return noSubType;
    }

    // Step 3: drop geography (global fallback)
    if (geography) {
      const globalMatch = await buildQuery(false, true).getOne();
      if (globalMatch) return globalMatch;
    }

    // No match found — fail explicitly
    throw new UnprocessableEntityException({
      statusCode: 422,
      error: 'Emission Factor Not Found',
      code: 'EF_NOT_FOUND',
      message:
        `No active emission factor found for: ` +
        `method=${calculationMethod || 'any'}, ` +
        (factorVersionId ? `factorVersionId=${factorVersionId}, ` : '') +
        (unitId ? `unitId=${unitId}, ` : '') +
        (fuelId !== undefined && fuelId !== null ? `fuelId=${fuelId}, ` : '') +
        (fuelName ? `fuelName=${fuelName}, ` : '') +
        (activitySubType ? `subType=${activitySubType}, ` : '') +
        (geography ? `geography=${geography}, ` : '') +
        (withRF !== undefined && withRF !== null ? `withRF=${withRF}` : ''),
    });
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Creates or updates a MasterEmissionFactor record.
   * Provide dto.id to update; omit id to create.
   */
  async upsertEmissionFactor(
    dto: UpsertEmissionFactorDto,
    userId: number,
  ): Promise<MasterEmissionFactor> {
    if (dto.id) {
      const existing = await this.efRepo.findOne({ where: { id: dto.id } });
      if (!existing) {
        throw new NotFoundException(`EmissionFactor id=${dto.id} not found`);
      }
      const merged = this.efRepo.merge(existing, {
        ...dto,
        calculationMethod: dto.calculationMethod?.toUpperCase(),
        activitySubType: dto.activitySubType?.toLowerCase() ?? null,
        geography: dto.geography?.toUpperCase() ?? null,
        updatedBy: userId,
      });
      return this.efRepo.save(merged);
    }

    // Soft-duplicate check on the 7-dimension key
    const duplicate = await this.efRepo.findOne({
      where: {
        factorVersionId: dto.factorVersionId,
        unitId: dto.unitId,
        calculationMethod: dto.calculationMethod?.toUpperCase(),
        activitySubType: dto.activitySubType?.toLowerCase() ?? (null as any),
        geography: dto.geography?.toUpperCase() ?? (null as any),
        withRF: dto.withRF ?? (null as any),
        isActive: true,
        ...(dto.fuelId !== undefined && dto.fuelId !== null ? { fuelId: dto.fuelId } : {}),
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        `An active emission factor with the same dimensions already exists (id=${duplicate.id}). Provide the id to update it.`,
      );
    }

    const created = this.efRepo.create({
      ...dto,
      calculationMethod: dto.calculationMethod?.toUpperCase(),
      activitySubType: dto.activitySubType?.toLowerCase() ?? null,
      geography: dto.geography?.toUpperCase() ?? null,
      isActive: dto.isActive !== false,
      createdBy: userId,
    });
    return this.efRepo.save(created);
  }

  /**
   * Paginated list of emission factors, optionally filtered.
   */
  async listEmissionFactors(filter: {
    calculationMethod?: string;
    factorVersionId?: number;
    fuelId?: number;
    geography?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ listData: MasterEmissionFactor[]; totalCount: number }> {
    const where: FindOptionsWhere<MasterEmissionFactor> = {};
    if (filter.calculationMethod) where.calculationMethod = filter.calculationMethod.toUpperCase();
    if (filter.factorVersionId !== undefined) where.factorVersionId = filter.factorVersionId;
    if (filter.fuelId !== undefined) where.fuelId = filter.fuelId;
    if (filter.geography) where.geography = filter.geography.toUpperCase();
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    else where.isActive = true;

    const [listData, totalCount] = await this.efRepo.findAndCount({
      where,
      relations: EF_RELATIONS,
      order: { factorVersionId: 'DESC', calculationMethod: 'ASC', activitySubType: 'ASC' },
      skip: filter.skip ?? 0,
      take: filter.take ?? 200,
    });
    return { listData, totalCount };
  }

  /**
   * Resolves an EF from query-string params (used by the GET /resolve endpoint).
   */
  async resolveFromQuery(query: ResolveEmissionFactorQueryDto): Promise<MasterEmissionFactor> {
    return this.resolveEmissionFactor({
      fuelId: query.fuelId,
      factorVersionId: query.factorVersionId,
      unitId: query.unitId,
      calculationMethod: query.calculationMethod,
      activitySubType: query.activitySubType,
      geography: query.geography,
      withRF: query.withRF,
    });
  }

  /**
   * Soft-deactivates an emission factor (isActive = false).
   * The record is retained for historical audit.
   */
  async deactivateEmissionFactor(id: number, userId: number): Promise<MasterEmissionFactor> {
    const ef = await this.efRepo.findOne({ where: { id } });
    if (!ef) throw new NotFoundException(`EmissionFactor id=${id} not found`);
    ef.isActive = false;
    ef.updatedBy = userId;
    return this.efRepo.save(ef);
  }

  /**
   * Finds a single EF by primary key — used for audit display.
   */
  async findById(id: number): Promise<MasterEmissionFactor | null> {
    return this.efRepo.findOne({
      where: { id },
      relations: EF_RELATIONS,
    });
  }
}
