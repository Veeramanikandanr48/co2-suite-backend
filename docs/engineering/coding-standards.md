# Coding Standards — CO₂ Suite Backend

> **Version:** 1.0 · Frozen alongside Architecture v1.0  
> **Applies to:** All TypeScript in `cobe/` and `cofe/`  
> These standards complement the [ADR governance policy](../architecture/decisions.md).  
> Deviations require a team discussion and an update to this document.

---

## 1. Layering Rules

The most important rules. Violations cause architectural drift.

| Rule | Rationale |
|---|---|
| **Repositories contain zero business logic** | Repos are data-access only. Business rules belong in Services. |
| **Services never access Redis directly** | All caching goes through `IFactorProvider` or a dedicated Cache Service. Direct `redis.get()` in a Service is a boundary violation. |
| **Factor resolution only through `IFactorResolver`** | Never query `emission_factors` table directly from a Service. All resolution goes through the provider chain. |
| **Controllers are thin** | Controllers validate input (DTO), call one Service method, return the result. No business logic, no DB calls, no cache calls. |
| **No raw SQL inside controllers or services** | Use TypeORM QueryBuilder or Repository methods. Raw SQL only in migrations. |
| **All architecture changes require an ADR** | Opening a PR that changes bounded context boundaries, entity SRP, or the provider chain without a matching ADR will be rejected in review. |

---

## 2. Naming Conventions

### Files
```
user.entity.ts          ← entities
user.repository.ts      ← repositories
user.service.ts         ← services
user.controller.ts      ← controllers
user.module.ts          ← modules
create-user.dto.ts      ← DTOs (prefixed with action)
user-response.dto.ts    ← response DTOs
```

### Classes
```ts
export class EmissionFactor { }            // Entity — noun only
export class EmissionFactorRepository { }  // Repository suffix
export class EmissionFactorService { }     // Service suffix
export class EmissionFactorController { }  // Controller suffix
export class CreateEmissionFactorDto { }   // DTO — action + noun + Dto
export class EmissionFactorResponseDto { } // Response DTO
```

### Variables & Methods
```ts
// ✅ Descriptive, intention-revealing names
const totalEmissionFactor = await this.resolver.resolve(key);
async findByCompositeKey(key: FactorLookupKey): Promise<EmissionFactor | null>

// ❌ Abbreviations that hide intent
const ef = await this.r.find(k);
```

### Constants
```ts
const MAX_RETRY_ATTEMPTS = 3;       // UPPER_SNAKE_CASE
const CACHE_TTL_SECONDS = 300;
```

---

## 3. TypeScript Standards

```ts
// ✅ Strict types — never `any`
async resolve(key: FactorLookupKey): Promise<EmissionFactor | null>

// ✅ Explicit return types on all exported functions
export function buildCompositeKey(key: FactorLookupKey): string { ... }

// ✅ Readonly where appropriate
readonly organizationId: number;

// ✅ Discriminated unions for state
type FactorResult =
  | { found: true; factor: EmissionFactor; source: 'memory' | 'redis' | 'db' }
  | { found: false; reason: string };

// ❌ Never use `any` — use `unknown` and narrow
function parse(input: unknown): EmissionFactor { ... }
```

---

## 4. Error Handling

```ts
// ✅ Use NestJS built-in exceptions in controllers/services
throw new NotFoundException(`EmissionFactor not found for key: ${JSON.stringify(key)}`);
throw new BadRequestException('effectiveFrom must be a valid ISO date');

// ✅ Wrap external calls (Redis, 3rd-party APIs) in try/catch and log
try {
  return await this.redis.get(cacheKey);
} catch (err: unknown) {
  this.logger.warn('Redis cache miss (connection error), falling through to DB', { err });
  return null;
}

// ❌ Never swallow errors silently
try { ... } catch { }  // ← PROHIBITED
```

---

## 5. Dependency Injection

```ts
// ✅ Always inject via constructor — never use `new`
constructor(
  @InjectRepository(EmissionFactor)
  private readonly efRepo: Repository<EmissionFactor>,
  private readonly factorResolver: IFactorResolver,
  private readonly logger: Logger,
) {}

// ❌ Never instantiate services directly inside other services
this.service = new EmissionFactorService();  // ← PROHIBITED
```

---

## 6. Database Rules

```ts
// ✅ Use transactions for multi-step writes
await this.dataSource.transaction(async (manager) => {
  await manager.save(factor);
  await manager.save(metadata);
  await manager.save(revision);
});

// ✅ Always use parameterized queries in QueryBuilder
.where('ef.organizationId = :orgId', { orgId })

// ❌ Never concatenate user input into queries
.where(`ef.organizationId = ${req.user.orgId}`)  // ← SQL INJECTION

// ✅ Avoid N+1 — use eager relations or explicit joins
.leftJoinAndSelect('ef.scopeItem', 'scope')
```

---

## 7. Logging

```ts
// ✅ Use NestJS Logger — no console.log in production code
private readonly logger = new Logger(EmissionFactorService.name);

this.logger.log('Factor resolved', { key, source: 'redis', latencyMs });
this.logger.warn('Factor not found, using global default', { key });
this.logger.error('Calculation failed', { err, entryId });

// ❌ console.log is prohibited in non-benchmark, non-seed code
console.log(factor);  // ← PROHIBITED
```

---

## 8. DTO Validation

```ts
// ✅ Every DTO uses class-validator decorators
export class CreateEmissionFactorDto {
  @IsInt()
  @Min(1)
  scopeId: number;

  @IsDecimal({ decimal_digits: '1,8' })
  totalEmissionFactor: number;

  @IsISO8601()
  effectiveFrom: string;

  @IsOptional()
  @IsISO8601()
  effectiveTo?: string;
}
```

---

## 9. Calculation Engine Rules

- **Never call the calculation engine from a controller directly** — use a queue/job
- **Always pin `formulaRevisionId`**, never resolve formula at runtime from a mutable relation
- **Every calculation must produce a `CalculationSnapshot`** with a valid `checksum`
- **Snapshots are append-only** — never update a completed snapshot
- **GWP multipliers must come from `EmissionFactorGas.gwpVersionId`** — never hardcode `{ CH4: 27.2 }`

---

## 10. Git & PR Standards

```bash
# Conventional commit format
feat(emission-factor): add DEFRA 2024 seed loader
fix(resolver): handle null regionId in composite key
perf(cache): increase LRU capacity to 50k entries
docs(adr): add ADR-013 AI data quality engine
test(calculation): add integration test for CH4 GWP AR6 path
```

**PR Requirements:**
- Passes all linting (`eslint --max-warnings 0`)
- Unit tests pass
- No `console.log` in changed files
- If schema changed: migration file included
- If performance-sensitive path changed: benchmark results attached to PR description
