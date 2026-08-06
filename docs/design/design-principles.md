# CO2 Suite — Enterprise Product Design System

## Core Design Principles

### 1. Business-First Guidance over Technical CRUD
- Never force operational users to pick raw technical parameters (Factor Source, GWP Version, Formula Revision, Priority).
- Everyday data entry must require only 5 operational business inputs: **Facility $\rightarrow$ Activity Category $\rightarrow$ Fuel Type $\rightarrow$ Measurement Unit $\rightarrow$ Amount & Date**.
- Auto-derived calculation parameters are displayed in a read-only **Applied Calculation Context Card** for transparency.

---

### 2. Linear & Vercel-Inspired Aesthetics
- Clean typography hierarchy (Inter / Outfit / SF Pro).
- Vibrant HSL-tailored dark modes and glassmorphism cards.
- Subdued micro-animations for hover states, modal slide-ins, and drawer transitions.
- High contrast status badges (`Draft`, `Submitted`, `Approved`, `Locked`).

---

### 3. Persona-Oriented Interaction Patterns

| Persona | Primary View | Design Goal |
| :--- | :--- | :--- |
| **Executive (CEO/CSO)** | Executive Dashboard & Command Center | Zero form entries. Pure visual insights: KPIs, reduction progress, MoM trends, report exports. |
| **Operations Manager** | Facility Workspace & Guided Collection | Fast, friction-free data entry, proof attachment, batch review, and instant calculation preview. |
| **ESG Administrator** | Unified Admin Console | Centralized management of taxonomies, emission factors, formula libraries, RBAC, and audit logs. |

---

### 4. Component Layout Patterns

- **3-Panel Layout**: Collapsible Left Sidebar | Center Data Grid / Form | Right Inspector Drawer.
- **Persistent Inspector Drawers**: Replace popup modals with slide-in drawers (`Sheet` component) for detail views and calculation inspection.
- **Global Command Palette**: Keyboard-shortcut driven (`Ctrl + K`) for instant navigation across facilities, activities, and master items.
