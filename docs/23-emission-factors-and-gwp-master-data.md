# Emission Factors and GWP Master Data

## Purpose
Defines the master-data layer used by Scope 1, 2 and 3 calculations.

## Factor master

Recommended fields:

| Field | Purpose |
|---|---|
| Factor ID | Stable identifier |
| Factor family | Fuel, electricity, transport, waste, etc. |
| Activity type | What the factor applies to |
| Factor value | Numeric value |
| Factor unit | Denominator/unit |
| Geography | Country/region |
| Reporting year | Applicable year |
| Source | Published source |
| Methodology | Calculation method |
| Gas breakdown | CO2/CH4/N2O/etc. |
| Active | Availability status |
| Version | Factor revision |

## GWP master

Store:
- gas
- chemical name
- formula
- AR4 GWP
- AR5 GWP
- AR6 GWP
- time horizon
- source/version.

The supplied August 2024 GWP document states that its table contains 100-year GWP values and recommends the latest AR6 values. It also explicitly distinguishes fossil and non-fossil methane.

## Methane handling

The application should not map all CH4 records to one value. The AR6 source distinguishes:
- fossil methane for fossil-origin methane sources,
- non-fossil methane for other sources including combustion.

## Factor resolution priority

Recommended resolution order:

`Exact activity + geography + reporting year + methodology`
→ `activity + geography + factor year`
→ approved fallback only if the methodology permits it.

Every fallback must be visible in the calculation audit trail.

## 8. Corrected Master-Data Governance

The supplied 2025 UK conversion-factor workbook is a valid source for activities/geographies for which its methodology applies, but it must not be treated as a universal global factor set or as the automatic default for 2026 reporting. The application must resolve factor geography and reporting/applicability year explicitly. For India electricity, for example, the factor registry should support the latest applicable Central Electricity Authority (CEA) grid-factor release rather than silently substituting a UK factor.

### 8.1 Factor identity

A factor is uniquely resolved using a combination of:
- factor ID/version,
- activity type,
- geography,
- reporting/applicability year,
- methodology,
- unit basis,
- gas coverage.

### 8.2 Gas-specific factors

Prefer component-gas factors when available. The factor record should support:
- CO2 value/unit,
- CH4 value/unit,
- N2O value/unit,
- other relevant gases,
- biogenic/fossil classification where required.

### 8.3 GWP sets

A GWP set shall have a stable ID, source, IPCC assessment/report, time horizon and effective version. A calculation record must reference the exact GWP set rather than storing only `AR6` as an unversioned label.

### 8.4 Methane

Where the selected GWP source distinguishes fossil and non-fossil methane, the factor/source classification must determine which value applies. The application must not apply one methane value to every source.

### 8.5 Factor fallback

Fallback resolution must be explicit and policy-controlled. If an exact factor is unavailable, the engine shall return the fallback reason and confidence/data-quality status.

### 8.6 Draft versus current methodology

Master data shall include `methodology_status`: `CURRENT`, `DRAFT`, `RETIRED`, or `CUSTOM_APPROVED`. Draft GHG Protocol revision values/rules must not become production defaults automatically.

