# Category 12 — End-of-Life Treatment of Sold Products

## 1. Purpose

Category 12 captures emissions from treatment/disposal of products sold during the reporting period at end of life.

The collection workbook fields are:
- Total mass of sold products (kg)
- Waste treatment
- Proportion of waste produced (%)

## 2. Calculation

For each treatment pathway:

```text
Treatment mass =
Total sold-product mass × treatment proportion
```

Then:

```text
CO2e = Treatment mass × treatment-specific emission factor
```

For multiple treatment pathways:

```text
Total CO2e = Σ(Treatment mass × treatment factor)
```

## 3. Treatment allocation

The application should allow multiple treatment rows:

```text
Product
 ├── Landfill — 40%
 ├── Recycling — 50%
 └── Incineration — 10%
```

The percentages should normally reconcile to 100% when the methodology requires complete allocation.

## 4. Validation

- total mass >= 0,
- treatment required,
- proportion between 0 and 100,
- treatment allocations must be checked for completeness,
- factor must match treatment type.

## 5. Product linkage

Link the record to the Products disclosure data when available so the total mass of sold products can be reconciled to product quantities.

## 7. Methodology Controls

Category 12 should use product mass/quantity and end-of-life treatment pathways consistent with the selected methodology. Treatment shares should be normalized and validated.

Where treatment pathways sum to 100%, the application must preserve the individual percentages for auditability. If they do not sum to 100%, the record should be flagged for review unless the selected methodology explicitly permits incomplete allocation.

Avoid double counting waste generated during manufacturing in Category 12; that waste belongs to the appropriate upstream/operational waste category rather than the sold-product end-of-life category.

