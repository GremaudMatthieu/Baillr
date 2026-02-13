# Story 4.3: Send Rent Calls by Email in Batch with PDF Attachments

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to send all generated rent calls by email with PDF attachments in a single batch operation,
So that all tenants receive their billing documents without manual effort (FR20).

## Acceptance Criteria

1. **Given** rent calls have been generated for a month, **When** I trigger batch email sending from the rent call page, **Then** each tenant with an email address receives an email with their rent call PDF attached
2. **Given** a rent call email is sent, **Then** the email contains: a professional French-language subject line ("Avis d'échéance — {billingPeriod}") and body with the billing period, the total amount due, and the entity name as sender display name
3. **Given** batch sending is triggered, **Then** the BatchSummary displays: total emails sent, total emails failed (tenants missing email), total amount billed
4. **Given** batch sending is triggered, **Then** batch sending processes 50 emails within 60 seconds (NFR6)
5. **Given** an email is successfully sent, **Then** the event RentCallSent is stored per rent call in KurrentDB with sentAt timestamp and recipientEmail
6. **Given** a rent call has been sent by email, **Then** the rent call card in the list displays a "Envoyé" badge with the sent date
7. **Given** rent calls have been sent, **Then** the UnitMosaic tiles update to orange (pending payment) for units with sent rent calls
8. **Given** rent calls exist for the current month but none have been sent, **Then** the ActionFeed displays "Envoyez les appels de loyer par email" as the next onboarding step (step 8)
9. **Given** a tenant has no email address configured, **Then** that rent call is skipped (not sent) and reported as a failure in the BatchSummary with the tenant name
10. **Given** I am not the owner of the entity, **When** I attempt to send rent calls, **Then** I receive a 401 Unauthorized response

## Tasks / Subtasks

- [x] Task 1: Install Nodemailer and create EmailService infrastructure (AC: 1, 2, 4)
  - [x]1.1: Install `nodemailer` and `@types/nodemailer` in backend: `npm install nodemailer && npm install -D @types/nodemailer`
  - [x]1.2: Create `backend/src/infrastructure/email/` directory
  - [x]1.3: Create `EmailService` — `@Injectable()`, method `sendWithAttachment(options: SendEmailOptions): Promise<void>`. Uses Nodemailer transport (configurable SMTP via env vars). Options: `{ to, subject, html, attachments: Array<{ filename, content: Buffer }>, from }`.
  - [x]1.4: Create `SendEmailOptions` interface in `backend/src/infrastructure/email/send-email-options.interface.ts`
  - [x]1.5: Create `backend/src/infrastructure/email/email.module.ts` — `@Global() @Module()`, exports `EmailService`
  - [x]1.6: Register `EmailModule` in `app.module.ts`
  - [x]1.7: Add environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (with defaults for dev: use Ethereal or `smtp://localhost:1025` for MailHog)
  - [x]1.8: Write EmailService unit tests (4 tests: sends email with attachment, handles SMTP error, validates required fields, uses configured from address)

- [x] Task 2: Create RentCallSent event and extend RentCallAggregate (AC: 5)
  - [x]2.1: Create `RentCallSent` event in `backend/src/billing/rent-call/events/rent-call-sent.event.ts` — fields: `rentCallId`, `sentAt` (ISO string), `recipientEmail`, `entityId`, `tenantId`
  - [x]2.2: Add `markAsSent(sentAt: Date, recipientEmail: string)` method to `RentCallAggregate` — guarded by `RentCallNotCreatedException` (if not created) and no-op guard (if already sent)
  - [x]2.3: Add `private sentAt: Date | null = null` and `private recipientEmail: string | null = null` fields to `RentCallAggregate`
  - [x]2.4: Add `@EventHandler(RentCallSent)` to apply sent state on aggregate
  - [x]2.5: Register `RentCallSent` event in the rent-call domain module
  - [x]2.6: Write aggregate unit tests (4 tests: markAsSent success, markAsSent on non-created throws, markAsSent idempotent no-op, event handler applies state)

- [x] Task 3: Extend Prisma schema and projection for sent status (AC: 5, 6)
  - [x]3.1: Add `sentAt DateTime? @map("sent_at")` and `recipientEmail String? @map("recipient_email")` fields to `RentCall` Prisma model
  - [x]3.2: Run `npx prisma migrate dev --name add-rent-call-sent-fields`
  - [x]3.3: Extend `RentCallProjection` to handle `RentCallSent` event — update `sentAt` and `recipientEmail` fields on the rent call read model
  - [x]3.4: Write projection tests (2 tests: RentCallSent updates sentAt, handles event for non-existent rent call gracefully)

- [x] Task 4: Create batch send controller and command handler (AC: 1, 3, 4, 5, 9, 10)
  - [x]4.1: Create `SendRentCallsByEmailCommand` — `{ entityId, month, userId }`
  - [x]4.2: Create `SendRentCallsByEmailHandler` — orchestrates: load rent calls for month via RentCallFinder (with tenant eager loading) → filter unsent only → for each: check tenant email → generate PDF via PdfGeneratorService + RentCallPdfAssembler → send email via EmailService → markAsSent on aggregate → return SendResult
  - [x]4.3: Create `SendRentCallsByEmailController` — `POST /api/entities/:entityId/rent-calls/send`, `@UseGuards(ClerkAuthGuard)`, accepts `{ month: string }` body DTO. Returns `{ sent, failed, totalAmountCents, failures: string[] }`
  - [x]4.4: Create `SendRentCallsDto` — `{ month: string }` with `@IsString()` + `@Matches(/^\d{4}-\d{2}$/)` validation
  - [x]4.5: Create `SendResult` interface — `{ sent: number, failed: number, totalAmountCents: number, failures: string[] }`
  - [x]4.6: Register controller and handler in `RentCallPresentationModule` and `RentCallDomainModule`
  - [x]4.7: Add `findUnsentByEntityAndMonth(entityId, userId, month)` method to `RentCallFinder` — returns rent calls where `sentAt IS NULL` with tenant, unit, lease, entity+bankAccounts eager loading
  - [x]4.8: Write controller unit tests (6 tests: success batch send, no unsent rent calls returns {sent:0}, tenant without email counted as failure, entity not found 401, month validation error 400, already-sent rent calls excluded)
  - [x]4.9: Write handler unit tests (5 tests: sends email per rent call, skips tenants without email, generates PDF for each, marks aggregate as sent, returns correct SendResult)

- [x] Task 5: Create email HTML template (AC: 2)
  - [x]5.1: Create `backend/src/infrastructure/email/templates/rent-call-email.template.ts` — pure function `renderRentCallEmailHtml(data: RentCallEmailData): string`. Returns a minimal, inline-styled HTML email body (no external CSS, email-safe HTML)
  - [x]5.2: Define `RentCallEmailData` interface: `{ entityName, tenantName, billingPeriod, totalAmountCents, dueDate }`. Reuse `formatEuroCents` and `formatMonthLabel` from `infrastructure/document/format-euro.util.ts`
  - [x]5.3: Email body content (French):
    - Subject: `"Avis d'échéance — {billingPeriod}"` (e.g., "Avis d'échéance — Février 2026")
    - Greeting: `"Madame, Monsieur,"`
    - Body: `"Veuillez trouver ci-joint votre avis d'échéance pour la période de {billingPeriod}."` + `"Montant total : {totalAmount}"` + `"Date d'exigibilité : le {dueDate} de chaque mois"`
    - Footer: `"Cordialement,"` + `"{entityName}"`
    - Legal: `"Cet avis d'échéance est envoyé à titre gratuit conformément à l'article 21 de la loi n° 89-462 du 6 juillet 1989."`
  - [x]5.4: Write template tests (3 tests: renders all required fields, handles French formatting, generates valid HTML)

- [x] Task 6: Add frontend send API function and mutation hook (AC: 1, 3)
  - [x]6.1: Add `sendRentCallsByEmail(entityId: string, month: string): Promise<SendResult>` to `rent-calls-api.ts` — POST request to `/api/entities/:entityId/rent-calls/send`
  - [x]6.2: Add `SendResult` interface to `rent-calls-api.ts` — `{ sent: number, failed: number, totalAmountCents: number, failures: string[] }`
  - [x]6.3: Create `useSendRentCallsByEmail(entityId: string)` mutation hook in `use-rent-calls.ts` — uses `useMutation`, invalidates rent-call queries on success (same cache invalidation pattern as generate)
  - [x]6.4: Add `sentAt` and `recipientEmail` fields to `RentCallData` interface (nullable)
  - [x]6.5: Write hook tests (3 tests: successful send, API error, returns SendResult)

- [x] Task 7: Create SendRentCallsDialog and wire up UI (AC: 1, 3, 6, 9)
  - [x]7.1: Create `SendRentCallsDialog` component in `frontend/src/components/features/rent-calls/send-rent-calls-dialog.tsx` — AlertDialog pattern (same as GenerateRentCallsDialog). Shows: month label, count of unsent rent calls, count of tenants without email. Confirm button: "Envoyer". Disabled during pending.
  - [x]7.2: Create `SendBatchSummary` component (or extend existing `BatchSummary`) to display send results: `{ sent, failed, failures[] }`. Success: green with Mail icon + "X appels de loyer envoyés". Failures: amber warning section listing tenant names without email.
  - [x]7.3: Add "Envoyer par email" `Button variant="default"` to `rent-calls-page-content.tsx` — visible only when unsent rent calls exist for selected month. Positioned next to existing "Générer" button area.
  - [x]7.4: Add "Envoyé" `Badge` to rent-call-list cards — displayed when `rentCall.sentAt` is non-null. Badge shows `"Envoyé le {date}"` with check icon.
  - [x]7.5: Wire SendRentCallsDialog to useSendRentCallsByEmail mutation in rent-calls-page-content.tsx — manage dialogOpen state, pass results to SendBatchSummary
  - [x]7.6: Write component tests (8 tests: dialog renders with correct counts, confirm triggers send, loading state disables button, send summary renders sent count, send summary renders failures, "Envoyer par email" button visible only with unsent, "Envoyé" badge renders on sent rent calls, button hidden when all sent)

- [x] Task 8: Update ActionFeed and UnitMosaic for sent status (AC: 7, 8)
  - [x]8.1: Add ActionFeed step 8: "Envoyez les appels de loyer par email" — condition: rent calls exist for current month AND none have `sentAt`. Icon: `Mail`, priority: `high`, href: `/rent-calls`
  - [x]8.2: Update UnitMosaic color logic: derive `sentUnitIds` Set from rent calls with `sentAt` non-null → units in this set get orange/amber tile color (pending payment). Priority: orange (sent) > green (occupied/paid) > gray (vacant)
  - [x]8.3: Write ActionFeed test (2 tests: step 8 appears when rent calls exist but not sent, step 8 disappears after all sent)
  - [x]8.4: Write UnitMosaic test (2 tests: orange tile when rent call sent, remains green/gray when not sent)
  - [x]8.5: E2E test: navigate to rent calls → verify "Envoyer par email" button → send → verify BatchSummary → verify "Envoyé" badge on cards
  - [x]8.6: E2E test: dashboard → verify ActionFeed shows "Envoyez les appels de loyer" step when rent calls exist but not sent

## Dev Notes

### Architecture Decisions

- **Nodemailer over SendGrid/SES**: Nodemailer is the standard Node.js email library. It supports any SMTP server (Ethereal for dev, any provider for prod). No vendor lock-in, no API key management complexity. The architecture specifies `SmtpService` in `infrastructure/email/` — Nodemailer implements this exactly.
- **Infrastructure service, NOT domain**: `EmailService` lives in `infrastructure/email/`, NOT in the Billing BC. Per architecture (line 437-438): "email delivery (SmtpService) are infrastructure services, not bounded contexts. They have no business invariants." Email sending is a stateless delivery operation.
- **RentCallSent as domain event**: Unlike PDF generation (read-side only), sending an email IS a state change — it records that the document was delivered. Therefore `RentCallSent` is a proper domain event stored in the rent call aggregate stream, with `sentAt` and `recipientEmail` for audit trail.
- **Handler orchestrates batch (corrected in review)**: Both `SendRentCallsByEmailHandler` and `GenerateRentCallsForMonthHandler` now contain full orchestration logic. Controllers are thin pass-throughs dispatching to `CommandBus`. This matches the Epic 2 pattern (`CreateAnEntityController` → `CommandBus.execute(Command)` → `Handler`).
- **PDF reuse from Story 4.2**: `PdfGeneratorService.generateRentCallPdf()` returns `Promise<Buffer>` — perfect for email attachment. `RentCallPdfAssembler` maps Prisma models to `RentCallPdfData`. Both are reused as-is from Story 4.2.
- **Idempotent sending**: The aggregate guards against double-sending (`sentAt !== null` → no-op). The controller filters only unsent rent calls. Re-triggering batch send is safe.
- **UnitMosaic orange state**: Per UX specification, orange = "pending payment" (rent call sent but not yet paid). The mosaic color priority is: red (late) > orange (sent/pending) > green (occupied) > gray (vacant). Since Story 4.3 is the first to introduce "sent" status, we add orange here. Red will come in Epic 6.

### Previous Story Intelligence

**From Story 4.2 (Rent Call PDF)**:
- `PdfGeneratorService` returns `Promise<Buffer>` — reuse directly as email attachment
- `RentCallPdfAssembler.assembleFromRentCall()` maps Prisma models → `RentCallPdfData` — reuse for PDF generation before sending
- `RentCallFinder.findByIdAndEntity()` returns `RentCallWithRelations` with full eager loading — reuse and extend with `findUnsentByEntityAndMonth()`
- `formatEuroCents()` and `formatMonthLabel()` utilities in `infrastructure/document/format-euro.util.ts` — reuse in email template
- Filename convention: `appel-loyer-{tenantLastName}-{month}.pdf` — reuse for email attachment filename
- CORS already configured with `exposedHeaders: ['Content-Disposition']`

**From Story 4.1 (Rent Call Generation)**:
- `GenerateRentCallsForMonthController` batch orchestration pattern: load leases → filter → iterate → create aggregates → return summary
- `BatchSummary` component: `{ generated, totalAmountCents, exceptions }` — extend or create parallel for send results
- `GenerateRentCallsDialog` AlertDialog pattern: month + count confirmation → mutation → result
- `useGenerateRentCalls` mutation hook with `setTimeout(1500ms)` cache invalidation — replicate for send
- `useRentCalls` query hook fetches `RentCallData[]` — extend interface with `sentAt`, `recipientEmail`

**From Story 4.2 Code Review**:
- Finding: filename sanitization for `Content-Disposition` — reuse `sanitizeFilename()` logic for email attachment filename
- Finding: `formatMonthLabel` guard for invalid month — already handled
- Finding: CORS `exposedHeaders` — already configured

**From Story 3.1 (Tenants)**:
- Tenant model has `email: String` field (NOT optional — but may be empty string in practice)
- Tenant type `individual` | `company` — for email greeting could use different salutation
- Tenant `firstName`, `lastName`, `companyName` — for email personalization

### Existing Code to Extend

| File | Change |
|------|--------|
| `backend/src/app.module.ts` | Register `EmailModule` |
| `backend/src/billing/rent-call/rent-call.aggregate.ts` | Add `markAsSent()` method + `sentAt`/`recipientEmail` fields |
| `backend/src/billing/rent-call/rent-call.module.ts` | Register `SendRentCallsByEmailHandler` |
| `backend/src/presentation/rent-call/rent-call-presentation.module.ts` | Register `SendRentCallsByEmailController` |
| `backend/src/presentation/rent-call/finders/rent-call.finder.ts` | Add `findUnsentByEntityAndMonth()` |
| `backend/src/presentation/rent-call/projections/rent-call.projection.ts` | Handle `RentCallSent` event |
| `backend/prisma/schema.prisma` | Add `sentAt`, `recipientEmail` to `RentCall` model |
| `frontend/src/lib/api/rent-calls-api.ts` | Add `sendRentCallsByEmail()`, `SendResult`, extend `RentCallData` |
| `frontend/src/hooks/use-rent-calls.ts` | Add `useSendRentCallsByEmail()` hook |
| `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx` | Add send button, dialog, summary |
| `frontend/src/components/features/rent-calls/rent-call-list.tsx` | Add "Envoyé" badge |
| `frontend/src/components/features/dashboard/action-feed.tsx` | Add step 8 (send emails) |
| `frontend/src/components/features/dashboard/unit-mosaic.tsx` | Add orange color for sent rent calls |

### New Files to Create

| File | Purpose |
|------|---------|
| `backend/src/infrastructure/email/email.service.ts` | SMTP email sending service (Nodemailer) |
| `backend/src/infrastructure/email/email.module.ts` | NestJS module for email infra |
| `backend/src/infrastructure/email/send-email-options.interface.ts` | Email options interface |
| `backend/src/infrastructure/email/templates/rent-call-email.template.ts` | HTML email template (pure function) |
| `backend/src/infrastructure/email/__tests__/email.service.spec.ts` | Email service tests |
| `backend/src/infrastructure/email/__tests__/rent-call-email.template.spec.ts` | Email template tests |
| `backend/src/billing/rent-call/events/rent-call-sent.event.ts` | RentCallSent domain event |
| `backend/src/billing/rent-call/commands/send-rent-calls-by-email.command.ts` | Send command |
| `backend/src/billing/rent-call/commands/send-rent-calls-by-email.handler.ts` | Send command handler |
| `backend/src/presentation/rent-call/controllers/send-rent-calls-by-email.controller.ts` | POST endpoint for batch send |
| `backend/src/presentation/rent-call/dto/send-rent-calls.dto.ts` | Request DTO with month validation |
| `backend/src/presentation/rent-call/__tests__/send-rent-calls-by-email.controller.spec.ts` | Controller tests |
| `backend/src/billing/rent-call/__tests__/send-rent-calls-by-email.handler.spec.ts` | Handler tests |
| `frontend/src/components/features/rent-calls/send-rent-calls-dialog.tsx` | AlertDialog for send confirmation |
| `frontend/src/components/features/rent-calls/send-batch-summary.tsx` | Batch send results display |
| `frontend/src/components/features/rent-calls/__tests__/send-rent-calls-dialog.test.tsx` | Dialog tests |
| `frontend/src/components/features/rent-calls/__tests__/send-batch-summary.test.tsx` | Summary tests |
| `frontend/src/hooks/__tests__/use-send-rent-calls.test.tsx` | Send hook tests |

### Value Objects

No new VOs needed — this story reuses existing VOs from Story 4.1 (RentCallMonth) and extends the aggregate with simple fields (`sentAt`, `recipientEmail`).

### Events

| Event | Stream | Fields |
|-------|--------|--------|
| `RentCallSent` | `rent-call-{id}` | `rentCallId`, `sentAt` (ISO), `recipientEmail`, `entityId`, `tenantId` |

### Commands

| Command | Handler | Purpose |
|---------|---------|---------|
| `SendRentCallsByEmailCommand` | `SendRentCallsByEmailHandler` | Batch send emails with PDF attachments |

### API Endpoints

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| `POST` | `/api/entities/:entityId/rent-calls/send` | Batch send rent calls by email | `{ month: "YYYY-MM" }` | `{ sent, failed, totalAmountCents, failures[] }` |

### Email Configuration (Environment Variables)

```env
# SMTP Configuration
SMTP_HOST=smtp.ethereal.email     # Dev: Ethereal (test SMTP)
SMTP_PORT=587
SMTP_USER=                         # From Ethereal or prod SMTP
SMTP_PASS=
SMTP_FROM=noreply@baillr.fr       # Default sender address
```

For development, use [Ethereal Email](https://ethereal.email/) — a fake SMTP service that captures emails without sending them. Alternatively, use MailHog (`smtp://localhost:1025`) with Docker.

### Email Template Structure

```
Subject: Avis d'échéance — Février 2026

Madame, Monsieur,

Veuillez trouver ci-joint votre avis d'échéance pour la période
de Février 2026.

Montant total : 875,00 €
Date d'exigibilité : le 5 de chaque mois

Cordialement,
SCI Example

---
Cet avis d'échéance est envoyé à titre gratuit conformément
à l'article 21 de la loi n° 89-462 du 6 juillet 1989.
```

### Batch Send Flow (Sequence)

```
1. User clicks "Envoyer par email" on rent-calls page
2. SendRentCallsDialog opens (AlertDialog) — shows count + month
3. User confirms → POST /api/entities/:entityId/rent-calls/send { month }
4. Controller:
   a. Verify entity ownership (EntityFinder)
   b. Load unsent rent calls for month (RentCallFinder.findUnsentByEntityAndMonth)
   c. For each rent call:
      i.   Check tenant.email exists → if not, add to failures[]
      ii.  Assemble RentCallPdfData (RentCallPdfAssembler)
      iii. Generate PDF buffer (PdfGeneratorService.generateRentCallPdf)
      iv.  Build email HTML (renderRentCallEmailHtml)
      v.   Send email with PDF attachment (EmailService.sendWithAttachment)
      vi.  Mark aggregate as sent (CommandBus → SendRentCallsByEmailCommand → markAsSent)
      vii. Increment sent counter
   d. Return { sent, failed, totalAmountCents, failures }
5. Frontend receives SendResult → displays SendBatchSummary
6. Cache invalidation (setTimeout 1500ms) → rent calls refresh with sentAt
7. Rent call cards show "Envoyé" badge
8. UnitMosaic tiles turn orange for sent rent calls
```

### UnitMosaic Color Priority (Updated)

| Priority | Color | Condition | Introduced |
|----------|-------|-----------|------------|
| 1 | Red (rose) | Late/unpaid (Epic 6) | Future |
| 2 | Orange (amber) | Sent/pending payment | **Story 4.3** |
| 3 | Green (emerald) | Occupied (has active lease) | Story 3.3 |
| 4 | Gray (slate-300) | Vacant (no active lease) | Story 2.6 |

### Testing Standards

**Backend (Jest)**:
- EmailService: send with attachment, SMTP error handling, field validation, configured sender (~4 tests)
- RentCallEmailTemplate: renders all fields, French formatting, valid HTML (~3 tests)
- RentCallAggregate.markAsSent: success, not-created guard, idempotent no-op, state application (~4 tests)
- RentCallProjection (RentCallSent): updates sentAt, handles missing rent call (~2 tests)
- SendRentCallsByEmailController: batch success, no unsent, tenant without email, unauthorized, validation (~6 tests)
- SendRentCallsByEmailHandler: sends per rent call, skips missing email, generates PDF, marks sent, returns result (~5 tests)

**Frontend (Vitest)**:
- SendRentCallsDialog: renders, confirms, loading state (~3 tests)
- SendBatchSummary: sent count, failures display (~2 tests)
- useSendRentCallsByEmail hook: success, error, returns result (~3 tests)
- RentCallList: "Envoyé" badge renders, send button visible/hidden (~3 tests)
- ActionFeed step 8: appears when unsent, disappears after sent (~2 tests)
- UnitMosaic: orange tile when sent (~2 tests)

**E2E (Playwright)**:
- Send flow: rent calls exist → send button → dialog → send → summary → badge (~1 test)
- ActionFeed: step 8 visible when rent calls exist but not sent (~1 test)

### Known Pitfalls to Avoid

1. **DO NOT use SendGrid/SES SDK** — use Nodemailer with SMTP for portability. Architecture specifies `SmtpService`.
2. **DO NOT send emails in the aggregate** — email sending is an infrastructure concern. The aggregate only records the fact (RentCallSent event). The controller/handler orchestrates the actual sending.
3. **DO NOT block on individual email failures** — if one email fails, continue with the rest. Report failures in the BatchSummary. Consider wrapping each send in try/catch.
4. **DO NOT forget the PDF attachment** — each email MUST include the rent call PDF as an attachment. Reuse `PdfGeneratorService.generateRentCallPdf()` + `RentCallPdfAssembler`.
5. **DO NOT send to tenants without email** — check `tenant.email` existence and non-empty before attempting send. Report as failure.
6. **DO NOT re-send already-sent rent calls** — use `findUnsentByEntityAndMonth()` to filter. Aggregate `markAsSent()` has idempotent no-op guard.
7. **DO NOT forget entity ownership check** — same pattern as all other controllers: `EntityFinder.findByIdAndUserId()`.
8. **DO NOT create the Nodemailer transport on every send** — create it once in the EmailService constructor (or lazily).
9. **DO NOT put business logic in the email template** — the template is a pure rendering function. All data preparation happens in the handler.
10. **DO NOT forget `prisma generate`** after adding `sentAt` and `recipientEmail` fields to the schema.
11. **Nodemailer transport type**: Use `createTransport({ host, port, auth, secure })` — NOT `createTransport("smtp://...")` URL format. The host/port pattern is more explicit and testable.
12. **Email HTML compatibility**: Use inline CSS only, no `<style>` blocks, no CSS classes, table-based layout for maximum email client compatibility. Keep it simple — this is a transactional email, not a marketing newsletter.
13. **Mock Nodemailer in tests**: Mock `createTransport` to return a mock `sendMail` function. Do NOT actually connect to SMTP in unit tests.
14. **`tenant.email` is `String` not `String?`**: The Prisma field is required but may be empty string `""` in practice if the user didn't provide one. Check for both null/undefined AND empty string.

### Project Structure Notes

- Alignment with architecture: `infrastructure/email/` is the correct location per architecture lines 1258-1259
- `EmailService` is generic infrastructure — will be reused by receipts (Epic 5), reminders (Epic 6), formal notices (Epic 6), revision letters (Epic 7), email alerts (Epic 8)
- The email template pattern (pure function returning HTML string) mirrors the PDF template pattern (pure function drawing on PDFKit doc)
- `formatEuroCents` and `formatMonthLabel` utilities are shared between PDF templates and email templates (cross-infrastructure reuse)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.3] — User story, acceptance criteria, FR20
- [Source: _bmad-output/planning-artifacts/architecture.md — Line 437-438] — Document & Email as infrastructure services
- [Source: _bmad-output/planning-artifacts/architecture.md — Line 748-749] — `infrastructure/email/` directory
- [Source: _bmad-output/planning-artifacts/architecture.md — Line 1258-1259] — `smtp.service.ts` location
- [Source: _bmad-output/planning-artifacts/architecture.md — Line 1300] — Consumed via command bus
- [Source: _bmad-output/planning-artifacts/prd.md — FR20] — Batch email sending with PDF attachments
- [Source: _bmad-output/planning-artifacts/prd.md — NFR6] — 50 emails within 60 seconds
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Line 931-938] — BatchSummary component spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Line 256-260] — Orange = pending/sent status color
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Line 1045-1052] — Batch operation feedback patterns
- [Source: _bmad-output/implementation-artifacts/4-2-generate-rent-call-pdf-documents.md] — PDF infrastructure, assembler, finder patterns
- [Source: _bmad-output/implementation-artifacts/4-1-generate-rent-calls-for-all-active-leases-in-batch.md] — Batch generation pattern, BatchSummary, dialog
- [Source: docs/project-context.md — Backend Architecture] — Infrastructure service pattern
- [Source: docs/project-context.md — Testing Infrastructure] — Jest + Vitest + Playwright patterns
- [Source: docs/anti-patterns.md] — Named exceptions, DTO checklist, guard clauses
- [Source: docs/dto-checklist.md] — @IsString, @Matches, defense-in-depth

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Jest `--testPathPattern` → `--testPathPatterns` (Jest 30 change)
- `nestjs-cqrx` mock too simple → used shared `mock-cqrx.ts` from billing tests
- Wrong relative path to `mock-cqrx.ts` from presentation layer → `../../../billing/rent-call/__tests__/mock-cqrx`
- Email template module not found during controller tests → created template file (Task 5) before controller tests
- Prisma client not regenerated after schema change → ran `npx prisma generate`

### Completion Notes List

- 8 tasks completed, all tests passing
- Backend: 686 tests (96 suites) — 45 new tests for this story (including review fixes)
- Frontend: 379 tests (51 suites) — 20 new tests for this story
- Both frontend and backend typecheck clean
- E2E tests added (3 new tests in serial suite) — send button, dialog, badge verification
- EmailService is @Global() infrastructure service, will be reused by future epics

### Review Fixes Applied (20 findings)

- **Architecture fix**: All Epic 4 controllers refactored to thin pass-throughs (CommandBus only). Both `SendRentCallsByEmailHandler` and `GenerateRentCallsForMonthHandler` now contain full orchestration logic.
- **XSS fix**: `escapeHtml()` applied to all user data in email template
- **SMTP secure flag**: Added `secure: process.env.SMTP_SECURE === 'true'` to Nodemailer transport
- **Error message sanitization**: Handler returns generic `"erreur d'envoi"` in failures[], full error logged via Logger
- **Shared utilities**: Created `escapeHtml`, `sanitizeForFilename`, `formatTenantDisplayName` in `infrastructure/shared/`
- **EntityCreated backward compat**: `email` field made optional in event interface
- **DTO defense**: Added `@MaxLength(7)` to `SendRentCallsDto.month`
- **EmailService.from getter**: Exposed `defaultFrom` for handler reuse (no duplicate `process.env` access)
- **SendBatchSummary keys**: Replaced index-based `key={i}` with `key={name}`
- **Cache invalidation**: Added units query invalidation in `useSendRentCallsByEmail`
- **E2E soft assertion**: Replaced catch-and-skip pattern with `test.skip()` conditional
- **Docker/env config**: Updated `.env.example` defaults to localhost:1025 + `SMTP_SECURE=false`, added port comments to docker-compose

### File List

**New files (25):**
- `backend/src/infrastructure/email/send-email-options.interface.ts`
- `backend/src/infrastructure/email/email.service.ts`
- `backend/src/infrastructure/email/email.module.ts`
- `backend/src/infrastructure/email/templates/rent-call-email.template.ts`
- `backend/src/infrastructure/email/__tests__/email.service.spec.ts`
- `backend/src/infrastructure/email/__tests__/rent-call-email.template.spec.ts`
- `backend/src/infrastructure/shared/escape-html.util.ts` (review fix: XSS prevention)
- `backend/src/infrastructure/shared/sanitize-filename.util.ts` (review fix: centralized utility)
- `backend/src/infrastructure/shared/format-tenant-name.util.ts` (review fix: DRY extraction)
- `backend/src/infrastructure/shared/__tests__/escape-html.util.spec.ts`
- `backend/src/infrastructure/shared/__tests__/sanitize-filename.util.spec.ts`
- `backend/src/billing/rent-call/events/rent-call-sent.event.ts`
- `backend/src/billing/rent-call/commands/send-rent-calls-by-email.command.ts`
- `backend/src/billing/rent-call/commands/send-rent-calls-by-email.handler.ts` (review fix: handler created)
- `backend/src/billing/rent-call/__tests__/send-rent-calls-by-email.handler.spec.ts`
- `backend/src/presentation/rent-call/controllers/send-rent-calls-by-email.controller.ts`
- `backend/src/presentation/rent-call/dto/send-rent-calls.dto.ts`
- `backend/src/presentation/rent-call/__tests__/send-rent-calls-by-email.controller.spec.ts`
- `backend/prisma/migrations/20260213170304_add_rent_call_sent_fields/migration.sql`
- `backend/prisma/migrations/20260213173352_add_entity_email/migration.sql`
- `frontend/src/components/features/rent-calls/send-rent-calls-dialog.tsx`
- `frontend/src/components/features/rent-calls/send-batch-summary.tsx`
- `frontend/src/components/features/rent-calls/__tests__/send-rent-calls-dialog.test.tsx`
- `frontend/src/components/features/rent-calls/__tests__/send-batch-summary.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-send-rent-calls.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-sent.test.tsx`

**Modified files (30):**
- `backend/package.json` (nodemailer + @types/nodemailer)
- `backend/package-lock.json`
- `backend/.env.example` (SMTP env vars — review fix: localhost:1025 defaults + SMTP_SECURE)
- `backend/prisma/schema.prisma` (sentAt, recipientEmail on RentCall + entity email)
- `backend/src/app.module.ts` (EmailModule import)
- `backend/src/billing/rent-call/rent-call.aggregate.ts` (markAsSent, RentCallSent handler)
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts` (4 new tests)
- `backend/src/billing/rent-call/rent-call.module.ts` (review fix: handler moved to presentation)
- `backend/src/billing/rent-call/commands/generate-rent-calls-for-month.command.ts` (review fix: simplified — no rentCallData)
- `backend/src/billing/rent-call/commands/generate-rent-calls-for-month.handler.ts` (review fix: full orchestration)
- `backend/src/billing/rent-call/__tests__/generate-rent-calls-for-month.handler.spec.ts` (review fix: expanded tests)
- `backend/src/portfolio/entity/events/entity-created.event.ts` (review fix: email optional)
- `backend/src/presentation/rent-call/controllers/generate-rent-calls-for-month.controller.ts` (review fix: thin)
- `backend/src/presentation/rent-call/controllers/get-rent-call-pdf.controller.ts` (review fix: shared utilities)
- `backend/src/presentation/rent-call/services/rent-call-pdf-assembler.service.ts` (review fix: shared utility)
- `backend/src/presentation/rent-call/__tests__/generate-rent-calls-for-month.controller.spec.ts` (review fix: thin tests)
- `backend/src/presentation/rent-call/projections/rent-call.projection.ts` (RentCallSent handler)
- `backend/src/presentation/rent-call/__tests__/rent-call.projection.spec.ts` (2 new tests)
- `backend/src/presentation/rent-call/finders/rent-call.finder.ts` (findUnsentByEntityAndMonth)
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts` (handlers + CqrxModule)
- `docker-compose.yml` (review fix: port comments)
- `frontend/src/lib/api/rent-calls-api.ts` (SendResult, sentAt, recipientEmail, sendRentCallsByEmail)
- `frontend/src/hooks/use-rent-calls.ts` (useSendRentCallsByEmail + review fix: units cache invalidation)
- `frontend/src/hooks/__tests__/use-rent-calls.test.ts` (3 new tests)
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx` (send button, dialog, summary)
- `frontend/src/components/features/rent-calls/rent-call-list.tsx` (Envoyé badge)
- `frontend/src/components/features/rent-calls/send-batch-summary.tsx` (review fix: name-based keys)
- `frontend/src/components/features/dashboard/action-feed.tsx` (step 8 + Mail icon)
- `frontend/src/components/features/dashboard/unit-mosaic.tsx` (orange color for sent)
- `frontend/e2e/rent-calls.spec.ts` (3 new E2E tests + review fix: test.skip pattern)
