# CO2 Suite — Component & Pattern Guidelines

## Standardized Enterprise Component Catalog

### 1. Header & Navigation (`PageHeader`, `MasterSidebar`)
- Sticky top navigation with breadcrumbs and fast actions.
- Collapsible sidebar supporting Linear/Vercel icon-only mode with active indicator highlights.

### 2. Guided Data Entry Wizard (`WizardForm`)
- 5-step horizontal progress tracker with step validation:
  1. `Facility Selection`
  2. `Activity Category`
  3. `Quantity & Unit`
  4. `Proof Upload`
  5. `Review & Submit`

### 3. Calculation Transparency (`AppliedCalculationContextCard`, `CalculationInspectorDrawer`)
- **`AppliedCalculationContextCard`**: Read-only card auto-resolving Factor Source, GWP Version, Priority, and Unit Rate before saving.
- **`CalculationInspectorDrawer`**: Slide-over drawer detailing the complete ISO 14064 calculation traceability graph, resolution steps, per-gas species breakdown, and SHA-256 legal checksum lock.

### 4. Inspector Panels (`MasterDetailDrawer`)
- Persistent 5-tab slide-in Sheet replacing pop-up modals: **Overview**, **Metadata**, **History & Diffs**, **Dependencies**, and **Audit Logs**.

### 5. Status Badges (`StatusBadge`)
- Consistent status badge styling:
  - `Draft`: Neutral grey border & pill
  - `Submitted`: Blue info pill
  - `Approved`: Positive green check pill
  - `Locked`: Slate lock pill
