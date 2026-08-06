# CO2 Suite — Architectural Decision Record (ADR) Governance & Lifecycle

## ADR Lifecycle Status Tracking

| ADR | Title | Status | Decision Summary |
| :--- | :--- | :---: | :--- |
| **ADR-001** | **Master Data Taxonomy** | 🔒 Implemented | Standardized taxonomy across GHG Scope, Activity Category, Fuel, Unit, Factor Source. |
| **ADR-002** | **Normalized Emission Factor Model** | 🔒 Implemented | Pure Foreign Keys to MasterItems with `decimal(18,8)` precision and composite priority index. |
| **ADR-003** | **Calculation Policy Engine** | 🔒 Implemented | Per-organization policy binding default factor sets, GWP versions, and formula versions. |
| **ADR-004** | **Provider Chain** | 🔒 Implemented | Multi-tier factor retrieval strategy (`Memory LRU` → `Redis` → `Database Index-Only Scan`). |
| **ADR-005** | **CalculationContext** | 🔒 Implemented | Dependency Inversion via context injection (`factorProvider`, `unitConverter`, `gwpProvider`). |
| **ADR-006** | **Methodology Plugin Framework** | 🔒 Implemented | Open `IMethodologyPlugin` interface enabling zero-core-code extensions. |
| **ADR-007** | **Immutable Calculation Snapshot** | 🔒 Implemented | Compact `CalculationSnapshot` + `CalculationSnapshotDetail` with SHA-256 legal checksum lock. |
| **ADR-008** | **Many-to-Many Taxonomy** | 🔒 Implemented | Decoupled mapping tables (`ActivityCategoryFuelType`, `FuelTypeMeasurementUnit`). |
| **ADR-009** | **Bounded Context Isolation** | 🔒 Implemented | Supplier & Audit Evidence are Operations context entities, NOT Master Data. |
| **ADR-010** | **SRP Entity Architecture** | 🔒 Implemented | `EmissionFactor` hot lookup table with offloaded `EmissionFactorGas` and `Metadata`. |
| **ADR-011** | **GWP-Versioned Gas Values** | 🔒 Implemented | `EmissionFactorGas` stores `gwpVersionId` allowing AR4/AR5/AR6/AR7 GWP multipliers per gas. |
| **ADR-012** | **Formula Revision Pinning** | 🔒 Implemented | Calculations pin to `formulaRevisionId`, never to mutable formula records. |
| **ADR-013** | **Inventory Approval Workflow** | 🔒 Implemented | Multi-stage lifecycle (`DRAFT` → `SUBMITTED` → `APPROVED` → `LOCKED`). |
| **ADR-014** | **Pre-Calculation Validation Engine** | 🔒 Implemented | Automated validation checking duplicate detection, unit dimension rules, negative amounts. |
| **ADR-015** | **Physical Unit Conversion Matrix** | 🔒 Implemented | Automated unit dimension solver (Mass $\rightleftharpoons$ Volume via Density, Energy $\rightleftharpoons$ Mass via NCV/GCV). |
| **ADR-016** | **Facility Completeness Scoring** | 🔒 Implemented | Real-time 0-100% completeness metrics per facility. |
| **ADR-017** | **Reporting Period Freeze** | 🔒 Implemented | Open $\rightarrow$ Closed $\rightarrow$ Frozen period lock with adjustment journal entries. |
| **ADR-018** | **Materialized Reporting Warehouse** | 🔒 Implemented | Read-only PostgreSQL Materialized Views built from `CalculationSnapshot`. |

---

## ADR Status Lifecycle Definitions

- **Proposed**: Under initial architecture review.
- **Accepted**: Approved by Architecture Review Board (ARB).
- **Implemented**: Code implemented, verified, and committed.
- **Deprecated**: Superseded by a newer ADR.
- **Archived**: Historical reference only.
