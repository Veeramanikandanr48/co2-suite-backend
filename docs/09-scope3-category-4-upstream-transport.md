# Category 4 — Upstream Transportation & Distribution

## 1. Purpose

Category 4 covers transportation and distribution activities occurring upstream of the reporting organization.

The purchased-goods/capital-goods data structures provide land, sea and air logistics fields that can support upstream transport.

## 2. Required transport dimensions

Each logistics leg should support:
- mode,
- vehicle type,
- number of trips,
- origin,
- destination,
- distance,
- weight,
- reporting period,
- supplier,
- reference.

## 3. Application orchestration

```text
Supplier / Purchased Item
 → Transport Leg
   → Mode
     → Vehicle / shipment type
       → Distance
       → Weight
       → Factor
       → CO2e
```

## 4. Calculation

Typical activity-based structure:

```text
tonnes = kg / 1,000

tonne-km = tonnes × distance

CO2e = tonne-km × factor
```

Where a factor is trip-based, use the factor unit supplied by the factor master instead of forcing a tonne-km calculation.

## 5. Land / sea / air

The form must keep modes separate because factors can differ materially.

## 6. Haul / geography

The supplied conversion-factor workbook contains a `Haul definition` table with territory and haul classifications. If the selected factor requires haul classification, the application should derive or request it from origin/destination.

## 7. Boundary exclusions and validation

Category 4 is not a generic bucket for every upstream logistics activity.

Explicitly exclude/reroute:
- transportation between tier-2 and tier-1 suppliers, which is already part of the cradle-to-gate emissions of purchased products and is accounted for in Category 1;
- transportation of fuels and energy consumed by the reporting company, which belongs in Category 3;
- transportation of purchased capital goods where the applicable boundary places the shipment in Category 4, while the embodied capital-good emissions remain in Category 2;
- transportation/distribution of sold products downstream that meets Category 9.

Validation:
- origin and destination cannot be identical when distance is required,
- distance must be positive,
- weight must be positive for mass-distance methods,
- number of trips must be positive,
- mode must be factor-compatible,
- tier/value-chain position must be resolved before category assignment.
