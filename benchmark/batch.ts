/**
 * Benchmark: Batch Calculation Throughput
 *
 * Measures end-to-end factor lookup & calculation throughput across varying batch sizes.
 * Simulates processing Activity Inventory entries with the full provider chain active.
 *
 * Run: npx ts-node -r tsconfig-paths/register benchmark/batch.ts
 *
 * Target SLAs (v1.0):
 *   Throughput:  > 10,000 calculations/second with warm cache
 *   p50 latency: < 5 ms per calculation
 *   p99 latency: < 25 ms per calculation
 */

import { CompositeFactorResolver } from '../src/modules/services/engine/factor-resolver';
import { FactorLookupKey } from '../src/modules/services/engine/interfaces/factor-provider.interface';

const BATCH_SIZES = [100, 1_000, 10_000, 100_000];

interface BatchResult {
  batchSize: number;
  durationMs: number;
  throughputPerSec: number;
  p50Ms: number;
  p99Ms: number;
}

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

async function runBatch(resolver: CompositeFactorResolver, size: number): Promise<BatchResult> {
  const latencies: number[] = new Array(size);
  const batchStart = performance.now();

  // Warm L1 cache with 1 key
  await resolver.resolveFactor(sampleKey);

  for (let i = 0; i < size; i++) {
    const t0 = performance.now();
    const factor = await resolver.resolveFactor(sampleKey);
    // Simulate simple calculation: (amount * factor) / 1000
    const _co2e = (100 * (factor?.factor || 2.68)) / 1000;
    latencies[i] = performance.now() - t0;
  }

  const durationMs = performance.now() - batchStart;
  const sorted = latencies.slice().sort((a, b) => a - b);

  return {
    batchSize: size,
    durationMs,
    throughputPerSec: Math.round((size / durationMs) * 1000),
    p50Ms: sorted[Math.floor(size * 0.5)],
    p99Ms: sorted[Math.floor(size * 0.99)],
  };
}

async function main(): Promise<void> {
  console.log('\n🔬 Batch Calculation Throughput Benchmark\n');
  const resolver = new CompositeFactorResolver();

  const results: BatchResult[] = [];
  for (const size of BATCH_SIZES) {
    const result = await runBatch(resolver, size);
    results.push(result);
    console.log(
      `  Batch ${size.toLocaleString().padStart(7)}: ${result.throughputPerSec.toLocaleString().padStart(10)} calc/sec  p50=${result.p50Ms.toFixed(4)}ms  p99=${result.p99Ms.toFixed(4)}ms`
    );
  }

  console.log('\nSLA Check:');
  for (const r of results) {
    const throughputPass = r.throughputPerSec >= 10_000 ? '✅' : '❌';
    const p99Pass = r.p99Ms < 25 ? '✅' : '❌';
    console.log(
      `  ${r.batchSize.toLocaleString().padStart(7)}: throughput (${r.throughputPerSec.toLocaleString()} / sec) ${throughputPass}  p99 (${r.p99Ms.toFixed(4)} ms) ${p99Pass}`
    );
  }
}

main().catch(console.error);
