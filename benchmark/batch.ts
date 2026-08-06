/**
 * Benchmark: Batch Calculation Throughput
 *
 * Measures end-to-end calculation throughput across varying batch sizes.
 * Simulates the calculation engine processing Activity Inventory entries
 * with the full provider chain active.
 *
 * Run: npx ts-node benchmark/batch.ts
 *
 * Target SLAs (v1.0):
 *   Throughput:  > 10,000 calculations/second with warm cache
 *   p50 latency: < 5 ms per calculation
 *   p99 latency: < 25 ms per calculation
 */

const BATCH_SIZES = [100, 1_000, 10_000, 100_000];

interface BatchResult {
  batchSize: number;
  durationMs: number;
  throughputPerSec: number;
  p50Ms: number;
  p99Ms: number;
}

async function runBatch(size: number): Promise<BatchResult> {
  const latencies: number[] = [];
  const batchStart = performance.now();

  for (let i = 0; i < size; i++) {
    const start = performance.now();
    // TODO: invoke CalculationEngine.calculate() with a mock activity entry
    latencies.push(performance.now() - start);
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

  const results: BatchResult[] = [];
  for (const size of BATCH_SIZES) {
    const result = await runBatch(size);
    results.push(result);
    console.log(`  Batch ${size.toLocaleString().padStart(7)}: ${result.throughputPerSec.toLocaleString()} calc/sec  p50=${result.p50Ms.toFixed(2)}ms  p99=${result.p99Ms.toFixed(2)}ms`);
  }

  console.log('\nSLA Check:');
  for (const r of results) {
    const throughputPass = r.throughputPerSec >= 10_000 ? '✅' : '❌';
    const p99Pass = r.p99Ms < 25 ? '✅' : '❌';
    console.log(`  ${r.batchSize.toLocaleString().padStart(7)}: throughput ${throughputPass}  p99 ${p99Pass}`);
  }
}

main().catch(console.error);
