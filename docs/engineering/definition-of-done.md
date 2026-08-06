# Definition of Done — CO₂ Suite

> **Version:** 1.0 · Frozen alongside Architecture v1.0  
> A feature is **not done** until every applicable checkbox below is ticked.  
> "It works on my machine" is not done.

---

## Every Feature

These apply to every PR, regardless of size.

- [ ] **Business logic implemented** and verified against the acceptance criteria
- [ ] **Unit tests** written for all service methods with meaningful edge cases
- [ ] **Integration tests** written for all API endpoints (happy path + error paths)
- [ ] **TypeScript strict mode passes** — zero `any`, zero implicit `any`
- [ ] **ESLint passes** with `--max-warnings 0`
- [ ] **No `console.log`** in production code (linting enforces this)
- [ ] **Conventional commit message** on all commits in the PR
- [ ] **PR description** explains *what* changed and *why* (not just *how*)

---

## Schema Changes

Applies when any entity, column, index, or constraint is added/modified/removed.

- [ ] **TypeORM migration file included** — generated, reviewed, and tested locally
- [ ] **Migration is reversible** — `down()` method correctly undoes `up()`
- [ ] **No destructive migrations without data migration script** — e.g., column rename includes data copy step
- [ ] **Composite indexes verified** — `EXPLAIN ANALYZE` run on affected queries in staging

---

## Emission Factor / Seed Data

Applies when adding or modifying seed data.

- [ ] **Source cited** in `metadata.citation` and `metadata.referenceUrl`
- [ ] **GWP version specified** per gas value (`gwpVersionId` not null)
- [ ] **Seed is idempotent** — re-running produces no duplicate records (upsert by composite key)
- [ ] **DataQuality tier set** — not left as default `TIER_1` without verification
- [ ] **Effective date range set** — `effectiveFrom` matches source publication date

---

## Calculation Engine Changes

Applies when modifying `FactorResolver`, `CalculationEngine`, or `CalculationContext`.

- [ ] **Benchmark run and results attached to PR** — L1/L2/L3 latency and throughput reported
- [ ] **SLAs still pass** — L1 < 0.1 ms, L2 < 2 ms, L3 < 10 ms, p99 < 25 ms
- [ ] **`CalculationSnapshot` checksum verified** — SHA-256 matches snapshot content
- [ ] **`formulaRevisionId` pinned** — calculation never resolves formula from mutable relation
- [ ] **GWP multipliers sourced from `EmissionFactorGas`** — no hardcoded GWP values

---

## API Endpoints

Applies to all new or modified REST endpoints.

- [ ] **DTO validation decorators** present on all input DTOs
- [ ] **Response DTO defined** — no raw entity objects returned to clients
- [ ] **Error responses documented** — 400, 401, 403, 404, 409, 500 cases handled
- [ ] **Authentication guard applied** — unauthenticated access is rejected
- [ ] **Authorization checked** — user can only access their organization's data
- [ ] **Swagger/OpenAPI annotations** updated (`@ApiOperation`, `@ApiResponse`)

---

## Audit & Governance

Applies when implementing any feature that creates, modifies, or deletes data.

- [ ] **Audit log entry created** — who did what, when, on which record
- [ ] **`createdBy` / `updatedBy` populated** from authenticated user context
- [ ] **Soft delete used** — records are never hard-deleted (use `isActive = false` or `status = ARCHIVED`)
- [ ] **Revision record created** where entity has a `*Revision` table (EmissionFactor, Formula)

---

## Performance-Sensitive Paths

Applies to any code in the hot calculation path.

- [ ] **No N+1 queries** — `EXPLAIN ANALYZE` verified
- [ ] **Eager relations justified** — only relations loaded on every request use `eager: true`
- [ ] **Cache invalidation tested** — adding/updating a factor clears the correct cache keys
- [ ] **Batch processing uses streaming** — large datasets processed with cursor, not `.findAll()`

---

## Architecture Compliance

Applies to all PRs.

- [ ] **No bounded context violations** — Supplier/Evidence not placed in Master Data; Master Data not placed in Operations
- [ ] **Controller is thin** — no business logic, no direct DB/cache access
- [ ] **Repository is thin** — no business logic
- [ ] **Factor resolution goes through `IFactorResolver`** — never direct table query
- [ ] **If architecture boundary crossed** — ADR proposed and linked in PR

---

## Before Merging to `main`

- [ ] **All review comments resolved**
- [ ] **CI pipeline green** — lint, unit tests, integration tests all pass
- [ ] **Staging deployment verified** (for significant features)
- [ ] **Product owner sign-off** on acceptance criteria (for user-facing features)
