# Scope 2 — Purchased Electricity, Steam, Heating and Cooling

## 1. Scope

Scope 2 represents purchased energy inputs. The collection workbook explicitly provides a purchased-electricity form and includes placeholders in the reporting index for:
- purchased electricity,
- purchased steam,
- purchased heating and cooling.

The application must keep these as separate source types because their activity units and factors can differ.

---

## 2. Purchased Electricity

### Source fields

The collection workbook provides three electricity input blocks:
- Electricity purchased from grid.
- Electricity from solar.
- Electricity from wind.

For grid electricity the fields are:

| Field | Description |
|---|---|
| Month / Year | Consumption period |
| Electricity (kWh) | Meter/invoice consumption |
| Cost | Financial value |
| Reference No | Invoice/source reference |
| Responsible person | Data owner |

The calculation workbook additionally demonstrates:
- account number,
- invoice number,
- adjusted kWh,
- emission factor in tCO2e/MWh,
- emission-source reference.

## 3. Calculation

If factor is `tCO2e/MWh`:

```text
MWh = kWh / 1,000
tCO2e = MWh × factor
```

If factor is `kgCO2e/kWh`:

```text
kgCO2e = kWh × factor
tCO2e = kgCO2e / 1,000
```

The factor unit must be part of the factor record so the calculation engine never guesses the denominator.

## 4. Adjusted consumption

The Store Makers workbook contains an `Adjusted kWh` column and uses it in the emissions formula.

The application should therefore support:
- measured consumption,
- adjusted consumption,
- adjustment reason,
- adjustment method,
- source evidence.

Adjustment should never overwrite the original meter/invoice quantity.

## 5. Renewable electricity

Solar and wind inputs should be captured separately from grid electricity.

Minimum fields:
- month/year,
- electricity kWh,
- source type,
- reference,
- responsible person,
- ownership/contractual basis where required by the reporting methodology.

The application should retain the original electricity quantity even when a reporting calculation assigns a different factor.

## 6. Purchased steam

Suggested fields:
- month,
- steam quantity,
- unit,
- supplier,
- site/facility,
- cost,
- reference,
- factor,
- factor source.

## 7. Purchased heating/cooling

Suggested fields:
- month,
- energy quantity,
- unit,
- energy type,
- supplier,
- facility,
- factor,
- evidence.

## 8. Factor management

The supplied 2025 conversion-factor workbook includes separate sheets for:
- UK electricity,
- overseas electricity,
- heat and steam,
- transmission and distribution,
- WTT electricity,
- WTT heat and steam.

These are source-specific and geography-sensitive. They must not be treated as one universal electricity factor table. For a reporting period in 2026, the factor resolver should prefer the latest approved factor set applicable to the reporting geography; older 2025 factors should remain available only when the reporting methodology explicitly requires that vintage.

## 9. Scope 2 record status

```text
Draft
 → Data Submitted
 → Validated
 → Calculation Complete
 → Approved
```

Changes after approval should create a new calculation version.

## 10. Required Scope 2 Dual-Method Architecture

### 10.1 Current applicable framework

The current GHG Protocol Scope 2 Guidance covers purchased or acquired electricity, steam, heat and cooling. It includes requirements for contractual instruments used in market-based accounting. The GHG Protocol is also revising the Scope 2 Guidance; the revision proposals discussed during 2025–2026 are not yet a replacement standard. The application must therefore version its Scope 2 methodology rather than hard-code draft proposals as current requirements.

### 10.2 Location-based method

The application shall support location-based Scope 2 accounting using applicable average grid/location emission factors. Store:
- geographic boundary,
- factor source,
- factor year,
- electricity quantity,
- factor unit,
- calculation version.

### 10.3 Market-based method

Where the applicable market provides contractual instruments or supplier-specific data, the application shall support market-based accounting. The factor record must identify the instrument/data type and its eligibility under the applicable Scope 2 quality criteria.

Supported data structures should include, as applicable:
- supplier-specific emission factor,
- contractual instrument,
- energy attribute certificate,
- power purchase agreement,
- supplier product,
- residual mix or other applicable market factor.

The system must retain certificate/instrument identifiers, quantity, vintage, market boundary, matching information and evidence where applicable.

### 10.4 Dual reporting

For organizations to which the Scope 2 Guidance dual-reporting requirement applies, the inventory shall produce both:

```text
Scope 2 Location-Based
Scope 2 Market-Based
```

They must not be summed together. The reporting layer shall label them clearly.

### 10.5 Renewable electricity

On-site generation, purchased renewable electricity and contractual renewable attributes are different concepts. The application must capture ownership/contractual rights and avoid granting renewable attributes to more than one reporting entity.

### 10.6 Transmission and distribution

T&D losses are not Scope 2 merely because electricity was purchased. Where the selected Scope 3 methodology includes upstream transmission/distribution emissions, the applicable activity and factor must be recorded separately from Scope 2.

### 10.7 Draft-revision protection

Do not implement proposed 2025–2026 Scope 2 revision rules as mandatory production rules until GHG Protocol publishes the final revised standard. Store a `methodology_status` such as `CURRENT_STANDARD`, `DRAFT_PROPOSAL`, or `CUSTOM_APPROVED`.

