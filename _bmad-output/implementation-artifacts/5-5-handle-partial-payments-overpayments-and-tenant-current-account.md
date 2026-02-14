# Story 5.5: Handle Partial Payments, Overpayments, and Tenant Current Account

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want the system to handle partial payments and overpayments on tenant current accounts,
So that I can accurately track what each tenant owes or is owed (FR32, FR33).

## Acceptance Criteria

1. **Given** a payment amount is less than the rent call total, **When** the payment is recorded, **Then** the rent call is marked as partially paid with the remaining balance displayed, **And** the rent call list shows a "Partiellement payé" badge (amber) with the amount paid and the remaining balance
2. **Given** a payment amount exceeds the rent call total, **When** the payment is recorded, **Then** the excess is credited to the tenant current account as a positive balance, **And** the rent call is marked as fully paid (green badge)
3. **Given** a tenant has a credit balance from overpayment, **When** a new rent call is generated for the next month, **Then** the credit is displayed in the TenantCurrentAccount but is NOT automatically applied (manual reconciliation only — YAGNI for auto-apply, defer to future story if needed)
4. **Given** I want to review a tenant's financial history, **When** I navigate to the tenant detail page, **Then** I see a TenantCurrentAccount section with a chronological list of all debits (rent calls) and credits (payments) with running balance
5. **Given** the TenantCurrentAccount displays financial entries, **Then** all amounts are displayed in French format (e.g., "1 234,56 €") with integer cents precision (NFR18)
6. **Given** the TenantCurrentAccount has entries, **Then** the balance is color-coded: green badge for zero/credit (tenant overpaid or balanced), red badge for debit (tenant owes money)
7. **Given** a rent call is partially paid, **When** I view the UnitMosaic on the dashboard, **Then** the unit tile shows amber background (same as "sent" state — payment incomplete), **And** the tile is NOT green (green = fully paid only)
8. **Given** a rent call is partially paid, **When** I try to record another payment on the same rent call, **Then** the system allows recording additional payments (removes single-payment no-op guard), **And** each payment is tracked as a separate PaymentRecorded event on the aggregate
9. **Given** I view a rent call's payment history, **When** there are multiple partial payments, **Then** each payment appears with its own date, amount, method, and payer name
10. **Given** the tenant current account exists, **Then** it is accessible via a "Compte courant" tab/section on the tenant detail page, with keyboard navigation and screen reader support (WCAG 2.1 AA)

## Tasks / Subtasks

- [x] Task 1: Extend RentCallAggregate to support multiple payments (AC: 1, 2, 8)
  - [x] 1.1: Add `payments: PaymentEntry[]` array to aggregate state (replaces single `paidAt`/`paidAmountCents` scalar fields for internal tracking)
  - [x]1.2: Create `PaymentEntry` interface in aggregate: `{ transactionId: string, bankStatementId: string | null, amountCents: number, payerName: string, paymentDate: Date, recordedAt: Date, paymentMethod: string, paymentReference: string | null }`
  - [x]1.3: Modify `recordPayment()` method: remove the `if (this.paidAt !== null) return` no-op guard, replace with append-to-payments logic. Compute `totalPaidCents = sum(payments.amountCents)`. Set `paidAt` only when `totalPaidCents >= totalAmountCents` (fully paid). Always update `paidAmountCents = totalPaidCents`
  - [x]1.4: Add `isFullyPaid` computed getter: `totalPaidCents >= totalAmountCents`
  - [x]1.5: Add `isPartiallyPaid` computed getter: `totalPaidCents > 0 && totalPaidCents < totalAmountCents`
  - [x]1.6: Add `remainingBalanceCents` computed getter: `Math.max(0, totalAmountCents - totalPaidCents)`
  - [x]1.7: Add `overpaymentCents` computed getter: `Math.max(0, totalPaidCents - totalAmountCents)`
  - [x]1.8: Backward compatibility: the `onPaymentRecorded` event handler MUST replay old single-payment events correctly (populate `payments` array from legacy scalar fields)
  - [x]1.9: Write aggregate unit tests: partial payment (amount < total), full payment (amount = total), overpayment (amount > total), multiple partial payments summing to full, replay of legacy PaymentRecorded event, computed getters correctness (12+ tests)

- [x] Task 2: Extend Prisma schema and projection for payment tracking (AC: 1, 2, 8, 9)
  - [x]2.1: Add new fields to `RentCall` Prisma model: `paymentStatus String? @map("payment_status")` — values: `null` (unpaid), `"partial"`, `"paid"`, `"overpaid"`; and `remainingBalanceCents Int? @map("remaining_balance_cents")`; and `overpaymentCents Int? @map("overpayment_cents")`
  - [x]2.2: Create `Payment` Prisma model for payment history: `id`, `rentCallId`, `entityId`, `transactionId`, `bankStatementId?`, `amountCents`, `payerName`, `paymentDate`, `paymentMethod`, `paymentReference?`, `recordedAt`, `createdAt`. Foreign key to `RentCall`. `@@index([rentCallId])`, `@@index([entityId])`
  - [x]2.3: Create `AccountEntry` Prisma model for tenant current account: `id`, `entityId`, `tenantId`, `type` (enum: `"debit"` | `"credit"`), `category` (enum: `"rent_call"` | `"payment"` | `"overpayment_credit"` | `"adjustment"`), `description`, `amountCents`, `balanceCents` (running balance after this entry), `referenceId` (rent call ID or payment ID), `referenceMonth` (YYYY-MM), `entryDate`, `createdAt`. `@@index([entityId, tenantId])`, `@@index([tenantId])`
  - [x]2.4: Run `npx prisma migrate dev --name add-payment-history-and-account-entries`
  - [x]2.5: Update `RentCallProjection.onPaymentRecorded()`: compute `totalPaidCents` from all `Payment` rows for this `rentCallId`, set `paymentStatus` (`"partial"` if < total, `"paid"` if = total, `"overpaid"` if > total), update `paidAt` (only when fully paid or overpaid), update `paidAmountCents`, `remainingBalanceCents`, `overpaymentCents`. Also create `Payment` row. Also create `AccountEntry` credit row for this payment. If overpayment, create additional `AccountEntry` with category `"overpayment_credit"`.
  - [x]2.6: Create `AccountEntryProjection` — subscribes to `RentCallGenerated` to create debit entries (rent call amount as debit on tenant account). Subscribes to `PaymentRecorded` to create credit entries (payment amount as credit). Computes `balanceCents` as running balance for the tenant (query previous latest entry balance + apply delta). Idempotent by `referenceId + category` check.
  - [x]2.7: Register `AccountEntryProjection` in `RentCallPresentationModule`
  - [x]2.8: Write projection unit tests: payment creates Payment row, partial payment sets status "partial", full payment sets status "paid", overpayment sets status "overpaid" + overpaymentCents, account entry debit on rent call generation, account entry credit on payment, running balance computation, idempotency (10+ tests)

- [x] Task 3: Create AccountEntry finders and tenant current account endpoint (AC: 4, 5, 6, 10)
  - [x]3.1: Create `AccountEntryFinder` in `presentation/rent-call/finders/` — methods: `findByTenantAndEntity(tenantId, entityId, userId): AccountEntry[]`, `getBalance(tenantId, entityId, userId): { balanceCents: number, entryCount: number }`
  - [x]3.2: Create `GetTenantAccountController` — `GET /api/entities/:entityId/tenants/:tenantId/account` — returns `{ entries: AccountEntryData[], balanceCents: number }` ordered by `entryDate DESC, createdAt DESC`
  - [x]3.3: Create `AccountEntryData` response type: `{ id, type, category, description, amountCents, balanceCents, referenceId, referenceMonth, entryDate }`
  - [x]3.4: Create `PaymentFinder` in `presentation/rent-call/finders/` — method: `findByRentCallId(rentCallId, entityId, userId): Payment[]`
  - [x]3.5: Create `GetRentCallPaymentsController` — `GET /api/entities/:entityId/rent-calls/:rentCallId/payments` — returns `Payment[]` for payment history per rent call
  - [x]3.6: Extend `RentCallFinder` responses to include `paymentStatus`, `remainingBalanceCents`, `overpaymentCents`
  - [x]3.7: Write controller + finder unit tests (8+ tests)

- [x] Task 4: Update frontend RentCallData type and hooks (AC: 1, 2, 7, 8, 9)
  - [x]4.1: Extend `RentCallData` interface: add `paymentStatus: 'partial' | 'paid' | 'overpaid' | null`, `remainingBalanceCents: number | null`, `overpaymentCents: number | null`
  - [x]4.2: Create `PaymentData` interface: `{ id, transactionId, bankStatementId, amountCents, payerName, paymentDate, paymentMethod, paymentReference, recordedAt }`
  - [x]4.3: Create `AccountEntryData` interface: `{ id, type, category, description, amountCents, balanceCents, referenceId, referenceMonth, entryDate }`
  - [x]4.4: Create `frontend/src/lib/api/account-entries-api.ts` — `getTenantAccount(entityId, tenantId): Promise<{ entries: AccountEntryData[], balanceCents: number }>`, `getRentCallPayments(entityId, rentCallId): Promise<PaymentData[]>`
  - [x]4.5: Create `frontend/src/hooks/use-tenant-account.ts` — `useTenantAccount(entityId, tenantId)` query hook with query key `["entities", entityId, "tenants", tenantId, "account"]`
  - [x]4.6: Create `frontend/src/hooks/use-rent-call-payments.ts` — `useRentCallPayments(entityId, rentCallId)` query hook with query key `["entities", entityId, "rent-calls", rentCallId, "payments"]`
  - [x]4.7: Update `useRecordManualPayment` and `useValidateMatch` cache invalidation: additionally invalidate `["entities", entityId, "tenants", tenantId, "account"]` and `["entities", entityId, "rent-calls", rentCallId, "payments"]`
  - [x]4.8: Write hook tests (6+ tests)

- [x] Task 5: Update rent call list UI for partial payment display (AC: 1, 2, 7, 9)
  - [x]5.1: Update `rent-call-list.tsx` payment status badges: add amber "Partiellement payé — X € / Y €" badge when `paymentStatus === 'partial'` (showing paidAmountCents and totalAmountCents). Keep green "Payé le..." badge for `paymentStatus === 'paid'`. Add green "Payé (trop-perçu: X €)" badge for `paymentStatus === 'overpaid'`.
  - [x]5.2: Update "Enregistrer un paiement" button visibility: show when `paymentStatus !== 'paid' && paymentStatus !== 'overpaid'` (allow additional payments on partial rent calls, but NOT on fully paid ones)
  - [x]5.3: Update `RecordManualPaymentDialog` defaults: when `paymentStatus === 'partial'`, set `defaultAmountCents` to `remainingBalanceCents` instead of `totalAmountCents`
  - [x]5.4: Add payment history expandable section: clicking a "Voir les paiements" link under the badge expands to show all payments for the rent call (date, amount, method icon, payer)
  - [x]5.5: Write component tests: partial payment badge, overpayment badge, button visibility for partial, payment history display (6+ tests)

- [x] Task 6: Create TenantCurrentAccount component (AC: 4, 5, 6, 10)
  - [x]6.1: Create `frontend/src/components/features/tenants/tenant-current-account.tsx` — Table-based component using shadcn Table + Badge primitives
  - [x]6.2: Table columns: Date (formatted DD/MM/YYYY), Description, Débit (red text for debits), Crédit (green text for credits), Solde (running balance with color: red for negative, green for zero/positive)
  - [x]6.3: Balance summary header: Badge showing current balance — `variant="destructive"` for negative (tenant owes), `variant="default"` green for zero/positive (balanced/credit)
  - [x]6.4: Empty state: "Aucune opération enregistrée pour ce locataire" with muted text
  - [x]6.5: Keyboard navigation: Table with `role="table"`, sortable column headers (default: date DESC), screen reader announces balance polarity
  - [x]6.6: French number formatting: use `Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })` for all amounts
  - [x]6.7: Write component tests: renders entries, empty state, balance badge color, debit/credit text color, French formatting (8+ tests)

- [x] Task 7: Integrate TenantCurrentAccount into tenant detail page (AC: 4, 10)
  - [x]7.1: Add "Compte courant" section to tenant detail page (below existing lease/insurance sections) — uses Card wrapper with CardHeader "Compte courant"
  - [x]7.2: Load account entries via `useTenantAccount(entityId, tenantId)` hook
  - [x]7.3: Show loading skeleton while fetching, error state on failure
  - [x]7.4: Update cross-query cache invalidation: payment recording must invalidate tenant account queries
  - [x]7.5: Write page integration tests (3+ tests)

- [x]Task 8: Update UnitMosaic for partial payment state + E2E tests (AC: 7, all ACs)
  - [x]8.1: Update UnitMosaic computation: `paidUnitIds` should only include units where ALL rent calls are fully paid (`paymentStatus === 'paid' || paymentStatus === 'overpaid'`). Units with `paymentStatus === 'partial'` should show amber (same as sent) — NOT green
  - [x]8.2: Add `partiallyPaidUnitIds` Set computation: units where any rent call has `paymentStatus === 'partial'` — these show amber with "partiellement payé" tooltip
  - [x]8.3: Write UnitMosaic test for partial payment amber state
  - [x]8.4: E2E test 1: Record a partial payment (amount < total) via manual payment dialog, verify amber badge "Partiellement payé", verify UnitMosaic amber state
  - [x]8.5: E2E test 2: Record a second partial payment on same rent call completing full payment, verify green badge "Payé", verify UnitMosaic green state
  - [x]8.6: E2E test 3: Navigate to tenant detail page, verify TenantCurrentAccount section shows debit (rent call) and credits (payments) with correct running balance

## Dev Notes

### Architecture Decisions

- **Multiple payments on RentCallAggregate**: the existing `recordPayment()` method has a no-op guard `if (this.paidAt !== null) return` that prevents multiple payments. This MUST be removed and replaced with append-to-payments-array logic. The `paidAt` field becomes a derived field (set when `totalPaidCents >= totalAmountCents`).
- **PaymentRecorded event is UNCHANGED**: the existing `PaymentRecorded` event structure stays the same (backward compatible). Each partial payment fires a separate `PaymentRecorded` event. The aggregate tracks cumulative state.
- **AccountEntry is a READ MODEL only**: the `account_entries` table is a projection — NOT a separate aggregate. It is populated by the `AccountEntryProjection` subscribing to `RentCallGenerated` and `PaymentRecorded` events. This follows the architecture document's `account_entries` table specification.
- **Running balance computation**: `balanceCents` on each `AccountEntry` row is computed during projection by querying the tenant's latest entry and applying the delta. Convention: negative balance = tenant owes money, positive balance = tenant has credit.
- **No auto-apply of overpayment**: the epic AC says "credit is automatically applied to the next rent call" — this is deferred to a future enhancement. For now, overpayment credit is DISPLAYED in the tenant account but not auto-deducted from future rent calls. Reason: auto-apply requires cross-aggregate coordination (modifying rent call generation based on tenant account balance) which is complex and not needed for MVP.
- **PaymentStatus enum**: `null` (unpaid) → `"partial"` (0 < paid < total) → `"paid"` (paid = total) → `"overpaid"` (paid > total). Stored as string in Prisma (not Prisma enum — follows project pattern of string unions).
- **Controller placement**: `GetTenantAccountController` goes in `presentation/rent-call/controllers/` because account entries are derived from rent call + payment events in the Billing BC. Alternatively could be in a new `presentation/accounting/` module, but YAGNI — keep it simple, refactor when Epic 8 accounting module arrives.

### Critical Constraints

- **Backward compatibility**: existing `PaymentRecorded` events from Stories 5.3/5.4 must replay correctly. The aggregate's `onPaymentRecorded` handler must populate the `payments` array from both old (single payment) and new (multiple payment) scenarios.
- **Integer cents**: all amounts are integer cents (no floating point). `remainingBalanceCents`, `overpaymentCents`, `balanceCents` — all integers.
- **French number formatting**: use `Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })`. Be aware of the narrow no-break space (`\u202F`) vs regular space difference in jsdom tests — use `.` wildcard in test assertions.
- **UnitMosaic regression**: currently `paidUnitIds` is computed from `rc.paidAt` (truthy check). Must change to check `paymentStatus === 'paid' || paymentStatus === 'overpaid'` instead. Partial payments must NOT make tiles green.
- **Cross-query cache invalidation**: payment recording must now invalidate: `["entities", entityId, "rent-calls"]`, `["entities", entityId, "tenants", tenantId, "account"]`, `["entities", entityId, "rent-calls", rentCallId, "payments"]`, `["entities"]`.
- **RecordManualPaymentDialog**: the `defaultAmountCents` must be `remainingBalanceCents` for partially paid rent calls (not `totalAmountCents`).

### Existing Code to Modify

- `backend/src/billing/rent-call/rent-call.aggregate.ts` — remove single-payment guard, add payments array, computed getters
- `backend/src/billing/rent-call/events/payment-recorded.event.ts` — NO CHANGES (backward compatible)
- `backend/src/presentation/rent-call/projections/rent-call.projection.ts` — compute paymentStatus, write Payment row, write AccountEntry rows
- `backend/src/presentation/rent-call/finders/rent-call.finder.ts` — extend responses, add payment finder methods
- `backend/prisma/schema.prisma` — add Payment model, AccountEntry model, extend RentCall model
- `frontend/src/lib/api/rent-calls-api.ts` — extend RentCallData type
- `frontend/src/components/features/rent-calls/rent-call-list.tsx` — partial/overpayment badges, button visibility, payment history
- `frontend/src/components/features/rent-calls/record-manual-payment-dialog.tsx` — defaultAmountCents for partial
- `frontend/src/components/features/dashboard/unit-mosaic.tsx` — partial payment amber state
- `frontend/src/hooks/use-record-manual-payment.ts` — extend cache invalidation
- `frontend/src/hooks/use-payment-actions.ts` — extend cache invalidation

### New Files to Create

- `backend/prisma/migrations/*_add_payment_history_and_account_entries/migration.sql` (auto-generated)
- `backend/src/presentation/rent-call/projections/account-entry.projection.ts`
- `backend/src/presentation/rent-call/finders/account-entry.finder.ts`
- `backend/src/presentation/rent-call/finders/payment.finder.ts`
- `backend/src/presentation/rent-call/controllers/get-tenant-account.controller.ts`
- `backend/src/presentation/rent-call/controllers/get-rent-call-payments.controller.ts`
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.partial-payment.spec.ts`
- `backend/src/presentation/rent-call/__tests__/account-entry.projection.spec.ts`
- `backend/src/presentation/rent-call/__tests__/get-tenant-account.controller.spec.ts`
- `backend/src/presentation/rent-call/__tests__/get-rent-call-payments.controller.spec.ts`
- `frontend/src/lib/api/account-entries-api.ts`
- `frontend/src/hooks/use-tenant-account.ts`
- `frontend/src/hooks/use-rent-call-payments.ts`
- `frontend/src/components/features/tenants/tenant-current-account.tsx`
- `frontend/src/components/features/tenants/__tests__/tenant-current-account.test.tsx`
- `frontend/e2e/partial-payments.spec.ts`

### Project Structure Notes

- All new backend code stays in `presentation/rent-call/` module (Billing BC presentation layer) — follows existing pattern
- `AccountEntry` model is in Prisma schema as a read model table — matches architecture's `account_entries` table specification
- TenantCurrentAccount component follows UX spec: Table + Badge primitives, 3 states (Balanced/Credit/Debit), chronological entries
- No new Bounded Context needed — this is an extension of existing Billing BC

### Previous Story Intelligence

**From Story 5.4 (Manual Payments):**
- `RecordManualPaymentDialog` uses AlertDialog (no Dialog primitive available) — adapt for partial payment defaults
- Backward-compatible command extension pattern: `paymentMethod: string = 'bank_transfer'`, `paymentReference: string | null = null`
- Server-side UUID for `transactionId` — same pattern for manual payments on partial rent calls
- `RecordAPaymentHandler` NOT re-registered — CommandBus is global, already in BankStatementPresentationModule
- PaymentMethodIcon component exists and can be reused for payment history display

**From Story 5.3 (Payment Validation):**
- `usePaymentActions` hook manages row statuses and progress tracking — extend for partial payment awareness
- `ContinuousFlowStepper` exists for matching flow — no changes needed
- `ValidateAMatchController` passes `paymentMethod='bank_transfer'` by default — continues to work

**From Code Review Fixes:**
- `bankStatementId` traceability is important (H1 from 5.3 review) — maintain null for manual payments
- DTO `@Min/@MaxLength` validation required (H2 from 5.3 review)
- Dark mode must be included in all new components (M5 from 5.3 review)
- `|| vs ??` distinction: use `??` for nullable defaults (M1 from 5.4 review)
- Double-click guard on payment buttons (M3 from 5.4 review) — `isPending` state disables button

### Testing Standards

**Backend (Jest):**
- Aggregate unit tests: partial/full/over payment flows, legacy event replay, computed getters
- Projection tests: Payment row creation, AccountEntry debit/credit, running balance, paymentStatus computation
- Controller tests: endpoint responses, entity ownership check, finder integration
- Use `mock-cqrx.ts` pattern from `billing/rent-call/__tests__/` for aggregate tests

**Frontend (Vitest + @testing-library/react):**
- Component tests: TenantCurrentAccount rendering, empty state, balance color, formatting
- Rent call list: partial badge, overpayment badge, button visibility, payment history expand
- UnitMosaic: partial payment amber state (NOT green)
- Hook tests: query key correctness, cache invalidation
- Use MockDate pattern for date-dependent tests

**E2E (Playwright):**
- Serial mode with seed test creating entity+property+unit+tenant+lease+rent call
- Partial payment flow: record amount < total, verify amber UI states
- Complete payment flow: record remaining amount, verify green UI states
- Tenant account verification: navigate to tenant, verify account entries

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.5 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/prd.md — FR32, FR33 requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture, account_entries table, Billing BC structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — TenantCurrentAccount component spec: Table + Badge, 3 states, chronological entries]
- [Source: docs/anti-patterns.md — CQRS delayed invalidation, cross-BC imports, projection resilience]
- [Source: docs/dto-checklist.md — defense-in-depth validation patterns]
- [Source: docs/project-context.md — established patterns for forms, hooks, projections]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Jest 30 `--testPathPattern` → `--testPathPatterns` flag change (fixed)
- Intl.NumberFormat test collision: `/850,00/` matches total AND badge text — used `textContent` match on specific element instead
- `use(params)` from React 19 incompatible with jsdom — tested TenantCurrentAccount section via extracted component pattern (same as LeaseDetailContent)

### Completion Notes List
- Task 1: Extended RentCallAggregate with `PaymentEntry[]` array, 5 computed getters (`totalPaidCents`, `isFullyPaid`, `isPartiallyPaid`, `remainingBalanceCents`, `overpaymentCents`), replaced single-payment no-op guard with `isFullyPaid` check. 12 new tests, 26 total passing.
- Task 2: Added `Payment` and `AccountEntry` Prisma models, extended `RentCall` with `paymentStatus`/`remainingBalanceCents`/`overpaymentCents`. Updated `RentCallProjection` for multi-payment tracking. Created `AccountEntryProjection` for debit/credit running balance. 20 projection tests passing.
- Task 3: Created `AccountEntryFinder`, `PaymentFinder`, `GetTenantAccountController`, `GetRentCallPaymentsController`. 8 controller tests passing.
- Task 4: Extended `RentCallData` type, created `AccountEntryData`/`PaymentData` interfaces, `account-entries-api.ts`, `use-tenant-account.ts`, `use-rent-call-payments.ts` hooks. Updated cache invalidation in `use-record-manual-payment.ts` and `use-payment-actions.ts`.
- Task 5: Updated `rent-call-list.tsx` with partial/overpaid badges, `PaymentHistoryToggle` expandable section, button visibility logic. Updated `rent-calls-page-content.tsx` for `remainingBalanceCents` default in dialog. 7 new tests (26 total).
- Task 6: Created `TenantCurrentAccount` component with table layout, balance badge (destructive for negative), debit/credit column coloring, French number formatting. 11 tests.
- Task 7: Integrated `TenantCurrentAccount` into tenant detail page via `useTenantAccount` hook in Card wrapper with loading/error states. 4 integration tests.
- Task 8: Updated UnitMosaic to use `paymentStatus` instead of `paidAt` for paid/partial/sent state. Added `partiallyPaidUnitIds` Set. 2 new tests (6 total). E2E: 4 tests (seed, partial payment, complete payment, tenant account verification).

### Change Log
- 861 backend tests (114 suites) — 0 regressions
- 530 frontend tests (67 suites) — 0 regressions
- 4 E2E tests (1 suite)
- TypeScript: clean

### File List

**New Files (17):**
- `backend/prisma/migrations/20260214022840_add_payment_history_and_account_entries/migration.sql`
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.partial-payment.spec.ts`
- `backend/src/presentation/rent-call/__tests__/account-entry.projection.spec.ts`
- `backend/src/presentation/rent-call/__tests__/get-rent-call-payments.controller.spec.ts`
- `backend/src/presentation/rent-call/__tests__/get-tenant-account.controller.spec.ts`
- `backend/src/presentation/rent-call/controllers/get-rent-call-payments.controller.ts`
- `backend/src/presentation/rent-call/controllers/get-tenant-account.controller.ts`
- `backend/src/presentation/rent-call/finders/account-entry.finder.ts`
- `backend/src/presentation/rent-call/finders/payment.finder.ts`
- `backend/src/presentation/rent-call/projections/account-entry.projection.ts`
- `frontend/e2e/partial-payments.spec.ts`
- `frontend/src/app/(auth)/tenants/__tests__/tenant-detail-account.test.tsx`
- `frontend/src/components/features/tenants/__tests__/tenant-current-account.test.tsx`
- `frontend/src/components/features/tenants/tenant-current-account.tsx`
- `frontend/src/hooks/use-rent-call-payments.ts`
- `frontend/src/hooks/use-tenant-account.ts`
- `frontend/src/lib/api/account-entries-api.ts`

**Modified Files (17):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `backend/prisma/schema.prisma`
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts`
- `backend/src/billing/rent-call/rent-call.aggregate.ts`
- `backend/src/presentation/rent-call/__tests__/rent-call.projection.spec.ts`
- `backend/src/presentation/rent-call/projections/rent-call.projection.ts`
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts`
- `frontend/e2e/fixtures/api.fixture.ts`
- `frontend/src/app/(auth)/tenants/[id]/page.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-paid.test.tsx`
- `frontend/src/components/features/dashboard/unit-mosaic.tsx`
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx`
- `frontend/src/components/features/rent-calls/rent-call-list.tsx`
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx`
- `frontend/src/hooks/use-payment-actions.ts`
- `frontend/src/hooks/use-record-manual-payment.ts`
- `frontend/src/lib/api/rent-calls-api.ts`

