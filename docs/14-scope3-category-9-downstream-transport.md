# Category 9 — Downstream Transportation & Distribution

## 1. Purpose

Category 9 captures transportation and distribution of sold products after the reporting organization's point of sale/ownership boundary, where applicable.

The collection workbook provides a `S3 - Distribution` form.

## 2. Source fields

- Month
- Finished product
- Description
- Land transport
- Sea transport
- Air transport

Each mode includes:
- Vehicle type
- Number of trips
- Origin
- Destination
- Distance per trip
- Weight

The form also contains a field indicating who pays for distribution, which is important for distinguishing downstream transport treatment.

## 3. Orchestration

```text
Finished Product
 → Distribution payer/boundary
 → Transport mode
 → Shipment
 → Weight + Distance
 → Factor
 → Category 9 CO2e
```

## 4. Calculation

For mass-distance factors:

```text
tonne-km = weight(kg) / 1,000 × distance(km)
CO2e = tonne-km × factor
```

For another factor unit, the calculation engine must use the factor's declared unit.

## 5. Product linkage

Where product disclosure exists, distribution records can be linked to:
- product,
- quantity sold,
- reporting month.

This improves reconciliation.

## 6. Validation

- finished product required,
- mode required,
- origin/destination required when distance-based,
- weight required for mass-distance factors,
- distribution boundary/payer status required where the application uses it for classification.

## 7. Boundary Correction

Category 9 covers transportation and distribution of products sold by the reporting company in the reporting year, after the reporting company's point of sale/ownership boundary as defined by the Scope 3 Standard, where the transportation is not already included in Scope 1/2 or another category.

The payer field is useful evidence but must not be the only classification rule. The application shall store the ownership/control and value-chain boundary decision explicitly.

Transport activity should be calculated using the factor's declared basis, such as tonne-km, shipment, vehicle-km or another approved unit.

