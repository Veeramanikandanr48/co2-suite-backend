# Validation, Approval and Audit Workflow

## Workflow

```text
Draft
  ↓
Submitted
  ↓
Validated
  ↓
Calculation Complete
  ↓
Approved
```

Rejected records return to the data owner with a reason.

## Validation levels

### Field validation
Required fields, valid units, numeric ranges and date validation.

### Business validation
Fuel/source compatibility, factor availability, treatment method compatibility, ownership/boundary checks and duplicate detection.

### Calculation validation
Verify factor, unit conversion, gas treatment, GWP set and formula.

### Review validation
Evidence, reference number and responsible person must be available before approval.

## Approval

Approved records become immutable for normal users.

Any post-approval correction should create:
- new version,
- change reason,
- changed-by user,
- timestamp,
- previous result,
- new result.

## Audit trail

The audit record should link:

`Organization → Activity → Evidence → Factor → GWP → Calculation Run → Validation → Approval`.

## Evidence

Examples:
- invoices
- purchase orders
- utility bills
- meter records
- travel records
- supplier data
- waste records
- lease records
- investment records.

## Reconciliation

The application should reconcile category totals to:
- facility totals,
- Scope totals,
- organization total,
- reporting-period total.

## 9. Mandatory Validation Controls

### 9.1 Validation layers

1. Schema validation.
2. Unit validation.
3. Boundary validation.
4. Factor compatibility validation.
5. GWP validation.
6. Range/outlier validation.
7. Double-count validation.
8. Evidence validation.
9. Methodology/version validation.

### 9.2 Approval immutability

An approved calculation must be immutable. Corrections create a new version linked to the previous version.

### 9.3 Evidence

Evidence should be linked to the exact activity record and not only to the organization/reporting period.

### 9.4 Review triggers

Mandatory review should be triggered for:
- missing factor,
- fallback factor,
- estimated activity above configured materiality,
- unusual year-over-year change,
- boundary change,
- methodology change,
- post-approval correction,
- duplicate source detected.

