# Scope 3 — Fifteen Categories and Application Orchestration

## 1. Scope

The collection workbook provides dedicated data structures for all fifteen Scope 3 categories.

Scope 3 is divided into:
- Upstream activities — Categories 1–8.
- Downstream activities — Categories 9–15.

## 2. Category registry

| Category | Name |
|---|---|
| 1 | Purchased Goods & Services |
| 2 | Capital Goods |
| 3 | Fuel- and Energy-Related Activities (not in Scope 1 or 2) |
| 4 | Upstream Transportation & Distribution |
| 5 | Waste Generated in Operations |
| 6 | Business Travel |
| 7 | Employee Commuting |
| 8 | Upstream Leased Assets |
| 9 | Downstream Transportation & Distribution |
| 10 | Processing of Sold Products |
| 11 | Use of Sold Products |
| 12 | End-of-Life Treatment of Sold Products |
| 13 | Downstream Leased Assets |
| 14 | Franchises |
| 15 | Investments |

## 3. Common orchestration

```text
Scope 3
  → Category
     → Activity type
        → Required fields
           → Activity data
              → Factor method
                 → Factor resolution
                    → Calculation
                       → Evidence
                          → Validation
                             → Approval
```

## 4. Method selection

A category may require one of several calculation methods depending on available data.

The application should support method metadata such as:

```text
ACTIVITY_BASED
DISTANCE_BASED
MASS_BASED
FUEL_BASED
SPEND_BASED
AVERAGE_DATA
SUPPLIER_SPECIFIC
HYBRID
```

The source workbook does not require every category to use the same method. For example:
- purchased goods includes transport-mode, distance and weight fields,
- services includes cost,
- commuting includes days and daily distance,
- investments includes financial values and ownership shares,
- use of sold products includes lifetime use and per-use consumption.

## 5. Category-specific forms

Each category should have its own form configuration instead of one giant generic form.

Example:

```json
{
  "scope": 3,
  "category": 7,
  "fields": [
    "employee",
    "mode",
    "transport_category",
    "fuel_type",
    "days_travelled",
    "daily_distance"
  ]
}
```

## 6. Category inclusion

Every category should support:

```text
Included
Excluded
Not Applicable
Pending Data
```

An excluded category must retain its reason.

## 7. Product disclosure

The workbook includes a Products disclosure form with:
- month,
- product name,
- quantity,
- unit,
- reference number,
- responsible person.

This data can support downstream categories where product quantities are required.

## 8. Category calculation result

Every category should produce:

```text
Scope 3 category total
  ├── CO2
  ├── CH4
  ├── N2O
  ├── other gases
  ├── CO2e
  └── data-quality / methodology metadata
```

## 8. Correct Scope 3 Orchestration Rules

### 8.1 Category assignment is boundary-driven

The application shall not classify a record solely from a form name. Category assignment must consider the value-chain relationship, ownership/control, direction (upstream/downstream), activity type and the selected Scope 3 methodology.

### 8.2 The 15-category baseline

The current GHG Protocol Scope 3 Standard defines 15 categories. The application shall retain these category identifiers as stable keys even if future revisions change descriptions or supporting methodology.

### 8.3 Avoiding double counting

The orchestration layer must perform duplicate-boundary checks before calculation approval. Examples include:
- leased assets versus Scope 1/2,
- franchise operations versus Scope 1/2,
- downstream transport versus transport paid/controlled by the reporting company,
- capital-good transport versus upstream transportation,
- use-phase emissions versus Scope 1 emissions from assets controlled by the reporting organization.

### 8.4 Category-specific methodology

Each category record must store:
- calculation method,
- activity basis,
- emission-factor basis,
- geography,
- reporting year,
- data quality,
- evidence,
- assumptions,
- factor version,
- calculation-engine version.

### 8.5 Estimation

Estimated data must be explicitly labelled. A missing supplier value must not silently fall back to spend-based or average-data calculation. The fallback rule must be permitted by the selected methodology and recorded in the audit trail.

### 8.6 Category 3 boundary

Category 3 includes upstream emissions related to purchased fuels and energy not already included in Scope 1 or Scope 2. The application must prevent the same combustion or electricity generation emissions from being counted again as Category 3.

