# Scope 1 — Stationary and Mobile Combustion

## 1. Scope

This document covers two Scope 1 source types present in the collection workbook:

1. Stationary combustion.
2. Mobile combustion.

The source workbook provides separate forms for both.

---

# Part A — Stationary Combustion

## 2. Meaning

Stationary combustion captures fuel burned in fixed equipment or fixed operational assets.

The collection workbook fields are:

| Field | Description |
|---|---|
| Month | Activity month |
| Combustion Source | Boiler, generator, heater, furnace, etc. |
| Fuel Type | Gaseous, liquid or solid classification |
| Fuel | Specific fuel |
| Unit | L, kg, Gl or applicable unit |
| Quantity | Consumed amount |
| Cost | Optional financial evidence |
| Reference No | Invoice / PO / source reference |
| Responsible person | Data owner |

The workbook's list sheet provides stationary-fuel groupings such as gaseous fuels, liquid fuels and solid fuels and combustion-source options such as boilers, diesel generators, heaters, furnaces, steam generators and gas turbines.

## 3. Application flow

```text
Select Organization
 → Select Reporting Period
 → Select Facility
 → Scope = 1
 → Source = Stationary Combustion
 → Select Combustion Source
 → Select Fuel Type
 → Select Fuel
 → Enter Unit + Quantity
 → Attach Evidence
 → Resolve Factor
 → Calculate CO2e
 → Validate
 → Submit
```

## 4. Validation

Required:
- reporting month,
- combustion source,
- fuel,
- unit,
- quantity,
- responsible person.

Business validations:
- quantity > 0,
- unit must be compatible with factor,
- reporting date must fall within inventory period,
- fuel must be active in the factor master,
- factor must exist for the selected reporting year.

## 5. Calculation

Where the factor is directly expressed as kg CO2e per unit:

```text
kg CO2e = Quantity × Factor
t CO2e = kg CO2e / 1,000
```

Where gas-specific factors are supplied:

```text
CO2e = CO2 + CH4 × GWP_CH4 + N2O × GWP_N2O
```

The 2025 UK conversion-factor workbook contains a `Fuels` source sheet identified as Scope 1 and a `Bioenergy` sheet also identified as Scope 1. The factor resolver must therefore distinguish normal fuels and bioenergy rather than treating all fuels as one flat list.

---

# Part B — Mobile Combustion

## 6. Meaning

Mobile combustion covers fuel used by company-owned or company-controlled vehicles/assets represented by the application.

The collection workbook fields are:

| Field | Description |
|---|---|
| Month | Month of use |
| Vehicle Type | Specific vehicle |
| Vehicle category | Passenger/commercial/other class |
| Fuel type | Petrol, diesel, etc. |
| Quantity (L) | Fuel consumed |
| Distance (Km) | Optional activity data |
| Cost | Financial evidence |
| Reference No | Invoice/source reference |
| Responsible person | Data owner |

The source calculation workbook demonstrates vehicle-level records including vehicle type, vehicle category, plate number, fuel type and monthly fuel quantity.

## 7. Vehicle master

The application should maintain:
- vehicle ID,
- registration/plate number,
- vehicle type,
- vehicle category,
- ownership/control status,
- fuel type,
- active dates,
- facility.

The `List` sheet in the collection workbook contains vehicle classes such as cars by market segment/size, motorcycles, vans and HGV classes.

## 8. Calculation

Fuel-based:

```text
CO2e = Fuel quantity × fuel emission factor
```

If the selected factor contains separate CO2, CH4 and N2O values:

```text
CO2e = CO2 + CH4 + N2O
```

where each gas is converted to CO2e using the selected GWP basis.

Distance-based calculation should only be used when the selected factor is explicitly distance-based.

## 9. Duplicate prevention

A mobile fuel record should have a natural duplicate check using:

```text
organization + period + month + vehicle + fuel + reference_no
```

Do not block legitimate repeated fuel purchases solely because vehicle and month are identical.

## 10. Evidence

Accept:
- fuel invoice,
- fuel-card statement,
- fleet report,
- purchase record,
- accounting export.

Reference number should be retained for audit traceability.

## 11. Special methane handling

The AR6 source distinguishes fossil and non-fossil methane. For combustion emissions, the source specifically instructs use of the non-fossil methane GWP to avoid double counting the methane oxidation-to-CO2 effect.

Therefore:

```text
Combustion CH4 → AR6 non-fossil CH4 GWP
```

unless a documented factor/source requires another treatment.

## 10. Methodology Corrections and Controls

### 10.1 Scope 1 classification

Stationary and mobile combustion are direct emissions only when the combustion source is owned or controlled by the reporting organization under its selected organizational-boundary approach. Fuel purchased by a company does not automatically create Scope 1 if the combustion occurs in a source outside the company's boundary.

### 10.2 Calculation hierarchy

The engine shall support, where appropriate:
- fuel/activity data × emission factor,
- direct measurement,
- mass balance,
- supplier-specific data.

The selected approach must be stored per source.

### 10.3 Gas-specific result

Do not store only one generic factor when the source provides gas components. Store CO2, CH4 and N2O separately, then apply the selected GWP set.

### 10.4 Fuel factor basis

The factor basis must identify whether the factor is per litre, kilogram, cubic metre, kWh, MJ, GJ or another unit, and whether it is net/gross calorific value based where relevant. Unit conversion must occur before factor multiplication.

### 10.5 Mobile combustion

Vehicle activity may be expressed as fuel consumed, distance travelled, vehicle-kilometres, or another approved activity basis. Distance must not be converted to fuel using an assumed efficiency unless that assumption is explicitly selected, sourced and versioned.

