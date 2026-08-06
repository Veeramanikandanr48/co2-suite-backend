# CO2 Suite — C4 Model System Architecture

## Level 1: System Context Diagram

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ENTERPRISE USER                                      │
│           (Executive • Operations Manager • ESG Auditor • System Admin)                │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CO2 SUITE ESG PLATFORM                                    │
│  Guided Workspaces • Factor Resolver • Calculation Engine • Compliance Reporting       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                EXTERNAL DATA SOURCES                                   │
│            IPCC • DEFRA • US EPA • CEA India • ERP Connectors (SAP/Oracle)             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Level 2: Container Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS FRONTEND SPA / WORKSPACE (`co2-suite-frontend`)              │
│        Command Center • Executive Dashboard • Operations Form • Admin Console          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST API / WebSocket
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    NESTJS BACKEND CORE API (`co2-suite-backend`)                       │
│    MasterModule • FactorResolverModule • CalculationModule • ReportingModule          │
└──────────────┬────────────────────────────┬────────────────────────────┬───────────────┘
               │                            │                            │
               ▼                            ▼                            ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│   L1 LRU / L2 REDIS      │ │   POSTGRESQL DATABASE    │ │   BULLMQ WORKER QUEUE    │
│  Fast Factor Cache MGET  │ │  Snapshots & Taxonomies  │ │  Async Batch Engine      │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```
