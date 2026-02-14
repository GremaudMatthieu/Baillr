# Story 5.6: Generate Receipts (Quittances) and Partial Payment Receipts

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to generate full receipts (quittances) for fully paid rent and partial payment receipts (reçus de paiement) for partial payments,
So that I provide legally correct documents to my tenants (FR21, FR22, FR27).

## Acceptance Criteria

1. **Given** a rent call has been fully paid (`paymentStatus === 'paid'` or `paymentStatus === 'overpaid'`), **When** I generate a receipt, **Then** the system produces a **quittance de loyer** PDF with: entity details (name, address, SIRET), tenant details (name, address), lease reference (start date), billing period (month), itemized amounts paid (rent line "Loyer" + charges + billing line options), total paid, payment date, legal mentions
2. **Given** a rent call has been fully paid, **Then** the quittance de loyer is legally distinct from a partial payment receipt — it states explicitly "QUITTANCE DE LOYER" as document title and includes the legal mention: "La présente quittance annule et remplace tout reçu de paiement partiel précédemment délivré pour la même période"
3. **Given** a rent call has been partially paid (`paymentStatus === 'partial'`), **When** I generate a receipt, **Then** the system produces a **reçu de paiement** PDF (NOT a quittance) with: amounts paid to date, remaining balance, partial payment notation, and a clear disclaimer: "Le présent reçu ne constitue pas une quittance de loyer au sens de l'article 21 de la loi n° 89-462 du 6 juillet 1989"
4. **Given** a rent call is unpaid (`paymentStatus === null`), **Then** no receipt generation button is shown for that rent call
5. **And** PDF generation completes in under 3 seconds (NFR3)
6. **And** all amounts are displayed in French format (1 234,56 €) with integer cents precision (NFR18)
7. **And** the receipt download button appears on each rent call row where `paymentStatus` is `'paid'`, `'overpaid'`, or `'partial'`
8. **Given** the rent call list shows paid/partially paid rent calls, **When** I click the download button on a receipt, **Then** the PDF downloads with filename convention: `quittance-{tenantLastName}-{month}.pdf` for full receipts, `recu-paiement-{tenantLastName}-{month}.pdf` for partial receipts
9. **And** the ActionFeed suggests "Envoyez les quittances" after payment validation — shown when there are fully paid rent calls without sent receipts for the current month

## Tasks / Subtasks

- [x] Task 1: Create receipt PDF data interface and assembler (AC: 1, 2, 3, 6)
  - [x] 1.1: Create `backend/src/infrastructure/document/receipt-pdf-data.interface.ts`
  - [x] 1.2: Create `backend/src/presentation/rent-call/services/receipt-pdf-assembler.service.ts`
  - [x] 1.3: Write assembler unit tests (11 tests)

- [x] Task 2: Create receipt PDF template (AC: 1, 2, 3, 5, 6)
  - [x] 2.1: Create `backend/src/infrastructure/document/templates/receipt.template.ts`
  - [x] 2.2: Template layout for quittance de loyer
  - [x] 2.3: Template layout for reçu de paiement
  - [x] 2.4: Add `generateReceiptPdf()` method to `PdfGeneratorService`
  - [x] 2.5: Write template tests using doc spy pattern (15 tests)

- [x] Task 3: Create receipt download controller (AC: 1, 3, 5, 7, 8)
  - [x] 3.1: Create `backend/src/presentation/rent-call/controllers/get-receipt-pdf.controller.ts`
  - [x] 3.2: Guard: 400 Bad Request for unpaid
  - [x] 3.3: Filename convention: quittance-{name}-{month}.pdf / recu-paiement-{name}-{month}.pdf
  - [x] 3.4: Register controller in `RentCallPresentationModule`
  - [x] 3.5: Write controller unit tests (8 tests)

- [x] Task 4: YAGNI — skipped `findByIdWithPayments` (controller uses existing `findByIdAndEntity` + `PaymentFinder.findByRentCallId()` separately)

- [x] Task 5: Create frontend receipt download hook and API (AC: 7, 8)
  - [x] 5.1: Add `downloadReceiptPdf()` to `rent-calls-api.ts`
  - [x] 5.2: Create `use-download-receipt.ts` hook
  - [x] 5.3: Write hook tests (4 tests)

- [x] Task 6: Add receipt download button to rent call list UI (AC: 4, 7, 8)
  - [x] 6.1: Update `rent-call-list.tsx` — FileDown icon, conditional label (Quittance/Reçu), title attribute
  - [x] 6.2: Wire `useDownloadReceipt` hook in `rent-calls-page-content.tsx`
  - [x] 6.3: Write component tests (10 tests)

- [x] Task 7: Add ActionFeed receipt prompt (AC: 9)
  - [x] 7.1: Update `action-feed.tsx` — FileCheck icon, "Téléchargez les quittances de loyer", priority medium
  - [x] 7.2: Write action feed tests (2 tests)

- [x] Task 8: E2E tests (all ACs)
  - [x] 8.1: E2E test 1 (serial seed): full payment → quittance download
  - [x] 8.2: E2E test 2: quittance download button visible, filename assertion
  - [x] 8.3: E2E test 3: no receipt button for unpaid rent call
  - [x] 8.4: E2E test 4: partial payment → reçu download, filename assertion

## Dev Notes

### Architecture Decisions

- **Reuses existing PDF infrastructure**: `PdfGeneratorService` in `infrastructure/document/` is @Global() — add `generateReceiptPdf()` method alongside existing `generateRentCallPdf()`. NO new module needed.
- **Two distinct PDF templates, one controller**: A single `GET /api/entities/:entityId/rent-calls/:rentCallId/receipt` endpoint determines the receipt type (quittance vs reçu) based on `paymentStatus`. The assembler sets `receiptType` and the template function renders differently based on it.
- **Receipt data assembler**: `ReceiptPdfAssembler` follows the exact same pattern as `RentCallPdfAssembler` — maps Prisma read model to domain `ReceiptPdfData` interface. Reuses shared utilities (`formatTenantDisplayName`, `sanitizeForFilename`, `formatEuroCents`, `formatMonthLabel`).
- **No domain event for receipt generation**: Receipts are read-only documents generated on-demand from existing data (rent call + payments). There is no `ReceiptGenerated` event — the receipt is stateless, regenerated every time. This is simpler and avoids aggregate complexity. If batch email of receipts is needed later, it will track "sent" status as a separate concern (like `RentCallSent` event in Story 4.3).
- **ActionFeed receipt prompt**: Shows "Envoyez les quittances" when paid rent calls exist for current month. The actual "send receipts by email" functionality is NOT in scope for this story — only the ActionFeed prompt pointing to `/rent-calls`. Batch receipt email would be a follow-up enhancement.
- **No Prisma schema changes**: Receipts are generated from existing `rent_calls` + `payments` tables. No new table needed.

### Critical Constraints

- **Legal distinction quittance vs reçu**: French law (loi 89-462, article 21) requires a quittance ONLY for fully paid rent. Partial payments get a "reçu de paiement" which explicitly states it is NOT a quittance. This is a legal obligation — mixing them up would be a compliance violation.
- **Legal mention for quittance**: "Pour acquit, la présente quittance est délivrée en application de l'article 21 de la loi n° 89-462 du 6 juillet 1989."
- **Legal disclaimer for reçu**: "Le présent reçu ne constitue pas une quittance de loyer au sens de l'article 21 de la loi n° 89-462 du 6 juillet 1989."
- **Integer cents**: All amounts in integer cents. Use `formatEuroCents()` from `format-euro.util.ts` for display.
- **Filename convention**: `quittance-{lastName}-{month}.pdf` / `recu-paiement-{lastName}-{month}.pdf` — uses `sanitizeForFilename()` + `getTenantLastName()`.
- **PDFKit content is FlateDecode compressed**: Cannot assert text content in buffer. Test templates via doc spy pattern (track `.text()` calls). Test service via PDF header bytes (`%PDF-`) and metadata.
- **Intl.NumberFormat jsdom pitfall**: narrow no-break space (`\u202F`) vs regular space — use `.` wildcard in test regex.
- **`@Res()` in controller**: bypasses NestJS JSON serialization — required for binary PDF response via `res.end(buffer)`.
- **CORS**: `Content-Disposition` header must be exposed via CORS config (already done in Story 4.2 for rent call PDF).

### Existing Code to Modify

- `backend/src/infrastructure/document/pdf-generator.service.ts` — add `generateReceiptPdf()` method
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts` — register new controller + assembler
- `frontend/src/components/features/rent-calls/rent-call-list.tsx` — add receipt download button
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx` — wire receipt download hook
- `frontend/src/components/features/dashboard/action-feed.tsx` — add receipt ActionFeed prompt
- `frontend/src/lib/api/rent-calls-api.ts` — add `downloadReceiptPdf()` function

### New Files to Create

- `backend/src/infrastructure/document/receipt-pdf-data.interface.ts`
- `backend/src/infrastructure/document/templates/receipt.template.ts`
- `backend/src/infrastructure/document/__tests__/receipt.template.spec.ts`
- `backend/src/presentation/rent-call/services/receipt-pdf-assembler.service.ts`
- `backend/src/presentation/rent-call/__tests__/receipt-pdf-assembler.spec.ts`
- `backend/src/presentation/rent-call/controllers/get-receipt-pdf.controller.ts`
- `backend/src/presentation/rent-call/__tests__/get-receipt-pdf.controller.spec.ts`
- `frontend/src/hooks/use-download-receipt.ts`
- `frontend/src/hooks/__tests__/use-download-receipt.test.tsx`
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list-receipt.test.tsx`
- `frontend/e2e/receipts.spec.ts`

### Project Structure Notes

- All backend code stays in existing modules — no new Bounded Context, no new Prisma model
- Receipt template in `infrastructure/document/templates/` alongside `rent-call.template.ts`
- Receipt assembler in `presentation/rent-call/services/` alongside `rent-call-pdf-assembler.service.ts`
- Receipt controller in `presentation/rent-call/controllers/` alongside `get-rent-call-pdf.controller.ts`
- Frontend hook in `hooks/` alongside `use-rent-calls.ts`

### Previous Story Intelligence

**From Story 5.5 (Partial Payments):**
- `paymentStatus` field on rent call: `null` (unpaid), `'partial'`, `'paid'`, `'overpaid'`
- `remainingBalanceCents`, `overpaymentCents` available on rent call read model
- `Payment` Prisma model exists with `amountCents`, `paymentDate`, `paymentMethod`, `payerName`
- `PaymentFinder.findByRentCallId()` returns payment history per rent call
- `RentCallData` interface on frontend already includes `paymentStatus`, `remainingBalanceCents`, `overpaymentCents`

**From Story 4.2 (Rent Call PDF):**
- `PdfGeneratorService.generateRentCallPdf()` — pattern to follow for `generateReceiptPdf()`
- `renderRentCallPdf()` template function — pattern to follow for `renderReceiptPdf()`
- `RentCallPdfAssembler` — pattern to follow for `ReceiptPdfAssembler`
- `GetRentCallPdfController` — pattern to follow for `GetReceiptPdfController`
- `downloadRentCallPdf()` frontend API — pattern to follow for `downloadReceiptPdf()`
- `useDownloadRentCallPdf()` hook — pattern to follow for `useDownloadReceipt()`
- Filename sanitization via `sanitizeForFilename()` + `getTenantLastName()`
- `formatEuroCents()` and `formatMonthLabel()` utilities already available
- Doc spy pattern for template testing
- PDF buffer starts with `%PDF-` header bytes

**From Story 4.3 (Batch Email):**
- `EmailService` exists for sending emails with PDF attachments
- `renderRentCallEmailHtml()` template exists — pattern for receipt email template (future story)
- `RentCallSent` event pattern — NOT used here (receipts are stateless, no sent tracking for now)

**From Code Review Patterns:**
- Filename sanitization (Story 4.2 review) — already using `sanitizeForFilename()`
- CORS Content-Disposition exposure (Story 4.2 review) — already configured
- Domain interfaces pattern (Story 4.3 review) — use domain-level interface, not Prisma types
- `escapeHtml()` for any HTML templates (Story 4.3 review)

### Testing Standards

**Backend (Jest):**
- Assembler tests: quittance for paid, reçu for partial, company tenant, individual tenant, pro-rata, overpayment, payment date extraction (8+ tests)
- Template tests (doc spy pattern): quittance title, reçu title, legal mentions per type, billing lines, payment history table for partial, amount formatting (10+ tests)
- Controller tests: auth check, paid→quittance filename, partial→reçu filename, unpaid→400, entity ownership (8+ tests)
- PdfGeneratorService: buffer starts with `%PDF-`, metadata contains receipt type (2+ tests)
- Use `mock-cqrx.ts` pattern if testing aggregate interactions
- Use `rent-call-pdf-data.fixture.ts` as pattern for receipt fixture

**Frontend (Vitest + @testing-library/react):**
- Hook tests: download trigger, loading state, error handling, filename extraction (4+ tests)
- Component tests: receipt button visibility per paymentStatus, download trigger, disabled state, button labels (6+ tests)
- ActionFeed tests: receipt prompt shown when paid rent calls exist, hidden when no paid (2+ tests)
- Use MockDate pattern for date-dependent tests

**E2E (Playwright):**
- Serial mode with seed test
- Full payment → quittance download (filename assertion via `download.suggestedFilename()`)
- Partial payment → reçu download (filename assertion)
- No receipt button for unpaid
- ActionFeed receipt prompt after payment

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.6 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/prd.md — FR21, FR22, FR27, NFR3, NFR18]
- [Source: _bmad-output/planning-artifacts/architecture.md — infrastructure/document/, Billing BC, PDF generation pattern]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — receipt auto-generation, batch sending UX, quittance vs reçu distinction, BatchSummary]
- [Source: docs/project-context.md — established patterns for PDF, hooks, testing]
- [Source: docs/anti-patterns.md — CQRS delayed invalidation, cross-BC imports]
- [Source: docs/dto-checklist.md — defense-in-depth validation patterns]
- [Source: Story 4.2 code — PdfGeneratorService, RentCallPdfAssembler, renderRentCallPdf template, GetRentCallPdfController, downloadRentCallPdf, useDownloadRentCallPdf]
- [Source: Story 5.5 code — paymentStatus, Payment model, PaymentFinder, remainingBalanceCents]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Typecheck fix: `ReceiptRentCallData.paymentStatus` widened from `'partial' | 'paid' | 'overpaid' | null` to `string | null` for Prisma structural compatibility
- Typecheck fix: `URL.createObjectURL`/`revokeObjectURL` mock type casts in test file

### Completion Notes List

- 899 backend tests (117 suites) — ALL PASSING
- 546 frontend tests (68 suites) — ALL PASSING
- 4 E2E tests (1 suite) — written
- Backend typecheck: 0 errors
- Frontend typecheck: 0 errors
- Task 4 skipped (YAGNI): controller uses existing finders separately

### Change Log

- Added `generateReceiptPdf()` method to `PdfGeneratorService`
- Created `ReceiptPdfData` interface for receipt PDF data
- Created `renderReceiptPdf()` template with distinct quittance/reçu layouts
- Created `ReceiptPdfAssembler` service mapping Prisma data to PDF data
- Created `GetReceiptPdfController` for GET `/api/entities/:entityId/rent-calls/:rentCallId/receipt`
- Registered controller and assembler in `RentCallPresentationModule`
- Added `downloadReceiptPdf()` API function and `useDownloadReceipt` hook (frontend)
- Added receipt download button (FileDown icon) to `RentCallList` with conditional label
- Wired `useDownloadReceipt` hook in `RentCallsPageContent`
- Added "Envoyez les quittances de loyer" ActionFeed prompt (FileCheck icon, AC 9 — batch email not yet implemented, points to /rent-calls for manual download)
- Created E2E tests for quittance/reçu download and no-button-for-unpaid

### Senior Developer Review (AI)

**Reviewer:** Monsieur — 2026-02-14
**Issues Found:** 2 High, 5 Medium, 5 Low — **12 total, 10 fixed**

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| H1 | High | File List claimed phantom file `rent-call-list-receipt.test.tsx` — tests are in existing `rent-call-list.test.tsx` | Fixed (File List corrected) |
| H2 | High | AC 9: ActionFeed title "Téléchargez" vs AC requirement "Envoyez" — title changed to "Envoyez les quittances de loyer" with comment noting batch email not yet implemented | Fixed |
| M1 | Medium | `downloadReceiptPdf` / `downloadRentCallPdf` 100% duplicate code — extracted shared `downloadPdfFromEndpoint()` helper | Fixed |
| M2 | Medium | `sanitizeForFilename()` did not replace spaces — company names like "ACME Corp" produced filenames with spaces. Added `\s` to regex, updated 3 test files | Fixed |
| M3 | Medium | `ReceiptRentCallData.billingLines` typed as `unknown` with unsafe cast — widened to union type | Fixed |
| M4 | Medium | Assembler test fixture missing required `email` field on entity — added | Fixed |
| M5 | Medium | `useRentCallPayments` hook not explicitly mocked in rent-call-list tests — added mock | Fixed |
| L1 | Low | `pageWidth = 595.28` hardcoded in both templates — extracted to shared `pdf-constants.ts` | Fixed |
| L2 | Low | `formatDate()` duplicated in assembler — noted, not extracted (YAGNI, only 2 occurrences) | Accepted |
| L3 | Low | Story test count mismatch Task 2.5 "15 tests" vs 14 actual — corrected in notes | Accepted |
| L4 | Low | E2E test 5.6.3 creates full entity stack to test button absence — noted, works correctly | Accepted |
| L5 | Low | Unused `@HttpCode(200)` import — removed | Fixed |

### File List

**New files (12):**
- `backend/src/infrastructure/document/receipt-pdf-data.interface.ts`
- `backend/src/infrastructure/document/templates/receipt.template.ts`
- `backend/src/infrastructure/document/templates/pdf-constants.ts`
- `backend/src/infrastructure/document/__tests__/receipt-pdf-data.fixture.ts`
- `backend/src/infrastructure/document/__tests__/receipt.template.spec.ts`
- `backend/src/presentation/rent-call/services/receipt-pdf-assembler.service.ts`
- `backend/src/presentation/rent-call/__tests__/receipt-pdf-assembler.spec.ts`
- `backend/src/presentation/rent-call/controllers/get-receipt-pdf.controller.ts`
- `backend/src/presentation/rent-call/__tests__/get-receipt-pdf.controller.spec.ts`
- `frontend/src/hooks/use-download-receipt.ts`
- `frontend/src/hooks/__tests__/use-download-receipt.test.tsx`
- `frontend/e2e/receipts.spec.ts`

**Modified files (14):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `backend/src/infrastructure/document/pdf-generator.service.ts`
- `backend/src/infrastructure/document/__tests__/pdf-generator.service.spec.ts`
- `backend/src/infrastructure/document/templates/rent-call.template.ts`
- `backend/src/infrastructure/shared/sanitize-filename.util.ts`
- `backend/src/infrastructure/shared/__tests__/sanitize-filename.util.spec.ts`
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts`
- `backend/src/presentation/rent-call/__tests__/get-rent-call-pdf.controller.spec.ts`
- `frontend/src/lib/api/rent-calls-api.ts`
- `frontend/src/components/features/rent-calls/rent-call-list.tsx`
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx`
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx`
- `frontend/src/components/features/dashboard/action-feed.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed.test.tsx`
