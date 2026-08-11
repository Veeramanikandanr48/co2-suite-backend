# Category 11 — Use of Sold Products

## 1. Purpose

Category 11 captures emissions resulting from the use of products sold during their expected lifetime.

The collection workbook contains fields for:
- Total lifetime expected uses
- Number sold in reporting period, product-wise
- Type of fuel
- Fuel consumed per use (L)
- Electricity consumed per use (kWh)
- Type of refrigerant
- Refrigerant leakage per use (kg)
- Reference number
- Responsible person

## 2. Core calculation

For fuel use:

```text
Lifetime fuel =
Number sold × Lifetime expected uses × Fuel consumed per use
```

Then:

```text
CO2e = Lifetime fuel × applicable fuel factor
```

For electricity:

```text
Lifetime electricity =
Number sold × Lifetime expected uses × Electricity per use
```

Then:

```text
CO2e = Lifetime electricity × applicable electricity factor
```

For refrigerant leakage:

```text
Lifetime refrigerant =
Number sold × Lifetime expected uses × leakage per use
```

Then apply the refrigerant GWP/factor.

## 3. Important distinction

`Number sold in reporting period` and `Total lifetime expected uses` are different dimensions.

Do not multiply by a total lifetime sales quantity if the input already represents the lifetime total.

## 4. Product-level records

Each product should have:
- product ID,
- product name,
- sales quantity,
- lifetime use assumption,
- fuel/electricity/refrigerant characteristics,
- methodology source.

## 5. Validation

- number sold >= 0,
- lifetime uses >= 0,
- per-use quantity >= 0,
- product required,
- factor compatible with activity unit.

Assumptions must be auditable and versioned.

## 7. Critical Methodology Correction

Category 11 must distinguish **direct use-phase emissions** from **indirect use-phase emissions** where the selected Scope 3 methodology requires or permits the distinction. The application must not assume that every sold product has a lifetime fuel/electricity calculation.

### 7.1 Direct use-phase

Examples include products that directly consume fuels or electricity or directly release greenhouse gases during use.

```text
Units sold
× expected lifetime activity
× energy/fuel/GHG per activity
× applicable factor
```

### 7.2 Indirect use-phase

Where applicable, products may enable or influence energy use without directly consuming the energy themselves. Such calculations must follow the selected Scope 3 method and documented assumptions.

### 7.3 Lifetime assumptions

Store each assumption separately:
- units sold,
- expected lifetime,
- uses/year or total uses,
- energy/fuel per use,
- leakage per use,
- geography,
- source of assumption,
- assumption version.

Do not multiply by lifetime twice.

### 7.4 Sales cohort handling

The application must identify whether the selected method accounts for the lifetime use of products sold in the reporting year or uses another permitted allocation approach. This must be a methodology setting, not an implicit code assumption.

