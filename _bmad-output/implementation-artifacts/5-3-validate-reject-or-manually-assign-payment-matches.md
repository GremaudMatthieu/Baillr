# Story 5.3: Validate, Reject, or Manually Assign Payment Matches

Status: done

## Story

As a bailleur,
I want to validate, reject, or manually assign each proposed payment match,
So that I have full control over reconciliation accuracy (FR30).

## Acceptance Criteria

1. **Given** the system has proposed payment matches **When** I review a MatchingRow **Then** I can validate the match (confirm payment against rent call) and the row turns green with a "Validé" label
2. **Given** I review a proposed match **When** I click the reject button **Then** the match is rejected (marked as not a rent payment) and the row becomes dimmed with strikethrough
3. **Given** an unmatched or rejected transaction **When** I want to manually assign it **Then** I can search and select a different rent call or tenant via a dropdown, and confirm the manual assignment
4. **Given** I validate a match **Then** a `PaymentRecorded` event is stored in KurrentDB with transaction details, rent call reference, and payment amount
5. **Given** I validate or manually assign matches **Then** the `ContinuousFlowStepper` shows progress: Import → Match → **Validate** → Complete, with the current step highlighted
6. **Given** payments are validated **Then** the `UnitMosaic` on the dashboard updates tiles from orange (sent) to green (paid) as payments are confirmed
7. **Given** I have validated all proposed matches **Then** the matching section shows a summary: "{n} paiements validés, {m} rejetés, {a} assignés manuellement"
8. **Given** an ambiguous match with multiple candidates **When** I select a candidate from the dropdown and click validate **Then** the selected match is recorded and the ambiguous row transitions to validated state
9. **Given** I want to validate multiple matches quickly **Then** the validate/reject buttons are keyboard-navigable (Tab between rows, Enter/Space on buttons) with ARIA labels for screen readers (WCAG 2.1 AA)
10. **Given** a rent call has already been validated (paid) **When** the matching algorithm runs **Then** it excludes that rent call from future matching proposals (no double-matching)

## Tasks / Subtasks

- [x] Task 1: Create PaymentRecorded domain event and extend RentCallAggregate (AC: 4, 10)
  - [x] 1.1 Create `PaymentRecorded` event in `billing/rent-call/events/` — fields: `rentCallId`, `entityId`, `transactionId`, `bankStatementId`, `amountCents`, `payerName`, `paymentDate` (ISO), `recordedAt` (ISO)
  - [x] 1.2 Add `recordPayment()` method to `RentCallAggregate` — guards: not created → throw `RentCallNotCreatedException`, already paid → no-op guard. Sets `paidAt`, `transactionId`, `paidAmountCents`
  - [x] 1.3 Add `@EventHandler(PaymentRecorded)` to `RentCallAggregate` — applies `paidAt`, `transactionId`, `paidAmountCents` to state
  - [x] 1.4 Create `RecordAPaymentCommand` — `{ rentCallId, entityId, userId, transactionId, bankStatementId, amountCents, payerName, paymentDate }`
  - [x] 1.5 Create `RecordAPaymentHandler` — loads aggregate, calls `recordPayment()`, saves
  - [x] 1.6 Write aggregate tests: payment recorded success, already paid no-op, not created throws
  - [x] 1.7 Write handler test: success dispatch, aggregate loaded + saved

- [x] Task 2: Add Prisma schema fields and projection for payment recording (AC: 4, 6, 10)
  - [x] 2.1 Add fields to `RentCall` Prisma model: `paidAt DateTime?`, `paidAmountCents Int?`, `transactionId String?`, `bankStatementId String?` (all nullable)
  - [x] 2.2 Run `npx prisma migrate dev --name add-rent-call-payment-fields`
  - [x] 2.3 Handle `PaymentRecorded` event in existing `RentCallProjection` — updates `RentCall` row with payment fields
  - [x] 2.4 Add `findPaidRentCallIds(entityId, userId, month)` method to `RentCallFinder` — returns `string[]` of rent call IDs where `paidAt` is not null
  - [x] 2.5 Write projection tests: updates rent call row, handles missing rent call gracefully
  - [x] 2.6 Write finder test: returns only paid IDs

- [x] Task 3: Create validate/reject/manual-assign controllers and DTOs (AC: 1, 2, 3, 4, 8)
  - [x] 3.1 Create `ValidateMatchDto` — `{ transactionId: string, rentCallId: string, amountCents: number, payerName: string, paymentDate: string }` with `@IsUUID()`, `@IsNotEmpty()`, `@IsInt()`, `@IsDateString()` validators
  - [x] 3.2 Create `RejectMatchDto` — `{ transactionId: string }` with `@IsUUID()`
  - [x] 3.3 Create `ManualAssignMatchDto` — `{ transactionId: string, rentCallId: string, amountCents: number, payerName: string, paymentDate: string }` same validators as validate
  - [x] 3.4 Create `ValidateAMatchController` — `POST /api/entities/:entityId/payments/validate` — dispatches `RecordAPaymentCommand`, returns `202 Accepted`
  - [x] 3.5 Create `RejectAMatchController` — `POST /api/entities/:entityId/payments/reject` — returns `200 OK` (no domain event)
  - [x] 3.6 Create `ManualAssignAMatchController` — `POST /api/entities/:entityId/payments/assign` — dispatches same `RecordAPaymentCommand`
  - [x] 3.7 Register controllers in `BankStatementPresentationModule`
  - [x] 3.8 Write controller tests: validate success 202, reject success 200, manual assign success 202, invalid DTO 400

- [x] Task 4: Wire excludedRentCallIds into matching controller (AC: 10)
  - [x] 4.1 Update `MatchPaymentsController` — call `RentCallFinder.findPaidRentCallIds()` and pass result as `excludedRentCallIds` to `PaymentMatchingService.match()`
  - [x] 4.2 Write updated controller test: verify paid rent calls are excluded from matching

- [x] Task 5: Create frontend API functions and hooks (AC: 1, 2, 3, 7)
  - [x] 5.1 Add `validateMatch(entityId, data)`, `rejectMatch(entityId, data)`, `manualAssignMatch(entityId, data)` to `bank-statements-api.ts`
  - [x] 5.2 Create `useValidateMatch(entityId)` hook — useState-managed with delayed invalidation
  - [x] 5.3 Create `useRejectMatch(entityId)` hook — useState-managed, no invalidation (UI-only)
  - [x] 5.4 Create `useManualAssignMatch(entityId)` hook — useState-managed with delayed invalidation
  - [x] 5.5 Create `usePaymentActions(entityId)` barrel hook combining validate/reject/assign with Map<string, RowStatus> tracking

- [x] Task 6: Update MatchingRow with validate/reject/assign actions and state transitions (AC: 1, 2, 3, 8, 9)
  - [x] 6.1 Add `onValidate(transactionId, rentCallId)`, `onReject(transactionId)`, `onManualAssign(transactionId, rentCallId)` callback props
  - [x] 6.2 Add per-row states: `default`, `validated` (green bg), `rejected` (dimmed, strikethrough), `assigned` (blue bg), `loading` (spinner)
  - [x] 6.3 Implement validate button with ARIA label "Valider le rapprochement"
  - [x] 6.4 Implement reject button with ARIA label "Rejeter le rapprochement"
  - [x] 6.5 Implement manual assignment for UnmatchedRow with Select dropdown + "Assigner le paiement" button
  - [x] 6.6 Implement AmbiguousRow candidate selection + validate with disabled validate when no selection
  - [x] 6.7 Keyboard navigation: tabIndex=0 on rows, Tab between rows, Enter/Space on buttons
  - [x] 6.8 Write component tests: 23 tests for MatchedRow, AmbiguousRow, UnmatchedRow states and actions

- [x] Task 7: Update MatchingProposalsContent with ContinuousFlowStepper and validation summary (AC: 5, 7)
  - [x] 7.1 Create `ContinuousFlowStepper` component with 4 steps, ARIA role="list", aria-current="step"
  - [x] 7.2 Wire validate/reject/assign callbacks from hooks to MatchingRow components
  - [x] 7.3 Track validation progress with ValidationProgress state
  - [x] 7.4 Display ValidationSummaryDisplay with aria-label="Résumé de validation"
  - [x] 7.5 Auto-advance stepper via computeSteps() function
  - [x] 7.6 Integrate ContinuousFlowStepper at top of MatchingProposalsContent
  - [x] 7.7 Pass availableRentCalls (deduplicated from matched+ambiguous) to UnmatchedRow
  - [x] 7.8 Write component tests: 8 stepper tests + 14 proposals tests

- [x] Task 8: Update UnitMosaic and write E2E tests (AC: 6, 9)
  - [x] 8.1 Update UnitMosaic: paidUnitIds Set, sentUnitIds excludes paid, "payé" green label
  - [x] 8.2 Add `paidAt` to `RentCallData` interface in rent-calls-api.ts
  - [x] 8.3 E2E test: seed → import → match → validate → verify row turns green
  - [x] 8.4 E2E test: stepper shows validation progress
  - [x] 8.5 E2E test: reject a match → verify row becomes dimmed
  - [x] 8.6 Write UnitMosaic paid tests: 4 tests for paid/sent/occupied priority

## Dev Notes

### Architecture Decisions

- **No new aggregate for payments**: `PaymentRecorded` is an event on the existing `RentCallAggregate`. A payment "marks" a rent call as paid — it's a state transition on the rent call, not a separate lifecycle. This follows the "child data in existing aggregate" pattern (like insurance on TenantAggregate in Story 3.2).
- **Rejection is UI-only (for now)**: Rejecting a match doesn't write a domain event. It's a frontend-only concern — the transaction is simply excluded from the matching results on next run. If we need rejection persistence later (e.g., for audit), we can add a `PaymentRejected` event. YAGNI for now.
- **Manual assignment = same command**: A manual assignment is semantically the same as validation — it records a payment against a rent call. The only difference is the source (user-selected vs algorithm-proposed). Both dispatch `RecordAPaymentCommand`.
- **Synchronous validation (202 Accepted)**: Validate/assign endpoints dispatch commands and return `202 Accepted`. The frontend uses optimistic UI to show immediate state changes.
- **ContinuousFlowStepper**: First implementation of the stepper mentioned in UX spec. 4 steps: Import → Rapprochement → Validation → Terminé. Steps auto-advance based on progress. The stepper is a pure UI component tracking local state — no backend concept of "flow progress".
- **excludedRentCallIds**: The matching controller now queries paid rent call IDs before calling the matching service. This closes the loop from Story 5.2's `excludedRentCallIds: Set<string>` parameter.

### Previous Story Intelligence

**From Story 5.2 (Auto-Match Payments):**
- `PaymentMatchingService.match()` accepts `excludedRentCallIds` parameter — pass paid rent call IDs from projection
- `MatchingRow` components (`MatchedRow`, `AmbiguousRow`, `UnmatchedRow`) exist but have NO action buttons yet — Story 5.3 adds validate/reject/assign callbacks
- `MatchingProposalsContent` tracks `ambiguousSelections: Map<string, string>` — this state will feed into validation (selected candidate ID for ambiguous matches)
- `useMatchPayments(entityId)` hook returns `{ matchPayments, isPending, error, result }` — reuse `result` to feed into validation UI
- Backend `MatchPaymentsController` has hardcoded `excludedRentCallIds = new Set()` — Task 4 replaces this with real query
- `getMonthOptions()` and `getCurrentMonth()` extracted to `frontend/src/lib/month-options.ts` — reuse in stepper

**From Story 5.1 (Bank Statement Import):**
- `BankStatementFinder.findTransactions()` returns `BankTransaction[]` — provides transaction data for validation commands
- `useBankStatements(entityId)` query hook exists — provides bank statement list for UI
- FormData upload pattern, Multer memoryStorage — no relevance to 5.3 but contextual

**From Story 4.3 (Send Rent Calls by Email):**
- `RentCallSent` event / `markAsSent()` on `RentCallAggregate` — `recordPayment()` follows the exact same pattern (state transition on existing aggregate)
- `sentAt` field on RentCall Prisma model — `paidAt` follows the same nullable DateTime pattern
- `BatchSummary` component pattern — reuse for validation summary display

**From Story 3.2 (Insurance):**
- Backward-compatible event extension on existing aggregate — `PaymentRecorded` is a NEW event type on `RentCallAggregate`, not modifying existing events
- Badge component pattern (InsuranceStatusBadge) — confidence badges already in MatchingRow

**From Story 2.6 (UnitMosaic):**
- UnitMosaic occupancy coloring: green for occupied, orange for sent rent calls (from 4.3) — Story 5.3 adds "paid" = green, "sent-but-unpaid" = orange
- `useLeases()` + `useRentCalls()` for mosaic data derivation — extend to include `paidAt`

### Data Flow

```
Validate match:
  Frontend: user clicks ✓ on MatchedRow
    → POST /api/entities/:entityId/payment-matches/validate
      { transactionId, rentCallId, amountCents, payerName, paymentDate }
    → Controller: validate entity ownership → dispatch RecordAPaymentCommand
    → Handler: load RentCallAggregate → recordPayment() → save
    → Event: PaymentRecorded stored in rent-call-{id} stream
    → Projection: updates RentCall row (paidAt, paidAmountCents, transactionId)
    → Frontend: optimistic update (row turns green immediately)
    → Delayed invalidation: rent calls query refreshed after 1.5s

Reject match:
  Frontend: user clicks ✗ on MatchedRow
    → POST /api/entities/:entityId/payment-matches/reject { transactionId }
    → Controller: returns 200 OK (no domain event)
    → Frontend: optimistic update (row becomes dimmed)
    → On re-match: transaction still appears, rent call still available

Manual assign:
  Frontend: user selects rent call from dropdown on UnmatchedRow → clicks "Assigner"
    → POST /api/entities/:entityId/payment-matches/assign (same payload as validate)
    → Same flow as validate (RecordAPaymentCommand dispatched)
```

### ContinuousFlowStepper Design

```
┌─────────────────────────────────────────────────────────────┐
│ Cycle mensuel — Février 2026                                │
│                                                             │
│ ① Import relevé    ✅ Fichier chargé                        │
│ ② Rapprochement    ✅ 8 rapprochés, 2 non rapprochés       │
│ ③ Validation       🔄 5/10 traités                         │
│ ④ Terminé          ⏳ À venir                               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Validation des rapprochements                           │ │
│ │                                                         │ │
│ │ 709,98€ DOS SANTOS FIRME                               │ │
│ │ → Appel loyer Apt 102 Février  [✓ Valider] [✗ Rejeter] │ │
│ │                                                         │ │
│ │ 986,33€ ACCO F.                                        │ │
│ │ → Appel loyer Apt 302 Février  [✓ Valider] [✗ Rejeter] │ │
│ │                                                         │ │
│ │ 5 paiements validés • 2 rejetés • 1 assigné            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Stepper states:**
- Step 1 (Import): ✅ completed when `bankStatements.length > 0`
- Step 2 (Rapprochement): ✅ completed when `matchResult !== null`
- Step 3 (Validation): 🔄 active when matching done but not all processed, ✅ when all rows handled
- Step 4 (Terminé): ✅ when step 3 complete — shows final summary

**Component structure:**
```typescript
interface FlowStep {
  label: string;
  status: 'pending' | 'active' | 'completed';
  description?: string;
}

function ContinuousFlowStepper({ steps }: { steps: FlowStep[] }) {
  // Horizontal on desktop (flex-row), vertical on mobile (flex-col)
  // ARIA: role="list", each step role="listitem", current step aria-current="step"
}
```

### Rejection Persistence Strategy

For this story, rejection is **client-side only**. When the user rejects a match:
1. Frontend marks the row as rejected (dimmed, strikethrough)
2. The `POST /reject` endpoint returns `200 OK` — it does NOT write to event store
3. On page reload or re-match, the rejected transaction will appear again as a candidate

**Why not persist rejections?**
- YAGNI: the primary flow is validate (>90% of interactions per UX spec)
- Rejection doesn't have financial implications — it just means "this isn't a rent payment"
- If persistence is needed later (audit trail), we add a `PaymentRejectionRecorded` event on a separate `BankTransactionAggregate`
- Keeping it client-side simplifies the domain model significantly

**Future consideration**: Story 5.4 (manual payments) may need to revisit this — cash/check payments are recorded directly, not from bank matching.

### Manual Assignment: Rent Call Search

For `UnmatchedRow`, the user needs to select a rent call to assign. Options:
- Use existing `RentCallFinder.findAllWithRelationsByEntityAndMonth()` — same data as matching
- Filter out already-paid and already-validated rent calls
- Display as a `Select` dropdown: `"{tenant name} — {unit identifier} — {month} — {amount}"` per option
- The available rent calls list comes from the matching result's existing `rentCalls` data (already loaded in the controller response)

**Decision**: Pass available (unmatched) rent calls from the matching result to UnmatchedRow components. No additional API call needed — the data is already available from the `POST /match` response. Add a new field `availableRentCalls: RentCallCandidate[]` to the matching result response.

### Key Patterns to Follow

- **Controller-per-action**: `ValidateAMatchController`, `RejectAMatchController`, `ManualAssignAMatchController` — each handles exactly one route
- **Command naming**: `RecordAPaymentCommand` (verb-a-noun convention)
- **Event naming**: `PaymentRecorded` (past tense)
- **DTO validation**: `@IsUUID()`, `@IsNotEmpty()`, `@IsInt()`, `@IsDateString()` per DTO checklist
- **Optimistic UI**: `onMutate` for immediate state change, `onSettled` with `setTimeout(1500ms)` for delayed invalidation
- **Cross-query cache invalidation**: After validate, invalidate `["entities", entityId, "rent-calls"]` and `["entities"]` for UnitMosaic
- **ARIA**: `aria-label` on validate/reject buttons, `role="list"` on stepper, keyboard navigation
- **Named exceptions**: `RentCallNotCreatedException`, `RentCallAlreadyPaidException` (if needed — or use no-op guard)

### Testing Standards

**Backend (Jest):**
- `RentCallAggregate` payment tests: recordPayment success, already paid no-op, not created throws (~3 tests)
- `RecordAPaymentHandler` tests: success, aggregate loaded + saved (~2 tests)
- `PaymentRecordedProjection` tests: updates rent call row, handles missing row (~2 tests)
- `ValidateAMatchController` tests: success 202, invalid DTO 400, entity not found 401 (~3 tests)
- `RejectAMatchController` tests: success 200 (~1 test)
- `ManualAssignAMatchController` tests: success 202, invalid DTO 400 (~2 tests)
- `RentCallFinder.findPaidRentCallIds` test: returns paid IDs only (~1 test)
- `MatchPaymentsController` updated test: excludedRentCallIds wired (~1 test)

**Frontend (Vitest):**
- `MatchedRow` with validate/reject: click validate → green, click reject → dimmed, loading state (~4 tests)
- `AmbiguousRow` with validate: select + validate → green (~2 tests)
- `UnmatchedRow` with manual assign: select rent call + assign → blue state (~2 tests)
- `ContinuousFlowStepper`: renders 4 steps, advances on state change, ARIA attributes (~3 tests)
- `MatchingProposalsContent` with validation: validate callback wired, summary updates, stepper integration (~4 tests)
- `useValidateMatch`/`useRejectMatch`/`useManualAssignMatch` hooks: trigger API, return state (~3 tests)

**E2E (Playwright):**
- Validate match flow: seed → import → match → validate → verify green row (~1 test)
- UnitMosaic update: verify orange → green after validation (~1 test)
- Reject match: verify dimmed row after rejection (~1 test)

### Project Structure Notes

**New Backend Files:**
- `backend/src/billing/rent-call/events/payment-recorded.event.ts` — new event in existing module
- `backend/src/billing/rent-call/commands/record-a-payment.command.ts` — new command
- `backend/src/billing/rent-call/commands/record-a-payment.handler.ts` — new handler
- `backend/src/billing/rent-call/__tests__/record-a-payment.handler.spec.ts` — handler tests
- `backend/src/presentation/bank-statement/controllers/validate-a-match.controller.ts` — POST validate
- `backend/src/presentation/bank-statement/controllers/reject-a-match.controller.ts` — POST reject
- `backend/src/presentation/bank-statement/controllers/manual-assign-a-match.controller.ts` — POST assign
- `backend/src/presentation/bank-statement/dto/validate-match.dto.ts` — validate DTO
- `backend/src/presentation/bank-statement/dto/reject-match.dto.ts` — reject DTO
- `backend/src/presentation/bank-statement/dto/manual-assign-match.dto.ts` — manual assign DTO
- `backend/src/presentation/bank-statement/controllers/__tests__/validate-a-match.controller.spec.ts`
- `backend/src/presentation/bank-statement/controllers/__tests__/reject-a-match.controller.spec.ts`
- `backend/src/presentation/bank-statement/controllers/__tests__/manual-assign-a-match.controller.spec.ts`
- `backend/src/presentation/bank-statement/projections/payment-recorded.projection.ts` — new projection

**New Frontend Files:**
- `frontend/src/components/features/payments/continuous-flow-stepper.tsx` — stepper component
- `frontend/src/components/features/payments/__tests__/continuous-flow-stepper.test.tsx` — stepper tests
- `frontend/src/hooks/use-payment-actions.ts` — validate/reject/assign hooks
- `frontend/src/hooks/__tests__/use-payment-actions.test.ts` — hook tests

**Modified Backend Files:**
- `backend/src/billing/rent-call/rent-call.aggregate.ts` — add `recordPayment()` + PaymentRecorded handler
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts` — add payment tests
- `backend/src/billing/rent-call/rent-call.module.ts` — register new handler
- `backend/prisma/schema.prisma` — add payment fields to RentCall model
- `backend/src/presentation/bank-statement/bank-statement-presentation.module.ts` — register new controllers
- `backend/src/presentation/bank-statement/controllers/match-payments.controller.ts` — wire excludedRentCallIds
- `backend/src/presentation/rent-call/finders/rent-call.finder.ts` — add findPaidRentCallIds method

**Modified Frontend Files:**
- `frontend/src/components/features/payments/matching-row.tsx` — add validate/reject/assign callbacks and state transitions
- `frontend/src/components/features/payments/__tests__/matching-row.test.tsx` — add action tests
- `frontend/src/components/features/payments/matching-proposals-content.tsx` — wire hooks, add stepper, validation summary
- `frontend/src/components/features/payments/__tests__/matching-proposals-content.test.tsx` — add validation tests
- `frontend/src/components/features/payments/payments-page-content.tsx` — integrate ContinuousFlowStepper
- `frontend/src/lib/api/bank-statements-api.ts` — add validate/reject/assign API functions
- `frontend/src/hooks/use-bank-statements.ts` — add matching result types export if needed
- `frontend/src/components/features/dashboard/action-feed.tsx` — potentially update UnitMosaic coloring logic
- `frontend/e2e/payments.spec.ts` — add E2E validation tests
- `frontend/e2e/fixtures/api.fixture.ts` — add validateMatch, rejectMatch helpers

### Events

| Event | Stream | Fields |
|-------|--------|--------|
| `PaymentRecorded` | `rent-call-{id}` | `rentCallId`, `entityId`, `transactionId`, `bankStatementId`, `amountCents`, `payerName`, `paymentDate` (ISO), `recordedAt` (ISO) |

### Commands

| Command | Handler | Purpose |
|---------|---------|---------|
| `RecordAPaymentCommand` | `RecordAPaymentHandler` | Record a payment (validate or manual assign) against a rent call |

### API Endpoints

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| `POST` | `/api/entities/:entityId/payment-matches/validate` | Validate a match | `ValidateMatchDto` | `202 Accepted` |
| `POST` | `/api/entities/:entityId/payment-matches/reject` | Reject a match | `RejectMatchDto` | `200 OK` |
| `POST` | `/api/entities/:entityId/payment-matches/assign` | Manually assign a match | `ManualAssignMatchDto` | `202 Accepted` |

### Known Pitfalls to Avoid

1. **DO NOT create a separate `Payment` aggregate**: Payments are NOT a separate lifecycle — they mark rent calls as paid. Use `PaymentRecorded` event on `RentCallAggregate`. This prevents the domain model explosion that would come from a separate Payment entity.
2. **DO NOT persist rejections as domain events (yet)**: Rejection is a UI concern in this story. YAGNI. If audit trail is needed later, add it then.
3. **DO NOT call `invalidateQueries` immediately after validate**: Use the established 1.5s delay in `onSettled` for projection catch-up. The optimistic update bridges the gap.
4. **DO NOT load rent calls separately for manual assignment dropdown**: The matching result already contains rent call candidates. Pass `availableRentCalls` from the matching response to `UnmatchedRow`.
5. **DO NOT forget to exclude paid rent calls from matching**: Task 4 is critical — `findPaidRentCallIds()` must be called before `PaymentMatchingService.match()`.
6. **DO NOT use floating-point for payment amounts**: All amounts are integer cents (NFR18).
7. **DO NOT skip ARIA labels on validate/reject buttons**: UX spec explicitly requires labeled buttons (not just icons) — `aria-label="Valider le rapprochement"`, `aria-label="Rejeter le rapprochement"`.
8. **DO NOT auto-validate high-confidence matches**: The UX spec emphasizes "the user supervises with full visibility" — all matches require explicit human confirmation.
9. **DO NOT modify the `BankStatementImported` event or `BankStatementAggregate`**: Payments are recorded on `RentCallAggregate`, not on bank statement.
10. **DO NOT forget `prisma generate`** after adding new fields to the RentCall model.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.3] — User story, acceptance criteria, FR30
- [Source: _bmad-output/planning-artifacts/architecture.md — Billing BC] — `billing/rent-call/` aggregate structure
- [Source: _bmad-output/planning-artifacts/architecture.md — CQRS patterns] — Command handler orchestration, event sourcing
- [Source: _bmad-output/planning-artifacts/architecture.md — Financial Precision] — Integer cents, no floating-point
- [Source: _bmad-output/planning-artifacts/architecture.md — Enforcement Guidelines] — Anti-patterns, named exceptions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — ContinuousFlowStepper] — Stepper component spec (lines 912-920)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — MatchingRow] — Component spec with validate/reject/reassign (lines 922-929)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Journey 2] — Monthly cycle flow (lines 668-741)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Flow Optimization] — Interruptible flows, single-click validation (lines 854-860)
- [Source: _bmad-output/planning-artifacts/prd.md — FR30] — Validate, reject, or manually assign payment matches
- [Source: docs/project-context.md] — CQRS patterns, optimistic UI, testing infrastructure
- [Source: docs/anti-patterns.md] — Named exceptions, DTO checklist
- [Source: 5-2-auto-match-payments-to-rent-calls.md] — Previous story: matching types, service, controller, UI components
- [Source: 5-1-import-bank-statements-from-csv-excel.md] — Bank statement aggregate, parser, finders

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Frontend test collision: `getByText("Rapprochement")` matched both stepper step label AND h2 heading — fixed with `getByRole("heading")`
- Frontend test collision: `getByText(/1 rapproché/)` matched both summary singular and stepper plural "rapprochés" — fixed with exact string match
- Projection architecture: added `PaymentRecorded` case to existing `RentCallProjection` switch (NOT a separate projection file) — consistent with existing event handling pattern

### Completion Notes List

- 8 tasks completed, 814 backend tests (109 suites), 480 frontend tests (63 suites), 4 E2E tests
- PaymentRecorded event on RentCallAggregate (not separate Payment aggregate) — follows Story 3.2 child data pattern
- Rejection is UI-only (no domain event) — YAGNI per story design
- Manual assignment dispatches same RecordAPaymentCommand as validation
- ContinuousFlowStepper: first implementation of 4-step cycle stepper (Import → Rapprochement → Validation → Terminé)
- usePaymentActions barrel hook manages per-row RowStatus via Map<string, RowStatus>
- UnitMosaic: paid → green, sent-but-not-paid → amber, occupied → green, vacant → bg-muted
- Controller URLs use `/payment-matches/` (matches endpoint paths)

### Code Review Fixes (adversarial review — 12 findings, 10 code fixes)

**HIGH fixes:**
- H1: bankStatementId now passed from frontend through DTOs to RecordAPaymentCommand (was hardcoded `''`). Added optional `@IsUUID() bankStatementId?` to ValidateMatchDto and ManualAssignMatchDto. Updated both controllers to use `dto.bankStatementId ?? ''`. Added field to frontend payload interfaces and passed `selectedStatementId` from MatchingProposalsContent.
- H2: Added `@Min(1)` on amountCents and `@MaxLength(255)` on payerName in both ValidateMatchDto and ManualAssignMatchDto (DTO defense-in-depth).

**MEDIUM fixes:**
- M2: Fixed E2E fixture URLs from `/payments/validate` → `/payment-matches/validate` and `/payments/reject` → `/payment-matches/reject` (was URL mismatch with actual controllers).
- M4: Investigated — false positive (fetchWithAuth auto-adds Content-Type: application/json).
- M5: Made ContinuousFlowStepper responsive (`flex-col` on mobile, `sm:flex-row` on desktop), hid connector lines on mobile.
- Dark mode (user-identified): Added `dark:` Tailwind variants to all matching components (MatchedRow, AmbiguousRow, UnmatchedRow row states, confidence badges, section headings, summary text, alert boxes, stepper completed text).

**LOW fixes:**
- L4: Fixed fragile E2E selector — added `.first()` to `page.getByLabel('Valider le rapprochement')` to avoid strict mode violation with multiple matches.
- M1: Created `use-payment-actions.test.ts` — 11 hook tests (validate/reject/assign success+error, barrel hook progress tracking, error aggregation).

**Not fixed (architectural note):**
- M3: RecordAPaymentHandler registered in BankStatementPresentationModule instead of rent-call.module.ts — accepted trade-off to avoid circular dependency risk.

**File List corrections (H3/L2/L3):**
- Removed phantom: `rent-call.module.ts` (NOT modified), `payment-recorded.projection.ts` (NOT created), `action-feed.tsx` (NOT modified)
- Added: `use-payment-actions.test.ts` (created during review)
- Fixed counts: New Backend 15, Modified Backend 9, New Frontend 5, Modified Frontend 12

### Change Log

- Created `PaymentRecorded` domain event and `recordPayment()` on RentCallAggregate
- Created `RecordAPaymentCommand` + `RecordAPaymentHandler`
- Added Prisma fields: paidAt, paidAmountCents, transactionId, bankStatementId on RentCall model
- Extended RentCallProjection with PaymentRecorded case
- Added findPaidRentCallIds to RentCallFinder
- Created 3 controllers: ValidateAMatch, RejectAMatch, ManualAssignAMatch
- Created 3 DTOs: ValidateMatchDto, RejectMatchDto, ManualAssignMatchDto
- Wired excludedRentCallIds into MatchPaymentsController
- Added validateMatch/rejectMatch/manualAssignMatch API functions
- Created usePaymentActions hook (useValidateMatch + useRejectMatch + useManualAssignMatch)
- Added validate/reject/assign action buttons + state transitions to MatchedRow/AmbiguousRow/UnmatchedRow
- Created ContinuousFlowStepper component with FlowStep interface
- Rewrote MatchingProposalsContent with hooks wiring, stepper, validation summary
- Updated UnitMosaic with paidUnitIds priority over sentUnitIds
- Added paidAt to RentCallData interface
- Added validateMatch/rejectMatch to E2E API fixture
- Created 4 E2E validation tests (seed, validate, reject, stepper)

### File List

**New Backend Files (15):**
- `backend/prisma/migrations/20260214003153_add_rent_call_payment_fields/migration.sql`
- `backend/src/billing/rent-call/events/payment-recorded.event.ts`
- `backend/src/billing/rent-call/commands/record-a-payment.command.ts`
- `backend/src/billing/rent-call/commands/record-a-payment.handler.ts`
- `backend/src/billing/rent-call/__tests__/record-a-payment.handler.spec.ts`
- `backend/src/presentation/bank-statement/controllers/validate-a-match.controller.ts`
- `backend/src/presentation/bank-statement/controllers/reject-a-match.controller.ts`
- `backend/src/presentation/bank-statement/controllers/manual-assign-a-match.controller.ts`
- `backend/src/presentation/bank-statement/dto/validate-match.dto.ts`
- `backend/src/presentation/bank-statement/dto/reject-match.dto.ts`
- `backend/src/presentation/bank-statement/dto/manual-assign-match.dto.ts`
- `backend/src/presentation/bank-statement/controllers/__tests__/validate-a-match.controller.spec.ts`
- `backend/src/presentation/bank-statement/controllers/__tests__/reject-a-match.controller.spec.ts`
- `backend/src/presentation/bank-statement/controllers/__tests__/manual-assign-a-match.controller.spec.ts`
- `backend/src/presentation/rent-call/__tests__/rent-call.finder.spec.ts`

**New Frontend Files (5):**
- `frontend/src/hooks/use-payment-actions.ts`
- `frontend/src/hooks/__tests__/use-payment-actions.test.ts`
- `frontend/src/components/features/payments/continuous-flow-stepper.tsx`
- `frontend/src/components/features/payments/__tests__/continuous-flow-stepper.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-paid.test.tsx`

**Modified Backend Files (9):**
- `backend/prisma/schema.prisma` — added paidAt, paidAmountCents, transactionId, bankStatementId fields
- `backend/src/billing/rent-call/rent-call.aggregate.ts` — added recordPayment(), PaymentRecorded handler
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts` — added payment tests
- `backend/src/presentation/bank-statement/bank-statement-presentation.module.ts` — registered 3 controllers + RecordAPaymentHandler
- `backend/src/presentation/bank-statement/controllers/match-payments.controller.ts` — wired excludedRentCallIds
- `backend/src/presentation/bank-statement/controllers/__tests__/match-payments.controller.spec.ts` — added exclusion test
- `backend/src/presentation/rent-call/projections/rent-call.projection.ts` — added PaymentRecorded case
- `backend/src/presentation/rent-call/__tests__/rent-call.projection.spec.ts` — added PaymentRecorded test
- `backend/src/presentation/rent-call/finders/rent-call.finder.ts` — added findPaidRentCallIds method

**Modified Frontend Files (12):**
- `frontend/src/lib/api/bank-statements-api.ts` — added validate/reject/assign API functions, types, bankStatementId field
- `frontend/src/hooks/use-bank-statements.ts` — re-exported new types
- `frontend/src/lib/api/rent-calls-api.ts` — added paidAt to RentCallData
- `frontend/src/components/features/payments/matching-row.tsx` — added action buttons, states, callbacks, dark mode
- `frontend/src/components/features/payments/matching-proposals-content.tsx` — rewrote with hooks, stepper, summary, bankStatementId passthrough, dark mode
- `frontend/src/components/features/payments/payments-page-content.tsx` — passed hasStatements prop
- `frontend/src/components/features/dashboard/unit-mosaic.tsx` — added paidUnitIds, updated sentUnitIds
- `frontend/src/components/features/payments/__tests__/matching-row.test.tsx` — added 14 action tests
- `frontend/src/components/features/payments/__tests__/matching-proposals-content.test.tsx` — added stepper/validation tests
- `frontend/src/components/features/payments/__tests__/payments-page-content.test.tsx` — added usePaymentActions mock
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx` — added paidAt to mock
- `frontend/e2e/payments.spec.ts` — added 4 payment validation E2E tests, fixed fragile selector
- `frontend/e2e/fixtures/api.fixture.ts` — added validateMatch/rejectMatch helpers, fixed URLs, added bankStatementId
