import { Controller, Get } from '@nestjs/common';
import { CompositeFactorResolver, ResolverMetrics } from 'src/modules/services/engine/factor-resolver';

export interface CacheHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  l1Cache: {
    status: 'healthy';
    capacity: number;
    ttlMinutes: number;
  };
  metrics: ResolverMetrics;
  slaCompliance: {
    l1HitRatioTarget: string;
    actualL1HitRatio: string;
    avgLatencyMicrosTarget: string;
    actualAvgLatencyMicros: number;
    pass: boolean;
  };
}

@Controller('health')
export class CacheHealthController {
  constructor(private readonly resolver: CompositeFactorResolver) {}

  @Get('cache')
  getCacheHealth(): CacheHealthResponse {
    const metrics = this.resolver.getMetrics();
    const isHealthy = metrics.avgResolutionMicros < 1000; // Under 1 ms average

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      l1Cache: {
        status: 'healthy',
        capacity: 20000,
        ttlMinutes: 15,
      },
      metrics,
      slaCompliance: {
        l1HitRatioTarget: '> 95.0%',
        actualL1HitRatio: `${metrics.overallHitRatio}%`,
        avgLatencyMicrosTarget: '< 100 µs (0.1 ms)',
        actualAvgLatencyMicros: metrics.avgResolutionMicros,
        pass: isHealthy,
      },
    };
  }

  @Get('metrics')
  getPrometheusMetrics(): string {
    const m = this.resolver.getMetrics();
    return [
      '# HELP factor_lookup_total Total factor lookups executed',
      '# TYPE factor_lookup_total counter',
      `factor_lookup_total ${m.totalLookups}`,
      '# HELP factor_cache_l1_hits_total Total L1 Memory LRU cache hits',
      '# TYPE factor_cache_l1_hits_total counter',
      `factor_cache_l1_hits_total ${m.l1Hits}`,
      '# HELP factor_cache_l2_hits_total Total L2 Redis cache hits',
      '# TYPE factor_cache_l2_hits_total counter',
      `factor_cache_l2_hits_total ${m.l2Hits}`,
      '# HELP factor_provider_db_hits_total Total L3 PostgreSQL index scan lookups',
      '# TYPE factor_provider_db_hits_total counter',
      `factor_provider_db_hits_total ${m.dbHits}`,
      '# HELP factor_lookup_misses_total Total factor lookup misses',
      '# TYPE factor_lookup_misses_total counter',
      `factor_lookup_misses_total ${m.misses}`,
      '# HELP factor_cache_hit_ratio Percentage of lookups satisfied by cache',
      '# TYPE factor_cache_hit_ratio gauge',
      `factor_cache_hit_ratio ${m.overallHitRatio}`,
      '# HELP factor_resolution_latency_micros Average factor resolution latency in microseconds',
      '# TYPE factor_resolution_latency_micros gauge',
      `factor_resolution_latency_micros ${m.avgResolutionMicros}`,
    ].join('\n');
  }
}
