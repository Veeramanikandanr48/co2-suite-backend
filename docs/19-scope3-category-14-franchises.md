# Category 14 — Franchises

## 1. Purpose

Category 14 captures emissions associated with franchise operations where the franchise emissions are not included in Scope 1/2 of the reporting organization.

The collection workbook provides:
- Number of franchises by building type
- Franchise total area (m2)
- Building total area (m2)
- Total active area (m2)
- Number of franchise assets (company cars and trucks)
- Scope 1 + Scope 2 emissions of each franchise (kg CO2e)

## 2. Calculation approaches

Where franchise Scope 1 and Scope 2 emissions are available:

```text
Category 14 = Franchise Scope 1 + Franchise Scope 2
```

Where an area/intensity method is used:

```text
Emissions = Relevant active area × applicable intensity factor
```

Vehicle emissions may be captured separately when the franchise asset information is used.

## 3. Building area

The application must distinguish:
- franchise total area,
- building total area,
- active area.

Do not automatically assume they are equal.

## 4. Franchise master

```text
Franchise
 ├── franchise ID
 ├── building type
 ├── area
 ├── active area
 ├── vehicle assets
 ├── Scope 1 emissions
 ├── Scope 2 emissions
 ├── reporting period
 └── evidence
```

## 5. Validation

- franchise count >= 0,
- areas >= 0,
- active area cannot exceed building/contractual boundaries without a documented reason,
- supplied Scope 1/2 emissions must have evidence,
- avoid duplicate inclusion in organizational Scope 1/2.

## 7. Critical Boundary Correction

Category 14 covers operation of franchises not included in the reporting company's Scope 1 or Scope 2 inventory. Therefore the application must first determine whether the franchise operation is already inside the reporting organization's organizational boundary.

### 7.1 Actual franchise emissions

Where franchise Scope 1 and Scope 2 emissions are supplied, the application may use those emissions when the selected methodology permits:

```text
Franchise Scope 1
+ Franchise Scope 2
= Category 14 emissions
```

The data must be traceable to the franchise facility and reporting period.

### 7.2 Area/intensity estimation

Area-based methods require a compatible intensity factor. The application must not treat building area as equivalent to energy consumption. Store area type, geography, building type, factor unit and source.

### 7.3 Vehicles

Franchise vehicle emissions must be classified according to ownership/control and the selected methodology. They must not be automatically added to building emissions.

