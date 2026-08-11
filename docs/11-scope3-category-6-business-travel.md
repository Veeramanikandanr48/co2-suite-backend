# Category 6 — Business Travel

## 1. Purpose

Category 6 covers business travel undertaken by employees or representatives.

The source workbook provides:
- `S3 - Business Travel - Air`
- `S3 - Business Travel-Land & Sea`

It also includes hotel accommodation in the air-travel sheet.

## 2. Air fields

- Passenger name
- Flight
- Flight class
- Origin
- Destination
- One-way / two-way
- Number of trips
- Responsible person

Hotel fields:
- Country
- Person
- Nights
- Rooms
- Cost
- Reference
- Responsible person

## 3. Land and sea fields

- Passenger
- Mode
- Transport category
- Transport sub-category
- Fuel type
- Origin
- Destination
- Cost
- Reference
- Responsible person

## 4. Calculation methods

Air travel can be calculated using a flight-distance/class factor where available.

Land/sea travel can use:
- distance-based activity,
- fuel-based activity,
- spend-based method,
depending on the selected factor.

Hotel:

```text
Room nights × hotel factor
```

if the factor is expressed per room-night.

## 5. Flight handling

The application should normalize:
- one-way vs round trip,
- passenger count,
- flight segment,
- cabin/class.

Do not multiply a round-trip record twice if the selected factor already represents a round trip.

## 6. Evidence

- ticket,
- travel booking,
- expense claim,
- travel management report,
- hotel invoice.

## 7. Validation

Origin and destination are required for distance/route methods. Flight class is required when the factor varies by class.

## 8. Methodology Corrections

### 8.1 Business travel boundary

Category 6 covers transportation of employees for business-related activities in vehicles not owned or operated by the reporting organization, plus relevant accommodation and related travel activities under the selected Scope 3 methodology. Travel in company-owned/controlled vehicles belongs to the applicable Scope 1 boundary instead.

### 8.2 Air travel

The calculation model shall distinguish flight segment, origin, destination, distance basis, passenger count, cabin class and one-way/round-trip status. The engine must know whether a factor is already expressed per passenger-trip, passenger-km, route or another basis.

### 8.3 Hotel accommodation

Hotel accommodation may be calculated when the selected methodology/factor supports it. Store room nights, rooms, country/region, factor basis and source. Cost should be used only when the selected method is spend-based.

### 8.4 Radiative forcing and distance uplift

If an approved factor set includes a distance uplift, radiative-forcing treatment or other aviation-specific adjustment, the application must apply it only once and must store the factor methodology. Do not apply a generic uplift independently when the selected factor already contains it.

