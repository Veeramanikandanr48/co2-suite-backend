# CO2 Suite — Enterprise API Handbook (`/api/v1/...`)

## Standardized REST Endpoints Catalog

### 1. Master Data API (`/api/v1/master-items`)
- `GET /api/v1/master-items`: List published master taxonomy items with filtering and pagination.
- `POST /api/v1/master-items`: Create new master item (`DRAFT` state).
- `PUT /api/v1/master-items/:id/publish`: Publish master item (triggers `MasterItemPublishedV1Event`).

### 2. Emission Factor API (`/api/v1/emission-factors`)
- `GET /api/v1/emission-factors/resolve`: Sub-millisecond factor lookup endpoint returning derived calculation context.
- `POST /api/v1/emission-factors`: Create custom tenant factor override (`Priority 1` or `Priority 2`).

### 3. Calculation API (`/api/v1/calculations`)
- `POST /api/v1/calculations/preview`: Real-time calculation preview without snapshot persistence.
- `POST /api/v1/calculations/execute`: Execute calculation, generate `CalculationSnapshot` + `SnapshotDetail`, and lock SHA-256 legal checksum.

### 4. Health & Metrics API (`/health`)
- `GET /health/cache`: JSON L1 LRU & L2 Redis cache hit ratio and operational status.
- `GET /health/metrics`: Prometheus metric exporter format.
