# Seed Data

Emission factor seed datasets, organized by source publisher.

## Structure

```
seed/
├── IPCC/           # IPCC Assessment Reports (AR4, AR5, AR6, AR7)
├── DEFRA/          # UK DEFRA Conversion Factors (annual editions)
├── EPA/            # US EPA Emission Factors (AP-42, eGRID)
├── eGRID/          # US EPA eGRID Regional Grid Emission Factors
├── CEA/            # India Central Electricity Authority Grid Factors
├── IEA/            # International Energy Agency CO2 Emissions from Fuel Combustion
└── Ecoinvent/      # Ecoinvent Life Cycle Inventory (LCA factors)
```

## Conventions

1. **One file per source + version**: `ar6-factors.ts`, `2024-factors.ts`
2. **Typed `SeedFactor[]` exports**: All seed files export a typed array — no raw SQL
3. **Idempotent**: Seeds use upsert logic keyed on the composite index — safe to re-run
4. **Never modify published entries**: Add a new record or create a revision instead
5. **Version independently**: Each source directory tracks its own versions

## Running Seeds

```bash
# Individual source
npx ts-node seed/IPCC/ar6-factors.ts

# All sources (sequential)
npm run seed

# Specific source group
npm run seed:ipcc
npm run seed:defra
npm run seed:epa
```

## Adding a New Source

1. Create `seed/<SOURCE>/` directory
2. Create `<version>-factors.ts` exporting `SeedFactor[]`
3. Add an npm script in `package.json`
4. Reference the source in `docs/architecture/data-model/emission-factor-sources.md`

## GWP Versioning

All seed records must specify `gwpVersion` per gas value.
This allows the system to serve different CO₂e totals depending on
which IPCC Assessment Report the organization's `CalculationPolicy` selects.

```text
CH₄  AR4 = 25
CH₄  AR5 = 28
CH₄  AR6 = 27.2
```
