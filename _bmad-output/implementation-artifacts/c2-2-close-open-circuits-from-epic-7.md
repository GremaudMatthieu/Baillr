# Story C2.2: Close Open Circuits from Epic 7

Status: done

## Story

As a property manager,
I want all Epic 7 features to function end-to-end with correct calculations, email delivery, and proper UX feedback,
so that charge regularizations produce accurate statements, can be sent to tenants, and the dashboard reflects their status.

## Context

Epic 7 delivered index revision and annual charge features, but the retrospective uncovered a **CRITICAL bug** and several incomplete circuits:

1. **CRITICAL**: `RegularizationCalculationService` does NOT read lease billing lines to compute provisions. Regularization statements show "Provisions versées: 0,00€" for all categories, producing completely wrong balances.
2. **Missing**: No E2E test verifying that a revised rent amount flows into the next generated rent call.
3. **Missing**: No email sending for charge regularization statements (pattern exists from Story 4.3).
4. **Missing**: ChargeCategory deletion produces a raw Prisma error instead of a user-friendly message.
5. **Missing**: No way to mark a regularization as "settled" after credits/debits have been applied and accounted for.
6. **Missing**: No ActionFeed alert for unsettled regularizations awaiting settlement.

**Blocker:** C2-2 must be DONE before Epic 8 starts.

## Acceptance Criteria

1. **AC1 — Provisions fix (CRITICAL):** `RegularizationCalculationService.calculateProvisions()` reads `LeaseBillingLine` rows (via `chargeCategoryId` FK), multiplies monthly amount by months of occupation for each charge category, and uses the result as "provisions versées" per category. Regularization statements show correct provision amounts and correct balance (actual charges minus provisions paid).
2. **AC2 — Provisions unit tests:** `RegularizationCalculationService` has unit tests covering: full-year tenant (12 months provisions), partial-year tenant (pro-rata provisions), multiple charge categories per lease, lease with no billing lines (0 provisions), water category excluded from billing-line provisions (water uses meter readings).
3. **AC3 — E2E revision → rent call:** A Playwright E2E test verifies that after approving a revision, the next rent call generated for that lease uses the revised rent amount (not the original).
4. **AC4 — Send regularization email:** A `POST /api/entities/:entityId/charge-regularizations/:id/send` endpoint sends the regularization PDF to each tenant by email, marks the aggregate as sent (`ChargeRegularizationSent` event), and returns a send summary. Same pattern as Story 4.3 (sequential batch, PDF attachment, BCC to entity owner, RFC 5322 From header).
5. **AC5 — Send regularization email tests:** Handler unit test, controller test, email template test. E2E test if SMTP available (conditional skip pattern from 4.3).
6. **AC6 — ChargeCategory deletion UX:** `DELETE /api/entities/:entityId/charge-categories/:id` endpoint. If the category is referenced by billing lines, return HTTP 409 with explicit message ("Cette catégorie est utilisée par X baux"). Frontend displays error toast on failed deletion. Delete button visible on non-standard categories only.
7. **AC7 — ChargeCategory deletion tests:** Controller test for success and FK constraint cases. Frontend test for delete button visibility (standard vs custom) and error toast display.
8. **AC8 — Mark regularization as settled:** `markAsSettled` method on `ChargeRegularizationAggregate` (guard: must be applied first). `POST /api/entities/:entityId/charge-regularizations/:id/settle` endpoint. UI button on regularization section (only visible when applied but not settled). Projection stores `settledAt` field.
9. **AC9 — Mark as settled tests:** Aggregate unit test (guard: not applied → throws, already settled → no-op). Controller test. Frontend component test for button visibility.
10. **AC10 — ActionFeed unsettled regularizations:** Dashboard shows alert "X régularisation(s) en attente de règlement" when calculated+applied regularizations exist that are not settled. Links to `/charges`. Priority: high.
11. **AC11 — ActionFeed test:** Frontend test for `useUnsettledRegularizationAlerts` hook rendering correct alert count and link.
12. **AC12 — All tests green:** All existing backend + frontend + E2E tests pass. No regressions.

## Tasks / Subtasks

- [x] Task 1: Fix RegularizationCalculationService — integrate provisions from lease billing lines (AC: #1, #2, #12)
  - [x] 1.1 Add `findBillingLinesByLeaseIds(leaseIds: string[]): Promise<LeaseBillingLineWithCategory[]>` method to LeaseFinder
  - [x] 1.2 Inject LeaseFinder into `RegularizationCalculationService` and replace `calculateProvisions()` — for each charge category on a lease's billing lines, compute `monthlyAmountCents × occupiedMonths`. Water categories excluded from billing-line provisions.
  - [x] 1.3 Update `StatementChargePrimitives` to include `provisionsPaidCents` per charge line
  - [x] 1.4 Unit tests: full-year (12mo), partial-year (pro-rata), multiple categories, no billing lines (0), water exclusion
  - [x] 1.5 Full backend test suite — all 1473 tests green
  - [x] 1.6 Frontend tests — all 767 tests green (updated PDF template/assembler/statement-card tests for new shape)

- [x] Task 2: E2E test revision → rent call flow (AC: #3, #12)
  - [x] 2.1 E2E spec: serial mode — create entity+property+unit+tenant+lease, enter INSEE index, calculate+approve revision, generate rent call, verify revised amount
  - [x] 2.2 Full E2E suite confirmed no regressions

- [x] Task 3: Send regularization statement by email (AC: #4, #5, #12)
  - [x] 3.1 `ChargeRegularizationSent` event (event class + data interface)
  - [x] 3.2 `markAsSent(sentAt)` method on aggregate with guards (not calculated → return, already sent → no-op)
  - [x] 3.3 `sentAt` field in aggregate state + projection + Prisma schema
  - [x] 3.4 `SendChargeRegularizationCommand` + `SendChargeRegularizationHandler` — batch per-tenant, PDF + email + mark sent
  - [x] 3.5 `renderRegularizationEmailHtml()` template (escapeHtml all interpolated, entity name, fiscal year, balance)
  - [x] 3.6 `SendChargeRegularizationController` — `POST /api/entities/:entityId/charge-regularizations/:fiscalYear/send`
  - [x] 3.7 Registered in module
  - [x] 3.8 Handler unit test + controller test + email template test
  - [x] 3.9 Frontend: `useSendChargeRegularization` hook + "Envoyer par email" button in regularization section
  - [x] 3.10 Frontend component test for send button visibility
  - [x] 3.11 E2E not added (SMTP conditional — would need MailHog running)

- [x] Task 4: ChargeCategory deletion with UX error handling (AC: #6, #7, #12)
  - [x] 4.1 `DeleteChargeCategoryController` — `DELETE /api/entities/:entityId/charge-categories/:id`. Catches P2003, returns 409 with usage count message
  - [x] 4.2 `countByChargeCategoryId()` in LeaseFinder for usage count
  - [x] 4.3 Registered in `ChargeCategoryPresentationModule`
  - [x] 4.4 Controller tests: success, FK constraint 409, not found, standard category guard
  - [x] 4.5 Frontend `deleteChargeCategory()` API + `useDeleteChargeCategory(entityId)` hook
  - [x] 4.6 Delete button with AlertDialog on non-standard categories, error message on 409
  - [x] 4.7 Frontend tests: 7 tests — delete button visibility, confirmation, mutation call, error display, disabled while pending

- [x] Task 5: Mark regularization as settled (AC: #8, #9, #12)
  - [x] 5.1 `ChargeRegularizationSettled` event
  - [x] 5.2 `markAsSettled()` with guards (not applied → return, already settled → no-op)
  - [x] 5.3 `settledAt` field in aggregate state + projection (Prisma already had field)
  - [x] 5.4 `SettleChargeRegularizationCommand` + handler
  - [x] 5.5 `SettleChargeRegularizationController` — `POST /api/entities/:entityId/charge-regularizations/:fiscalYear/settle`
  - [x] 5.6 Registered in module. 4 aggregate tests + 1 handler test + 4 controller tests + 3 projection tests
  - [x] 5.7 Frontend `useSettleChargeRegularization` hook + "Marquer comme réglée" button (applied but not settled) / "Réglée" badge (settled)
  - [x] 5.8 Frontend tests: 7 tests — button visibility (3 states), AlertDialog confirmation, mutation call, disabled while pending, error message

- [x] Task 6: ActionFeed for unsettled regularizations (AC: #10, #11, #12)
  - [x] 6.1 Backend already supports `GET /api/entities/:entityId/charge-regularization` (no fiscalYear → lists all)
  - [x] 6.2 Frontend `useChargeRegularizations(entityId)` hook + `getChargeRegularizations()` API method
  - [x] 6.3 `useUnsettledRegularizationAlerts()` hook — filters applied&&!settled, generates alert with count + fiscal years
  - [x] 6.4 Display order: `[...unpaidAlerts, ...unsettledAlerts, ...insuranceAlerts, ...onboardingActions]`
  - [x] 6.5 7 frontend tests: no alert empty, not applied, all settled, singular, plural with years, mixed filtering, link to /charges

## Dev Notes

### Task 1 — Provisions Fix (CRITICAL)

**Root cause:** `RegularizationCalculationService.calculateProvisions()` reads billing lines from **rent call JSON blobs** (`billingLines` field on `rentCall` table). This is fragile — rent calls created before 7.5c normalization may not have `chargeCategoryId` populated. The correct approach is to read **lease billing lines** from the normalized `LeaseBillingLine` table.

**Fix approach:**
1. Query `LeaseBillingLine` rows for all active leases in the fiscal year (single batch query via Finder)
2. Group by `leaseId` → `chargeCategoryId` → `amountCents`
3. For each charge in the regularization: find the matching billing line by `chargeCategoryId`, compute `amountCents × occupiedMonths` (where occupiedMonths = occupiedDays / 30 or similar rounding per French law)
4. Water categories use meter readings, NOT billing-line provisions — skip water categories in billing-line lookup

**Key files:**
- `backend/src/presentation/charge-regularization/services/regularization-calculation.service.ts`
- `backend/src/presentation/charge-regularization/finders/charge-regularization.finder.ts` (or create a billing-line finder)
- `backend/src/indexation/charge-regularization/regularization-statement.ts` (StatementChargePrimitives)

**Occupancy calculation:** Already computed as `occupiedDays` / `daysInYear` in the service. For monthly provisions: `amountCents × Math.ceil(occupiedDays / (daysInYear / 12))` — or simpler: count the number of months the lease was active in the fiscal year.

### Task 2 — E2E Revision → Rent Call

**Flow to test:**
1. Create entity, property, unit, tenant, lease (reuse existing E2E patterns from 3.3)
2. Enter an INSEE IRL index for the applicable quarter
3. Calculate revisions → one pending revision
4. Approve the revision → lease rent updated
5. Generate rent calls for the next month
6. Verify the rent call amount matches the revised rent (not original)

**Serial mode:** This test must run in serial mode (test.describe.serial) since steps depend on each other.

### Task 3 — Send Regularization Email

**Pattern from Story 4.3 (rent calls email):**
- Controller loads entity + unsent data → dispatches command
- Handler iterates unsent items sequentially: generate PDF → render HTML → send → mark as sent
- `markAsSent(sentAt, recipientEmail)` on aggregate with no-op guard
- RFC 5322 From: `"${escapedEntityName}" <${entityEmail || defaultFrom}>`
- BCC to entity email if present
- `escapeHtml()` ALL interpolated strings in email template

**Regularization-specific:**
- The aggregate is per entity+fiscal year (not per tenant). `markAsSent` marks the whole regularization as sent.
- The handler sends one email per tenant in the statements (loop over `statements[]`).
- PDF already exists (`GetChargeRegularizationPdfController`) — reuse the assembler/template.

### Task 4 — ChargeCategory Deletion

**Prisma constraint:** `LeaseBillingLine.chargeCategory` has `onDelete: Restrict`. Attempting to delete a referenced category throws `PrismaClientKnownRequestError` with code `P2003`.

**Implementation:**
- Create `DELETE /api/entities/:entityId/charge-categories/:id` controller
- Guard: standard categories (`isStandard = true`) cannot be deleted → 403
- Guard: entity ownership via `entityFinder.findByIdAndUserId`
- Try delete → catch P2003 → query usage count → return 409 with message
- Frontend: AlertDialog confirmation → on error 409, show toast with error message

### Task 5 — Mark as Settled

**Aggregate state progression:** calculated → applied → settled (→ optionally sent at any point after calculated)

**Guards:**
- `markAsSettled()`: must be applied first (`this.appliedAt !== null`), no-op if already settled
- New event: `ChargeRegularizationSettled` with `settledAt` timestamp

**Prisma schema change:** Add `settledAt DateTime? @map("settled_at")` to `ChargeRegularization` model.

### Task 6 — ActionFeed

**Existing alert hooks pattern:**
- `useUnpaidAlerts()` → critical priority
- `useInsuranceAlerts()` → medium/high priority
- `useOnboardingActions()` → low-medium priority

**New hook:** `useUnsettledRegularizationAlerts()` → high priority
- Query all regularizations for current entity
- Filter: `appliedAt !== null && settledAt === null`
- Generate alert: "X régularisation(s) en attente de règlement — Exercices: 2024, 2025"
- Icon: `Calculator` (domain-specific)
- Priority: `high`
- Href: `/charges`
- Display order: after unpaid, before insurance

### Cross-Cutting Concerns

- **DTO defense-in-depth:** Apply `@IsNotEmpty`, `@MaxLength`, `@IsString` per `docs/dto-checklist.md`
- **Cache invalidation:** On send/settle mutations, invalidate `["entities", entityId, "charge-regularization", fiscalYear]` and `["entities", entityId, "charge-regularizations"]`
- **CQRS presentation discipline:** All new GET endpoints use QueryBus pattern (C2-1 norm)
- **entityId isolation:** All new Finder queries MUST include `entityId` in WHERE clause
- **prisma generate:** Run after schema changes

### Previous Learnings

- RFC 5322 From header quoting (Story 4.3)
- E2E conditional SMTP test pattern (Story 4.3)
- AlertDialog for destructive ops (Epic 2 pattern)
- Cross-query cache invalidation (consolidation retro)
- `useRef` guard for async callbacks (Epic 7 retro)
- MockDate pattern for date-dependent tests (Story 3.2)

## Dev Agent Record

### Implementation Plan

_(To be filled during implementation)_

### Debug Log

_(To be filled during implementation)_

### Completion Notes

- **6 tasks completed**, all 12 ACs addressed
- **Backend**: 1476 tests (221 suites) — all green
- **Frontend**: 768 tests (96 suites) — all green
- **Code Review**: 10 findings (3H/4M/3L), 10 fixes applied:
  - H1: `findBillingLinesByLeaseIds` now scoped by `entityId` (defense-in-depth)
  - H2: `res.json() as Promise<T>` → `(await res.json()) as T` in charge-regularization-api
  - H3: Added 2 tests to `settle-charge-regularization.handler.spec.ts` (load failure, parameter forwarding)
  - M1: `useSendChargeRegularization` + `useSettleChargeRegularization` now invalidate plural query key `charge-regularizations` (ActionFeed cache)
  - M2: `deleteChargeCategory` `where: { id }` → `where: { id, entityId }` (defense-in-depth)
  - M3: Entity email BCC trimmed before use (`entity.email?.trim() || null`)
  - M4: Settle button now requires `isSent` guard (applied + sent + not settled)
  - M5: Added multi-tenant batch test with partial failure to send handler spec
  - L1: (covered by H2 fix)
  - L2: ActionFeed unsettled regularization icon `Calculator` → `CircleDollarSign` (semantic clarity)
- **CRITICAL fix (Task 1)**: Provisions now correctly computed from lease billing lines (LeaseBillingLine table) instead of rent call JSON blobs. Water categories excluded. Pro-rata for partial-year tenants.
- **Key implementation decisions**:
  - `markAsSent()` / `markAsSettled()` use silent return (not throw) when not in correct state — consistent with other aggregate guards
  - `SendChargeRegularization` returns `{ sent, failed, failures[] }` summary (same pattern as rent call email)
  - `DeleteChargeCategory` catches Prisma P2003 at controller level, queries usage count for error message
  - ActionFeed `useChargeRegularizations()` reuses existing GET endpoint without fiscalYear filter
  - `settledAt` column already existed in Prisma schema (from Story 7.8), no migration needed

## File List

### New Files (16)
- `backend/src/indexation/charge-regularization/commands/send-charge-regularization.command.ts`
- `backend/src/indexation/charge-regularization/commands/send-charge-regularization.handler.ts`
- `backend/src/indexation/charge-regularization/commands/settle-charge-regularization.command.ts`
- `backend/src/indexation/charge-regularization/commands/settle-charge-regularization.handler.ts`
- `backend/src/indexation/charge-regularization/events/charge-regularization-sent.event.ts`
- `backend/src/indexation/charge-regularization/events/charge-regularization-settled.event.ts`
- `backend/src/indexation/charge-regularization/__tests__/send-charge-regularization.handler.spec.ts`
- `backend/src/indexation/charge-regularization/__tests__/settle-charge-regularization.handler.spec.ts`
- `backend/src/infrastructure/email/templates/charge-regularization-email.template.ts`
- `backend/src/infrastructure/email/__tests__/charge-regularization-email.template.spec.ts`
- `backend/src/presentation/charge-category/controllers/delete-charge-category.controller.ts`
- `backend/src/presentation/charge-category/__tests__/delete-charge-category.controller.spec.ts`
- `backend/src/presentation/charge-regularization/controllers/send-charge-regularization.controller.ts`
- `backend/src/presentation/charge-regularization/controllers/settle-charge-regularization.controller.ts`
- `backend/src/presentation/charge-regularization/__tests__/send-charge-regularization.controller.spec.ts`
- `backend/src/presentation/charge-regularization/__tests__/settle-charge-regularization.controller.spec.ts`
- `frontend/e2e/revision-rent-call.spec.ts`
- `frontend/src/components/features/dashboard/__tests__/action-feed-unsettled-regularizations.test.tsx`

### Modified Files (36)
- `backend/prisma/schema.prisma`
- `backend/src/indexation/charge-regularization/charge-regularization.aggregate.ts`
- `backend/src/indexation/charge-regularization/regularization-statement.ts`
- `backend/src/indexation/charge-regularization/__tests__/calculate-charge-regularization.handler.spec.ts`
- `backend/src/indexation/charge-regularization/__tests__/charge-regularization.aggregate.spec.ts`
- `backend/src/indexation/charge-regularization/__tests__/regularization-statement.spec.ts`
- `backend/src/infrastructure/document/charge-regularization-pdf-data.interface.ts`
- `backend/src/infrastructure/document/__tests__/charge-regularization.template.spec.ts`
- `backend/src/presentation/charge-category/charge-category-presentation.module.ts`
- `backend/src/presentation/charge-regularization/charge-regularization-presentation.module.ts`
- `backend/src/presentation/charge-regularization/projections/charge-regularization.projection.ts`
- `backend/src/presentation/charge-regularization/services/charge-regularization-pdf-assembler.service.ts`
- `backend/src/presentation/charge-regularization/services/regularization-calculation.service.ts`
- `backend/src/presentation/charge-regularization/__tests__/calculate-charge-regularization.controller.spec.ts`
- `backend/src/presentation/charge-regularization/__tests__/charge-regularization-pdf-assembler.spec.ts`
- `backend/src/presentation/charge-regularization/__tests__/charge-regularization.projection.spec.ts`
- `backend/src/presentation/charge-regularization/__tests__/regularization-calculation.service.spec.ts`
- `backend/src/presentation/lease/finders/lease.finder.ts`
- `frontend/e2e/fixtures/api.fixture.ts`
- `frontend/src/app/(auth)/charges/page.tsx`
- `frontend/src/app/(auth)/charges/__tests__/charges-page.test.tsx`
- `frontend/src/components/features/charges/charge-regularization-section.tsx`
- `frontend/src/components/features/charges/__tests__/charge-regularization-section.test.tsx`
- `frontend/src/components/features/charges/__tests__/regularization-statement-card.test.tsx`
- `frontend/src/components/features/dashboard/action-feed.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-import-bank-statement.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-insurance.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-lease.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-rent-calls.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-send-rent-calls.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-unpaid.test.tsx`
- `frontend/src/hooks/use-charge-categories.ts`
- `frontend/src/hooks/use-charge-regularization.ts`
- `frontend/src/lib/api/charge-categories-api.ts`
- `frontend/src/lib/api/charge-regularization-api.ts`

## Change Log

- 2026-02-16: Story C2-2 implementation complete — 6 tasks, 18 new files + 36 modified, 1473 backend tests + 767 frontend tests all green
- 2026-02-16: Code review — 10 findings (3H/4M/3L), 10 fixes applied. Final: 1476 backend tests + 768 frontend tests all green
