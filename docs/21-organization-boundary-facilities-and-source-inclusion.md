# Organization Boundary, Facilities and Source Inclusion

## Purpose
Defines the organizational and operational boundary used before Scope 1, 2 and 3 calculations begin.

## Organization
Store organization identity, reporting period, parent/subsidiary relationships, ownership/control basis and active status.

## Facilities
Each facility should contain:
- facility ID/code
- name
- country/location
- facility type
- ownership/control status
- active period
- reporting inclusion status

## Source inclusion
Every source/category should explicitly be:
- INCLUDED
- EXCLUDED
- NOT_APPLICABLE
- PENDING_REVIEW

## Exclusions
Store exclusion reason, reviewer, review date and supporting reference.

## Boundary control
The system must prevent accidental duplicate treatment of the same activity across Scope 1, Scope 2 and Scope 3.

## Reporting-period rule
Every activity record must belong to the selected inventory period and facility/boundary.

## 8. Required Boundary Decision Matrix

Every emission source must pass a boundary decision before scope/category assignment. The decision record shall include:

| Decision | Required output |
|---|---|
| Ownership/control | In boundary / out of boundary |
| Lease status | Owned / leased-in / leased-out / none |
| Operational control | Yes / No / Not applicable |
| Financial control | Yes / No / Not applicable |
| Equity share | Percentage where applicable |
| Value-chain position | Upstream / operations / downstream |
| Scope/category | Final classification |
| Double-count check | Pass / Review / Fail |

The application must never assign a Scope 3 category before this decision is complete.

