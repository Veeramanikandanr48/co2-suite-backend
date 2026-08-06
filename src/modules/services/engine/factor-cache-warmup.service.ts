import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CompositeFactorResolver } from './factor-resolver';
import { FactorLookupKey, ResolvedFactor } from './interfaces/factor-provider.interface';

/**
 * Startup Cache Warmup Service
 *
 * Implements NestJS `OnApplicationBootstrap` to pre-load top hot global default
 * factors into L1 Memory LRU and L2 Redis on application boot, ensuring
 * zero cold-start DB latency spikes for primary calculation lookups.
 */
@Injectable()
export class FactorCacheWarmupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FactorCacheWarmupService.name);

  constructor(private readonly resolver: CompositeFactorResolver) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Starting startup cache warmup for core IPCC AR6 default emission factors…');
    try {
      const hotEntries = this.getHotGlobalFactors();
      const count = await this.resolver.warmCache(hotEntries);
      this.logger.log(`Startup cache warmup complete. ${count} hot factors ready in L1 & L2 caches.`);
    } catch (err) {
      this.logger.warn(`Startup cache warmup warning: ${(err as Error).message}`);
    }
  }

  /**
   * Pre-defined hot global default factors (IPCC AR6 defaults)
   */
  private getHotGlobalFactors(): Array<{ key: FactorLookupKey; factor: ResolvedFactor }> {
    return [
      // Stationary Combustion — Diesel
      {
        key: { scopeId: 1, activityCategoryId: 1, fuelGasTypeId: 1, measurementUnitId: 1, factorSourceId: 1, factorVersionId: 1, effectiveDate: '2026-01-01' },
        factor: { factorId: 1, factor: 2.68, co2: 2.657, ch4: 0.00011, n2o: 0.00021, co2e: 2.68, formula: '(amount * factor) / 1000', source: 'IPCC', version: 'AR6' },
      },
      // Stationary Combustion — Natural Gas
      {
        key: { scopeId: 1, activityCategoryId: 1, fuelGasTypeId: 2, measurementUnitId: 2, factorSourceId: 1, factorVersionId: 1, effectiveDate: '2026-01-01' },
        factor: { factorId: 2, factor: 2.02, co2: 1.998, ch4: 0.00054, n2o: 0.00006, co2e: 2.02, formula: '(amount * factor) / 1000', source: 'IPCC', version: 'AR6' },
      },
      // Stationary Combustion — Coal
      {
        key: { scopeId: 1, activityCategoryId: 1, fuelGasTypeId: 3, measurementUnitId: 3, factorSourceId: 1, factorVersionId: 1, effectiveDate: '2026-01-01' },
        factor: { factorId: 3, factor: 2.42, co2: 2.411, ch4: 0.00109, n2o: 0.00027, co2e: 2.42, formula: '(amount * factor) / 1000', source: 'IPCC', version: 'AR6' },
      },
      // Scope 2 Grid Electricity — Global Average
      {
        key: { scopeId: 2, activityCategoryId: 2, fuelGasTypeId: 4, measurementUnitId: 4, factorSourceId: 1, factorVersionId: 1, effectiveDate: '2026-01-01' },
        factor: { factorId: 4, factor: 0.475, co2: 0.47, ch4: 0.00002, n2o: 0.00001, co2e: 0.475, formula: '(amount * factor) / 1000', source: 'IEA', version: '2023' },
      },
    ];
  }
}
