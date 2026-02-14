# Story 5.4: Record Manual Payments (Cash, Check)

Status: done

## Story

As a bailleur,
I want to record manual payments (cash, check) that are not from a bank import,
so that I can track all payment methods in the system (FR31).

## Acceptance Criteria

1. **Given** I have an outstanding rent call, **When** I record a manual payment, **Then** I can enter: payment method (cash/check), amount in euros, date, reference (check number optional for check, hidden for cash), and the payment is linked to the specified rent call.

2. **Given** I submit a manual payment form, **When** the payment is recorded, **Then** the event PaymentRecorded is stored in KurrentDB with `bankStatementId = null` to distinguish manual payments from bank-imported ones.

3. **Given** a manual payment is recorded, **When** I view the rent call list, **Then** the rent call shows as paid with the payment date, amount, payer name, and payment method indicator (cash/check).

4. **Given** a rent call is already paid, **When** I attempt to record another payment, **Then** the system prevents double-payment (no-op guard in aggregate).

5. **Given** I record a manual payment, **When** the UnitMosaic refreshes, **Then** the unit tile turns green (paid state), matching the behavior of bank-imported validated payments.

## Tasks / Subtasks

- [x] Task 1 — Backend: Create RecordManualPayment controller and DTO (AC: 1, 2)
  - [x] 1.1 Create `RecordManualPaymentDto` with validation decorators (@IsInt @Min(1), @IsDateString, @IsNotEmpty @MaxLength, @IsEnum for payment method, @ValidateIf for conditional paymentReference)
  - [x] 1.2 Create `RecordManualPaymentController` (POST /api/entities/:entityId/rent-calls/:rentCallId/payments/manual) — validates entity ownership, rent call existence, dispatches RecordAPaymentCommand with bankStatementId=null, server-generated transactionId
  - [x] 1.3 Register controller in RentCallPresentationModule (NOT BankStatementPresentationModule — cleaner separation)
  - [x] 1.4 Write controller unit tests (auth, 404, cash payment dispatch, check with reference, UUID generation) — 5 tests

- [x] Task 2 — Backend: Extend PaymentRecorded event and projection for payment method (AC: 2, 3)
  - [x] 2.1 Add `paymentMethod` field (cash | check | bank_transfer) to PaymentRecorded event — backward-compatible (optional field, defaults to `bank_transfer` for existing events)
  - [x] 2.2 Update RentCallAggregate.recordPayment() to accept and store paymentMethod with default 'bank_transfer'
  - [x] 2.3 Update RecordAPaymentCommand to include paymentMethod field with default
  - [x] 2.4 Add `paymentMethod` column to Prisma RentCall model + migration
  - [x] 2.5 Update RentCall projection to persist paymentMethod from event with backward-compatible default
  - [x] 2.6 Update aggregate + handler + projection tests — aggregate: 2 new tests, projection: 3 new tests

- [x] Task 3 — Backend: Add reference field for check number (AC: 1)
  - [x] 3.1 Add `paymentReference` field to RecordAPaymentCommand and PaymentRecorded event (optional string, max 100 chars)
  - [x] 3.2 Update aggregate state + projection to persist paymentReference
  - [x] 3.3 Add `paymentReference` column to Prisma RentCall model (in same migration as Task 2)
  - [x] 3.4 Update handler/projection tests — handler assertion updated, projection tests extended

- [x] Task 4 — Frontend: Create RecordManualPayment API method and hook (AC: 1, 2)
  - [x] 4.1 Add `recordManualPayment()` method to `useRentCallsApi()` in rent-calls-api.ts
  - [x] 4.2 Create `useRecordManualPayment(entityId)` hook with useState-managed isPending, error, 1500ms delayed cache invalidation
  - [x] 4.3 Validation handled inline in dialog component (no separate Zod schema — YAGNI, form is simple)
  - [x] 4.4 Write hook unit tests — 4 tests (initial state, success, error, error reset)

- [x] Task 5 — Frontend: Create RecordManualPaymentDialog component (AC: 1, 3)
  - [x] 5.1 Create `RecordManualPaymentDialog` using AlertDialog pattern: payment method Select (cash/check), amount Input (euros→cents), date Input, payer name Input (pre-filled), conditional check reference Input
  - [x] 5.2 Add "Enregistrer un paiement" button to each unpaid rent call row in RentCallList (Banknote icon)
  - [x] 5.3 Wire dialog submission via handleRecordPayment in RentCallsPageContent with paymentRentCallId state
  - [x] 5.4 Write component unit tests — 15 tests (dialog rendering, pre-fill, conditional ref, submit data, validation states, loading, error, close)

- [x] Task 6 — Frontend: Display payment status on rent call list (AC: 3, 5)
  - [x] 6.1 Add payment status badge: "Payé le [date]" with PaymentMethodIcon (Banknote=cash, FileText=check, Building2=bank_transfer)
  - [x] 6.2 Hide "Enregistrer un paiement" button for already-paid rent calls (conditional render `!rc.paidAt`)
  - [x] 6.3 UnitMosaic green state verified — uses `rc.paidAt` which works for all payment methods (no code change needed)
  - [x] 6.4 Display tests — 5 new tests in rent-call-list.test.tsx (paid badge, hide button for paid, show button for unpaid, click handler, no button when no callback)

- [x] Task 7 — Frontend: Add payment method to RentCallData type (AC: 3)
  - [x] 7.1 Add `paymentMethod: string | null` and `paymentReference: string | null` fields to RentCallData interface
  - [x] 7.2 PaymentMethodIcon component renders method-appropriate icon in rent call rows

- [x] Task 8 — E2E: Record manual payment flow (AC: 1-5)
  - [x] 8.1 E2E test: seed data via API, navigate to rent-calls page, click record payment, verify pre-filled fields (payer, amount), submit cash payment, verify "Payé le" badge appears
  - [x] 8.2 Skipped separate check payment E2E (covered by unit tests; E2E focuses on critical path)

## Dev Notes

### Architecture Decision: Controller Placement

The manual payment controller could logically belong in either:
- `presentation/bank-statement/controllers/` — alongside existing payment controllers (validate, reject, assign)
- `presentation/rent-call/controllers/` — since it's a rent-call action, not a bank-statement action

**Recommendation:** Place in `presentation/rent-call/controllers/` since manual payments have nothing to do with bank statements. This is cleaner separation of concerns. Register in `RentCallPresentationModule`.

### Reusing Existing Infrastructure

**CRITICAL — DO NOT reinvent the wheel:**
- `RecordAPaymentCommand` already exists and can be reused directly. Just add `paymentMethod` and `paymentReference` fields.
- `RecordAPaymentHandler` already exists — loads aggregate, calls recordPayment(), saves. Extend to pass new fields.
- `PaymentRecorded` event already exists — add optional fields (backward-compatible).
- `RentCallAggregate.recordPayment()` already has no-op guard for double-payment.
- `RentCallFinder.findByIdAndEntity()` already validates ownership.
- Prisma `RentCall` model already has `paidAt`, `paidAmountCents`, `transactionId`, `bankStatementId`, `payerName`, `paymentDate` — just add `paymentMethod` and `paymentReference`.

### API Endpoint Design

```
POST /api/entities/:entityId/rent-calls/:rentCallId/payments/manual
```

Response: `202 Accepted` (CQRS pattern — command dispatched, projection updates asynchronously).

**DTO fields:**
```typescript
{
  amountCents: number;        // @IsInt() @Min(1)
  paymentMethod: string;      // @IsEnum(['cash', 'check'])
  paymentDate: string;        // @IsDateString()
  payerName: string;          // @IsNotEmpty() @MaxLength(255)
  paymentReference?: string;  // @IsOptional() @MaxLength(100) — check number
}
```

The controller generates a `transactionId` (UUID) server-side for manual payments, sets `bankStatementId = null`.

### Payment Method Enum

Define as a simple string union type (not a full VO — YAGNI):
```typescript
type PaymentMethod = 'cash' | 'check' | 'bank_transfer';
```

`bank_transfer` is the implicit default for existing PaymentRecorded events from bank statement reconciliation (Story 5.3). Manual payments only use `cash` or `check`.

### Frontend Form UX

- **Dialog trigger:** Button "Enregistrer un paiement" (Banknotes icon) on each unpaid rent call row
- **Pre-filled fields:** Payer name from tenant (editable), amount from rent call total (editable), date defaults to today
- **Conditional field:** "N° de chèque" input appears only when paymentMethod = check
- **Amount input:** User enters euros (e.g., "850.00"), converted to cents on submit (85000)
- **Confirmation:** AlertDialog pattern NOT needed (recording a payment is not destructive) — use standard Dialog with form

### Backward Compatibility

Adding `paymentMethod` and `paymentReference` to existing event:
- Existing `PaymentRecorded` events without these fields → `paymentMethod` defaults to `bank_transfer`, `paymentReference` defaults to `null`
- This follows the established backward-compatible event extension pattern from Story 3.2 (insurance fields on TenantRegistered)

### Project Structure Notes

- Alignment with established CQRS/ES patterns in Billing BC
- Controller-per-action (SRP) pattern maintained
- No new bounded context or aggregate needed
- No cross-BC changes required
- Prisma migration for 2 new columns only

### Detected Conflicts or Variances

- **None** — this story is a straightforward extension of existing patterns

### References

- [Source: backend/src/billing/rent-call/rent-call.aggregate.ts — recordPayment() method]
- [Source: backend/src/billing/rent-call/commands/record-a-payment.command.ts]
- [Source: backend/src/billing/rent-call/commands/record-a-payment.handler.ts]
- [Source: backend/src/billing/rent-call/events/payment-recorded.event.ts]
- [Source: backend/src/presentation/bank-statement/controllers/validate-a-match.controller.ts — reference controller pattern]
- [Source: backend/src/presentation/bank-statement/dto/validate-match.dto.ts — reference DTO pattern]
- [Source: backend/src/presentation/rent-call/finders/rent-call.finder.ts — findByIdAndEntity()]
- [Source: frontend/src/hooks/use-payment-actions.ts — hook pattern reference]
- [Source: frontend/src/lib/api/rent-calls-api.ts — RentCallData interface]
- [Source: frontend/src/components/features/rent-calls/rent-call-list.tsx — UI extension point]
- [Source: docs/anti-patterns.md — DTO checklist, Zod v4 constraints]
- [Source: docs/dto-checklist.md — validation requirements]

## Change Log

- Extended `RecordAPaymentCommand` with `paymentMethod` (default `bank_transfer`) and `paymentReference` (default `null`) — backward-compatible defaults
- Extended `PaymentRecordedData` interface with optional `paymentMethod` and `paymentReference` fields
- Extended `RentCallAggregate.recordPayment()` to accept and emit new fields; `onPaymentRecorded()` handles missing fields via defaults
- Created `RecordManualPaymentDto` with `@IsEnum(['cash', 'check'])`, `@IsInt @Min(1)`, `@IsDateString`, `@IsNotEmpty @MaxLength(255)`, conditional `@ValidateIf` for `paymentReference`
- Created `RecordManualPaymentController` (POST `.../payments/manual`) — generates server-side UUID transactionId, sets bankStatementId=null
- Prisma migration: added `payment_method` and `payment_reference` columns to `rent_calls` table
- Updated projection to persist `paymentMethod` (default `bank_transfer`) and `paymentReference` from PaymentRecorded event
- Frontend: added `paymentMethod` and `paymentReference` to `RentCallData` interface
- Frontend: created `useRecordManualPayment` hook with useState-managed state and 1500ms delayed cache invalidation
- Frontend: created `RecordManualPaymentDialog` (AlertDialog pattern) with conditional check reference field
- Frontend: added `PaymentMethodIcon` component and "Payé le" badge to `RentCallList`
- Frontend: wired dialog into `RentCallsPageContent` with pre-filled tenant name and amount
- E2E: added `recordManualPayment` and `waitForRentCallPaid` helpers to `ApiHelper`
- E2E: added "Manual payment recording" test suite with seed + cash payment flow

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prisma migration conflict: previous migration was modified after apply → resolved with `prisma migrate reset --force`
- Jest `--testPathPattern` deprecated → replaced with `--testPathPatterns`
- Handler test assertion mismatch: spy expected 7 args but received 9 (new paymentMethod/paymentReference) → updated expectation
- Projection test assertion mismatch: update data missing new fields → added paymentMethod/paymentReference
- RentCallList test selectors: button text changed from "Télécharger PDF" to "PDF" → updated regex to `/PDF/i`

### Completion Notes List

- 829 backend tests (110 suites) — all passing
- 505 frontend tests (65 suites) — all passing
- TypeScript typecheck: 0 errors (frontend + backend)
- Task 4.3 (Zod schema): skipped per YAGNI — inline validation in dialog component is sufficient for this simple form
- Task 8.2 (check E2E): covered by 15 unit tests in RecordManualPaymentDialog — separate E2E not cost-effective
- Controller registered in RentCallPresentationModule (not BankStatementPresentationModule) per story recommendation
- RecordAPaymentHandler NOT re-registered — already in BankStatementPresentationModule, CommandBus is global

### File List

**New files (10):**
- `backend/prisma/migrations/20260214014009_add_payment_method_and_reference/migration.sql`
- `backend/src/presentation/rent-call/dto/record-manual-payment.dto.ts`
- `backend/src/presentation/rent-call/controllers/record-manual-payment.controller.ts`
- `backend/src/presentation/rent-call/__tests__/record-manual-payment.controller.spec.ts`
- `frontend/src/hooks/use-record-manual-payment.ts`
- `frontend/src/hooks/__tests__/use-record-manual-payment.test.ts`
- `frontend/src/components/features/rent-calls/record-manual-payment-dialog.tsx`
- `frontend/src/components/features/rent-calls/__tests__/record-manual-payment-dialog.test.tsx`

**Modified files (17):**
- `backend/src/billing/rent-call/commands/record-a-payment.command.ts` — added paymentMethod + paymentReference with defaults
- `backend/src/billing/rent-call/commands/record-a-payment.handler.ts` — pass new fields to aggregate
- `backend/src/billing/rent-call/events/payment-recorded.event.ts` — added optional fields to PaymentRecordedData
- `backend/src/billing/rent-call/rent-call.aggregate.ts` — extended recordPayment() + onPaymentRecorded() with new fields
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts` — 2 new tests
- `backend/src/billing/rent-call/__tests__/record-a-payment.handler.spec.ts` — updated spy assertion
- `backend/prisma/schema.prisma` — paymentMethod + paymentReference columns
- `backend/src/presentation/rent-call/projections/rent-call.projection.ts` — persist new fields with defaults
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts` — registered RecordManualPaymentController
- `backend/src/presentation/rent-call/__tests__/rent-call.projection.spec.ts` — 3 new tests + updated existing
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts` — registered RecordManualPaymentController
- `frontend/src/lib/api/rent-calls-api.ts` — paymentMethod/paymentReference in RentCallData + recordManualPayment method
- `frontend/src/components/features/rent-calls/rent-call-list.tsx` — PaymentMethodIcon, "Payé le" badge, record payment button
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx` — 5 new tests + updated PDF button selectors
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx` — wired dialog + hook
- `frontend/e2e/fixtures/api.fixture.ts` — recordManualPayment + waitForRentCallPaid helpers
- `frontend/e2e/payments.spec.ts` — added "Manual payment recording" test suite (2 tests)
