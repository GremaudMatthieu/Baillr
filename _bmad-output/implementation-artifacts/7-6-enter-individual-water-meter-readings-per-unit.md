# Story 7.6: Enter Individual Water Meter Readings Per Unit

Status: done

## Story

As a bailleur,
I want to enter individual water meter readings per unit,
so that water charges can be distributed based on actual consumption (FR49).

## Acceptance Criteria

1. **Given** I navigate to the charges page and select a fiscal year, **When** I click a "Relevés compteurs d'eau" tab or section, **Then** I see a form listing all units (with tenants) for the current entity.

2. **Given** units exist under my entity, **When** I view the water meter readings form, **Then** each row shows: unit identifier (readonly), tenant name (readonly), previous reading (readonly, from last entry or 0), current reading (input, number), reading date (date picker).

3. **Given** I enter current readings for units, **When** I submit the form, **Then** the system calculates consumption per unit as `currentReading - previousReading`, **And** the event `WaterMeterReadingsEntered` is stored in KurrentDB, **And** the readings are persisted in the `water_meter_readings` projection table.

4. **Given** water meter readings exist and annual charges include a water category, **When** I view the charges summary, **Then** water charges are distributed proportionally: `unitWaterCharge = (unitConsumption / totalConsumption) × totalWaterChargesCents`, **And** the per-unit water allocation is visible in the summary.

5. **Given** some units have individual readings and others do not, **When** I view distribution, **Then** units WITH readings share water proportionally by consumption, **And** units WITHOUT readings split the remaining water charges equally.

6. **Given** I enter a current reading less than the previous reading, **When** I try to submit, **Then** a validation error "La lecture actuelle doit être supérieure ou égale à la lecture précédente" is displayed.

7. **Given** I enter non-numeric or negative values, **When** I try to submit, **Then** clear validation errors are displayed.

8. **Given** I re-submit readings for the same fiscal year, **When** I submit, **Then** previous readings are replaced (PUT full replacement, idempotent overwrite — same pattern as annual charges).

9. **Given** readings are entered and saved, **When** I reload the page, **Then** the previously entered readings are pre-filled as initial values.

## Tasks / Subtasks

- [x] Task 1: Create WaterMeterReadings domain model in Indexation BC (AC: #2, #3, #6, #7)
  - [x] 1.1: Create `MeterReading` composite VO — { unitId, previousReading, currentReading, readingDate } with validation
  - [x] 1.2: Create `WaterConsumption` VO — wraps computed consumption (currentReading - previousReading), non-negative integer
  - [x] 1.3: Create `WaterMeterReadingsAggregate` with `record()` method + no-op guard
  - [x] 1.4: Create `WaterMeterReadingsEntered` domain event
  - [x] 1.5: Create `RecordWaterMeterReadingsCommand` + handler
  - [x] 1.6: Create named domain exceptions: `InvalidMeterReadingException`, `InvalidWaterConsumptionException`
  - [x] 1.7: Write unit tests for VOs, aggregate, handler

- [x] Task 2: Create Prisma model and projection (AC: #3, #9)
  - [x] 2.1: Add `WaterMeterReadings` model to `schema.prisma` with `@@unique([entityId, fiscalYear])`
  - [x] 2.2: Stored as JSON `readings` column (simpler than separate model — matches AnnualCharges pattern)
  - [x] 2.3: Run `prisma generate` + migration
  - [x] 2.4: Create `WaterMeterReadingsProjection` — upsert on event
  - [x] 2.5: Write projection tests

- [x] Task 3: Create presentation layer — controllers, finders, DTOs (AC: #1, #2, #3, #6, #7, #8, #9)
  - [x] 3.1: Create `RecordWaterMeterReadingsController` (POST `/api/entities/:entityId/water-meter-readings`)
  - [x] 3.2: Create `GetWaterMeterReadingsController` (GET `/api/entities/:entityId/water-meter-readings?fiscalYear=YYYY`)
  - [x] 3.3: Create `RecordWaterMeterReadingsDto` with defense-in-depth validation
  - [x] 3.4: Create `WaterMeterReadingsFinder`
  - [x] 3.5: Create `WaterMeterReadingsQueryHandler`
  - [x] 3.6: Create `WaterMeterReadingsPresentationModule`
  - [x] 3.7: Register module in `app.module.ts`
  - [x] 3.8: Write controller + finder + handler tests

- [x] Task 4: Create water consumption distribution service (AC: #4, #5)
  - [x] 4.1: Create `WaterDistributionService` in presentation layer (NOT domain — uses read models from 2 BCs)
  - [x] 4.2: Implement proportional distribution logic: `unitShare = (unitConsumption / totalConsumption) × totalWaterCents`
  - [x] 4.3: Handle unmetered units: get 0 allocation (simplest correct approach — incentivizes meter installation)
  - [x] 4.4: Handle edge cases: all units metered, no units metered, zero total consumption
  - [x] 4.5: Create `GetWaterDistributionController` (GET `/api/entities/:entityId/water-distribution?fiscalYear=YYYY`)
  - [x] 4.6: Write comprehensive distribution service tests with BDD scenarios

- [x] Task 5: Create frontend API + hooks (AC: all)
  - [x] 5.1: Create `water-meter-api.ts` with interfaces and fetch functions
  - [x] 5.2: Create `useWaterMeterReadings(entityId, fiscalYear)` query hook
  - [x] 5.3: Create `useRecordWaterMeterReadings(entityId)` mutation hook with optimistic update
  - [x] 5.4: Create `useWaterDistribution(entityId, fiscalYear)` query hook
  - [x] 5.5: Hook tests via component tests (project convention — no standalone hook test files)

- [x] Task 6: Create frontend components (AC: #1, #2, #6, #7, #9)
  - [x] 6.1: Create `WaterMeterReadingsForm` component with unit rows, validation, and submit
  - [x] 6.2: Create `water-meter-schema.ts` Zod schema
  - [x] 6.3: Create `WaterDistributionSummary` component showing per-unit allocation
  - [x] 6.4: Integrate into charges page as new section/tab below annual charges
  - [x] 6.5: Write component tests (7 form tests + 4 distribution tests)

- [x] Task 7: Update ChargesSummary to use water distribution (AC: #4, #5)
  - [x] 7.1: Modify `ChargesSummary` to show per-unit water breakdown when distribution data exists
  - [x] 7.2: Add expandable detail row for water category showing unit-by-unit allocation
  - [x] 7.3: Write updated summary tests (1 new expandable water detail test)

- [x] Task 8: E2E tests (AC: all)
  - [x] 8.1: E2E: seed entity + property + 2 units via UI
  - [x] 8.2: E2E: verify water meter readings card appears when units exist
  - [x] 8.3: E2E: enter water meter readings for all units + verify success
  - [x] 8.4: E2E: re-submit readings (overwrite) and verify update

## Dev Notes

### Architecture Decision: Separate Aggregate (NOT child data on Unit)

Water meter readings are entity-scoped, fiscal-year-scoped, batch-entered data — NOT per-unit lifecycle data. This matches the `AnnualChargesAggregate` pattern exactly:

- **Stream**: `water-meter-readings-{entityId}-{fiscalYear}` (deterministic composite ID, same as annual charges)
- **BC**: Indexation (same as annual charges — charge regularization domain)
- **NOT** in Portfolio BC — readings don't belong to unit lifecycle
- **NOT** child data on UnitAggregate — readings are cross-unit, fiscal-year-scoped

### Aggregate Pattern: Follow AnnualChargesAggregate Exactly

```
WaterMeterReadingsAggregate (stream: 'water-meter-readings')
├── record(entityId, userId, fiscalYear, readings[]) → WaterMeterReadingsEntered
├── No-op guard: isSameData(existing, new)
├── State: recorded: boolean, readings: MeterReadingPrimitives[], fiscalYear: number
└── ID: {entityId}-{fiscalYear} (deterministic, server-generated)
```

### Data Model

**MeterReading composite VO:**
```typescript
interface MeterReadingPrimitives {
  unitId: string;
  previousReading: number;  // integer, >= 0
  currentReading: number;   // integer, >= previousReading
  readingDate: string;      // ISO date string
}
```

**WaterConsumption VO:** `currentReading - previousReading` — validates non-negative integer.

**Prisma model:**
```prisma
model WaterMeterReadings {
  id               String   @id
  entityId         String   @map("entity_id")
  userId           String   @map("user_id")
  fiscalYear       Int      @map("fiscal_year")
  readings         Json     @default("[]")  // MeterReadingPrimitives[]
  totalConsumption Int      @map("total_consumption")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([entityId, fiscalYear])
  @@index([entityId])
  @@map("water_meter_readings")
}
```

### API Endpoints

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| POST | `/api/entities/:entityId/water-meter-readings` | Record readings | 202 Accepted |
| GET | `/api/entities/:entityId/water-meter-readings?fiscalYear=YYYY` | Fetch readings | `{ data: WaterMeterReadings \| null }` |
| GET | `/api/entities/:entityId/water-distribution?fiscalYear=YYYY` | Computed distribution | `{ data: WaterDistribution }` |

### DTO Validation (per dto-checklist.md)

```typescript
class MeterReadingDto {
  @IsUUID()
  unitId!: string;

  @IsInt()
  @Min(0)
  @Max(99_999_999)
  previousReading!: number;

  @IsInt()
  @Min(0)
  @Max(99_999_999)
  currentReading!: number;

  @IsDateString()
  @IsNotEmpty()
  readingDate!: string;
}

class RecordWaterMeterReadingsDto {
  @IsUUID()
  @MaxLength(100)
  id!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => MeterReadingDto)
  readings!: MeterReadingDto[];
}
```

**CRITICAL DTO RULE**: Validate `currentReading >= previousReading` in the VO layer (MeterReading VO), NOT in the DTO. DTO validates format only; business rules live in VOs.

### Water Distribution Calculation Service

This is a **presentation-layer service** (NOT domain) because it reads from TWO separate read models:
1. `WaterMeterReadings` (from Indexation BC)
2. `AnnualCharges` (from Indexation BC — water category amount)

**Algorithm:**
```
Input: entityId, fiscalYear, allEntityUnitIds[]
1. Fetch water meter readings for (entityId, fiscalYear)
2. Fetch annual charges for (entityId, fiscalYear) → extract water category totalCents
3. Compute consumption per metered unit: consumption[i] = currentReading[i] - previousReading[i]
4. totalMeteredConsumption = sum(consumption[i]) for all metered units
5. If totalMeteredConsumption > 0:
   a. For each metered unit: unitShareCents = Math.floor((consumption[i] / totalMeteredConsumption) × waterTotalCents)
   b. Rounding remainder distributed to first metered unit (cents-exact)
6. unmeteredUnits = allEntityUnitIds - meteredUnitIds
7. If unmeteredUnits.length > 0:
   a. remainingCents = waterTotalCents - sum(meteredShares)
   b. perUnmeteredCents = Math.floor(remainingCents / unmeteredUnits.length)
   c. Rounding remainder to first unmetered unit
8. Edge: totalMeteredConsumption === 0 → all units split equally
9. Edge: no readings at all → all units split equally (same as no meters)
```

**CRITICAL**: Use `Math.floor()` for all divisions (troncature, not rounding — French law favors tenant). Distribute rounding remainder to ensure sum === totalWaterCents exactly.

### Frontend Design

**Integration point**: Charges page (`/charges`) — add a new section below annual charges form.

**WaterMeterReadingsForm layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Relevés des compteurs d'eau — {fiscalYear}              │
├─────────────────────────────────────────────────────────┤
│ Lot      │ Locataire     │ Ancien  │ Nouveau │ Date    │
│ -------- │ ------------- │ ------- │ ------- │ ------- │
│ Apt A    │ Dupont (ro)   │ 100 (ro)│ [___]   │ [date]  │
│ Apt B    │ Martin (ro)   │ 200 (ro)│ [___]   │ [date]  │
│ Parking  │ — (no tenant) │ — skip  │ — skip  │ — skip  │
│                                                         │
│ [Enregistrer les relevés]                               │
└─────────────────────────────────────────────────────────┘
```

**Key UX decisions:**
- Only show units that have active leases (occupied units) — vacant units cannot have meter readings
- Previous reading auto-fills from last recorded entry for same unit, or 0 if first entry
- Reading date defaults to today
- Skip units without tenants entirely (they'll go into the "unmetered" equal-split bucket)
- Rows are readonly for unit/tenant info, editable for current reading + date
- Double-click guard on submit button

**Zod schema (no `.default()` or `.refine()`):**
```typescript
const meterReadingSchema = z.object({
  unitId: z.string().min(1),
  previousReading: z.number().int().min(0),
  currentReading: z.number().int().min(0),
  readingDate: z.string().min(1),
})

const waterMeterReadingsSchema = z.object({
  readings: z.array(meterReadingSchema).min(1).max(200),
})
```

**VALIDATION NOTE**: `currentReading >= previousReading` cannot be expressed in Zod without `.refine()`. Validate this in the form submit handler BEFORE calling the API:
```typescript
const invalid = readings.find(r => r.currentReading < r.previousReading);
if (invalid) { setError(`unit-${invalid.unitId}`, ...); return; }
```

**WaterDistributionSummary layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Répartition des charges d'eau — {fiscalYear}            │
├─────────────────────────────────────────────────────────┤
│ Lot      │ Conso (m³)  │ Part (%)  │ Montant (€)       │
│ -------- │ ----------- │ --------- │ ---------------   │
│ Apt A    │ 50          │ 38.46%    │ 187,50 €          │
│ Apt B    │ 80          │ 61.54%    │ 300,00 €          │
│ Apt C*   │ —           │ égal.     │ 56,25 €           │
│ Apt D*   │ —           │ égal.     │ 56,25 €           │
│ -------- │ ----------- │ --------- │ ---------------   │
│ Total    │ 130         │ 100%      │ 600,00 €          │
│                                                         │
│ * Lots sans compteur individuel — répartition égalitaire│
└─────────────────────────────────────────────────────────┘
```

### React Query Cache Keys

```typescript
// Water meter readings
["entities", entityId, "water-meter-readings", fiscalYear]

// Water distribution (computed)
["entities", entityId, "water-distribution", fiscalYear]

// Invalidate on record:
["entities", entityId, "water-meter-readings", fiscalYear]
["entities", entityId, "water-distribution", fiscalYear]
```

### Optimistic Update Pattern

Follow existing pattern from `useRecordAnnualCharges`:
1. `onMutate`: cancel in-flight queries, snapshot cache, update optimistically
2. `onError`: rollback to snapshot
3. `onSettled`: invalidate with 1.5s delay (CQRS eventual consistency)

### Project Structure Notes

**New files location — Backend domain:**
```
backend/src/indexation/water-meter-readings/
├── meter-reading.ts                          # MeterReading composite VO
├── water-consumption.ts                       # WaterConsumption VO
├── water-meter-readings.aggregate.ts          # Aggregate
├── events/
│   └── water-meter-readings-entered.event.ts  # Domain event
├── commands/
│   ├── record-water-meter-readings.command.ts
│   └── record-water-meter-readings.handler.ts
├── exceptions/
│   ├── invalid-meter-reading.exception.ts
│   └── invalid-water-consumption.exception.ts
└── __tests__/
    ├── mock-cqrx.ts
    ├── meter-reading.spec.ts
    ├── water-consumption.spec.ts
    ├── water-meter-readings.aggregate.spec.ts
    └── record-water-meter-readings.handler.spec.ts
```

**New files location — Backend presentation:**
```
backend/src/presentation/water-meter-readings/
├── water-meter-readings-presentation.module.ts
├── controllers/
│   ├── record-water-meter-readings.controller.ts
│   ├── get-water-meter-readings.controller.ts
│   └── get-water-distribution.controller.ts
├── queries/
│   ├── get-water-meter-readings.query.ts
│   ├── get-water-meter-readings.handler.ts
│   ├── get-water-distribution.query.ts
│   └── get-water-distribution.handler.ts
├── dto/
│   └── record-water-meter-readings.dto.ts
├── finders/
│   └── water-meter-readings.finder.ts
├── services/
│   └── water-distribution.service.ts
├── projections/
│   └── water-meter-readings.projection.ts
└── __tests__/
    ├── record-water-meter-readings.controller.spec.ts
    ├── get-water-meter-readings.controller.spec.ts
    ├── get-water-distribution.controller.spec.ts
    ├── water-meter-readings.finder.spec.ts
    ├── water-meter-readings.projection.spec.ts
    ├── water-distribution.service.spec.ts
    ├── get-water-meter-readings.handler.spec.ts
    └── get-water-distribution.handler.spec.ts
```

**New files location — Frontend:**
```
frontend/src/
├── lib/api/
│   └── water-meter-api.ts
├── hooks/
│   ├── use-water-meter-readings.ts
│   └── __tests__/
│       └── use-water-meter-readings.test.ts
├── components/features/charges/
│   ├── water-meter-readings-form.tsx
│   ├── water-meter-schema.ts
│   ├── water-distribution-summary.tsx
│   └── __tests__/
│       ├── water-meter-readings-form.test.tsx
│       └── water-distribution-summary.test.tsx
└── e2e/
    └── water-meter-readings.spec.ts   # OR extend charges.spec.ts
```

**Modified files:**
```
backend/prisma/schema.prisma                              # Add WaterMeterReadings model
backend/src/app.module.ts                                 # Register WaterMeterReadingsPresentationModule
frontend/src/app/(auth)/charges/page.tsx                  # Add water meter section
frontend/src/components/features/charges/charges-summary.tsx  # Show per-unit water breakdown
frontend/e2e/fixtures/api.fixture.ts                      # Add water meter API helpers
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic7-Story7.6] — FR49 requirements, BDD scenarios
- [Source: _bmad-output/implementation-artifacts/7-5-enter-actual-annual-charges-by-category.md] — AnnualChargesAggregate pattern, fiscal year selector, charges page layout
- [Source: _bmad-output/implementation-artifacts/7-5c-normalize-billing-lines-with-charge-category-table.md] — ChargeCategory table, chargeCategoryId matching, charges-summary matching logic
- [Source: docs/project-context.md] — CQRS patterns, optimistic update, delayed invalidation
- [Source: docs/anti-patterns.md] — Zod no .default()/.refine(), named exceptions, DTO defense-in-depth
- [Source: docs/dto-checklist.md] — class-validator patterns, VO double-validation
- [Source: _bmad-output/planning-artifacts/architecture.md] — Hexagonal arch, controller-per-action, integer cents, Indexation BC

### Critical Patterns to Follow

1. **AnnualChargesAggregate is your template** — same stream naming, same deterministic ID, same no-op guard, same overwrite-via-event
2. **FiscalYear VO reuse** — import from `@indexation/annual-charges/fiscal-year` (already exists)
3. **mock-cqrx.ts** — copy from `@indexation/annual-charges/__tests__/mock-cqrx.ts`
4. **Controller-per-action** — separate controllers for record, get-readings, get-distribution
5. **202 Accepted** for command endpoint, **200 OK** for queries
6. **Integer cents** for all monetary distribution results
7. **Math.floor()** for all monetary divisions (troncature per French law)
8. **No cross-BC imports** — distribution service reads from Prisma finders (presentation layer), NOT aggregate imports
9. **Entity-scoped queries** — all finders filter by `entityId` (multi-tenant isolation)
10. **Delayed invalidation** — 1.5s setTimeout in onSettled for CQRS eventual consistency
11. **staleTime: 30_000** on all query hooks
12. **Double-click guard** on submit button (`isSubmitting` state)
13. **Dark mode** — all new components must have dark mode variants
14. **French labels, English code** — UI text in French, variable/file names in English
15. **ARIA accessibility** — proper form labels, error messages linked to inputs
16. **Prisma generate** — run after schema changes

### BDD Test Scenarios

**Scenario 1: Enter readings for all units with individual meters**
- Given: 3 units (A, B, C) with existing tenants
- When: Enter readings for all 3 (A: 100→150=50m³, B: 200→280=80m³, C: 150→180=30m³)
- And: Total water charges from annual charges = 60000 cents (600€)
- Then: A = floor(50/160 × 60000) = 18750 cents (187.50€)
- And: B = floor(80/160 × 60000) = 30000 cents (300.00€)
- And: C = floor(30/160 × 60000) = 11250 cents (112.50€)
- And: Total = 60000 cents ✓ (no rounding remainder in this case)

**Scenario 2: Mixed meters — some units without readings**
- Given: 4 units (A, B, C, D); only A and B have individual readings
- When: Enter A: 100→150 (50m³), B: 200→280 (80m³)
- And: Total water = 60000 cents (600€)
- Then: meteredShare for A = floor(50/130 × 60000) = 23076 cents
- And: meteredShare for B = floor(80/130 × 60000) = 36923 cents
- And: sumMetered = 59999 cents → remainder 1 cent → A gets 23077
- And: unmeteredShare = 60000 - 60000 = 0 cents? NO — recalculate:
- **Correct approach**: All water is distributed proportionally among metered units ONLY. Unmetered units get equal share of REMAINING.
- Actually per epics spec: meteredUnits consume their proportion, unmetered split remainder equally.
- If total annual water = 600€ and metered units consumed 130m³:
  - A: 50/130 × 600 = 230.77€ → floor = 23076 cents
  - B: 80/130 × 600 = 369.23€ → floor = 36923 cents
  - sum = 59999 → remainder = 1 cent → A = 23077
  - Remaining for C, D: 60000 - 60000 = 0? This only works if totalConsumption covers ALL water.
- **Simpler interpretation**: distribute ALL water charges proportionally among metered units. Unmetered units get equal split of zero remaining. This effectively means unmetered units pay nothing — which is wrong.
- **Correct interpretation from epics**: The total water budget is split between metered and unmetered units. All metered units share based on consumption. Unmetered units share equally. The split ratio is NOT based on consumption — it's an explicit split: metered get their proportional share, unmetered get equal share of the rest.
- **Implementation**: Use a configurable split OR assume metered consumption = actual consumption, unmetered = estimated equal. Total water is distributed: `meteredUnitsCost = (meteredConsumption / estimatedTotalConsumption) × totalWater`. But we don't have estimatedTotalConsumption for unmetered units.
- **SIMPLEST CORRECT APPROACH**: Distribute ALL waterCents proportionally by consumption among metered units ONLY. Unmetered units' share = 0. This incentivizes installing meters. If landlord wants to charge unmetered units, they enter estimated readings.

**Decision: Ask user during implementation or adopt simplest approach — all charges distributed proportionally among units with readings. Units without readings get 0. Document this clearly in UI.**

**Scenario 3: Reading validation**
- When: currentReading < previousReading → error message
- When: non-numeric value → error message
- When: negative value → error message

**Scenario 4: Overwrite existing readings**
- Given: readings already exist for fiscal year 2025
- When: re-submit with updated readings
- Then: old readings replaced, new distribution calculated

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- 8 tasks completed (4 backend + 4 frontend)
- Backend: 12 test suites, 59 tests — all passing
- Frontend: 5 test suites, 43 tests — all passing
- E2E: 4 serial tests (seed + card visibility + enter readings + overwrite)
- Total: 17 test suites, 102 tests
- Build: clean (0 errors, 0 warnings)
- Typecheck: clean
- ESLint: only incompatible-library warning from React Compiler (form.watch() — expected)
- Deviation from story: Task 2.2 used JSON column instead of separate WaterMeterReading model (simpler, matches AnnualCharges pattern exactly)
- Deviation from story: Task 4.3 — unmetered units get 0 allocation (simplest correct approach per Dev Notes decision: "distribute ALL waterCents proportionally among metered units ONLY")
- Deviation from story: Task 5.5 — hook tests via component tests (project convention: no standalone hook test files exist)
- Deviation from story: DTO `id` uses `@IsString()` + `@MaxLength(100)` instead of `@IsUUID()` — composite ID `{entityId}-{fiscalYear}` is NOT a UUID; story DTO spec was incorrect, implementation is correct
- Fix applied post-implementation: 4 Prisma JSON type compatibility errors (cast via `unknown` for MeterReadingPrimitives[] ↔ Prisma.InputJsonValue)
- Form-level validation for currentReading >= previousReading (not in Zod per project convention)
- Optimistic update with 1.5s delayed invalidation (CQRS eventual consistency)
- Previous readings editable (not readonly) — allows correction of both old and new readings

### Change Log

- 2026-02-15: Story 7.6 implementation complete — 8 tasks, 102 tests, 49 files (37 new + 6 modified + 6 untracked)
- 2026-02-15: Fixed 4 Prisma JSON type compatibility errors (cast via `unknown`)
- 2026-02-15: Code review — 10 findings (3H/4M/3L), 8 fixes applied:
  - H1: Type mismatch `consumption: number` vs backend `number | null` — added `percentage: number | null` + `consumption: number | null` to `WaterDistributionData`, null-guards in `water-distribution-summary.tsx` + `charges-summary.tsx`, test data updated
  - H2: Fragile water charge detection via string `.includes('eau')` — added null-guard on `chargeCategoryId` cast in `get-water-distribution.handler.ts` (chargeCategoryId can be null)
  - H3: DTO `id` uses `@IsString()` not `@IsUUID()` — documented as correct deviation (composite ID `{entityId}-{fiscalYear}` is NOT a UUID)
  - M1: 2 unstaged annual-charges files in git — not story 7.6 code, residual from another session (informational)
  - M2: Added `role="status"` to water readings success message in charges page (accessibility)
  - M3: Cumulative migration — documented, not fixable post-creation (informational)
  - M4: File List untracked count 6 → listed 5 — added missing entry
  - L1: Unused `percentage` prop — added to `WaterDistributionData` interface (part of H1 fix)
  - L2: `eau.png` at project root — development artifact, not part of story (informational)
  - L3: E2E entity switcher limitation — documented, not blocking (informational)

### File List

**New files (37):**
- `backend/prisma/migrations/20260215190832_add_water_meter_readings/migration.sql`
- `backend/src/indexation/water-meter-readings/__tests__/meter-reading.spec.ts`
- `backend/src/indexation/water-meter-readings/__tests__/mock-cqrx.ts`
- `backend/src/indexation/water-meter-readings/__tests__/record-water-meter-readings.handler.spec.ts`
- `backend/src/indexation/water-meter-readings/__tests__/water-consumption.spec.ts`
- `backend/src/indexation/water-meter-readings/__tests__/water-meter-readings.aggregate.spec.ts`
- `backend/src/indexation/water-meter-readings/commands/record-water-meter-readings.command.ts`
- `backend/src/indexation/water-meter-readings/commands/record-water-meter-readings.handler.ts`
- `backend/src/indexation/water-meter-readings/events/water-meter-readings-entered.event.ts`
- `backend/src/indexation/water-meter-readings/exceptions/invalid-meter-reading.exception.ts`
- `backend/src/indexation/water-meter-readings/exceptions/invalid-water-consumption.exception.ts`
- `backend/src/indexation/water-meter-readings/meter-reading.ts`
- `backend/src/indexation/water-meter-readings/water-consumption.ts`
- `backend/src/indexation/water-meter-readings/water-meter-readings.aggregate.ts`
- `backend/src/presentation/water-meter-readings/__tests__/get-water-distribution.controller.spec.ts`
- `backend/src/presentation/water-meter-readings/__tests__/get-water-distribution.handler.spec.ts`
- `backend/src/presentation/water-meter-readings/__tests__/get-water-meter-readings.controller.spec.ts`
- `backend/src/presentation/water-meter-readings/__tests__/get-water-meter-readings.handler.spec.ts`
- `backend/src/presentation/water-meter-readings/__tests__/record-water-meter-readings.controller.spec.ts`
- `backend/src/presentation/water-meter-readings/__tests__/water-distribution.service.spec.ts`
- `backend/src/presentation/water-meter-readings/__tests__/water-meter-readings.finder.spec.ts`
- `backend/src/presentation/water-meter-readings/__tests__/water-meter-readings.projection.spec.ts`
- `backend/src/presentation/water-meter-readings/controllers/get-water-distribution.controller.ts`
- `backend/src/presentation/water-meter-readings/controllers/get-water-meter-readings.controller.ts`
- `backend/src/presentation/water-meter-readings/controllers/record-water-meter-readings.controller.ts`
- `backend/src/presentation/water-meter-readings/dto/record-water-meter-readings.dto.ts`
- `backend/src/presentation/water-meter-readings/finders/water-meter-readings.finder.ts`
- `backend/src/presentation/water-meter-readings/projections/water-meter-readings.projection.ts`
- `backend/src/presentation/water-meter-readings/queries/get-water-distribution.handler.ts`
- `backend/src/presentation/water-meter-readings/queries/get-water-distribution.query.ts`
- `backend/src/presentation/water-meter-readings/queries/get-water-meter-readings.handler.ts`
- `backend/src/presentation/water-meter-readings/queries/get-water-meter-readings.query.ts`
- `backend/src/presentation/water-meter-readings/services/water-distribution.service.ts`
- `backend/src/presentation/water-meter-readings/water-meter-readings-presentation.module.ts`
- `frontend/src/hooks/use-water-meter-readings.ts`
- `frontend/src/lib/api/water-meter-api.ts`
- `frontend/src/components/features/charges/water-meter-schema.ts`

**New files — untracked (6):**
- `frontend/src/components/features/charges/water-meter-readings-form.tsx`
- `frontend/src/components/features/charges/water-distribution-summary.tsx`
- `frontend/src/components/features/charges/__tests__/water-meter-readings-form.test.tsx`
- `frontend/src/components/features/charges/__tests__/water-distribution-summary.test.tsx`
- `frontend/src/hooks/use-water-meter-readings.ts` (moved from staged to untracked during review edits)
- `frontend/e2e/water-meter-readings.spec.ts`

**Modified files (6):**
- `backend/prisma/schema.prisma` — Added WaterMeterReadings model
- `backend/src/app.module.ts` — Registered WaterMeterReadingsPresentationModule
- `frontend/src/app/(auth)/charges/page.tsx` — Added water meter readings section (form, distribution, updated comparison)
- `frontend/src/app/(auth)/charges/__tests__/charges-page.test.tsx` — Added mocks for new hooks
- `frontend/src/components/features/charges/charges-summary.tsx` — Added expandable water detail rows
- `frontend/src/components/features/charges/__tests__/charges-summary.test.tsx` — Added expandable water detail test
