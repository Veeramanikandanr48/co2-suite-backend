# Category 8 — Upstream Leased Assets

## 1. Purpose

Category 8 captures emissions from leased assets upstream where the emissions are not already included in the reporting organization's Scope 1 or Scope 2 inventory.

## 2. Source fields

The collection workbook provides:
- Name of leased assets
- Combined Scope 1 and Scope 2 emissions (kg CO2e)
- Physical area of leased assets (floor space, m2)
- Reference number
- Responsible person

## 3. Application model

```text
Leased Asset
 ├── asset name
 ├── lease period
 ├── area
 ├── supplied emissions
 ├── factor/method
 ├── reference
 └── responsible person
```

## 4. Calculation methods

Where landlord-provided emissions are available:

```text
Category 8 emissions = supplied Scope 1 + Scope 2 emissions
```

Where area-based estimation is used:

```text
Emissions = Floor area × applicable emissions intensity factor
```

The method used must be stored.

## 5. Boundary check

The same leased asset must not be counted:
- in the organization's Scope 1/2,
- and again in Category 8.

The lease/boundary record should identify who controls the energy/emissions source.

## 6. Validation

- leased asset required,
- lease period required,
- area required for area-based method,
- supplied emissions required for supplier-specific method,
- reference required.

## 7. Boundary Correction

Category 8 applies to operation of assets leased by the reporting company in the reporting period when those emissions are not already included in Scope 1 or Scope 2 under the company's selected organizational boundary.

The engine must therefore evaluate lease/control status before assigning Category 8. A leased asset already included in Scope 1 or Scope 2 must not be duplicated in Category 8.

Supported approaches may include actual energy/fuel data, lessor-specific data, area/intensity estimates or other approved methods. The chosen approach and assumptions must be versioned.

