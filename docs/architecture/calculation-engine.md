# CO2 Suite — High-Performance Calculation Engine & Factor Resolution

## Provider Chain Architecture (ADR-004)

Factor resolution follows a 3-tier caching hierarchy backed by `SingleFlightGroup` thundering herd protection:

$$\text{SingleFlight Protection} \longrightarrow \text{L1 LRU Memory Cache} \longrightarrow \text{L2 Redis MGET} \longrightarrow \text{L3 PostgreSQL Index Scan}$$

```text
Priority Cascading Resolution Order:
• Priority 1: Facility / Direct Meter Override
• Priority 2: Supplier-Specific Scope 3 Declaration
• Priority 3: Regional Grid / Subregion Factor
• Priority 4: National / Country Factor
• Priority 5: Global IPCC Default Factor
```

---

## Immutable Audit Snapshots (ADR-007)

1. **`CalculationSnapshot`**: Compact row (~80 bytes) containing primary totals (`totalCO2e`, `amount`, `unit`, `calculatedAt`) for fast aggregation queries across millions of records.
2. **`CalculationSnapshotDetail`**: Offloaded detail row containing JSONB per-gas species breakdown ($\text{CO}_2, \text{CH}_4, \text{N}_2\text{O}, \text{SF}_6$), raw formula parameters, GWP multiplier maps, and a **SHA-256 Legal Checksum** for ISO 14064 compliance.
