# Story 3.6: Terminate a Lease with Pro-Rata Calculation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to terminate a lease by setting an end date, with the system calculating pro-rata amounts for partial periods,
So that final billing is accurate when a tenant leaves (FR16, FR17).

## Acceptance Criteria

1. **Given** I have an active lease, **When** I terminate the lease with an end date, **Then** the event `LeaseTerminated` is stored in KurrentDB with the end date
2. **Given** a lease has been terminated, **When** I view the UnitMosaic on the dashboard, **Then** the unit's status returns to vacant (gray) after the end date has passed
3. **Given** a lease starts or ends mid-month, **When** a rent call is generated for that period, **Then** the system calculates pro-rata: `(number of days in period / total days in month) x monthly amount`
4. **Given** pro-rata applies, **Then** it is applied to all billing lines (rent, provisions, options) and all calculations use integer cents with rounding down to the cent (NFR18)
5. **Given** I have terminated a lease, **When** I view the lease detail page, **Then** I see the termination end date displayed in a "Résiliation" section
6. **Given** I have NOT terminated a lease, **When** I view the lease detail page, **Then** I see a "Résilier ce bail" button in the lease detail
7. **Given** I attempt to terminate a lease that is already terminated, **Then** the system rejects the operation with a clear error
8. **Given** I set a termination end date before the lease start date, **Then** the system rejects the operation with a validation error
9. **Given** a lease is terminated, **When** I view the lease list, **Then** the lease displays a "Résilié" badge with the end date

## Tasks / Subtasks

- [ ] Task 1: Create LeaseEndDate VO and termination domain infrastructure (AC: 1, 7, 8)
  - [ ] 1.1: Create `LeaseEndDate` VO — `lease-end-date.ts` with validation: ISO date string, `static fromString()`, `static empty()`, `get isEmpty(): boolean`, `toISOString()`, `get value(): Date`
  - [ ] 1.2: Create `InvalidLeaseEndDateException` — `.required()`, `.invalid()`, `.beforeStartDate()`
  - [ ] 1.3: Create `LeaseAlreadyTerminatedException` — `.create()` with DomainException base
  - [ ] 1.4: Create `LeaseTerminated` event with fields: `{ leaseId, endDate }`
  - [ ] 1.5: Create `TerminateALeaseCommand` with payload: `{ leaseId, endDate }`
  - [ ] 1.6: Create `TerminateALeaseHandler` — load aggregate, call `terminate()`, save. ZERO business logic in handler.
  - [ ] 1.7: Extend `LeaseAggregate` — add `endDate: LeaseEndDate | null = null` + `terminated = false` state fields, add `terminate(endDate: string)` method with guards (not created → LeaseNotCreatedException, already terminated → LeaseAlreadyTerminatedException, endDate < startDate → InvalidLeaseEndDateException.beforeStartDate), handle `LeaseTerminated` event replay
  - [ ] 1.8: Write aggregate + handler + VO unit tests

- [ ] Task 2: Create pro-rata calculation utility (AC: 3, 4)
  - [ ] 2.1: Create `pro-rata.ts` utility at `backend/src/tenancy/lease/pro-rata.ts` with function `calculateProRataAmountCents(amountCents: number, daysInPeriod: number, totalDaysInMonth: number): number` — uses `Math.floor((daysInPeriod * amountCents) / totalDaysInMonth)`
  - [ ] 2.2: Create helper `daysInMonth(year: number, month: number): number` — `new Date(year, month, 0).getDate()`
  - [ ] 2.3: Create helper `calculateOccupiedDays(startDate: Date, endDate: Date | null, year: number, month: number): number` — compute days of lease overlap within given month
  - [ ] 2.4: Write comprehensive pro-rata unit tests (full month, start mid-month, end mid-month, start+end same month, February leap year, 0 days edge case)

- [ ] Task 3: Create Prisma migration and projection update (AC: 1, 5)
  - [ ] 3.1: Add `endDate DateTime? @map("end_date")` column to Prisma Lease model
  - [ ] 3.2: Run migration
  - [ ] 3.3: Update `lease.projection.ts` — handle `LeaseTerminated` event (update `endDate` column in Prisma)
  - [ ] 3.4: Write projection tests for `LeaseTerminated` event

- [ ] Task 4: Create presentation layer (AC: 1, 7, 8)
  - [ ] 4.1: Create `TerminateALeaseDto` with class-validator decorators: `@IsString() @IsNotEmpty() @IsDateString() endDate`
  - [ ] 4.2: Create `TerminateALeaseController` — `PUT /api/leases/:id/terminate` (202 Accepted), with LeaseFinder authorization check
  - [ ] 4.3: Write controller unit tests (success 202, unauthorized, validation errors, already terminated)

- [ ] Task 5: Create frontend API client, hooks, and termination form (AC: 5, 6, 9)
  - [ ] 5.1: Update `LeaseData` interface in `leases-api.ts` — add `endDate: string | null`
  - [ ] 5.2: Add `terminateLease(leaseId, payload)` to API client — `PUT /leases/:id/terminate`
  - [ ] 5.3: Create `useTerminateLease(leaseId, entityId)` mutation hook with optimistic update + delayed invalidation of `["leases", leaseId]`, `["entities", entityId, "leases"]`, `["entities", entityId, "units"]`, `["entities"]`
  - [ ] 5.4: Create `terminate-lease-schema.ts` — Zod schema: `endDate` (ISO date string, required)
  - [ ] 5.5: Create `terminate-lease-dialog.tsx` — AlertDialog with date input for end date, confirmation text "Voulez-vous résilier ce bail ?", cancel/confirm buttons, pro-rata preview display
  - [ ] 5.6: Write terminate-lease-dialog frontend tests

- [ ] Task 6: Update lease detail page and list (AC: 2, 5, 6, 9)
  - [ ] 6.1: Add "Résiliation" Card section to `LeaseDetailContent` — 2-state: not terminated (show "Résilier ce bail" button) / terminated (show end date display)
  - [ ] 6.2: "Résilier ce bail" button opens `TerminateLeaseDialog` (AlertDialog pattern)
  - [ ] 6.3: When terminated, display end date formatted as French date, with Badge "Résilié"
  - [ ] 6.4: Update lease list to show "Résilié" Badge next to terminated leases (where `endDate !== null`)
  - [ ] 6.5: Update UnitMosaic occupancy logic: filter out terminated leases (where `endDate !== null && new Date(endDate) <= new Date()`) from `occupiedUnitIds` Set
  - [ ] 6.6: Write lease detail page frontend tests for termination section
  - [ ] 6.7: Write unit mosaic test for terminated lease vacancy

- [ ] Task 7: E2E tests (AC: 1, 2, 5, 9)
  - [ ] 7.1: Add `terminateLease(leaseId, payload)` API fixture method
  - [ ] 7.2: E2E: Terminate lease via UI → verify "Résilié" badge on detail page
  - [ ] 7.3: E2E: Verify terminated lease unit returns to vacant (gray) on dashboard UnitMosaic

## Dev Notes

### Architecture Decisions

- **Third operation on LeaseAggregate**: Stories 3.4 and 3.5 introduced the first two update operations (`configureBillingLines`, `configureRevisionParameters`). This story adds a third: `terminate()`. Same pattern: load aggregate → call method → save. Key difference: termination is irreversible — no "update" after termination.
- **LeaseTerminated as separate event**: `LeaseTerminated` is a new event, NOT a modification of `LeaseCreated`. Follows the backward-compatible event pattern. Old leases without termination produce `endDate = null` via Prisma nullable default.
- **PUT endpoint for terminate**: `PUT /api/leases/:id/terminate` — not DELETE (the lease is not deleted, it's terminated with an end date). The lease data remains for audit trail, charge regularization (Epic 7), and historical reference.
- **Nullable Prisma column**: `endDate DateTime?` — nullable because a lease exists without termination. Frontend detects "not yet terminated" via `endDate === null`.
- **No no-op guard**: Unlike billing lines and revision parameters, lease termination is a definitive one-time action. Once terminated, the lease cannot be "un-terminated". The `LeaseAlreadyTerminatedException` guard prevents re-termination.
- **Pro-rata as utility, NOT stored**: Pro-rata amounts are **calculated on demand** during rent call generation (Story 4.1), NOT stored in the lease itself. This story implements the pro-rata calculation utility as a pure function for Story 4.1 to consume. The lease only stores the `endDate` fact.
- **UnitMosaic vacancy after termination**: The frontend derives vacancy from lease existence + `endDate`. A terminated lease with `endDate <= today` makes the unit vacant. No need for a separate `isActive` field — derivable from `endDate`.
- **AlertDialog pattern for termination**: Uses the same AlertDialog confirmation pattern established for bank account deletion (Story 2.2). Destructive action requires explicit confirmation.
- **End date validation**: The aggregate validates that `endDate >= startDate`. The VO validates ISO format. Controller-level DTO validates `@IsDateString()`.

### Value Objects

| VO | File | Type | Validation | Null Object |
|---|---|---|---|---|
| LeaseEndDate | `lease-end-date.ts` | Date (nullable) | ISO date string, valid date | Yes (`.empty()`, `.isEmpty`) |

LeaseEndDate follows the same pattern as `LeaseStartDate` (private constructor, static `fromString()`, `toISOString()`). Adds Null Object pattern because the end date is null for active leases.

### Events

| Event | Trigger | Data Fields |
|---|---|---|
| `LeaseTerminated` | TerminateALeaseCommand | `{ leaseId, endDate }` |

Metadata: `{ userId, entityId, timestamp, correlationId }`

### Commands

| Command | Handler | Logic |
|---|---|---|
| `TerminateALeaseCommand` | `TerminateALeaseHandler` | Load existing LeaseAggregate, call `terminate(endDate)`, save. Handler has ZERO business logic. |

Command payload: `{ leaseId, endDate: string }`

### API Endpoints

| Method | Path | Purpose | Response |
|---|---|---|---|
| `PUT` | `/api/leases/:id/terminate` | Terminate a lease | 202 Accepted (no body) |

Existing endpoints unchanged:
- `POST /api/entities/:entityId/leases` — Create lease
- `GET /api/entities/:entityId/leases` — List leases (now includes `endDate` field)
- `GET /api/leases/:id` — Get single lease (now includes `endDate` field)
- `PUT /api/leases/:id/billing-lines` — Configure billing lines
- `PUT /api/leases/:id/revision-parameters` — Configure revision parameters

**Authorization flow** (controller-level):
1. Extract `userId` from JWT via `@CurrentUserId()`
2. Verify lease ownership: `LeaseFinder.findByIdAndUser(leaseId, userId)` → throw UnauthorizedException
3. Validate DTO (class-validator)
4. Dispatch command

### Pro-Rata Calculation Utility

```typescript
// Pure function — no side effects, deterministic
function calculateProRataAmountCents(
  amountCents: number,
  daysInPeriod: number,
  totalDaysInMonth: number,
): number {
  return Math.floor((daysInPeriod * amountCents) / totalDaysInMonth);
}

// Helper: days in a given month
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Helper: compute occupied days within a month for a lease
function calculateOccupiedDays(
  leaseStartDate: Date,
  leaseEndDate: Date | null,
  year: number,
  month: number, // 1-indexed (January=1)
): number {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // last day of month

  const effectiveStart = leaseStartDate > monthStart ? leaseStartDate : monthStart;
  const effectiveEnd = leaseEndDate && leaseEndDate < monthEnd ? leaseEndDate : monthEnd;

  if (effectiveStart > effectiveEnd) return 0;

  const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusive
}
```

**Critical rules**:
- `Math.floor` for rounding DOWN (NFR18 — truncation per French rental law)
- All monetary values as integer cents — NO floating point
- Multiplication BEFORE division to preserve precision: `(daysInPeriod * amountCents) / totalDaysInMonth`
- Pro-rata applies to EACH billing line independently (rent, provisions, options)
- Deterministic: replaying from events produces identical results (NFR15)

**Example calculations**:
```
Monthly rent: €630.00 = 63000 cents, January (31 days), tenant leaves on Jan 15:
  - Occupied days: 15 (Jan 1-15 inclusive)
  - Pro-rata: floor((15 * 63000) / 31) = floor(30483.87...) = 30483 cents = €304.83

Monthly provision: €80.00 = 8000 cents, January (31 days), same scenario:
  - Pro-rata: floor((15 * 8000) / 31) = floor(3870.96...) = 3870 cents = €38.70
```

### Prisma Model Update

```prisma
model Lease {
  // ... existing fields ...
  endDate              DateTime? @map("end_date")
  // ... relations unchanged ...
}
```

Nullable — lease created without termination, terminated by adding end date.

### LeaseAggregate Extension

```typescript
// New fields in aggregate state
private endDate: LeaseEndDate | null = null;
private terminated = false;

// New method
terminate(endDate: string): void {
  if (!this.created) {
    throw LeaseNotCreatedException.create();
  }
  if (this.terminated) {
    throw LeaseAlreadyTerminatedException.create();
  }

  const voEndDate = LeaseEndDate.fromString(endDate);

  // Validate: end date must be >= start date
  if (voEndDate.value.getTime() < this.startDate.value.getTime()) {
    throw InvalidLeaseEndDateException.beforeStartDate();
  }

  this.apply(
    new LeaseTerminated({
      leaseId: this.id,
      endDate: voEndDate.toISOString(),
    }),
  );
}

// Event replay handler
@EventHandler(LeaseTerminated)
onLeaseTerminated(event: LeaseTerminated): void {
  this.endDate = LeaseEndDate.fromString(event.data.endDate);
  this.terminated = true;
}
```

### Frontend Zod Schema

```typescript
const terminateLeaseSchema = z.object({
  endDate: z.string().min(1, { error: "Date de fin requise" }),
});
```

**Critical rules**:
- NO `.default()` on schema — use `defaultValues` in `useForm()`
- Simple string validation — ISO date parsing done on submit
- Use `{ error: "..." }` (Zod v4 API)

### Termination Display

| Field | Label | Display |
|---|---|---|
| End date | Date de fin | "15 Mars 2026" (French formatted date) |
| Status | Statut | Badge "Résilié" (destructive variant) |

### UnitMosaic Occupancy Update

```typescript
// Current (Story 3.3):
const occupiedUnitIds = useMemo(() => {
  if (!leases) return new Set<string>();
  return new Set(leases.map((l) => l.unitId));
}, [leases]);

// Updated for termination:
const occupiedUnitIds = useMemo(() => {
  if (!leases) return new Set<string>();
  const now = new Date();
  return new Set(
    leases
      .filter((l) => !l.endDate || new Date(l.endDate) > now)
      .map((l) => l.unitId),
  );
}, [leases]);
```

### Cross-Query Cache Invalidation

Lease termination must invalidate:
- `["leases", leaseId]` — lease detail (primary)
- `["entities", entityId, "leases"]` — lease list (terminated status may appear in list)
- `["entities", entityId, "units"]` — unit vacancy status changes
- `["entities"]` — dashboard data

Use `setTimeout(1500ms)` delayed invalidation pattern (established in Story 2.1).

### Testing Standards

**Backend (Jest)**:
- LeaseEndDate VO: valid ISO date, invalid string, required (empty), empty(), isEmpty (~5 tests)
- LeaseAlreadyTerminatedException: create() (~1 test)
- InvalidLeaseEndDateException: required(), invalid(), beforeStartDate() (~3 tests)
- LeaseAggregate.terminate: valid termination, reject before create, reject already terminated, reject end date before start date (~5 tests)
- TerminateALeaseHandler: success, aggregate-not-found (~2 tests)
- TerminateALeaseController: success 202, unauthorized, validation errors (~4 tests)
- Lease projection: on LeaseTerminated → update endDate, idempotent, missing lease warning (~3 tests)
- Pro-rata utility: full month (31 days), start mid-month, end mid-month, start+end same month, February (28 days), February leap year (29 days), 0 days edge case, rounding down verification (~10 tests)

**Frontend (Vitest)**:
- TerminateLeaseDialog: render fields, submit valid data, cancel closes dialog, validation errors (~5 tests)
- Lease detail page: termination section display (active lease → button, terminated lease → date + badge), termination dialog opens on click (~5 tests)
- Lease list: "Résilié" badge display (~2 tests)
- UnitMosaic: terminated lease → unit is vacant (gray) (~2 tests)

**E2E (Playwright)**:
- Terminate lease → verify "Résilié" badge on detail page (~1 test)
- Verify terminated lease unit returns to vacant on dashboard (~1 test)

### Previous Story Intelligence

**From Story 3.5 (Revision Parameters)**:
- Third update operation on LeaseAggregate — same handler pattern
- `LeaseFinder.findByIdAndUser()` for authorization — already exists
- `LeaseNotCreatedException` — already exists, reuse
- `LeaseDetailContent` has 3 Card sections already — add 4th for termination
- Private constructor exceptions: use `toThrow(DomainException)` or `toThrow('message string')` in tests
- Day+Month calendar validation example — useful pattern for date validation

**From Story 3.4 (Billing Lines)**:
- PUT endpoint pattern: `PUT /api/leases/:id/billing-lines` → clone for `PUT /api/leases/:id/terminate`
- `vi.fn()` mock type mismatch fix: use `(...args: unknown[]) => void` type declaration
- Index-based Map key for billing lines — NOT applicable here (termination is single value)

**From Story 3.3 (Leases)**:
- LeaseAggregate initial structure — `created` flag pattern, reuse for `terminated` flag
- UnitMosaic occupancy derived from `useLeases` — update filtering logic
- E2E serial mode with seed test — add termination test after seed

**From Story 2.2 (Bank Accounts — AlertDialog pattern)**:
- AlertDialog for delete/destructive confirmation — clone for termination confirmation
- `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`

**From Story C.1 (Frontend Testing)**:
- Radix UI in jsdom requires polyfills (ResizeObserver, hasPointerCapture, scrollIntoView) — already in setup.ts
- `container.querySelector("form")` for forms without accessible name
- Mock pattern for hooks: `vi.mock()` in test file, mock all exports from module

### Known Pitfalls to Avoid

1. **DO NOT store pro-rata amounts in the lease** — pro-rata is calculated on-demand during rent call generation (Story 4.1), not during termination
2. **DO NOT use DELETE HTTP method** — the lease is not deleted, it's terminated. Use `PUT /api/leases/:id/terminate`
3. **DO NOT allow re-termination** — once terminated, the lease cannot be "un-terminated". Guard with `LeaseAlreadyTerminatedException`
4. **DO NOT forget to update UnitMosaic** — filter out terminated leases from `occupiedUnitIds` computation
5. **DO NOT use floating-point for pro-rata** — `Math.floor((days * cents) / totalDays)` ensures integer result with truncation (NFR18)
6. **DO NOT multiply AFTER division** — `(daysInPeriod * amountCents) / totalDaysInMonth` preserves precision (integer multiplication before integer division)
7. **DO NOT forget cross-aggregate authorization** at controller level (LeaseFinder.findByIdAndUser)
8. **DO NOT forget `prisma generate`** after schema changes
9. **DO NOT modify LeaseCreated event** — create new `LeaseTerminated` event for backward compatibility
10. **DO NOT call `invalidateQueries` immediately** — use delayed invalidation (1500ms) pattern
11. **DO NOT use `.default()` or `.refine()` on Zod schema** with zodResolver
12. **DO NOT add logic in command handler** — all business rules in aggregate
13. **DO NOT forget to invalidate units cache** — termination changes unit vacancy status, requiring `["entities", entityId, "units"]` invalidation

### Project Structure Notes

**New files to create:**

```
backend/src/tenancy/lease/lease-end-date.ts
backend/src/tenancy/lease/pro-rata.ts
backend/src/tenancy/lease/exceptions/invalid-lease-end-date.exception.ts
backend/src/tenancy/lease/exceptions/lease-already-terminated.exception.ts
backend/src/tenancy/lease/commands/terminate-a-lease.command.ts
backend/src/tenancy/lease/commands/terminate-a-lease.handler.ts
backend/src/tenancy/lease/events/lease-terminated.event.ts
backend/src/tenancy/lease/__tests__/lease-end-date.spec.ts
backend/src/tenancy/lease/__tests__/pro-rata.spec.ts
backend/src/tenancy/lease/__tests__/terminate-a-lease.handler.spec.ts
backend/src/presentation/lease/controllers/terminate-a-lease.controller.ts
backend/src/presentation/lease/dto/terminate-a-lease.dto.ts
backend/src/presentation/lease/__tests__/terminate-a-lease.controller.spec.ts
backend/prisma/migrations/YYYYMMDDHHMMSS_add_end_date_to_lease/migration.sql
frontend/src/components/features/leases/terminate-lease-dialog.tsx
frontend/src/components/features/leases/terminate-lease-schema.ts
frontend/src/components/features/leases/__tests__/terminate-lease-dialog.test.tsx
```

**Files to modify:**

```
backend/src/tenancy/lease/lease.aggregate.ts                    (add endDate + terminated fields, terminate() method, LeaseTerminated event handler)
backend/src/tenancy/lease/lease.module.ts                       (register TerminateALeaseHandler)
backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts     (add terminate tests)
backend/src/presentation/lease/lease-presentation.module.ts     (register TerminateALeaseController)
backend/src/presentation/lease/projections/lease.projection.ts  (handle LeaseTerminated event)
backend/src/presentation/lease/__tests__/lease.projection.spec.ts (add LeaseTerminated test)
backend/prisma/schema.prisma                                    (add endDate column)
frontend/src/lib/api/leases-api.ts                              (add endDate to LeaseData + terminateLease API call)
frontend/src/hooks/use-leases.ts                                (add useTerminateLease hook)
frontend/src/components/features/leases/lease-detail-content.tsx (add termination Card section + dialog trigger)
frontend/src/components/features/dashboard/unit-mosaic.tsx       (filter terminated leases from occupiedUnitIds)
frontend/src/app/(auth)/leases/[id]/__tests__/lease-detail-page.test.tsx (add termination tests)
frontend/src/app/(auth)/leases/__tests__/leases-page.test.tsx   (add "Résilié" badge test)
frontend/e2e/fixtures/api.fixture.ts                            (add terminateLease fixture)
frontend/e2e/leases.spec.ts                                     (add termination E2E tests)
_bmad-output/implementation-artifacts/sprint-status.yaml
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.6] — User story, acceptance criteria, FR16, FR17
- [Source: _bmad-output/planning-artifacts/architecture.md — Bounded Contexts] — Tenancy BC contains Lease aggregate (FR9-17)
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture] — `lease-{id}` stream, `leases` table
- [Source: _bmad-output/planning-artifacts/architecture.md — Naming Conventions] — VerbANoun commands, PastTense events
- [Source: _bmad-output/planning-artifacts/architecture.md — Controller Pattern] — One controller per action, 202 Accepted
- [Source: _bmad-output/planning-artifacts/architecture.md — Value Objects] — Private constructor, static factory, Null Object pattern
- [Source: _bmad-output/planning-artifacts/prd.md — FR16] — Terminate a lease with an end date
- [Source: _bmad-output/planning-artifacts/prd.md — FR17] — System calculates pro-rata amounts when a lease starts or ends mid-period
- [Source: _bmad-output/planning-artifacts/prd.md — NFR18] — All financial amounts stored and calculated with 2-decimal precision, no floating-point arithmetic on money
- [Source: _bmad-output/implementation-artifacts/3-5-configure-lease-revision-parameters.md] — PUT endpoint pattern, inline edit, LeaseNotCreatedException reuse
- [Source: _bmad-output/implementation-artifacts/3-4-configure-billing-lines-per-lease.md] — PUT full replacement pattern, vi.fn() mock type fix
- [Source: _bmad-output/implementation-artifacts/3-3-create-a-lease-linking-tenant-to-unit.md] — LeaseAggregate structure, UnitMosaic occupancy derivation, E2E serial mode
- [Source: _bmad-output/implementation-artifacts/2-2-associate-bank-accounts-to-an-entity.md] — AlertDialog delete confirmation pattern
- [Source: docs/project-context.md — CQRS/ES Patterns] — Optimistic UI, delayed invalidation
- [Source: docs/project-context.md — Form Patterns] — Zod + react-hook-form, no .default()
- [Source: docs/anti-patterns.md] — DTO checklist, guard clauses, named exceptions
- [Source: docs/dto-checklist.md] — @IsDateString for date fields, @IsNotEmpty on required fields

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
