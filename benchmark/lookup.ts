/**
 * Benchmark: EmissionFactor Lookup Performance
 *
 * Tests the three-tier provider chain:
 *   L1 (Memory LRU) → L2 (Redis) → L3 (PostgreSQL index-only scan)
 *
 * Run: npx ts-node benchmark/lookup.ts
 *
 * Target SLAs (v1.0):
 *   L1 hit:  < 0.1 ms  (in-process LRU cache)
 *   L2 hit:  < 2 ms    (Redis GET)
 *   L3 hit:  < 10 ms   (Postgres index-only scan on composite index)
 *   p99:     < 20 ms   (worst-case single factor resolution)
 */

import { CompositeFactorResolver } from '../src/modules/services/engine/factor-resolver';
import { FactorLookupKey } from '../src/modules/services/engine/interfaces/factor-provider.interface';

const ITERATIONS = 100_000;

const sampleKey: FactorLookupKey = {
  organizationId: 1,
  scopeId: 1,
  activityCategoryId: 2,
  fuelGasTypeId: 3,
  measurementUnitId: 4,
  countryId: 1,
  factorSourceId: 1,
  factorVersionId: 1,
  effectiveDate: '2026-01-01',
};

async function benchmarkL1(resolver: CompositeFactorResolver, key: FactorLookupKey): Promise<{ avgMs: number; p99Ms: number }> {
  // Prime L1 Cache with one initial resolution call
  await resolver.resolveFactor(key);

  const latenciesMs: number[] = new Array(ITERATIONS);
  const startTotal = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await resolver.resolveFactor(key);
    latenciesMs[i] = performance.now() - t0;
  }

  const endTotal = performance.now();
  const avgMs = (endTotal - startTotal) / ITERATIONS;

  latenciesMs.sort((a, b) => a - b);
  const p99Ms = latenciesMs[Math.floor(ITERATIONS * 0.99)];

  return { avgMs, p99Ms };
}

async function main(): Promise<void> {
  console.log(`\n🔬 EmissionFactor Lookup Benchmark — ${ITERATIONS.toLocaleString()} iterations\n`);

  const resolver = new CompositeFactorResolver();
  const l1Result = await benchmarkL1(resolver, sampleKey);
  const metrics = resolver.getMetrics();

  console.table({
    'L1 Memory LRU (Avg)': {
      'Latency (ms)': l1Result.avgMs.toFixed(4),
      'SLA Target': '< 0.1 ms',
      'Pass': l1Result.avgMs < 0.1 ? '✅' : '❌',
    },
    'L1 Memory LRU (p99)': {
      'Latency (ms)': l1Result.p99Ms.toFixed(4),
      'SLA Target': '< 0.5 ms',
      'Pass': l1Result.p99Ms < 0.5 ? '✅' : '❌',
    },
  });

  console.log('\nResolver Telemetry Metrics:');
  console.log(`  • Total Lookups: ${metrics.totalLookups.toLocaleString()}`);
  console.log(`  • L1 Cache Hits: ${metrics.l1Hits.toLocaleString()} (${metrics.l1HitRatio}%)`);
  console.log(`  • Average Resolution: ${metrics.avgResolutionMicros} µs\n`);
}

main().catch(console.error);
