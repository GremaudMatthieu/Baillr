# Story 7.2: Calculate Revised Rent Using Official Formula

Status: done

## Story

As a bailleur,
I want the system to calculate revised rent using the correct formula with the entered indices,
so that revisions are legally accurate and auditable (FR44).

## Acceptance Criteria

1. **Given** an index has been entered for the relevant quarter **and** a lease has revision parameters configured (revisionDay, revisionMonth, referenceQuarter, referenceYear, baseIndexValue, revisionIndexType),
   **When** I navigate to the revisions page,
   **Then** the system identifies all leases eligible for revision (where the matching new index exists but no revision has been applied yet).

2. **Given** a lease is eligible for revision,
   **When** the system calculates the revision,
   **Then** it applies the formula: `new_rent = current_rent × (new_index / base_index)` where:
   - `current_rent` = lease's current `rentAmountCents`
   - `new_index` = the InseeIndex value for the lease's `revisionIndexType` + `referenceQuarter` + the revision year
   - `base_index` = the lease's `baseIndexValue` (configured in revision parameters)

3. **Given** the formula is applied,
   **When** the result is computed,
   **Then** it is **truncated down to the cent** (troncature, NOT Math.round — NFR18, favoring tenant per French law) and all calculations use integer cents internally.

4. **Given** a revision has been calculated,
   **When** I view the revision detail,
   **Then** I see: current rent, base index (quarter + value), new index (quarter + value), formula applied, resulting new rent, and the difference (positive or negative).

5. **Given** indices and leases exist,
   **When** I visit the revisions page,
   **Then** I see a RevisionTable listing all pending revisions with: tenant name, unit label, current rent, new rent, difference, index type, and revision status.

6. **Given** the calculation is deterministic,
   **When** replayed with the same inputs,
   **Then** it produces identical results (NFR15 — event sourcing replay safety).

## Tasks / Subtasks

- [x] Task 1 — Create RevisionAggregate with RentRevisionCalculated event (AC: #2, #3, #6)
  - [x] 1.1 Create `backend/src/indexation/revision/` domain directory
  - [x] 1.2 Create RevisionAggregate with `calculateRevision()` method
  - [x] 1.3 Create `RentRevisionCalculated` event with full audit trail data
  - [x] 1.4 Create VOs: RevisedRentAmount, RevisionFormula (composite VO holding all formula inputs/outputs)
  - [x] 1.5 Create IndexCalculatorService implementing the official formula with truncation
  - [x] 1.6 Create named exceptions: RevisionAlreadyCalculatedException, MissingIndexException
  - [x] 1.7 Write aggregate + VO + service unit tests

- [x] Task 2 — Create CalculateARevision command & handler (AC: #2)
  - [x] 2.1 Create `CalculateARevisionCommand` (leaseId, entityId, userId, newIndexValue, baseIndexValue, currentRentCents)
  - [x] 2.2 Create `CalculateARevisionHandler` — pure orchestration: create aggregate, call method, save
  - [x] 2.3 Write handler unit tests

- [x] Task 3 — Create Prisma read model + projection (AC: #4, #5)
  - [x] 3.1 Add `Revision` model to Prisma schema (id, leaseId, entityId, tenantId, unitId, currentRentCents, newRentCents, differenceCents, baseIndexValue, baseIndexQuarter, newIndexValue, newIndexQuarter, newIndexYear, revisionIndexType, status: pending|approved, calculatedAt, approvedAt)
  - [x] 3.2 Run `prisma generate` after schema change
  - [x] 3.3 Create RevisionProjection subscribing to `revision-` stream prefix
  - [x] 3.4 Write projection unit tests

- [x] Task 4 — Create presentation layer (controllers, DTOs, finder) (AC: #1, #4, #5)
  - [x] 4.1 Create `CalculateRevisionsController` — POST `/api/entities/:entityId/revisions/calculate` (batch calculation)
  - [x] 4.2 Create `GetRevisionsController` — GET `/api/entities/:entityId/revisions`
  - [x] 4.3 Create `RevisionFinder` with queries: findAllByEntity, findByLeaseId
  - [x] 4.4 Create `RevisionPresentationModule` registering all providers
  - [x] 4.5 Register module in `app.module.ts`
  - [x] 4.6 Write controller + finder + DTO unit tests

- [x] Task 5 — Implement batch calculation orchestration in controller (AC: #1, #2)
  - [x] 5.1 Controller fetches all active leases with revision parameters configured
  - [x] 5.2 For each lease, look up matching InseeIndex by (revisionIndexType, referenceQuarter, revisionYear)
  - [x] 5.3 Skip leases with missing index (collect in `skipped` list)
  - [x] 5.4 Skip leases already revised for this period (idempotency via finder query)
  - [x] 5.5 Generate UUID per revision, dispatch CalculateARevisionCommand
  - [x] 5.6 Return BatchSummary: { calculated, skipped, errors }

- [x] Task 6 — Create frontend revisions page + RevisionTable component (AC: #4, #5)
  - [x] 6.1 Create route `/revisions` with page.tsx
  - [x] 6.2 Create `RevisionTable` component displaying pending revisions
  - [x] 6.3 Create `CalculateRevisionsDialog` (AlertDialog) with confirmation before batch calculation
  - [x] 6.4 Create `useRevisions` hook (GET query) and `useCalculateRevisions` mutation hook
  - [x] 6.5 Create `revisions-api.ts` client module
  - [x] 6.6 Add "Révisions" navigation item to sidebar (BarChart3 icon)
  - [x] 6.7 No-entity state guard on page

- [x] Task 7 — Write frontend unit tests (AC: #4, #5)
  - [x] 7.1 Test RevisionTable component (empty state, populated state, formatting)
  - [x] 7.2 Test CalculateRevisionsDialog (trigger, confirmation, loading, summary)
  - [x] 7.3 Test revisions page (no-entity, loading, data states)
  - [x] 7.4 Test useCalculateRevisions hook

- [x] Task 8 — Write E2E tests (AC: #1-#6)
  - [x] 8.1 Seed test: create entity + property + unit + tenant + lease (with revision params) + record INSEE index
  - [x] 8.2 Test: navigate to revisions page, verify empty state
  - [x] 8.3 Test: trigger batch calculation, verify revision appears in table
  - [x] 8.4 Test: verify formula display (current rent, indices, new rent, difference)
  - [x] 8.5 Test: sidebar navigation to /revisions

## Dev Notes

### Critical: The Official Rent Revision Formula

```
new_rent_cents = Math.floor(current_rent_cents * new_index / base_index)
```

**IMPORTANT — Truncation, NOT rounding:**
- Use `Math.floor()` (troncature) — French law favors the tenant
- The operation order matters: multiply FIRST, then divide, then floor
- All monetary values as integer cents throughout
- `new_index` and `base_index` are Float values from InseeIndex (e.g., 142.06)
- The formula is: `new_rent = old_rent × (new_index / base_index)`

**IndexCalculatorService implementation:**
```typescript
export class IndexCalculatorService {
  calculate(currentRentCents: number, newIndexValue: number, baseIndexValue: number): number {
    // Multiply first to preserve precision, then floor
    return Math.floor(currentRentCents * newIndexValue / baseIndexValue);
  }
}
```

This is a pure function — no side effects, deterministic, replay-safe (NFR15).

### Architecture: RevisionAggregate in Indexation BC

Per architecture.md, the revision aggregate lives in the **Indexation BC** (`backend/src/indexation/revision/`), NOT Tenancy.

**Directory structure:**
```
backend/src/indexation/
├── insee-index/           # Already exists (Story 7.1)
├── revision/              # NEW — Story 7.2
│   ├── revision.aggregate.ts
│   ├── events/
│   │   └── rent-revision-calculated.event.ts
│   ├── commands/
│   │   ├── calculate-a-revision.command.ts
│   │   └── calculate-a-revision.handler.ts
│   ├── exceptions/
│   │   ├── revision-already-calculated.exception.ts
│   │   └── missing-index.exception.ts
│   ├── services/
│   │   └── index-calculator.service.ts
│   └── __tests__/
│       ├── mock-cqrx.ts          # Copy from insee-index/__tests__/
│       ├── revision.aggregate.spec.ts
│       ├── index-calculator.service.spec.ts
│       └── calculate-a-revision.handler.spec.ts
└── indexation.module.ts   # Already exists — remains empty (BC root)
```

**Presentation layer:**
```
backend/src/presentation/
└── revision/
    ├── controllers/
    │   ├── calculate-revisions.controller.ts
    │   └── get-revisions.controller.ts
    ├── dto/                     # No DTO needed for GET; minimal for POST
    ├── finders/
    │   └── revision.finder.ts
    ├── projections/
    │   └── revision.projection.ts
    ├── revision-presentation.module.ts
    └── __tests__/
        ├── calculate-revisions.controller.spec.ts
        ├── get-revisions.controller.spec.ts
        ├── revision.projection.spec.ts
        └── revision.finder.spec.ts (optional)
```

### Cross-BC References (by ID only)

The RevisionAggregate stores cross-BC IDs as strings:
- `leaseId` (from Tenancy BC)
- `tenantId` (from Tenancy BC)
- `unitId` (from Portfolio BC)

The controller orchestrates cross-BC reads:
- Uses `LeaseFinder` to fetch active leases with revision parameters
- Uses `InseeIndexFinder` to look up matching indices
- Dispatches `CalculateARevisionCommand` to the Indexation BC

**IMPORTANT:** The controller imports finders from other presentation modules (LeaseFinder from `@presentation/lease`, InseeIndexFinder from `@presentation/insee-index`). This is the established pattern — presentation layer acts as API gateway.

### RevisionAggregate Design

```typescript
export class RevisionAggregate extends AggregateRoot {
  static readonly streamName = 'revision';
  private calculated = false;  // no-op guard

  calculateRevision(
    leaseId: string, entityId: string, userId: string,
    tenantId: string, unitId: string, tenantName: string, unitLabel: string,
    currentRentCents: number,
    baseIndexValue: number, baseIndexQuarter: string,
    newIndexValue: number, newIndexQuarter: string, newIndexYear: number,
    revisionIndexType: string,
    calculator: IndexCalculatorService,
  ): void {
    if (this.calculated) return; // no-op guard

    const newRentCents = calculator.calculate(currentRentCents, newIndexValue, baseIndexValue);

    this.apply(new RentRevisionCalculated({
      revisionId: this.id,
      leaseId, entityId, userId, tenantId, unitId, tenantName, unitLabel,
      currentRentCents, newRentCents,
      differenceCents: newRentCents - currentRentCents,
      baseIndexValue, baseIndexQuarter,
      newIndexValue, newIndexQuarter, newIndexYear,
      revisionIndexType,
      calculatedAt: new Date().toISOString(),
    }));
  }
}
```

**Key:** The calculator service is passed as parameter (port/adapter pattern per architecture.md). The aggregate does NOT inject services via constructor.

### Prisma Read Model

```prisma
model Revision {
  id                 String    @id
  leaseId            String    @map("lease_id")
  entityId           String    @map("entity_id")
  userId             String    @map("user_id")
  tenantId           String    @map("tenant_id")
  unitId             String    @map("unit_id")
  tenantName         String    @map("tenant_name")
  unitLabel          String    @map("unit_label")
  currentRentCents   Int       @map("current_rent_cents")
  newRentCents       Int       @map("new_rent_cents")
  differenceCents    Int       @map("difference_cents")
  baseIndexValue     Float     @map("base_index_value")
  baseIndexQuarter   String    @map("base_index_quarter")
  newIndexValue      Float     @map("new_index_value")
  newIndexQuarter    String    @map("new_index_quarter")
  newIndexYear       Int       @map("new_index_year")
  revisionIndexType  String    @map("revision_index_type")
  status             String    @default("pending")   // pending | approved
  calculatedAt       DateTime  @map("calculated_at")
  approvedAt         DateTime? @map("approved_at")

  @@unique([leaseId, newIndexYear, newIndexQuarter])
  @@map("revisions")
  @@index([entityId])
  @@index([leaseId])
}
```

**Idempotency:** `@@unique([leaseId, newIndexYear, newIndexQuarter])` — one revision per lease per index period. Controller pre-checks via finder before dispatching command.

**`tenantName` and `unitLabel` denormalized:** Stored in read model for display without joins. This is the projection pattern — read models are disposable and can be rebuilt.

### Batch Calculation Controller Logic

```typescript
// POST /api/entities/:entityId/revisions/calculate
async handle(@Param('entityId') entityId, @CurrentUser() userId): Promise<void> {
  // 1. Verify entity ownership
  const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
  if (!entity) throw new UnauthorizedException();

  // 2. Fetch active leases with revision parameters configured
  const leases = await this.leaseFinder.findAllActiveWithRevisionParams(entityId, userId);

  // 3. For each lease, look up matching InseeIndex
  const calculator = new IndexCalculatorService();
  const results = { calculated: 0, skipped: [] as string[], errors: [] as string[] };

  for (const lease of leases) {
    // Skip if already revised for this period
    const existingRevision = await this.revisionFinder.existsByLeaseAndPeriod(
      lease.id, lease.referenceYear!, lease.referenceQuarter!,
    );
    if (existingRevision) { results.skipped.push(lease.id); continue; }

    // Look up new index
    const newIndex = await this.inseeIndexFinder.findByTypeQuarterYear(
      lease.revisionIndexType, lease.referenceQuarter!, lease.referenceYear!,
    );
    if (!newIndex) { results.skipped.push(lease.id); continue; }

    // Calculate
    const revisionId = randomUUID();
    await this.commandBus.execute(new CalculateARevisionCommand(
      revisionId, lease.id, entityId, userId,
      lease.tenantId, lease.unitId, tenantName, unitLabel,
      lease.rentAmountCents, lease.baseIndexValue!, lease.referenceQuarter!,
      newIndex.value, newIndex.quarter, newIndex.year,
      lease.revisionIndexType,
    ));
    results.calculated++;
  }

  // Return summary (exception to 202 pattern — POST returns 200 with summary)
}
```

**IMPORTANT:** This POST returns a 200 with batch summary (not 202). This is the same pattern as rent call batch generation (Story 4.1) and email sending (Story 4.3). The controller orchestrates the batch — this is NOT a domain service.

### New Finder Methods Required

**LeaseFinder** — add `findAllActiveWithRevisionParams(entityId, userId)`:
- Filters: `entityId`, NOT terminated (`endDate IS NULL`), revision params NOT NULL (`revisionDay IS NOT NULL`)
- Include: tenant (for name), unit (for label)
- Returns leases with their revision parameters populated

**InseeIndexFinder** — add `findByTypeQuarterYear(type, quarter, year, entityId)`:
- Returns single InseeIndex or null
- Used for exact lookup during revision calculation

**RevisionFinder** — new:
- `findAllByEntity(entityId)` — all revisions for display
- `existsByLeaseAndPeriod(leaseId, year, quarter)` — idempotency check

### Frontend: Revisions Page

**Route:** `/revisions`
**Navigation:** "Révisions" in sidebar with BarChart3 icon (after "Indices")

**Page structure:**
```
┌─────────────────────────────────────────────┐
│ Révisions de loyer                          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Calculer les révisions    [Calculer]    │ │
│ │ X baux éligibles                        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Révisions en attente                    │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │ Locataire │ Lot    │ Loyer  │ Nouv. │ │ │
│ │ │           │        │ actuel │ loyer │ │ │
│ │ │───────────┼────────┼────────┼───────│ │ │
│ │ │ Dupont    │ Apt A  │ 750€   │ 762€  │ │ │
│ │ │ Martin    │ Apt B  │ 820€   │ 832€  │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Components:**
- `RevisionTable` — table of pending revisions with columns: tenant, unit, current rent, new rent, difference, index type, formula details
- `CalculateRevisionsDialog` — AlertDialog confirming batch calculation, shows BatchSummary on success
- `RevisionDetail` — expandable row or inline display showing full formula breakdown

**Hooks:**
- `useRevisions(entityId)` — GET query with staleTime 30s
- `useCalculateRevisions(entityId)` — mutation with optimistic UI + delayed invalidation

**API client:**
- `getRevisions(entityId)` — GET `/api/entities/:entityId/revisions`
- `calculateRevisions(entityId)` — POST `/api/entities/:entityId/revisions/calculate`

### Currency Formatting

Use the established pattern with `Intl.NumberFormat`:
```typescript
const formatEuros = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
```

**Test pitfall (from Story 4.1):** `Intl.NumberFormat("fr-FR")` uses narrow no-break space (`\u202F`) in real browsers but regular space in jsdom — use `.` wildcard or `toContain` in test assertions instead of exact string matching.

### What This Story Does NOT Do

- **Does NOT approve revisions** — that's Story 7.3 (batch approve + RentRevised event + lease rent update)
- **Does NOT generate revision letters** — that's Story 7.4
- **Does NOT modify the lease's rent amount** — the RevisionAggregate stores the calculated result; the lease is updated only after approval in Story 7.3
- **Does NOT add ActionFeed integration** — consider adding "Calculez vos révisions de loyer" step if leases have revision params + matching indices exist but no pending revisions

### Project Structure Notes

- Alignment with architecture.md: RevisionAggregate in `indexation/revision/` BC
- Presentation module: `presentation/revision/` (separate from `presentation/insee-index/`)
- Path alias `@indexation/*` already exists (added in Story 7.1)
- No new path aliases needed — revision is under the same `indexation/` BC
- Cross-BC finder imports: LeaseFinder from `lease-presentation.module.ts`, InseeIndexFinder from `insee-index-presentation.module.ts` — both already exported

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Indexation BC] — RevisionAggregate structure, IndexCalculatorService pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Financial Precision] — Integer cents, truncation (Math.floor)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2] — AC, formula definition
- [Source: docs/project-context.md#CQRS Patterns] — Command flow, optimistic UI, projection resilience
- [Source: docs/project-context.md#Form Patterns] — Euros/cents conversion
- [Source: docs/anti-patterns.md] — DTO validation, named exceptions, no cross-BC imports
- [Source: Story 7.1 learnings] — Indexation BC setup, InseeIndexAggregate, mock-cqrx pattern, E2E serial mode
- [Source: Story 4.1 learnings] — Batch generation pattern, server-side UUID, BatchSummary
- [Source: Story 3.5 learnings] — Revision parameters on LeaseAggregate (revisionDay, revisionMonth, referenceQuarter, referenceYear, baseIndexValue)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- DomainException constructor requires (message, code, statusCode?) — fixed in both RevisionAlreadyCalculatedException (409) and MissingIndexException (400) [NOTE: both exceptions later removed as dead code during review]

### Completion Notes List
- 8 tasks completed, all subtasks done
- Backend: 1122 tests (154 suites) — all pass, no regressions
- Frontend: 629 tests (84 suites) — all pass, no regressions
- TypeScript: 0 errors
- RevisionAggregate in Indexation BC with no-op guard for idempotency
- IndexCalculatorService: pure function with Math.floor truncation (French law favoring tenant)
- Batch calculation orchestration in controller (same pattern as Story 4.1 rent calls)
- Cross-BC reads via LeaseFinder (findAllActiveWithRevisionParams) and InseeIndexFinder (findByTypeQuarterYear)
- Prisma @@unique([leaseId, newIndexYear, newIndexQuarter]) for idempotency
- Frontend: RevisionTable + CalculateRevisionsDialog + /revisions page + sidebar nav
- E2E: 4 tests in serial mode (seed + empty state + batch calculation + sidebar navigation)
- Task 1.4 (VOs) adapted: formula logic lives in IndexCalculatorService (pure function) rather than separate VOs — simpler, YAGNI

### Change Log
- 2026-02-14: Story implemented and marked for review
- 2026-02-14: Code review (Claude Opus 4.6) — 10 findings (3H/4M/3L), 9 fixes applied:
  - H1: Cross-entity data leak — `findByTypeQuarterYear` now requires `entityId` parameter (security fix)
  - H2: Dead code — removed unused `RevisionAlreadyCalculatedException` and `MissingIndexException` + empty `exceptions/` dir
  - H3: Fixed by H1 — finder signature now matches story spec
  - M1: Double-click guard added to `CalculateRevisionsDialog.handleCalculate`
  - M2: Error state display added to dialog + test for error case
  - M3: Added `useRevisions` query hook tests (fetch + disabled when undefined)
  - M4: Renamed `use-calculate-revisions.test.ts` → `use-revisions.test.ts` to match module
  - L3: E2E selector scoped to `table` for robustness (`page.locator("table").getByText("IRL")`)
  - Controller test assertion added verifying entityId passed to index lookup
  - L1/L2 not fixed (YAGNI — no centralized formatEuros or pluralize helper exists in project, 13+ files affected)

### File List

**New files (27):**
- `backend/src/indexation/revision/__tests__/calculate-a-revision.handler.spec.ts`
- `backend/src/indexation/revision/__tests__/index-calculator.service.spec.ts`
- `backend/src/indexation/revision/__tests__/mock-cqrx.ts`
- `backend/src/indexation/revision/__tests__/revision.aggregate.spec.ts`
- `backend/src/indexation/revision/commands/calculate-a-revision.command.ts`
- `backend/src/indexation/revision/commands/calculate-a-revision.handler.ts`
- `backend/src/indexation/revision/events/rent-revision-calculated.event.ts`
- `backend/src/indexation/revision/revision.aggregate.ts`
- `backend/src/indexation/revision/services/index-calculator.service.ts`
- `backend/src/presentation/revision/__tests__/calculate-revisions.controller.spec.ts`
- `backend/src/presentation/revision/__tests__/get-revisions.controller.spec.ts`
- `backend/src/presentation/revision/__tests__/revision.projection.spec.ts`
- `backend/src/presentation/revision/controllers/calculate-revisions.controller.ts`
- `backend/src/presentation/revision/controllers/get-revisions.controller.ts`
- `backend/src/presentation/revision/finders/revision.finder.ts`
- `backend/src/presentation/revision/projections/revision.projection.ts`
- `backend/src/presentation/revision/revision-presentation.module.ts`
- `frontend/e2e/revisions.spec.ts`
- `frontend/src/app/(auth)/revisions/page.tsx`
- `frontend/src/components/features/revisions/__tests__/calculate-revisions-dialog.test.tsx`
- `frontend/src/components/features/revisions/__tests__/revision-table.test.tsx`
- `frontend/src/components/features/revisions/__tests__/revisions-page.test.tsx`
- `frontend/src/components/features/revisions/calculate-revisions-dialog.tsx`
- `frontend/src/components/features/revisions/revision-table.tsx`
- `frontend/src/hooks/__tests__/use-revisions.test.ts`
- `frontend/src/hooks/use-revisions.ts`
- `frontend/src/lib/api/revisions-api.ts`

**Modified files (5):**
- `backend/prisma/schema.prisma` — Added Revision model
- `backend/src/app.module.ts` — Registered RevisionPresentationModule
- `backend/src/presentation/insee-index/finders/insee-index.finder.ts` — Added findByTypeQuarterYear method (with entityId param, review fix)
- `backend/src/presentation/lease/finders/lease.finder.ts` — Added findAllActiveWithRevisionParams method
- `frontend/src/components/layout/sidebar.tsx` — Added "Révisions" nav item
