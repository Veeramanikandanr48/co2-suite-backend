# CO2 Suite — Quality Engineering & Definition of Done

## Golden Engineering Rule

> **Architecture v1.0 is Frozen.**
> From this point onward, architecture changes only occur when a validated business requirement cannot be met by the current design. Otherwise, engineering effort goes into product quality, user experience, integrations, testing, and customer value.

---

## Definition of Done (DoD) Checklist

Every product feature, workspace enhancement, or API endpoint must satisfy the following criteria before merging into main:

### 1. Functional & Business Workflow
- [ ] End-to-end user journey succeeds without manual intervention or unexpected pop-ups.
- [ ] Responsive design verified on desktop, tablet, and mobile breakpoints.
- [ ] Accessible keyboard navigation (`Ctrl + K`, tab index, aria-labels) and WCAG AA compliance.

### 2. Quality & Automated Testing
- [ ] **Unit Tests**: Strategy calculation, physical unit conversion matrix, and factor resolution logic tested (`npm run test`).
- [ ] **Integration Tests**: API endpoints (`/api/v1/...`) and event invalidation verified with clean database state.
- [ ] **End-to-End Tests**: Playwright automated UI tests passing for complete business journeys.
- [ ] **Performance SLAs**: Factor resolution sub-millisecond response times verified against production benchmark suite.

### 3. Governance & Audit Integrity
- [ ] Immutable snapshot SHA-256 legal checksum lock verified.
- [ ] Fine-grained RBAC permission tokens (`permissions.enum.ts`) enforced.
- [ ] Role-focused documentation in `docs/` updated if API contracts change.
