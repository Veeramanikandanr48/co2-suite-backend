# Emission Calculation Engine and Unit Normalization

## Purpose
Defines how the application converts activity data into consistent CO2e results.

## Generic calculation

`Emissions = Activity Data × Emission Factor`

For gas-specific calculations:

`CO2e = CO2 + (CH4 × GWP) + (N2O × GWP) + other applicable gases`

## Unit normalization

Examples:

`kWh → MWh = kWh / 1,000`

`kg → tonnes = kg / 1,000`

`litres → factor denominator` only when the selected factor explicitly supports litres.

The engine must never silently assume a conversion.

## Factor compatibility

A factor contains:
- activity unit
- factor unit
- gas/result unit
- geography
- year
- source
- methodology

The resolver must verify that the activity unit is compatible with the factor denominator before calculation.

## Calculation versioning

Every result should retain:
- calculation run ID
- engine version
- factor ID/version
- GWP set/version
- input activity version
- timestamp

## Rounding

Perform calculations at sufficient internal precision. Apply presentation rounding only after the final calculation.

## Recalculation

If an approved factor or activity is changed, create a new calculation version rather than silently replacing the approved result.

## 9. Corrected Calculation Pipeline

The production pipeline shall be:

```text
Raw Activity
  ↓
Source Validation
  ↓
Boundary / Category Resolution
  ↓
Methodology Resolution
  ↓
Unit Normalization
  ↓
Factor Resolution
  ↓
Gas-Level Calculation
  ↓
GWP Resolution
  ↓
CO2e Aggregation
  ↓
Quality / Double-count Checks
  ↓
Calculation Version
  ↓
Approval
```

### 9.1 No hidden assumptions

Every conversion or fallback must create an audit event. This includes density, calorific value, distance conversion, currency normalization, occupancy, lifetime, treatment share and estimated activity.

### 9.2 Factor compatibility

A factor must declare its activity basis and output basis. The engine shall reject incompatible units rather than silently converting between semantically different activities.

### 9.3 Precision and rounding

Store full calculation precision internally. Apply presentation rounding only at the reporting layer unless the selected methodology explicitly requires rounding during calculation.

### 9.4 Idempotency

The same immutable input snapshot, methodology version, factor version, GWP version and engine version must produce the same calculation result.

