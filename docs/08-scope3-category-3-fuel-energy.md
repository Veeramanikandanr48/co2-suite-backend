# Category 3 — Fuel- and Energy-Related Activities Not in Scope 1 or 2

## 1. Purpose

Category 3 captures upstream fuel- and energy-related emissions that are not already included in Scope 1 or Scope 2.

The Store Makers calculation workbook explicitly labels part of its mobile-fuel calculation area as `Scope 3 - Category 3`, while the 2025 factor workbook contains WTT and transmission/distribution factor families.

## 2. Avoid double counting

The application must distinguish:

```text
Scope 1
Direct combustion

Scope 2
Purchased energy use

Scope 3 Category 3
Upstream / life-cycle energy activities not already included
```

A Category 3 calculation must never simply repeat the Scope 1 or Scope 2 total.

## 3. Factor families

The supplied 2025 conversion-factor workbook contains:
- WTT-fuels
- WTT-bioenergy
- Transmission and distribution
- WTT-UK electricity
- WTT-heat and steam

The factor resolver should expose these as Category 3 factor families when applicable.

## 4. Calculation pattern

For fuel:

```text
Fuel quantity × WTT fuel factor
```

For electricity:

```text
Electricity consumption × applicable upstream electricity factor
```

For transmission/distribution:

```text
Purchased energy × applicable T&D factor
```

## 5. Input relationship

Category 3 should be linked to the corresponding Scope 1/2 activity where possible:

```text
Scope 1 fuel record
       ↓
Category 3 WTT record

Scope 2 electricity record
       ↓
Category 3 upstream electricity/T&D record
```

This allows the system to identify missing upstream calculations and prevent duplicate base activity entry.

## 6. Validation

- source activity must exist or be explicitly provided,
- factor family must be WTT/T&D applicable,
- Scope 1/2 emissions must not be directly reused as Category 3 emissions,
- factor version must be stored.
