# Architecture Documentation

> **Architecture Version:** v1.0  
> **Status:** 🔒 Frozen — Approved for Implementation  
> **Frozen Date:** 2026-08-06  
> **Review Board:** Principal Engineer Architecture Review

---

## Directory Structure

```
docs/architecture/
├── ADR/                  # Architectural Decision Records (ADR-001 → ADR-012 frozen)
├── diagrams/             # System context, component & deployment diagrams
├── data-model/           # Entity relationship diagrams per bounded context
├── api/                  # REST & WebSocket API contracts
├── sequence/             # Calculation flow, factor resolution, snapshot sequence diagrams
├── deployment/           # Infrastructure topology, cloud deployment, scaling
└── decisions.md          # This file — ADR index and governance policy
```

---

## Governance Policy

All future architectural changes **must** follow this process:

1. Open a new ADR file in `ADR/ADR-0XX-title.md`
2. Set status to `Proposed`
3. Get ARB (Architecture Review Board) approval
4. Merge with status `Accepted`
5. Update `decisions.md`

**Prohibited:** Modifying frozen ADRs (ADR-001 → ADR-012) directly.

---

## ADR Index

| ADR | Title | Status |
|---|---|:---:|
| [ADR-001](ADR/ADR-001-master-data-taxonomy.md) | Master Data Taxonomy | 🔒 Frozen |
| [ADR-002](ADR/ADR-002-normalized-emission-factor-model.md) | Normalized Emission Factor Model | 🔒 Frozen |
| [ADR-003](ADR/ADR-003-calculation-policy-engine.md) | Calculation Policy Engine | 🔒 Frozen |
| [ADR-004](ADR/ADR-004-provider-chain.md) | Provider Chain (LRU → Redis → DB) | 🔒 Frozen |
| [ADR-005](ADR/ADR-005-calculation-context.md) | CalculationContext & Dependency Inversion | 🔒 Frozen |
| [ADR-006](ADR/ADR-006-methodology-plugin-framework.md) | Methodology Plugin Framework | 🔒 Frozen |
| [ADR-007](ADR/ADR-007-immutable-calculation-snapshot.md) | Immutable Calculation Snapshot | 🔒 Frozen |
| [ADR-008](ADR/ADR-008-many-to-many-taxonomy.md) | Many-to-Many Taxonomy Mappings | 🔒 Frozen |
| [ADR-009](ADR/ADR-009-bounded-context-isolation.md) | Bounded Context Isolation | 🔒 Frozen |
| [ADR-010](ADR/ADR-010-srp-entity-architecture.md) | SRP Entity Architecture | 🔒 Frozen |
| [ADR-011](ADR/ADR-011-gwp-versioned-gas-values.md) | GWP-Versioned Gas Values | 🔒 Frozen |
| [ADR-012](ADR/ADR-012-formula-revision-pinning.md) | Formula Revision Pinning | 🔒 Frozen |
| ADR-013 | AI-Assisted Data Quality Engine | 📋 Proposed |
| ADR-014 | Supplier Portal & Scope 3 Self-Reporting | 📋 Proposed |
| ADR-015 | IoT Meter Integration & Real-Time Ingestion | 📋 Proposed |
| ADR-016 | Carbon Forecast & Scenario Planning Engine | 📋 Proposed |
| ADR-017 | ERP Connector Framework (SAP, Oracle, Excel) | 📋 Proposed |
| ADR-018 | Multi-Currency CO₂e Financial Reporting | 📋 Proposed |
