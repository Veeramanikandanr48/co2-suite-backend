# Benchmark Suite

Performance benchmarks for the CO₂ Suite calculation engine and factor resolver.

## SLA Targets (v1.0)

| Metric | Target | Benchmark File |
|---|---|---|
| L1 Memory LRU lookup | < 0.1 ms avg | `lookup.ts` |
| L2 Redis lookup | < 2 ms avg | `lookup.ts` |
| L3 PostgreSQL index-only scan | < 10 ms avg | `lookup.ts` |
| p99 single calculation | < 25 ms | `batch.ts` |
| Throughput (warm cache) | > 10,000 calc/sec | `batch.ts` |
| 25M record test | < 30 min | `25m-test.ts` |

## Files

```
benchmark/
├── lookup.ts      # Three-tier provider chain latency (L1 → L2 → L3)
├── batch.ts       # End-to-end batch calculation throughput
├── redis.ts       # Redis cache hit/miss rates and eviction behavior
├── postgres.ts    # PostgreSQL composite index scan plan analysis
└── 25m-test.ts    # Full 25-million record load & calculation test
```

## Running

```bash
# Single benchmark
npx ts-node benchmark/lookup.ts
npx ts-node benchmark/batch.ts

# Full suite (requires running DB + Redis)
npm run benchmark
```

## When to Run

- Before every release
- After any schema migration to `emission_factors` table
- After any change to the FactorResolver or CalculationEngine
- After Redis configuration changes
