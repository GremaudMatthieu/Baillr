# Story 6.1: Detect Late Payments and Display Unpaid Status

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want the system to automatically detect late payments based on configurable delay thresholds,
So that I am alerted to unpaid rent without manual tracking (FR35).

## Acceptance Criteria

1. **AC1 — Late detection engine:** Given a rent call has been sent (`sentAt IS NOT NULL`) and the due date has passed (monthly due date from lease + configurable delay threshold), When the delay threshold is exceeded (default: 5 days after due date), Then the system marks the rent call as "late" via a computed query (NOT a stored flag — derived from current date vs due date + threshold).

2. **AC2 — Entity-level delay threshold:** Given an entity, When the bailleur configures a custom late payment delay (default: 5 days), Then this threshold is stored on the entity aggregate and used for all late detection computations for that entity's rent calls.

3. **AC3 — UnitMosaic red tiles:** Given a unit has at least one unpaid rent call that exceeds the delay threshold, When the dashboard is displayed, Then the UnitMosaic tile for that unit turns red (`bg-red-100` / `dark:bg-red-900/30`).

4. **AC4 — ActionFeed unpaid alerts:** Given one or more rent calls are late, When the dashboard is displayed, Then the ActionFeed displays alerts: "Loyer impayé — [tenant name] — [amount] — [X jours de retard]" with priority `critical`, sorted by days late descending.

5. **AC5 — Unpaid rent calls list view:** Given the user navigates to `/rent-calls`, When filtering by unpaid status, Then the list shows only rent calls where `sentAt IS NOT NULL AND (paymentStatus IS NULL OR paymentStatus = 'partial') AND daysLate > 0` with a visible "days late" badge per row.

6. **AC6 — Late payment count badge:** Given late rent calls exist for the current entity, When the sidebar navigation is displayed, Then the "Appels de loyer" link shows a count badge with the number of late rent calls.

## Tasks / Subtasks

- [x] Task 1 — Add latePaymentDelayDays to EntityAggregate (AC: #2)
  - [x] 1.1 Create `LatePaymentDelayDays` value object (integer, min 0, max 90, default 5)
  - [x] 1.2 Add `EntityLatePaymentDelayConfigured` event to EntityAggregate
  - [x] 1.3 Add `configureLatePaymentDelay(days: LatePaymentDelayDays)` method to EntityAggregate
  - [x] 1.4 Add `latePaymentDelayDays` field to entity Prisma read model + projection
  - [x] 1.5 Create `ConfigureLatePaymentDelayCommand` + handler
  - [x] 1.6 Create `ConfigureLatePaymentDelayController` (PUT /api/entities/:entityId/late-payment-delay)
  - [x] 1.7 Create DTO with `@IsInt()`, `@Min(0)`, `@Max(90)` validation
  - [x] 1.8 Write aggregate + VO + handler + controller + projection tests

- [x] Task 2 — Expose late payment delay on entity detail frontend (AC: #2)
  - [x] 2.1 Add `latePaymentDelayDays` to entity API response type
  - [x] 2.2 Create `useConfigureLatePaymentDelay` mutation hook
  - [x] 2.3 Add inline editable field on entity detail page (Settings section) — number input with "jours" suffix
  - [x] 2.4 Write frontend component + hook tests

- [x] Task 3 — Implement late detection query logic (AC: #1, #5)
  - [x] 3.1 Create `GetUnpaidRentCallsController` (GET /api/entities/:entityId/rent-calls/unpaid) — returns rent calls with computed `daysLate` and `dueDate`
  - [x] 3.2 Create `UnpaidRentCallFinder` — SQL query joining rent_calls + leases (monthlyDueDate) + entities (latePaymentDelayDays), computing daysLate as `CURRENT_DATE - (month_start + monthlyDueDate - 1 + latePaymentDelayDays)`, filtering `daysLate > 0 AND sentAt IS NOT NULL AND (paymentStatus IS NULL OR paymentStatus = 'partial')`
  - [x] 3.3 Create `GetUnpaidRentCallsQuery` + handler
  - [x] 3.4 Write finder + controller tests with date-based assertions

- [x] Task 4 — Add unpaid status filter to rent calls list page (AC: #5)
  - [x] 4.1 Create `useUnpaidRentCalls(entityId)` query hook
  - [x] 4.2 Add filter toggle (Tabs or Select) on rent calls page: "Tous" | "Impayés"
  - [x] 4.3 Display `daysLate` badge per rent call row (Badge variant destructive, "{X} j de retard")
  - [x] 4.4 Write frontend component tests

- [x] Task 5 — UnitMosaic red for unpaid units (AC: #3)
  - [x] 5.1 Call `useUnpaidRentCalls` in dashboard to get unpaid unit IDs
  - [x] 5.2 Add `unpaidUnitIds` Set to UnitMosaic color logic (RED takes priority over all other colors)
  - [x] 5.3 Update ARIA label for red tiles: "Impayé"
  - [x] 5.4 Write UnitMosaic tests for red color state

- [x] Task 6 — ActionFeed unpaid alerts (AC: #4)
  - [x] 6.1 Create `useUnpaidAlerts()` hook in action-feed — iterates unpaid rent calls, generates alert per late rent call
  - [x] 6.2 Render unpaid alerts BEFORE insurance alerts (highest urgency) with AlertTriangle icon, priority critical
  - [x] 6.3 Alert text: "Loyer impayé — {tenantName} — {amount} — {daysLate} jours de retard"
  - [x] 6.4 Alert href: `/rent-calls?filter=unpaid` (deep link to filtered view)
  - [x] 6.5 Write ActionFeed tests for unpaid alert rendering

- [x] Task 7 — Navigation badge for late rent calls (AC: #6)
  - [x] 7.1 Create `useUnpaidCount(entityId)` hook (or reuse useUnpaidRentCalls with `.length`)
  - [x] 7.2 Add count Badge to sidebar "Appels de loyer" link (variant destructive, only visible when count > 0)
  - [x] 7.3 Write sidebar badge tests

- [x] Task 8 — E2E tests (AC: #1-6)
  - [x] 8.1 Create `e2e/unpaid-detection.spec.ts` — serial mode, seed entity+property+unit+tenant+lease, generate rent call for past month, send it, verify UnitMosaic stays amber (within threshold), advance past threshold, verify red status + ActionFeed alert
  - [x] 8.2 Test entity delay threshold configuration (change to 0 days, verify immediate red)
  - [x] 8.3 Test unpaid filter on rent calls page

## Dev Notes

### Architecture Decision: Computed Late Status (NOT Stored Event)

**Critical:** Late status is NOT a domain event. It is a **computed projection query** based on:
- Current date (`NOW()`)
- Rent call's due date (derived from `lease.monthlyDueDate` + rent call `month`)
- Entity's `latePaymentDelayDays` threshold

**Rationale:**
- Late status changes with time passage (a rent call becomes late simply because days pass)
- Storing a `RentCallMarkedAsLate` event would require a cron job or scheduler to emit events — over-engineering
- A computed query is simpler, always accurate, and requires no background process
- This aligns with the Epic 5 retro insight: "not everything needs event sourcing"
- The architecture.md mentions `@nestjs/schedule` for proactive alerts, but for Story 6.1 (detection + display), computation at query time is sufficient
- Story 6.2+ (escalation actions) will introduce domain events (`ReminderSent`, `FormalNoticeSent`) because those are user-triggered actions with side effects

### Recovery BC: Deferred to Story 6.2

The architecture.md defines a `recovery/` bounded context with `ReminderAggregate`. For Story 6.1, we do NOT create this BC yet — we only need:
1. A new field on EntityAggregate (latePaymentDelayDays)
2. A new Finder in presentation/rent-call (UnpaidRentCallFinder)
3. A new controller endpoint for unpaid queries
4. Frontend display changes

The Recovery BC with ReminderAggregate and escalation saga will be introduced in Story 6.2 when user-triggered actions create domain events.

### Due Date Calculation

The due date for a rent call is computed as:
```
dueDate = new Date(year, monthIndex, lease.monthlyDueDate)
```

Where:
- `rent_call.month` = "2026-02" → year=2026, monthIndex=1 (February)
- `lease.monthlyDueDate` = 5 → 5th of the month
- `dueDate` = 2026-02-05
- `lateAfterDate` = dueDate + entity.latePaymentDelayDays
- `daysLate` = Math.max(0, diffInDays(today, lateAfterDate))

**Edge case:** If `monthlyDueDate` exceeds month length (e.g., 31 in February), JavaScript `new Date(2026, 1, 31)` rolls over to March 3 — this is acceptable behavior (tenant pays at month end effectively).

### Existing Infrastructure to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `RentCallFinder` | `presentation/rent-call/finders/` | Base rent call queries — extend or create sibling `UnpaidRentCallFinder` |
| `useRentCalls(entityId, month)` | `frontend/src/hooks/use-rent-calls.ts` | Existing rent call fetching — add new `useUnpaidRentCalls` alongside |
| `EntityAggregate` | `portfolio/entity/entity.aggregate.ts` | Add `latePaymentDelayDays` field + event |
| `entity.projection.ts` | `presentation/entity/projections/` | Project new field to Prisma |
| `UnitMosaic` | `frontend/src/components/features/dashboard/unit-mosaic.tsx` | Add red color state (priority: red > green > amber > muted) |
| `ActionFeed` | `frontend/src/components/features/dashboard/action-feed.tsx` | Add unpaid alerts section (before insurance alerts) |
| `fetchWithAuth` | `frontend/src/lib/api/` | API calls with JWT |

### UnitMosaic Color Priority (Updated)

```
1. RED (bg-red-100) — Unpaid/late rent call (NEW — highest priority)
2. GREEN (bg-green-100) — Paid/overpaid
3. AMBER (bg-amber-100) — Partially paid or sent but not paid
4. ORANGE (bg-orange-100) — Sent (pending payment) ← Currently exists as amber
5. MUTED (bg-muted) — Vacant or no rent call
```

**Important:** A unit with BOTH a paid current month AND an unpaid past month should show RED (unpaid takes priority over paid for current month).

### ActionFeed Priority Order (Updated)

```
1. CRITICAL — Unpaid rent alerts (NEW — highest urgency)
2. HIGH — Insurance expired/expiring alerts
3. HIGH — "Envoyez vos appels de loyer" (unsent rent calls)
4. HIGH — "Générez vos appels de loyer" (no rent calls for month)
5. MEDIUM — Onboarding progression steps
```

### Project Structure Notes

- Alignment with project-context.md conventions: one controller per action, VOs flat in module, named exceptions, kebab-case files
- EntityAggregate extension follows exact pattern from Story 4.3 (entity email field addition)
- New finder pattern: `UnpaidRentCallFinder` joins rent_calls + leases + entities — first cross-table computed finder
- No new Prisma model needed — only a new column `late_payment_delay_days` on `ownership_entities` table
- Frontend: new `useUnpaidRentCalls` hook follows established pattern from `useRentCalls`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Recovery BC, lines 391-421]
- [Source: _bmad-output/planning-artifacts/architecture.md — BC Directory Pattern, lines 440-466]
- [Source: _bmad-output/planning-artifacts/architecture.md — Scheduling Infrastructure, lines 1260-1261]
- [Source: docs/project-context.md — CQRS/Event Sourcing Patterns]
- [Source: docs/project-context.md — Backend Architecture, Domain Layer Rules]
- [Source: _bmad-output/implementation-artifacts/epic-5-retro-2026-02-14.md — Carry-over items, Epic 6 readiness]
- [Source: backend/src/billing/rent-call/rent-call.aggregate.ts — Current aggregate state]
- [Source: backend/prisma/schema.prisma — RentCall model with paymentStatus field]
- [Source: frontend/src/components/features/dashboard/unit-mosaic.tsx — Color logic, lines 129-154]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Jest `--testPathPattern` deprecation: switched to `--testPathPatterns` for Jest 30 compatibility
- Entity detail lives on edit page (`entities/[id]/edit/page.tsx`), not a separate detail page
- `latePaymentDelayDays` field added to EntityData interface required updates to 6 existing test files with EntityData mocks

### Completion Notes List
- 923 backend tests (122 suites), 567 frontend tests (73 suites), 4 E2E tests
- Late status is computed at query time (NOT a domain event) — no cron/scheduler needed
- UnitMosaic color priority: RED (unpaid) > GREEN (paid) > AMBER (partial/sent) > MUTED (vacant)
- ActionFeed priority: critical (unpaid) > high (insurance/rent calls) > medium (onboarding)
- Sidebar badge: destructive variant Badge with unpaid count on "Appels de loyer" link
- No new Prisma model — only a new column on ownership_entities

### File List

#### New Files (25)
- `backend/src/portfolio/entity/late-payment-delay-days.ts` — LatePaymentDelayDays Value Object
- `backend/src/portfolio/entity/exceptions/invalid-late-payment-delay-days.exception.ts` — Named exception (3 static factories)
- `backend/src/portfolio/entity/events/entity-late-payment-delay-configured.event.ts` — Domain event
- `backend/src/portfolio/entity/commands/configure-late-payment-delay.command.ts` — Command
- `backend/src/portfolio/entity/commands/configure-late-payment-delay.handler.ts` — Handler
- `backend/src/portfolio/entity/__tests__/late-payment-delay-days.spec.ts` — VO tests
- `backend/src/portfolio/entity/__tests__/configure-late-payment-delay.handler.spec.ts` — Handler tests
- `backend/src/presentation/entity/controllers/configure-late-payment-delay.controller.ts` — PUT controller
- `backend/src/presentation/entity/dto/configure-late-payment-delay.dto.ts` — DTO with @IsInt/@Min/@Max validators
- `backend/src/presentation/entity/__tests__/configure-late-payment-delay.controller.spec.ts` — Controller tests
- `backend/src/presentation/rent-call/finders/unpaid-rent-call.finder.ts` — Cross-table computed finder
- `backend/src/presentation/rent-call/controllers/get-unpaid-rent-calls.controller.ts` — GET endpoint
- `backend/src/presentation/rent-call/queries/get-unpaid-rent-calls.query.ts` — Query + handler
- `backend/src/presentation/rent-call/__tests__/unpaid-rent-call.finder.spec.ts` — Finder tests with fakeTimers
- `backend/src/presentation/rent-call/__tests__/get-unpaid-rent-calls.controller.spec.ts` — Controller tests
- `frontend/src/hooks/use-unpaid-rent-calls.ts` — Query hook
- `frontend/src/hooks/use-configure-late-payment-delay.ts` — Mutation hook with optimistic update
- `frontend/src/hooks/__tests__/use-unpaid-rent-calls.test.ts` — Hook tests
- `frontend/src/hooks/__tests__/use-configure-late-payment-delay.test.ts` — Hook tests
- `frontend/src/components/features/entities/late-payment-delay-settings.tsx` — Inline edit component (read/edit mode)
- `frontend/src/components/features/entities/__tests__/late-payment-delay-settings.test.tsx` — Component tests
- `frontend/src/components/features/dashboard/__tests__/action-feed-unpaid.test.tsx` — ActionFeed unpaid alert tests
- `frontend/src/components/layout/__tests__/sidebar-unpaid-badge.test.tsx` — Sidebar badge tests
- `frontend/e2e/unpaid-detection.spec.ts` — E2E tests (4 tests)

#### Modified Files (22)
- `backend/prisma/schema.prisma` — Add latePaymentDelayDays column to ownership_entities
- `backend/src/portfolio/entity/entity.aggregate.ts` — Add latePaymentDelayDays field + event + method
- `backend/src/portfolio/entity/entity.module.ts` — Register ConfigureLatePaymentDelayHandler
- `backend/src/presentation/entity/entity-presentation.module.ts` — Register controller
- `backend/src/presentation/entity/projections/entity.projection.ts` — Project latePaymentDelayDays
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts` — Register UnpaidRentCallFinder + controller + handler
- `frontend/src/lib/api/entities-api.ts` — Add latePaymentDelayDays to EntityData + configureLatePaymentDelay method
- `frontend/src/lib/api/rent-calls-api.ts` — Add UnpaidRentCallData interface + getUnpaidRentCalls method
- `frontend/src/hooks/use-entities.ts` — Add latePaymentDelayDays to optimistic EntityData
- `frontend/src/app/(auth)/entities/[id]/edit/page.tsx` — Add "Paramètres" section with LatePaymentDelaySettings
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx` — Add filter toggle (Tous/Impayés) + unpaid list view
- `frontend/src/components/features/dashboard/unit-mosaic.tsx` — Add red color for unpaid units (highest priority)
- `frontend/src/components/features/dashboard/action-feed.tsx` — Add useUnpaidAlerts + critical priority + AlertTriangle icon
- `frontend/src/components/layout/sidebar.tsx` — Add Badge with unpaid count on rent calls nav link
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic.test.tsx` — Add unpaid mock + red state tests
- `frontend/src/components/features/entities/__tests__/entity-card.test.tsx` — Add latePaymentDelayDays to mock
- `frontend/src/components/features/entities/__tests__/entity-form.test.tsx` — Add latePaymentDelayDays to mock
- `frontend/src/components/features/entities/__tests__/entity-list.test.tsx` — Add latePaymentDelayDays to mock
- `frontend/src/components/layout/__tests__/entity-switcher.test.tsx` — Add latePaymentDelayDays to mock
- `frontend/src/contexts/__tests__/entity-context.test.tsx` — Add latePaymentDelayDays to mock
- `frontend/src/hooks/__tests__/use-entities.test.ts` — Add latePaymentDelayDays to mock
- `frontend/e2e/fixtures/api.fixture.ts` — Add configureLatePaymentDelay + getUnpaidRentCalls + waitForUnpaidRentCallCount

## Senior Developer Review (AI)

**Reviewer:** Monsieur — 2026-02-14
**Outcome:** Approved with fixes (7 fixes applied)

### Findings (2H / 5M / 3L)

**HIGH — Fixed:**
1. **H1** `@IsNotEmpty()` + `@Type(() => Number)` missing on `ConfigureLatePaymentDelayDto.days` — defense-in-depth violation (DTO checklist). Fixed: added both decorators.
2. **H2** `useConfigureLatePaymentDelay.onSettled` did not invalidate unpaid rent calls cache — changing delay threshold left UnitMosaic/ActionFeed stale. Fixed: added `["entities", entityId, "rent-calls", "unpaid"]` invalidation.

**MEDIUM — Fixed:**
3. **M1** E2E test 6.1.1 assertion `sent + failed >= 0` always true. Fixed: replaced with `waitForRentCallCount` to verify projection has processed.
4. **M2** E2E test 6.1.4 selector `'Délai de paiement'` doesn't match actual UI text. Fixed: use heading `'Paramètres'` + exact text `'Délai de retard de paiement :'`.
5. **M3** UnitMosaic `isSent` used `bg-amber-100` instead of `bg-orange-100` — regression from Story 4.3 pattern. Fixed: restored `bg-orange-100 dark:bg-orange-900/30` for sent state.
6. **M4** `UnpaidRentCallFinder` used `new Date()` with time component — timezone-sensitive daysLate calculation. Fixed: normalized to start-of-day with `new Date(year, month, date)`.
7. **M5** DTO missing `@Type(() => Number)` from class-transformer — bundled with H1 fix.

**LOW — Not fixed (acceptable):**
- L1: File List count says 25 but lists 23 new source files (minor doc discrepancy)
- L2: `jest.useFakeTimers()` in backend finder test — acceptable for Jest (warning applies to vitest only)
- L3: Double ownership check in controller+finder — redundant but consistent with project pattern

## Change Log
- 2026-02-14: Story 6.1 implemented — 8 tasks, 25 new files + 22 modified, 923 backend tests (122 suites) + 567 frontend tests (73 suites) + 4 E2E tests
- 2026-02-14: Code review — 7 fixes applied (2H, 5M): DTO defense-in-depth, cache invalidation, E2E robustness, UnitMosaic color regression, timezone normalization
