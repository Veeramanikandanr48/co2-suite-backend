# ADR-007: Immutable Calculation Snapshot

**Status:** 🔒 Frozen  
**Date:** 2026-08-06  
**Deciders:** Architecture Review Board

---

## Context

ESG emissions calculations must be fully reproducible years after they are performed.
Regulatory frameworks (ISO 14064, CSRD, GHG Protocol) require that any calculation
submitted in an annual report can be independently verified and reproduced.

If calculation snapshots only store foreign key IDs that reference mutable records
(e.g. `factorRevisionId`), a future migration, rename, or purge of those records
would make the snapshot non-reproducible.

## Decision

Every `CalculationSnapshot` record:

1. **Pins all revision IDs** at the moment of calculation — `factorRevisionId`,
   `formulaRevisionId`, `policyRevisionId`, `gwpVersionId`. These point to immutable
   revision entities that must never be updated or deleted.

2. **Copies inline values** at the moment of calculation:
   - `factorValue` — exact decimal emission factor rate used
   - `formulaExpression` — exact formula string evaluated
   - `strategyName` — exact strategy class invoked
   - `gasBreakdown` — JSONB of per-gas emission totals
   - `gasFactors` — JSONB of per-gas factor values
   - `gwpMultipliers` — JSONB of per-gas GWP multipliers applied

3. **Stores a SHA-256 `checksum`** of the canonical JSON snapshot so auditors
   can verify the record has not been altered post-calculation.

## Consequences

- Calculation snapshots are fully self-describing and survive master data migrations.
- ISO 14064 / CSRD audit chains are legally defensible.
- Storage overhead is acceptable: JSONB fields compress well and snapshots are append-only.
- Snapshots must never be updated; only new snapshots may be created.
