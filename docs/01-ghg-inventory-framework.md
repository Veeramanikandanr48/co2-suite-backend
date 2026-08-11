# ESG / GHG Inventory Application — Scope 1, Scope 2 and Scope 3 Framework

## 1. Purpose

This document defines the functional and calculation framework for an ESG greenhouse-gas (GHG) inventory application. The application is intended to collect activity data, assign the activity to the correct GHG scope/category, resolve an emission factor, calculate emissions in CO2-equivalent, retain supporting evidence, and produce an auditable inventory.

The source workbook is organized around:
- Organization details and reporting boundary.
- Scope 1: stationary combustion, mobile combustion, process emissions and fugitive emissions.
- Scope 2: purchased electricity and other purchased energy forms.
- Scope 3: fifteen value-chain categories.
- Products disclosure and supporting activity data.
- Responsible person and reference fields for traceability.

The application must preserve the source workbook's terminology and data requirements rather than replacing them with a generic ESG form.

## 2. GHG inventory hierarchy

```text
Organization
  └── Reporting Period
       ├── Organizational Boundary
       │    └── Facilities / Operations
       └── GHG Inventory
            ├── Scope 1
            │    ├── Stationary Combustion
            │    ├── Mobile Combustion
            │    ├── Process Emissions
            │    └── Fugitive Emissions
            ├── Scope 2
            │    ├── Purchased Electricity
            │    ├── Purchased Steam
            │    └── Purchased Heating / Cooling
            └── Scope 3
                 ├── Category 1 — Purchased Goods & Services
                 ├── Category 2 — Capital Goods
                 ├── Category 3 — Fuel- and Energy-Related Activities
                 ├── Category 4 — Upstream Transportation & Distribution
                 ├── Category 5 — Waste Generated in Operations
                 ├── Category 6 — Business Travel
                 ├── Category 7 — Employee Commuting
                 ├── Category 8 — Upstream Leased Assets
                 ├── Category 9 — Downstream Transportation & Distribution
                 ├── Category 10 — Processing of Sold Products
                 ├── Category 11 — Use of Sold Products
                 ├── Category 12 — End-of-Life Treatment of Sold Products
                 ├── Category 13 — Downstream Leased Assets
                 ├── Category 14 — Franchises
                 └── Category 15 — Investments
```

## 3. Common activity-record structure

Every activity record should carry, where applicable:

| Field | Purpose |
|---|---|
| Organization | Tenant / reporting organization |
| Reporting period | Year or inventory period |
| Facility | Physical or operational location |
| Scope | 1, 2 or 3 |
| Category | Scope category or Scope 3 category |
| Emission source | Specific activity source |
| Activity date/month | Time allocation |
| Activity quantity | Primary measured amount |
| Activity unit | L, kg, kWh, km, AED, kg-km, nights, hours, etc. |
| Factor | Selected emission factor |
| Factor unit | Denominator of factor |
| Factor source | Published source / master |
| Factor year | Factor-set year |
| GWP basis | AR4 / AR5 / AR6 where relevant |
| CO2 | Calculated CO2 |
| CH4 | Calculated CH4 |
| N2O | Calculated N2O |
| Other gases | HFC/PFC/SF6/NF3/etc. when applicable |
| CO2e | Final normalized result |
| Evidence | Invoice, PO, travel record, meter record, supplier document, etc. |
| Reference number | Source reference |
| Responsible person | Data owner |
| Status | Draft / Submitted / Validated / Approved / Rejected |

## 4. Core calculation pattern

The generic activity-based calculation is:

```text
Emissions = Activity Data × Emission Factor
```

When factors are gas-specific:

```text
CO2e = CO2 + (CH4 × GWP_CH4) + (N2O × GWP_N2O) + Σ(Gas × GWP_Gas)
```

The application must normalize units before multiplication.

Example:

```text
Fuel = 1,000 L
Factor = kg CO2e / L

kg CO2e = 1,000 × factor
t CO2e = kg CO2e / 1,000
```

## 5. Scope classification

### Scope 1
Direct emissions from sources controlled or owned by the reporting organization, represented in the source workbook through:
- stationary fuel combustion,
- company-controlled mobile fuel use,
- process emissions,
- fugitive refrigerant/gas releases.

### Scope 2
Indirect emissions associated with purchased energy. The source workbook explicitly provides purchased electricity and has provision for solar and wind electricity input.

### Scope 3
Other indirect value-chain emissions. The source workbook provides dedicated input structures for all fifteen Scope 3 categories.

## 6. Reporting-boundary behavior

The organization setup must allow:
- number of facilities,
- reporting period,
- organization structure,
- subsidiary / parent relationship,
- financial and operational control information,
- ownership percentage,
- inclusion/exclusion decision for each source.

The Store Makers calculation workbook demonstrates an explicit reporting-boundary index where individual Scope 1 and Scope 2 sources are marked included/excluded.

## 7. Inclusion / exclusion

Each source must have an explicit status:

```text
INCLUDED
EXCLUDED
NOT_APPLICABLE
PENDING_REVIEW
```

An exclusion should store:
- reason,
- reviewer,
- date,
- evidence/reference,
- optional materiality rationale.

An excluded source must not silently disappear from the inventory.

## 8. Data lineage

The calculation result must be traceable:

```text
Result
 → Calculation Run
 → Activity Record
 → Source Document
 → Emission Factor
 → Factor Version
 → GWP Set
 → Organization
 → Reporting Period
```

## 9. Source material used for this documentation

Primary application basis:
- `GHG Data Collection Sheet - S 1,2&3 - v3(2).xlsx`
- `Store makers GHG Calculation v2(2).xlsx`
- `ghg-conversion-factors-2025-full-set(2).xlsx`
- `Global-Warming-Potential-Values (August 2024)(2).pdf`
- `Global-Warming-Potential-Values (Feb 16 2016)_1(2).pdf`

The August 2024 GWP source states that it provides 100-year GWP values and recommends the latest AR6 values. It also distinguishes fossil and non-fossil methane. The application should therefore make the GWP set explicit instead of hard-coding a single historical set.

## 12. Methodology Corrections and Mandatory Controls

### 12.1 Standards hierarchy

This application shall distinguish between:

1. GHG Protocol Corporate Accounting and Reporting Standard.
2. GHG Protocol Scope 2 Guidance.
3. GHG Protocol Corporate Value Chain (Scope 3) Standard.
4. GHG Protocol Scope 3 Calculation Guidance.
5. Sector-specific or jurisdictional guidance where explicitly selected.

A calculation method must never be inferred only from a factor name. The selected methodology, factor source, factor year, geography and gas/GWP convention must be stored with the calculation.

### 12.2 Inventory boundary

Scope classification must be performed after the organizational boundary and operational boundary are established. A source is not Scope 1 merely because it is physically near a facility, and it is not Scope 3 merely because a supplier or contractor is involved. The application must resolve ownership/control, leased-asset treatment and value-chain position before assigning the scope/category.

### 12.3 Gas-level calculation

Where the factor is gas-specific, the engine shall calculate and retain component gases separately before aggregation:

```text
CO2e = CO2 + (CH4 × GWP_CH4) + (N2O × GWP_N2O) + ...
```

The inventory record must retain gas-level results, the GWP set, time horizon and source.

### 12.4 Biogenic and fossil CO2

The data model must distinguish fossil CO2 from biogenic CO2 where the selected methodology requires separate reporting. Biogenic CO2 must not be silently mixed into fossil Scope 1 totals.

### 12.5 Recalculation and restatement

A material change to organizational boundaries, methodology, emission factors, activity data, source records or GWP values shall create a new calculation version. Approved historical results must remain reproducible.

### 12.6 Exclusions

Every excluded source/category must have:
- exclusion reason,
- boundary basis,
- materiality assessment where applicable,
- reviewer,
- evidence,
- reporting period.

A missing activity value must never be treated as an exclusion automatically.

