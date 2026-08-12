# Category 7 — Employee Commuting

## 1. Purpose

Category 7 captures employee travel between home and the workplace.

The collection workbook fields are:
- Employee name
- Mode of transport
- Transport category
- Fuel type
- Number of days travelled in reporting year
- Daily distance in km, two-way
- Reference number
- Responsible person

## 2. Calculation

For distance-based commuting:

```text
Annual distance = Days travelled × Daily two-way distance
CO2e = Annual distance × applicable factor
```

If the factor is passenger-km based:

```text
Passenger-km = annual distance × occupancy adjustment
```

only when the selected factor requires it.

## 3. Employee privacy

The application may need employee-level data for collection, but reporting should support aggregation by:
- transport mode,
- facility,
- location,
- reporting period.

Access to employee names should be role-controlled.

## 4. Modes

The transport master should support:
- car,
- motorcycle,
- bus,
- rail,
- other configured modes.

The collection workbook specifically expects transport category and fuel type.

## 5. Validation

- days > 0,
- distance > 0,
- mode required,
- fuel type required where applicable,
- reporting year must match the inventory period.

## 6. Remote working

The source workbook contains a separate `S3 - Remote Working` form with:
- employee name,
- country,
- type of home office,
- total working hours,
- reference,
- responsible person.

Remote working may be modeled as a separate activity configuration, but when reported under the GHG Protocol framework it is an optional Category 7 teleworking component. It must not be treated as a new Scope 3 category or silently omitted from Category 7 reporting. Only incremental home-working emissions above the defined baseline should be counted.

## 8. Methodology Controls

Employee commuting must use a documented activity basis such as passenger-km, vehicle-km, fuel, or another permitted method. If vehicle-km is used, occupancy must be handled according to the factor definition. If the factor is already per passenger-km, do not divide by occupancy a second time.

Survey-derived commuting data must store survey period, population represented, response rate where available, extrapolation method and assumptions.

