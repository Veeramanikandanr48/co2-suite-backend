import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MethodologyStatus } from 'src/enums/ghg.enum';

export interface FactorResolveParams {
  fuelKey?: string;
  fuelId?: number;
  factorVersionId?: number;
  reportingYear?: number;
  geography?: string;
  basisUnit?: string;
  basedOption?: 'activity' | 'spend';
  allowFallback?: boolean;
}

export interface ResolvedFactor {
  factor: EmissionFactor | null;
  fallbackUsed: boolean;
  fallbackReason?: string;
  resolutionOrder: string;
}

@Injectable()
export class FactorResolutionService {
  constructor(
    @InjectRepository(EmissionFactor)
    private readonly emissionFactorRepo: Repository<EmissionFactor>,
    @InjectRepository(MasterFuel)
    private readonly masterFuelRepo: Repository<MasterFuel>,
    @InjectRepository(MasterFactorVersion)
    private readonly masterFactorVersionRepo: Repository<MasterFactorVersion>,
  ) {}

  private baseQuery(fuelId: number): SelectQueryBuilder<EmissionFactor> {
    return this.emissionFactorRepo
      .createQueryBuilder('ef')
      .leftJoinAndSelect('ef.fuel', 'fuel')
      .leftJoinAndSelect('ef.factorVersion', 'factorVersion')
      .leftJoinAndSelect('ef.unitBasis', 'unitBasis')
      .where('ef.fuelId = :fuelId', { fuelId })
      .andWhere('ef.isActive = :isActive', { isActive: true });
  }

  /**
   * Resolves an emission factor using the documented priority (doc 23 §6):
   * 1. Exact activity + geography + reporting year + methodology
   * 2. activity + geography + factor year
   * 3. Approved fallback (isDefaultFactor and methodologyStatus CURRENT) - only if permitted
   *
   * Every fallback is surfaced to the caller for the audit trail.
   */
  async resolveFactor(params: FactorResolveParams): Promise<ResolvedFactor> {
    const geography = (params.geography || 'GLOBAL').toUpperCase();
    const basedOption = params.basedOption || 'activity';

    let fuel: MasterFuel | null = null;
    if (params.fuelId) {
      fuel = await this.masterFuelRepo.findOne({
        where: { id: params.fuelId, isActive: true },
      });
    } else if (params.fuelKey) {
      fuel = await this.masterFuelRepo
        .createQueryBuilder('fuel')
        .where(
          '(LOWER(fuel.name) = LOWER(:key) OR LOWER(fuel.code) = LOWER(:key))',
          { key: params.fuelKey.trim() },
        )
        .andWhere('fuel.isActive = :isActive', { isActive: true })
        .getOne();
    }

    if (!fuel) {
      return {
        factor: null,
        fallbackUsed: false,
        fallbackReason: 'Fuel/activity source not found in master data',
        resolutionOrder: 'NONE',
      };
    }

    // Pass 1: exact geography + reporting year (CURRENT methodology preferred)
    const exact = await this.baseQuery(fuel.id)
      .andWhere('ef.geography = :geography', { geography })
      .andWhere('ef.reportingYear = :year', {
        year: params.reportingYear ?? null,
      })
      .andWhere('ef.methodologyStatus = :status', {
        status: MethodologyStatus.CURRENT,
      })
      .getOne();
    if (exact) {
      return {
        factor: exact,
        fallbackUsed: false,
        resolutionOrder: 'EXACT',
      };
    }

    // Pass 2: geography + reported factor version
    const version = params.factorVersionId
      ? await this.masterFactorVersionRepo.findOne({
          where: { id: params.factorVersionId, isActive: true },
        })
      : null;
    if (version) {
      const geoVersion = await this.baseQuery(fuel.id)
        .andWhere('ef.geography = :geography', { geography })
        .andWhere('ef.factorVersionId = :factorVersionId', {
          factorVersionId: version.id,
        })
        .getOne();
      if (geoVersion) {
        return {
          factor: geoVersion,
          fallbackUsed: false,
          resolutionOrder: 'GEO_VERSION',
        };
      }
    }

    // Pass 3: any CURRENT factor for geography (approved fallback)
    if (params.allowFallback !== false) {
      const fallbackCandidates = await this.baseQuery(fuel.id)
        .andWhere('ef.geography = :geography', { geography })
        .andWhere('ef.methodologyStatus = :status', {
          status: MethodologyStatus.CURRENT,
        })
        .orderBy('ef.isDefaultFactor', 'DESC')
        .addOrderBy('ef.reportingYear', 'DESC')
        .getMany();
      const fallbackFactor =
        fallbackCandidates.find((f) => f.isDefaultFactor) ??
        fallbackCandidates[0] ??
        null;

      if (fallbackFactor) {
        return {
          factor: fallbackFactor,
          fallbackUsed: true,
          fallbackReason: `Exact factor not found for ${fuel.name} in ${geography} (based=${basedOption}); approved fallback factor used (${fallbackFactor.sourceReference || 'no source reference'})`,
          resolutionOrder: 'FALLBACK',
        };
      }
    }

    // Pass 4: default factor regardless of geography
    const globalDefault = await this.baseQuery(fuel.id)
      .andWhere('ef.isDefaultFactor = :isDefault', { isDefault: true })
      .andWhere('ef.methodologyStatus = :status', {
        status: MethodologyStatus.CURRENT,
      })
      .getOne();
    if (globalDefault) {
      return {
        factor: globalDefault,
        fallbackUsed: true,
        fallbackReason: `No ${geography}-specific factor; GLOBAL default factor used (${globalDefault.sourceReference || 'no source reference'})`,
        resolutionOrder: 'GLOBAL_DEFAULT',
      };
    }

    return {
      factor: null,
      fallbackUsed: false,
      fallbackReason: `No applicable factor found for ${fuel.name} in ${geography}`,
      resolutionOrder: 'NONE',
    };
  }

  /** Converts a legacy user-entered ef + source into a durable factor if possible. */
  getLegacyFactorKey(unitBasis?: string): { symbol: string } | null {
    const map: Record<string, string> = {
      sm3: 'sm3',
      L: 'L',
      l: 'L',
      kg: 'kg',
      kWh: 'kWh',
      m3: 'm3',
      tonne: 'tonne',
      ton: 'tonne',
      km: 'km',
      't-km': 't-km',
      'ton.km': 't-km',
      'passenger.km': 'pkm',
      USD: 'USD',
      EUR: 'EUR',
    };
    const key = (unitBasis ?? '').trim();
    return map[key] ? { symbol: map[key] } : null;
  }
}
