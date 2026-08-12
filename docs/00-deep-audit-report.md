# ESG / GHG Scope 1, 2 and 3 — Deep Audit Report

## Audit date
2026-08-11

## Executive verdict

**Result: SUBSTANTIALLY CORRECT, BUT NOT YET SAFE TO LABEL 100% PRODUCTION/ASSURANCE-READY WITHOUT THE SOURCE FACTOR FILES.**

The 25 Markdown documents have a strong GHG Protocol-oriented architecture and correctly cover Scope 1, Scope 2, all 15 current Scope 3 categories, organizational boundaries, calculation, factor/GWP governance, validation, audit trails, and reporting.

The deep review found several important items that required correction or stronger wording. These have been patched in the audited ZIP.

## High-priority findings fixed

1. **Scope 3 Category 1 hybrid method**
   - The previous wording blurred the official hybrid method with generic combinations of spend/average/activity methods.
   - Corrected to distinguish supplier-specific, hybrid, average-data/physical-data, and spend-based methods.

2. **Scope 3 Category 4 boundary**
   - Added explicit exclusions for tier-2 → tier-1 transport and other boundary cases.
   - Category 4 is not a generic upstream-logistics bucket.

3. **Scope 3 Category 5 waste**
   - Added third-party treatment boundary, optional waste transportation treatment, and waste-to-energy double-count controls.

4. **Scope 3 Category 7 teleworking**
   - Clarified that teleworking is an optional Category 7 component, not a new Scope 3 category.

5. **Scope 3 Category 15**
   - Updated the implementation note to the current PCAF Part A 3rd edition (2025) and required versioned investment methodologies.

6. **Emission-factor governance**
   - Added a hard control that the supplied 2025 UK factor workbook cannot be treated as a universal 2026/global factor set.
   - Geography and applicability year must drive factor resolution.
   - India-specific electricity should support the latest applicable CEA database.

7. **Scope 2 reporting total**
   - Corrected reconciliation logic so location-based and market-based Scope 2 values are not added together.
   - The official total must select one Scope 2 reporting basis.

## Standards/status checks

### GHG Protocol
The current Corporate Standard, Scope 2 Guidance and Scope 3 Standard remain the operative baseline while revisions are under development.

GHG Protocol's July 29, 2026 announcement states that it is moving toward a consolidated GHGP/ISO corporate accounting standard, with a consolidated public consultation planned for Q2 2027 and publication of the consolidated joint corporate standard planned for Q4 2028. Therefore, draft 2025-2026 proposals must not silently replace the current standards.

### Scope 2
The existing framework supports location-based and market-based accounting where applicable. The documentation correctly preserves dual-reporting architecture and avoids treating the two methods as additive.

### Scope 3
The archive correctly contains all 15 current Scope 3 categories.

### GWP
The GHG Protocol's August 2024 GWP document provides 100-year values from IPCC AR6 and recommends the latest values. It also explicitly distinguishes fossil and non-fossil methane. The documentation's combustion/non-fossil methane treatment is consistent with that source.

### PCAF
For Category 15 where applicable, the current PCAF official resource lists Part A — Financed Emissions, 3rd edition (2025). Investment-type-specific attribution must therefore be versioned rather than implemented as one generic ownership formula.

### India electricity
The Central Electricity Authority currently publishes a CO2 Baseline Database, with Version 21.0 listed on its official site. An India deployment should resolve electricity factors against the applicable CEA release rather than defaulting to a UK factor.

## What cannot be numerically certified from this ZIP

The ZIP contains 25 Markdown files and a manifest, but it does **not** contain the referenced:
- GHG Data Collection workbook,
- Store Makers calculation workbook,
- 2025 conversion-factor workbook,
- August 2024 GWP PDF,
- older GWP PDF.

Therefore this audit verifies the **methodology and application specification**, but it cannot certify that every numeric emission factor, factor unit, source row, spreadsheet formula, or GWP value in the missing source files is numerically correct.

## Structural observation

The Markdown files are not all 500+ lines. Several are substantially shorter. This is a documentation-length issue, not automatically a GHG methodology error. If the project requirement is that every file must contain at least 500 lines, the archive still needs expansion.

## Production-readiness checklist

- [x] 25 Markdown files
- [x] Scope 1 coverage
- [x] Scope 2 coverage
- [x] All 15 Scope 3 categories
- [x] Organizational boundary
- [x] Calculation engine concepts
- [x] Factor/GWP versioning
- [x] Validation/approval/audit concepts
- [x] Scope 2 dual-method architecture
- [x] Category 1 hybrid-method clarification
- [x] Category 4 boundary clarification
- [x] Category 5 waste boundary clarification
- [x] Category 7 teleworking clarification
- [x] Category 15 PCAF-version clarification
- [x] Scope 2 reconciliation correction
- [x] Geography/year-aware factor governance
- [ ] Numeric factor certification from original source files
- [ ] Formula-by-formula validation against original workbooks
- [ ] Full 500+ line requirement, if required by project specification

## Final conclusion

The corrected documentation is **methodologically strong and substantially aligned with the current GHG Protocol framework**, but it should be called **audited/corrected methodology documentation**, not a fully certified emission-factor library.

For a final numeric certification, the original referenced Excel/PDF source files must be supplied alongside this documentation so every factor, unit, formula, and source citation can be checked row-by-row.
