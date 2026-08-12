# Category 13 — Downstream Leased Assets

## 1. Purpose

Category 13 captures emissions from assets owned by the reporting organization and leased to downstream entities, where those emissions are not included elsewhere.

The collection workbook provides:
- Name of leased assets
- Combined Scope 1 and Scope 2 emissions (kg CO2e)
- Physical area / floor space (m2)
- Reference number
- Responsible person

## 2. Calculation methods

Supplier/lessee supplied:

```text
Category 13 = supplied Scope 1 + Scope 2 emissions
```

Area based:

```text
Category 13 = floor area × emissions intensity factor
```

The chosen method must be recorded.

## 3. Boundary protection

The application must ensure that the same energy emissions are not counted:
- as Scope 1/2 by the owner,
- and again as another category without a documented boundary basis.

## 4. Asset model

```text
Downstream Lease
 ├── asset
 ├── lessee
 ├── lease period
 ├── floor area
 ├── supplied emissions
 ├── methodology
 ├── evidence
 └── approval
```

## 5. Validation

- asset required,
- lease period required,
- emissions or area required according to method,
- reference required,
- factor required for estimated method.

## 7. Boundary Correction

Category 13 covers operation of assets owned by the reporting company and leased to other entities, where the emissions are not already included in the reporting company's Scope 1 or Scope 2 inventory under the selected boundary approach.

The engine shall record asset owner, lessee, lease period, asset type, energy/fuel data, allocation basis and evidence. Area/intensity estimates must not be mixed with actual consumption without explicit methodology selection.

