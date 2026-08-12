# Enterprise GHG Inventory — ERD & Implementation Plan (Scope 1, 2, 3)

> Companion to docs 00–25. Defines the production data model and module wiring that
> operationalises the audited GHG Protocol methodology specification.

## 1. Design principles (from docs 01 / 21 / 22 / 23 / 24 / 25)

1. **Traceability** — every result links `Activity → Factor → Factor Version → GWP Set → Calculation Run → Approval → Audit`.
2. **Versioned master data** — emission factors carry identity (activity, geography, year, methodology,
   unit basis, gas coverage) and a `methodologyStatus` (`CURRENT | DRAFT | RETIRED | CUSTOM_APPROVED`).
   Draft GHG Protocol revisions are never production defaults.
3. **Unit normalization is explicit** — the engine never silently converts; every conversion is a
   versioned, sourced record or an audited fallback.
4. **Gas-level calculation** — component gases are retained and GWP-weighted using an explicit,
   versioned GWP set (AR4/AR5/AR6, fossil vs non-fossil methane).
5. **Approval immutability** — approved results are immutable; corrections produce a new calculation
   version linked to the previous version.
6. **Boundary before classification** — source inclusion/exclusion is decided against an explicit
   organizational boundary before scope/category assignment.

## 2. Entity Relationship Diagram

```text
organizations ──┬── organization_boundaries (1..* per org+year)
                │      consolidationApproach, scope2ReportingBasis, methodologyRegistryRef
                │── source_inclusions (1..* per org+year+source)
                │      inclusionStatus, exclusionReason, reviewer, evidenceRef
                │── user_details ──┬── audit_trail (entity/action/before/after JSON)
                │                  └── createdBy/updatedBy patched into every entity (BaseColumns)

master_datasource ── master_factor_version ──┬── version_fuel_mapping (legacy description link)
                                             └── emission_factors (1..*)
master_fuel ───┬─ version_fuel_mapping
               └─ emission_factors           factor identity: fuel + version + unit + geography +
                   │                           methodology, gas breakdown (CO2/CH4/N2O/HFC/PFC/SF6/NF3),
                   │                           biogenic/fossil CO2 flag, methodologyStatus
master_unit ─── fuel_unit_mapping ── unit_conversions (from→to factor, sourced)

gwp_set (source, IPCC assessment, timeHorizon, version, isCurrent)
   └── gwp_value (gasCode, gasName, chemicalFormula, value, methaneOrigin FOSSIL|NON_FOSSIL|null)

inventory_entries ──┬── category (string, legacy) | scopeId/categoryId (FK, new)
                    ├── factorId → emission_factors        (nullable, legacy ef float retained)
                    ├── factorVersionId / gwpSetId
                    ├── calculationRunId → calculation_runs
                    ├── latestCalculationResultId → calculation_results
                    ├── inclusionStatus, reportingBasis, dataQuality, rejectionReason

calculation_runs (orgId, runType SAVE|UPDATE|RECALC|RETRO, engineVersion, gwpSetId, factorVersionId,
                  inputSnapshot JSONB, resultSummary JSONB, parentRunId, status, reason)
   └── calculation_results (entryId, factorId, gwpSetId, normalizedAmount/Unit, gas-level values,
                            totalEmission tCO2e, biogenicCO2, calculationTrace JSONB, versionNumber,
                            previousResultId, isLatest)

approval_modules (+INVENTORY=2) ── approval_matrix (conditionName, toRoleId, approvalOrder)
   └── user_approval ── user_approval_remarks_mapping

audit_trail (entityType, entityId, action CREATE|UPDATE|DELETE|SUBMIT|APPROVE|REJECT|RECALCULATE|FALLBACK,
             beforeJson, afterJson, reason, changedBy)
```

## 3. New / modified tables

| Table | Kind | Purpose |
|---|---|---|
| `gwp_set` | NEW | Versioned GWP set: source, IPCC assessment (AR4/AR5/AR6), time horizon, version, isCurrent |
| `gwp_value` | NEW | Per-gas GWP value within a set, incl. methaneOrigin (FOSSIL/NON_FOSSIL) |
| `emission_factors` | NEW | Numeric factor master with full identity + gas breakdown + methodology status |
| `unit_conversions` | NEW | Explicit sourced unit conversions (kWh→MWh, kg→t …) |
| `calculation_runs` | NEW | Immutable run record: input snapshot, versions used, status |
| `calculation_results` | NEW | Gas-level result of an entry within a run, versioned |
| `audit_trail` | NEW | Immutable audit events with before/after JSON |
| `organization_boundaries` | NEW | Per org+year: consolidation approach, Scope 2 reporting basis |
| `source_inclusions` | NEW | Per org+year+source: INCLUDED/EXCLUDED/NOT_APPLICABLE/PENDING_REVIEW with reason |
| `inventory_entries` | MODIFIED | + scopeId, categoryId, factorId, gwpSetId, calculationRunId, latestCalculationResultId, inclusionStatus, reportingBasis, dataQuality, rejectionReason |

## 4. Backend module wiring

```text
AppModule
 ├─ MethodologyModule   GWP sets/values, emission factors, unit conversions, DB factor resolution
 ├─ CalculationModule   NormalizationService, ValidationService, CalculationPipelineService, RunService
 ├─ AuditModule         AuditService (event recording + query)
 ├─ BoundaryModule      OrganizationBoundary + SourceInclusion CRUD
 ├─ ReportingModule     Reconciliation, methodology disclosure, CSV export
 └─ ServicesModule ──── rewired: create/update inventory entry → pipeline →
                        calculation result + approval (module INVENTORY) + audit events
```

## 5. Calculation pipeline (doc 22 §9, implemented)

```text
Raw Activity → Source Validation → Boundary/Category Resolution → Methodology Resolution
→ Unit Normalization → Factor Resolution → Gas-Level Calculation → GWP Resolution
→ CO2e Aggregation → Quality/Double-Count Checks → Calculation Version → Approval
```

Every conversion / fallback produces an audit event (`action = FALLBACK`).

## 6. Approval workflow (doc 24, wired)

- New `ApprovalModuleEnum.INVENTORY = 2`, seeded module `inventory_entries` w/ matrix rows.
- On entry creation → `insertDynamicApproval`; on approve/reject → `updateApproval` +
  entry status sync + audit event; approval immutability enforced on update path.

## 7. Reporting / reconciliation (doc 25)

`GET reporting/reconciliation?year=&facility=` returns:
`Scope 1 + Scope 2(selected basis) + Scope 3 = Organization Total (approved records only)`,
per-facility totals, methodology disclosure (standard/version, factor source/version, GWP set,
engine version, fallback %, exclusions) and CSV export.

## 8. Implementation phases

1. Entities + enums + DTOs
2. MethodologyModule (GWP, factors, conversions)
3. CalculationModule (normalization, validation, pipeline, runs)
4. AuditModule + BoundaryModule
5. Rewire ServicesModule (persistence through pipeline, approval, audit)
6. ReportingModule
7. Frontend: GWP/factor/conversion management, approval queue, audit trail, reconciliation views