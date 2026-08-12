# Category 10 — Processing of Sold Products

## 1. Purpose

Category 10 covers emissions arising from processing of products sold by the reporting organization by downstream entities.

The collection workbook provides:
- Type of fuel
- Fuel consumed (L)
- Type of refrigerant
- Refrigerant consumed (kg)
- Electricity consumption (kWh)
- Reference number
- Responsible person

## 2. Activity model

```text
Sold Product
 → Downstream processing activity
    ├── Fuel
    ├── Refrigerant
    └── Electricity
```

## 3. Fuel calculation

```text
Fuel quantity × applicable fuel factor
```

## 4. Electricity calculation

```text
Electricity kWh × applicable electricity factor
```

## 5. Refrigerant calculation

```text
Released/consumed refrigerant mass × refrigerant GWP/factor
```

The system must clarify whether the supplied refrigerant quantity is consumption, recharge or leakage before calculation.

## 6. Product linkage

The application should support linking processing records to products disclosed in the Products disclosure sheet.

## 7. Validation

- product/process context required,
- activity quantity required,
- fuel type required for fuel method,
- refrigerant type required for refrigerant method,
- factor compatibility required.

## 7. Methodology Correction

Category 10 covers emissions from downstream processing of intermediate products sold by the reporting organization to other entities. The application must first determine whether the sold product is an intermediate product requiring further processing.

The processing activity model may include fuel, electricity, process emissions and refrigerant releases where applicable. The source data must distinguish energy consumption from actual GHG release.

Refrigerant recharge/consumption is not automatically equal to fugitive emissions. The calculation must use the selected leakage or release methodology.

Where downstream processing emissions are estimated using industry-average processing data, store the processing pathway, product type, quantity, geography, factor source and assumptions.

