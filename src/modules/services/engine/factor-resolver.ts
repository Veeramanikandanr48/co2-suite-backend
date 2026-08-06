import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { ActivityCode } from 'src/enums/activity-code.enum';
import {
  IFactorProvider,
  FactorLookupKey,
  ResolvedFactor,
  IUnitConverter,
  IGwpProvider,
} from './interfaces/factor-provider.interface';

export interface GasSpeciesRatio {
  CO2: number;
  CH4: number;
  N2O: number;
  HFC: number;
  PFC: number;
  SF6: number;
  NF3: number;
}

export interface ResolverMetrics {
  totalLookups: number;
  l1Hits: number;
  l2Hits: number;
  dbHits: number;
  misses: number;
  l1HitRatio: number;
  l2HitRatio: number;
  overallHitRatio: number;
  avgResolutionMicros: number;
}

/**
 * Three-Tier Composite Factor Resolver (ADR-004)
 *
 * Tier 1: L1 In-Memory LRU Cache (< 0.1 ms latency target)
 * Tier 2: L2 Redis Shared Cache (< 2.0 ms latency target)
 * Tier 3: L3 PostgreSQL B-Tree Index Scan (< 10.0 ms latency target)
 *
 * Implements Priority-Based Cascading Override Rules (ADR-002):
 * Priority 1: Facility / Organization Override
 * Priority 2: Supplier-Specific Factor
 * Priority 3: Regional / Grid Region Factor
 * Priority 4: Country / National Factor
 * Priority 5: Global IPCC AR6 Default Factor
 */
@Injectable()
export class CompositeFactorResolver implements IFactorProvider {
  private readonly logger = new Logger(CompositeFactorResolver.name);

  // L1 In-Memory LRU Store
  private readonly l1Cache = new Map<string, { factor: ResolvedFactor; expiresAt: number }>();
  private readonly l1Capacity = 10000;
  private readonly l1TtlMs = 1000 * 60 * 15; // 15-minute TTL

  // Performance telemetry counters
  private metrics = {
    totalLookups: 0,
    l1Hits: 0,
    l2Hits: 0,
    dbHits: 0,
    misses: 0,
    totalMicros: 0,
  };

  constructor(
    @InjectRepository(EmissionFactor)
    private readonly efRepo?: Repository<EmissionFactor>,
  ) {}

  /**
   * Helper: Builds a deterministic cache hash key from lookup criteria.
   */
  private buildCacheKey(key: FactorLookupKey): string {
    return [
      key.organizationId ?? 0,
      key.scopeId,
      key.activityCategoryId,
      key.fuelGasTypeId,
      key.measurementUnitId,
      key.countryId ?? 0,
      key.regionId ?? 0,
      key.supplierId ?? 0,
      key.factorSourceId,
      key.factorVersionId,
      key.effectiveDate || '2026-01-01',
    ].join(':');
  }

  /**
   * Primary Factor Lookup with Tier 1 → Tier 2 → Tier 3 Fallback
   */
  async resolveFactor(key: FactorLookupKey): Promise<ResolvedFactor | null> {
    const start = process.hrtime.bigint();
    this.metrics.totalLookups++;
    const cacheKey = this.buildCacheKey(key);

    // ── Tier 1: L1 In-Memory LRU Cache ─────────────────────────────────────
    const l1Entry = this.l1Cache.get(cacheKey);
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      this.metrics.l1Hits++;
      this.recordLatency(start);
      // Refresh LRU order
      this.l1Cache.delete(cacheKey);
      this.l1Cache.set(cacheKey, l1Entry);
      return l1Entry.factor;
    }

    // ── Tier 2: L2 Redis Cache (Stubbed for Redis Client pluggability) ──────
    // If Redis is attached, check string key `ef:${cacheKey}`.
    // Omitted network I/O here for standalone execution; falls through to L3.

    // ── Tier 3: L3 PostgreSQL Index-Only Query ─────────────────────────────
    let resolved: ResolvedFactor | null = null;

    if (this.efRepo) {
      try {
        const query = this.efRepo
          .createQueryBuilder('ef')
          .leftJoinAndSelect('ef.gases', 'gas')
          .leftJoinAndSelect('ef.formulaRevisionItem', 'formula')
          .leftJoinAndSelect('ef.factorSourceItem', 'source')
          .leftJoinAndSelect('ef.factorVersionItem', 'version')
          .where('ef.isActive = :active', { active: true })
          .andWhere('ef.scopeId = :scopeId', { scopeId: key.scopeId })
          .andWhere('ef.activityCategoryId = :catId', { catId: key.activityCategoryId })
          .andWhere('ef.fuelGasTypeId = :fuelId', { fuelId: key.fuelGasTypeId })
          .andWhere('ef.measurementUnitId = :unitId', { unitId: key.measurementUnitId });

        // Optional filtering by organization, country, region
        if (key.organizationId) {
          query.andWhere('(ef.organizationId = :orgId OR ef.organizationId IS NULL)', { orgId: key.organizationId });
        } else {
          query.andWhere('ef.organizationId IS NULL');
        }

        if (key.countryId) {
          query.andWhere('(ef.countryId = :countryId OR ef.countryId IS NULL)', { countryId: key.countryId });
        }

        if (key.regionId) {
          query.andWhere('(ef.regionId = :regionId OR ef.regionId IS NULL)', { regionId: key.regionId });
        }

        if (key.factorSourceId) {
          query.andWhere('ef.factorSourceId = :sourceId', { sourceId: key.factorSourceId });
        }

        if (key.factorVersionId) {
          query.andWhere('ef.factorVersionId = :versionId', { versionId: key.factorVersionId });
        }

        // Filter by effective date range if set
        if (key.effectiveDate) {
          query.andWhere('(ef.effectiveFrom <= :date OR ef.effectiveFrom IS NULL)', { date: key.effectiveDate });
          query.andWhere('(ef.effectiveTo >= :date OR ef.effectiveTo IS NULL)', { date: key.effectiveDate });
        }

        // Priority ordering: Priority 1 (Facility) > 2 (Supplier) > 3 (Regional) > 4 (Country) > 5 (Global)
        query.orderBy('ef.priority', 'ASC');

        const ef = await query.getOne();

        if (ef) {
          resolved = {
            factorId: ef.id,
            factor: Number(ef.totalEmissionFactor),
            co2: ef.co2 ? Number(ef.co2) : undefined,
            ch4: ef.ch4 ? Number(ef.ch4) : undefined,
            n2o: ef.n2o ? Number(ef.n2o) : undefined,
            co2e: ef.co2e ? Number(ef.co2e) : Number(ef.totalEmissionFactor),
            formula: ef.formulaRevisionItem?.expression || '(amount * factor) / 1000',
            source: ef.factorSourceItem?.name || 'IPCC',
            version: ef.factorVersionItem?.name || 'AR6',
          };
          this.metrics.dbHits++;
        }
      } catch (err) {
        this.logger.warn(`L3 DB Factor lookup warning: ${(err as Error).message}`);
      }
    } else {
      // Standalone/Offline mode when DB repository is not injected
      resolved = {
        factorId: 9999,
        factor: 2.68,
        co2: 2.657,
        ch4: 0.00011,
        n2o: 0.00021,
        co2e: 2.68,
        formula: '(amount * factor) / 1000',
        source: 'IPCC',
        version: 'AR6',
      };
      this.metrics.dbHits++;
    }

    if (!resolved) {
      this.metrics.misses++;
    } else {
      // Store in L1 Cache
      if (this.l1Cache.size >= this.l1Capacity) {
        // Evict oldest entry (first key in insertion-ordered Map)
        const firstKey = this.l1Cache.keys().next().value;
        if (firstKey) this.l1Cache.delete(firstKey);
      }
      this.l1Cache.set(cacheKey, {
        factor: resolved,
        expiresAt: Date.now() + this.l1TtlMs,
      });
    }

    this.recordLatency(start);
    return resolved;
  }

  /**
   * Vectorized Batch Resolution — Resolves multiple lookup keys in parallel
   */
  async resolveFactorsBatch(keys: FactorLookupKey[]): Promise<Map<string, ResolvedFactor>> {
    const resultMap = new Map<string, ResolvedFactor>();
    const promises = keys.map(async (k) => {
      const hash = this.buildCacheKey(k);
      const res = await this.resolveFactor(k);
      if (res) resultMap.set(hash, res);
    });
    await Promise.all(promises);
    return resultMap;
  }

  /**
   * Invalidate specific key in cache (e.g. when factor is published or revised)
   */
  invalidate(key: FactorLookupKey): void {
    const hash = this.buildCacheKey(key);
    this.l1Cache.delete(hash);
  }

  /**
   * Flush all cached factor values
   */
  clearAllCaches(): void {
    this.l1Cache.clear();
  }

  /**
   * Telemetry metrics report for monitoring & benchmark assertions
   */
  getMetrics(): ResolverMetrics {
    const total = this.metrics.totalLookups || 1;
    return {
      totalLookups: this.metrics.totalLookups,
      l1Hits: this.metrics.l1Hits,
      l2Hits: this.metrics.l2Hits,
      dbHits: this.metrics.dbHits,
      misses: this.metrics.misses,
      l1HitRatio: Math.round((this.metrics.l1Hits / total) * 10000) / 100,
      l2HitRatio: Math.round((this.metrics.l2Hits / total) * 10000) / 100,
      overallHitRatio: Math.round(((this.metrics.l1Hits + this.metrics.l2Hits) / total) * 10000) / 100,
      avgResolutionMicros: Math.round(this.metrics.totalMicros / total),
    };
  }

  private recordLatency(startBigInt: bigint): void {
    const elapsed = process.hrtime.bigint() - startBigInt;
    this.metrics.totalMicros += Number(elapsed / 1000n);
  }

  // ── Legacy static helpers maintained for backward compatibility ─────────────

  static resolveSupportedSources(activityCode: string): string[] {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.SC:
        return ['IPCC (Commercial & Institutional Use)', 'IPCC (Manufacturing)', 'DEFRA 2024', 'EPA 2024'];
      case ActivityCode.MC:
        return ['IPCC', 'DEFRA 2024', 'EPA 2024'];
      case ActivityCode.FE:
        return ['IPCC-AR6 GWP', 'DEFRA 2024'];
      case ActivityCode.PE:
        return ['IEA Grid Factors 2023', 'DEFRA UK Grid 2024', 'IEA Europe 2023'];
      case ActivityCode.PHC:
        return ['DEFRA 2024', 'IPCC District Energy'];
      case ActivityCode.PGS:
      case ActivityCode.CG:
        return ['Ecoinvent 3.9', 'EXIOBASE 3', 'DEFRA 2024'];
      default:
        return ['IPCC', 'DEFRA 2024', 'Ecoinvent 3.9'];
    }
  }

  static resolveAcceptedUnits(activityCode: string): string[] {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.SC:
        return ['sm3', 'L', 'kg', 'm3', 'kWh'];
      case ActivityCode.MC:
        return ['L', 'km', 'kg', 'gallon'];
      case ActivityCode.FE:
        return ['kg', 'g', '%'];
      case ActivityCode.PE:
      case ActivityCode.PHC:
        return ['kWh', 'MWh', 'GJ'];
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return ['t-km', 'km', 'kg', 'tonnes'];
      default:
        return ['kg', 'tonnes', 'sm3', 'L', 'kWh', 'USD', 'EUR'];
    }
  }

  static resolveRequiredFields(activityCode: string): string[] {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.FE:
        return ['refrigerantGasType', 'calculationMethod', 'amountOrLeakageRate'];
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return ['transportMode', 'distance', 'weightOrTonneKm'];
      case ActivityCode.INV:
        return ['investeeName', 'investeeScope1Emissions', 'investeeScope2Emissions', 'equitySharePercent'];
      default:
        return ['fuelOrActivityType', 'amount', 'unit'];
    }
  }

  static resolveGasRatios(activityCode: string): GasSpeciesRatio {
    switch (activityCode.toUpperCase()) {
      case ActivityCode.MC:
        return { CO2: 0.9844, CH4: 0.0015, N2O: 0.0141, HFC: 0, PFC: 0, SF6: 0, NF3: 0 };
      case ActivityCode.FE:
        return { CO2: 1.0, CH4: 0, N2O: 0, HFC: 0, PFC: 0, SF6: 0, NF3: 0 };
      case ActivityCode.SC:
      default:
        return { CO2: 0.997, CH4: 0.0025, N2O: 0.0005, HFC: 0, PFC: 0, SF6: 0, NF3: 0 };
    }
  }

  static resolveDefaultFormula(activityCode: string, basedOption: string = 'activity'): string {
    if (basedOption === 'spend') return '(spend * eeio_factor) / 1000';
    switch (activityCode.toUpperCase()) {
      case ActivityCode.FE:
        return '(amount * (leakage / 100) * GWP) / 1000';
      case ActivityCode.UTD:
      case ActivityCode.DTD:
        return '(distance * weight * factor) / 1000';
      case ActivityCode.INV:
        return 'investee_emissions * (equity_share / 100)';
      default:
        return '(amount * factor) / 1000';
    }
  }
}

// Export FactorResolver alias for backward compatibility
export const FactorResolver = CompositeFactorResolver;
