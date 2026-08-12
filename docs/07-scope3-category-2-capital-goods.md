# Category 2 — Capital Goods

## 1. Purpose

Category 2 covers purchased capital goods.

The collection workbook provides a dedicated `S3 - Capital Goods` form.

## 2. Fields

The form contains:
- Month
- Supplier name
- Capital Good
- Description
- Land transport details
- Sea transport details
- Air transport details

Each transport section contains:
- Vehicle type
- Number of trips
- Origin
- Destination
- Distance per trip
- Weight

## 3. Application model

A capital-good record should include:

```text
CapitalGoodPurchase
 ├── organization
 ├── period
 ├── supplier
 ├── asset/category
 ├── description
 ├── purchase quantity/value where available
 ├── logistics legs
 ├── factor method
 ├── evidence
 └── responsible person
```

## 4. Calculation

The calculation engine should support the method actually selected for the factor:

```text
Capital-good quantity × embodied-emission factor
```

or, where the calculation is transport-related:

```text
Weight × Distance × Transport Factor
```

The application must keep capital-good emissions separate from ordinary purchased goods.

## 5. Transport legs

Each land/sea/air leg is a child record:

```text
Capital Good
  └── Transport Leg
       ├── mode
       ├── vehicle type
       ├── trips
       ├── origin
       ├── destination
       ├── distance
       └── weight
```

## 6. Validation

A transport calculation cannot be finalized when a required distance or weight is missing unless the selected factor is not activity-distance based.

## 7. Audit trail

Store the supplier, purchase reference, source document and calculation version so a capital expenditure record can be reconstructed later.

## 8. Critical Boundary Correction

Category 2 primarily accounts for cradle-to-gate emissions of purchased capital goods in the reporting year. The existence of transport fields in a collection form does not mean all transport emissions belong to Category 2.

### 8.1 Capital-good embodied emissions

The preferred calculation structure is:

```text
Capital good quantity/value/activity
        ↓
Cradle-to-gate emission factor or supplier-specific emissions
        ↓
Category 2 CO2e
```

### 8.2 Capital-good transport

Transport between suppliers and the reporting organization's operations must be classified using the applicable upstream transportation and distribution boundary, normally Category 4 when it meets that category's definition. It must not be added to Category 2 merely because the shipment contains capital goods.

### 8.3 Depreciation

Do not automatically depreciate or amortize cradle-to-gate capital-good emissions over the asset life. The Scope 3 accounting treatment must follow the selected standard/methodology; the application should not impose a financial-accounting depreciation rule on GHG inventory calculations.

