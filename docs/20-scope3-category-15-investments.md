# Category 15 — Investments

## 1. Purpose

Category 15 captures financed/investment-related emissions associated with the reporting organization's investments.

The collection workbook separates:
- Equity
- Project finance and debt investments

## 2. Equity fields

The workbook contains:
- Investee company
- Investee company's sector(s) of operation
- Investee company's revenue
- Investee company's revenue in sector (%)
- Reporting company's share of equity (%)

## 3. Project finance / debt fields

The workbook contains:
- Type of project
- Project phase
- Project construction cost or project revenue in reporting year
- Share of total project costs (%)

## 4. Application model

```text
Investment
 ├── investment type
 ├── investee/project
 ├── sector
 ├── financial metric
 ├── ownership/share percentage
 ├── reporting period
 ├── emissions data
 ├── factor/methodology
 └── evidence
```

## 5. Calculation orchestration

The application should first identify the investment methodology.

Then resolve the required financial/emissions metric.

Conceptually:

```text
Attributable activity =
Underlying emissions/activity × reporting organization's attributable share
```

The exact factor and denominator must come from the selected investment methodology/factor record.

## 6. Sector allocation

Where the source workbook provides investee revenue by sector, the application should retain:
- total revenue,
- sector revenue percentage,
- selected sector,
- attribution percentage.

This allows sector-specific allocation without overwriting the underlying financial data.

## 7. Project finance

For project finance, retain:
- project type,
- project phase,
- project construction cost or revenue,
- share of project cost.

These fields must remain separate from equity ownership.

## 8. Validation

- investment type required,
- reporting period required,
- attributable share must be valid,
- financial metric must be positive where required,
- project phase required for project-finance records,
- supporting financial/project evidence required.

## 9. Audit requirements

Investment calculations require especially strong lineage because the result may depend on:
- investee data,
- financial data,
- ownership,
- sector allocation,
- project phase,
- factor version.

All of these should be versioned.

## 10. Critical Category 15 Correction

Category 15 is methodology-sensitive and is an area of active GHG Protocol development. The current application must implement the currently applicable Scope 3 Standard methodology while keeping the calculation engine versioned so future revisions can be introduced without rewriting historical calculations.

### 10.1 Investment types

The model shall distinguish at minimum:
- listed equity,
- unlisted/private equity,
- corporate debt/bonds,
- business loans/project finance where applicable,
- other supported investment types only when an approved methodology exists.

Do not use one equity-ownership formula for every investment type.

### 10.2 Financed-emissions methodology

For financial institutions and investment portfolios, the application should support the applicable PCAF-aligned financed-emissions methodology.

PCAF's current official resource lists Part A — Financed Emissions, 3rd edition (2025). The GHG Protocol recognizes PCAF's standard as conforming with the requirements of the Scope 3 Standard for Category 15 investment activities.

Do not hard-code the older six-asset-class PCAF edition. Store the PCAF edition/version as part of the methodology record and map each investment type to its specific attribution method.

### 10.3 Attribution

Attribution depends on asset/investment type and the selected methodology. A generic `share_of_equity` field is insufficient for all debt/project-finance cases. Store:
- attribution metric,
- numerator,
- denominator,
- attribution percentage,
- source,
- date/version.

### 10.4 Investee emissions

Where investee-reported emissions are used, retain the investee reporting period, Scope 1/2/3 coverage, assurance status where available, source and data quality.

### 10.5 Sector allocation

Revenue-by-sector allocation may be used only when the selected method calls for it. Sector allocation must not be treated as equivalent to ownership attribution. Store them as separate dimensions.

### 10.6 Project finance

Project-finance calculations require methodology-specific attribution. Construction cost, project revenue and ownership/share-of-financing data must not be substituted for one another without an explicit method.

### 10.7 Future-standard protection

GHG Protocol has published draft/revision materials for Category 15. These are not current requirements. Mark draft methods as `DRAFT_PROPOSAL` and keep them disabled for production unless explicitly enabled by an approved methodology version.

