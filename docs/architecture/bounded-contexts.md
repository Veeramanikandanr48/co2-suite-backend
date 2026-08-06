# CO2 Suite — Enterprise Bounded Contexts & Domain Architecture

## Bounded Context Isolation (ADR-009)

The platform is structured into four isolated bounded contexts to ensure modularity, maintainability, and domain clarity:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MASTER DATA CONTEXT                                  │
│ Organization • Scope • Activity Category • Fuel Type • Gas Type • Measurement Unit    │
│ Country • Region • Currency • Industry • Factor Source • Factor Version • GWP Version  │
│ Formula Library • Reporting Framework • Data Quality Tiers • Unit Conversion Matrix   │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 REFERENCE DATA CONTEXT                                 │
│                     Emission Factors (Composite Lookup Index)                          │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  OPERATIONS CONTEXT                                    │
│             Suppliers • Audit Evidence • Activity Inventory • Calculations             │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   REPORTING CONTEXT                                    │
│                   Reports • Disclosures • Compliance Exports (XLSX/PDF)               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Domain Taxonomy Hierarchy

1. **Master Data Context**: Shared reference taxonomies across all enterprise tenants.
2. **Reference Data Context**: Normalized emission factors from official publishers (IPCC, DEFRA, EPA, eGRID, CEA).
3. **Operations Context**: Tenant-specific operational data (Facilities, Activity Inventories, Proof Evidence, Supplier Profiles, Calculation Workflows).
4. **Reporting Context**: Read-only Materialized Views serving executive dashboards, GHG Protocol, CSRD ESRS E1, and EU CBAM disclosures.
