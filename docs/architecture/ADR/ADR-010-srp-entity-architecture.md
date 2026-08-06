# ADR-010: Single Responsibility Principle (SRP) Entity Architecture

**Status:** 🔒 Frozen  
**Date:** 2026-08-06  
**Deciders:** Architecture Review Board

---

## Context

The original `EmissionFactor` entity grew to 45+ columns mixing lookup keys, gas values,
text labels, governance metadata, formula logic, and geographic information. This violated
the Single Responsibility Principle and degraded lookup performance because the database
had to scan wide rows even during simple factor resolutions.

The calculation engine will perform millions of factor lookups. Every byte of unnecessary
data in the hot table increases memory buffer usage and reduces cache hit rates.

## Decision

Split `EmissionFactor` into four focused entities:

| Entity | Responsibility | Access Pattern |
|---|---|---|
| `EmissionFactor` | Hot lookup: FK indexes + totalEmissionFactor + validity | Every calculation |
| `EmissionFactorGas` | Normalized per-gas breakdown values (CO₂, CH₄, N₂O, SF₆, HFCs…) | Calculation + reporting |
| `EmissionFactorMetadata` | Provenance, citations, data quality, approval audit | Audit & detail views only |
| `EmissionFactorRevision` | Monotonic change history with inline snapshot & SHA-256 checksum | Audit & rollback only |

Additionally:

- `Formula` is a definition header only (code, name)
- `FormulaRevision` holds the versioned expression + strategy + compiledHash
- Calculations pin to `formulaRevisionId`, never to mutable `Formula` records

## Consequences

- `EmissionFactor` table contains ~20 columns — fits in a single database page for most rows
- Index-only scans are possible for the common calculation path
- Governance fields do not pollute the hot path
- Unlimited gas types (SF₆, NF₃, HFCs, PFCs) are supported without schema changes via `EmissionFactorGas`
- `compiledHash` on `FormulaRevision` enables deterministic calculation engine cache invalidation
