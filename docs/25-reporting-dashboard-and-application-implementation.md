# Reporting, Dashboard and Application Implementation

## Dashboard hierarchy

```text
Organization
 ├── Scope 1
 ├── Scope 2
 ├── Scope 3
 │    ├── Category 1
 │    ├── ...
 │    └── Category 15
 └── Total GHG Inventory
```

## Required reporting views

### Scope summary
Show:
- Scope 1 total
- Scope 2 total
- Scope 3 total
- Total tCO2e
- reporting year
- comparison to previous year when available.

### Scope 3 category view
Show all fifteen categories individually.

### Facility view
Allow users to identify emissions by facility and source.

### Source view
Allow drill-down from total → category/source → activity record → evidence.

## Data-quality indicators

Report:
- percentage calculated from primary activity data,
- supplier-specific data,
- estimated data,
- missing data,
- factor fallback usage,
- records pending approval.

## Reconciliation

`Organization Total = Scope 1 + Selected Scope 2 Reporting Basis + Scope 3`

Scope 2 location-based and market-based results are alternative reporting views, not additive components. The reporting configuration must explicitly select which Scope 2 basis is used for the official total, while retaining both values when dual reporting applies.

Only approved/eligible records should be included in the official reporting total.

## API/application architecture

Recommended logical modules:

```text
Organization
Boundary / Facilities
Inventory
Scope 1
Scope 2
Scope 3
Activity Data
Emission Factors
GWP Master
Calculation Engine
Validation
Approval
Audit
Reporting
```

## Frontend behavior

Forms should be category-specific and dynamically render fields based on:
- scope,
- category,
- activity type,
- selected methodology,
- selected factor.

The frontend must not contain hard-coded emission factors.

## Backend behavior

The backend should:
1. validate the activity,
2. resolve the factor,
3. normalize units,
4. calculate emissions,
5. persist the calculation version,
6. return the result and lineage metadata.

## Implementation sequence

1. Organization/boundary
2. Factor and GWP master
3. Calculation engine
4. Scope 1
5. Scope 2
6. Scope 3 categories 1–15
7. Validation/approval/audit
8. Dashboard/reporting
9. Reconciliation and export

## 12. Corrected Reporting and Implementation Requirements

### 12.1 Reporting dimensions

Reports shall separate:
- Scope 1,
- Scope 2 location-based,
- Scope 2 market-based where applicable,
- Scope 3 Category 1–15.

Do not display location-based and market-based Scope 2 as additive values.

### 12.2 Methodology disclosure

Every report must expose or link to:
- standard/methodology version,
- reporting period,
- organizational boundary,
- emission-factor source/version,
- GWP set/version,
- calculation-engine version,
- estimated/fallback data percentage,
- exclusions and materiality notes.

### 12.3 Drill-down

A dashboard number must drill down to:

```text
Total
 → Scope
 → Category/source
 → Activity record
 → Factor
 → GWP
 → Evidence
 → Calculation version
```

### 12.4 Recalculation

If a factor or methodology is updated, historical results must remain linked to the original version. Recalculated results should be stored as a new version with a reason and reviewer.

### 12.5 Production rule

Draft GHG Protocol revisions must never silently replace current production rules. A methodology registry must control which version is active for each reporting period.

