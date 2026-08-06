# CO2 Suite — Enterprise Data Dictionary

## Master & Core Entities Overview

| Entity Name | Bounded Context | Primary Purpose | Ownership & Governance |
| :--- | :--- | :--- | :--- |
| **`MasterItem`** | Master Data Context | Universal reference item for scopes, activity categories, fuels, gases, units, countries, and publishers. | Admin Console (Maker-Checker Approved) |
| **`EmissionFactor`** | Reference Data Context | Core lookup table containing numerical factor rates, priority levels, and geography references. | Reference Data Team |
| **`EmissionFactorGas`** | Reference Data Context | Per-gas species breakdown ($\text{CO}_2, \text{CH}_4, \text{N}_2\text{O}, \text{SF}_6$) tied to GWP versions. | Reference Data Team |
| **`CalculationPolicy`** | Master Data Context | Per-organization calculation defaults (Factor Source, GWP Version, Formula Version). | Tenant Administrator |
| **`CalculationSnapshot`** | Operations Context | Compact immutable record (~80 bytes) storing calculated emission totals for fast reporting queries. | Calculation Engine (Automated) |
| **`CalculationSnapshotDetail`** | Operations Context | Heavy JSONB audit payload storing gas species maps, formula parameters, and SHA-256 legal checksums. | Calculation Engine (Automated) |
| **`ImportJob`** | Operations Context | Bulk ingestion tracker with `idempotencyKey`, retry counters, and Dead Letter Queue (`deadLetterReason`). | Background Queue Workers |
