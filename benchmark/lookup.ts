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

const ITERATIONS = 10_000;

interface LookupKey {
  organizationId: number;
  scopeId: number;
  activityCategoryId: number;
  fuelGasTypeId: number;
  measurementUnitId: number;
  countryId: number;
  priority: number;
}

const sampleKey: LookupKey = {
  organizationId: 1,
  scopeId: 1,
  activityCategoryId: 2,
  fuelGasTypeId: 3,
  measurementUnitId: 4,
  countryId: 1,
  priority: 5,
};

async function benchmarkL1(_key: LookupKey): Promise<number> {
  const start = performance.now();
  // TODO: instantiate FactorResolver with LRU provider and run ITERATIONS lookups
  const end = performance.now();
  return (end - start) / ITERATIONS;
}

async function benchmarkL2(_key: LookupKey): Promise<number> {
  const start = performance.now();
  // TODO: instantiate FactorResolver with Redis provider and run ITERATIONS lookups
  const end = performance.now();
  return (end - start) / ITERATIONS;
}

async function benchmarkL3(_key: LookupKey): Promise<number> {
  const start = performance.now();
  // TODO: instantiate FactorResolver with Postgres-only provider and run ITERATIONS lookups
  const end = performance.now();
  return (end - start) / ITERATIONS;
}

async function main(): Promise<void> {
  console.log(`\n🔬 EmissionFactor Lookup Benchmark — ${ITERATIONS.toLocaleString()} iterations\n`);

  const l1 = await benchmarkL1(sampleKey);
  const l2 = await benchmarkL2(sampleKey);
  const l3 = await benchmarkL3(sampleKey);

  console.table({
    'L1 Memory LRU': { 'avg ms': l1.toFixed(3), 'SLA': '< 0.1 ms', 'Pass': l1 < 0.1 ? '✅' : '❌' },
    'L2 Redis':      { 'avg ms': l2.toFixed(3), 'SLA': '< 2 ms',   'Pass': l2 < 2    ? '✅' : '❌' },
    'L3 PostgreSQL': { 'avg ms': l3.toFixed(3), 'SLA': '< 10 ms',  'Pass': l3 < 10   ? '✅' : '❌' },
  });
}

main().catch(console.error);
