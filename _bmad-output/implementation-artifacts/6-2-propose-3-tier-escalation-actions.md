# Story 6.2: Propose 3-Tier Escalation Actions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want the system to propose escalation actions in 3 tiers for each unpaid rent,
So that I can follow a structured recovery process (FR36, FR37, FR41).

## Acceptance Criteria

1. **AC1 — StatusTimeline component:** Given a late payment has been detected (from Story 6.1 `useUnpaidRentCalls`), When I view the unpaid rent details (via a dedicated unpaid detail page or inline expansion on the rent calls page), Then I see the StatusTimeline component showing 3 escalation tiers:
   - **Tier 1:** Email reminder (relance par email)
   - **Tier 2:** Formal notice via registered mail (mise en demeure par lettre recommandée)
   - **Tier 3:** Stakeholder notification (signalement assureur, avocat, garant)
   Each tier shows: status (available/completed/skipped), date if completed, action button.

2. **AC2 — Escalation state tracking per rent call:** Given an unpaid rent call, When escalation actions are taken, Then the system tracks which tiers have been executed per rent call (FR41) via domain events on a new EscalationAggregate (stream `escalation-{rentCallId}`). Tracked state: `tier1SentAt`, `tier1RecipientEmail`, `tier2SentAt`, `tier3SentAt`, each nullable (null = not yet executed).

3. **AC3 — Tier 1 action — Send email reminder:** Given a late rent call and Tier 1 is available (not yet sent), When I click the Tier 1 action button, Then an email reminder is sent to the tenant with: professional French-language subject and body, amount due, number of days late, payment instructions with IBAN. The event `ReminderEmailSent` is stored in KurrentDB. The StatusTimeline updates Tier 1 to "completed" with the sent date.

4. **AC4 — Tier 2 action — Generate formal notice PDF:** Given Tier 1 has been completed (or skipped) and Tier 2 is available, When I click the Tier 2 action button, Then the system generates a mise en demeure PDF with: entity details, tenant details, lease reference, unpaid periods with amounts, total debt, legal mentions required by French law, formal demand for payment within 8 days. The PDF is available for download. The event `FormalNoticeGenerated` is stored in KurrentDB. The StatusTimeline updates Tier 2 to "completed". PDF generation completes in under 3 seconds (NFR3).

5. **AC5 — Tier 3 action — Generate stakeholder notification letters:** Given Tier 2 has been completed (or skipped) and Tier 3 is available, When I click the Tier 3 action button, Then the system generates stakeholder notification PDF letters for configured recipients (insurance, lawyer, guarantor). Each letter contains: entity details, tenant details, lease reference, debt summary, escalation history. The event `StakeholderNotificationGenerated` is stored in KurrentDB. The StatusTimeline updates Tier 3 to "completed".

6. **AC6 — Tier skip capability:** Given any tier is available, When I want to skip directly to a higher tier, Then I can skip any tier (e.g., skip Tier 1 email and go directly to Tier 2 formal notice). Skipped tiers show status "skipped" in the StatusTimeline.

7. **AC7 — Unpaid detail page:** Given I have unpaid rent calls, When I click on an unpaid alert in the ActionFeed or an unpaid rent call row, Then I navigate to `/rent-calls/:id` detail page showing: rent call details (tenant, unit, amount, days late), StatusTimeline with escalation tiers, and action buttons for each available tier.

8. **AC8 — ActionFeed escalation updates:** Given escalation actions have been taken, When I view the ActionFeed, Then unpaid alerts show the current escalation tier status (e.g., "Relance envoyée le 10/02" or "Mise en demeure disponible").

## Tasks / Subtasks

- [x] Task 1 — Create Recovery Bounded Context with EscalationAggregate (AC: #2)
  - [x] 1.1 Create `backend/src/recovery/` directory structure (recovery.module.ts)
  - [x] 1.2 Add `@recovery/*` path alias to tsconfig.json, Jest moduleNameMapper (package.json), webpack.config.js
  - [x] 1.3 Create `EscalationAggregate` with stream `escalation-{rentCallId}` — fields: `rentCallId`, `entityId`, `tenantId`, `tier1SentAt`, `tier1RecipientEmail`, `tier2SentAt`, `tier3SentAt`
  - [x] 1.4 Create `EscalationInitiated` event (emitted on first tier action, carries rentCallId + entityId + tenantId)
  - [x] 1.5 Create `ReminderEmailSent` event (tier1SentAt, recipientEmail)
  - [x] 1.6 Create `FormalNoticeGenerated` event (tier2SentAt)
  - [x] 1.7 Create `StakeholderNotificationGenerated` event (tier3SentAt)
  - [x] 1.8 Create escalation aggregate tests (init + each tier transition + skip + no-op guard for already-completed tier)
  - [x] 1.9 Register RecoveryModule in app.module.ts

- [x] Task 2 — Implement Tier 1: Send Email Reminder command + handler (AC: #3)
  - [x] 2.1 Create `SendAReminderEmailCommand` (rentCallId, entityId, tenantId, tenantEmail)
  - [x] 2.2 Create `SendAReminderEmailHandler` — loads/creates EscalationAggregate, calls `sendReminderEmail(tenantEmail, sentAt)`, saves
  - [x] 2.3 Create `renderReminderEmailHtml(data: ReminderEmailData)` template in `infrastructure/email/templates/` — French professional language, amount due, days late, IBAN
  - [x] 2.4 Create `ReminderEmailData` interface with fields: tenantName, amount (formatted), daysLate, entityName, entityIban, entityBic, period
  - [x] 2.5 Write handler + template tests

- [x] Task 3 — Implement Tier 2: Generate Formal Notice PDF (AC: #4)
  - [x] 3.1 Create `GenerateAFormalNoticeCommand` (rentCallId, entityId, tenantId)
  - [x] 3.2 Create `GenerateAFormalNoticeHandler` — loads EscalationAggregate, calls `generateFormalNotice(sentAt)`, saves
  - [x] 3.3 Create `renderFormalNoticePdf(doc, data: FormalNoticePdfData)` template in `infrastructure/document/templates/`
  - [x] 3.4 Create `FormalNoticePdfData` interface — entity details, tenant details, lease ref, unpaid periods, total debt, escalation history, legal mentions
  - [x] 3.5 Create `FormalNoticePdfAssembler` — maps Prisma data to `FormalNoticePdfData`
  - [x] 3.6 Write handler + template + assembler tests

- [x] Task 4 — Implement Tier 3: Generate Stakeholder Notification Letters (AC: #5)
  - [x] 4.1 Create `GenerateStakeholderNotificationsCommand` (rentCallId, entityId, tenantId)
  - [x] 4.2 Create `GenerateStakeholderNotificationsHandler` — loads EscalationAggregate, calls `generateStakeholderNotifications(sentAt)`, saves
  - [x] 4.3 Create `renderStakeholderLetterPdf(doc, data: StakeholderLetterPdfData)` template — entity, tenant, lease, debt summary, escalation history
  - [x] 4.4 Create `StakeholderLetterPdfData` interface + `StakeholderLetterPdfAssembler`
  - [x] 4.5 Write handler + template + assembler tests

- [x] Task 5 — Escalation presentation layer: controllers + projection + finders (AC: #2, #7)
  - [x] 5.1 Create `escalation` Prisma model: `id`, `rentCallId` (@@unique), `entityId`, `userId`, `tenantId`, `tier1SentAt`, `tier1RecipientEmail`, `tier2SentAt`, `tier3SentAt`, `createdAt`
  - [x] 5.2 Create `EscalationProjection` — subscribes to escalation events, upserts Prisma model
  - [x] 5.3 Create `EscalationFinder` — `findByRentCallId(rentCallId, userId)`, `findAllByEntity(entityId, userId)`
  - [x] 5.4 Create `SendAReminderEmailController` — POST `/api/entities/:entityId/rent-calls/:rentCallId/escalation/reminder` → dispatches command, calls EmailService, returns 202
  - [x] 5.5 Create `GenerateAFormalNoticeController` — POST `/api/entities/:entityId/rent-calls/:rentCallId/escalation/formal-notice` → dispatches command, generates PDF, returns buffer
  - [x] 5.6 Create `GenerateStakeholderNotificationsController` — POST `/api/entities/:entityId/rent-calls/:rentCallId/escalation/stakeholder-notifications` → dispatches command, generates PDFs, returns zip or individual downloads
  - [x] 5.7 Create `GetEscalationStatusController` — GET `/api/entities/:entityId/rent-calls/:rentCallId/escalation` → returns escalation state
  - [x] 5.8 Create DTOs for each endpoint with proper validation (`@IsUUID`, `@IsNotEmpty`)
  - [x] 5.9 Create `EscalationPresentationModule` — register controllers, finders, projection, handlers
  - [x] 5.10 Write controller + finder + projection tests

- [x] Task 6 — StatusTimeline component + rent call detail (AC: #1, #6, #7)
  - [x] 6.1 Create `StatusTimeline` component — 3-tier vertical timeline with status indicators (available/completed/skipped), dates, action buttons
  - [x] 6.2 Create `useEscalationStatus(entityId, rentCallId)` query hook
  - [x] 6.3 Create `useSendReminderEmail(entityId)` mutation hook
  - [x] 6.4 Create `useGenerateFormalNotice(entityId)` mutation hook (blob download pattern)
  - [x] 6.5 Create `useGenerateStakeholderNotifications(entityId)` mutation hook (blob download pattern)
  - [x] 6.6 Create/extend rent call detail page (`/rent-calls/:id`) — display rent call info + StatusTimeline + action buttons
  - [x] 6.7 Add "Voir détails" link on unpaid rent call rows and ActionFeed alerts → navigates to `/rent-calls/:id`
  - [x] 6.8 Write StatusTimeline + hooks + detail page tests

- [x] Task 7 — ActionFeed escalation status integration (AC: #8)
  - [x] 7.1 Extend `useUnpaidAlerts()` — fetch escalation status for each unpaid rent call, show current tier in alert description
  - [x] 7.2 Update alert text: "Loyer impayé — {tenant} — {amount} — Relance envoyée le {date}" or "Mise en demeure disponible"
  - [x] 7.3 Update href from `/rent-calls?filter=unpaid` to `/rent-calls/{id}` for rent calls with escalation history
  - [x] 7.4 Write ActionFeed escalation status tests

- [x] Task 8 — E2E tests (AC: #1-8)
  - [x] 8.1 Create `e2e/escalation.spec.ts` — serial mode, seed entity+property+unit+tenant+lease, generate rent call for past month, send it, configure 0 delay threshold, verify unpaid detection
  - [x] 8.2 Test navigation: navigate from unpaid filter to detail page, verify StatusTimeline visible
  - [x] 8.3 Test StatusTimeline: verify all 3 tiers and action buttons visible
  - [x] 8.4 Test Tier 2: click formal notice button, verify PDF download (tier skip scenario)
  - [N/A] 8.5 Tier 1 email test: skipped in E2E (MailHog dependency) — covered by backend unit tests

## Dev Notes

### Architecture Decision: Recovery Bounded Context

**Critical:** Story 6.2 introduces the **Recovery BC** (`backend/src/recovery/`), the 4th bounded context after Portfolio, Tenancy, and Billing. This was deferred from Story 6.1 (which used computed queries only — no domain events).

**EscalationAggregate vs. ReminderAggregate:**

The architecture.md mentions a `ReminderAggregate` in the Recovery BC. However, the actual domain concept is **escalation tracking per rent call** — not "a reminder" as a standalone entity. The aggregate should be named `EscalationAggregate` with stream `escalation-{rentCallId}`:

- One escalation per unpaid rent call (not per tenant)
- Tracks all 3 tiers in a single aggregate (not 3 separate aggregates)
- Stream keyed by `rentCallId` (1:1 relationship) — if the same rent call becomes unpaid again (unlikely), the existing escalation continues
- `@@unique([rentCallId])` in Prisma ensures idempotency

**Why NOT store escalation on RentCallAggregate:**
- Cross-BC violation: RentCall is in Billing BC, escalation belongs to Recovery BC
- Separation of concerns: RentCall tracks billing; Escalation tracks the recovery process
- If escalation grows complex (saga, recurring reminders, etc.), it has its own aggregate stream

### New Bounded Context Setup Checklist

Follow the **exact pattern** from Story 3.1 (Tenancy BC) and Story 4.1 (Billing BC):

1. Create `backend/src/recovery/` directory:
   ```
   recovery/
   ├── escalation/
   │   ├── escalation.aggregate.ts
   │   ├── escalation.module.ts
   │   ├── commands/
   │   │   ├── send-a-reminder-email.command.ts
   │   │   ├── send-a-reminder-email.handler.ts
   │   │   ├── generate-a-formal-notice.command.ts
   │   │   ├── generate-a-formal-notice.handler.ts
   │   │   ├── generate-stakeholder-notifications.command.ts
   │   │   └── generate-stakeholder-notifications.handler.ts
   │   ├── events/
   │   │   ├── escalation-initiated.event.ts
   │   │   ├── reminder-email-sent.event.ts
   │   │   ├── formal-notice-generated.event.ts
   │   │   └── stakeholder-notification-generated.event.ts
   │   └── __tests__/
   └── recovery.module.ts
   ```

2. Add `@recovery/*` path alias:
   - `backend/tsconfig.json` → `"@recovery/*": ["src/recovery/*"]`
   - `backend/package.json` → Jest `moduleNameMapper`: `"^@recovery/(.*)$": "<rootDir>/src/recovery/$1"`
   - `backend/webpack.config.js` → `"@recovery": path.resolve(__dirname, "src/recovery")`

3. Register `RecoveryModule` in `app.module.ts` imports array

### Controller Orchestration Pattern

Story 6.2 controllers follow the **Story 4.2 PDF pattern** for Tier 2 and Tier 3:

**Tier 1 (email reminder):**
```typescript
// POST /api/entities/:entityId/rent-calls/:rentCallId/escalation/reminder
async handle(...) {
  // 1. Ownership check
  const entity = await this.entityFinder.findByIdAndUserId(entityId, userId.value);
  if (!entity) throw new UnauthorizedException();

  // 2. Load unpaid rent call data for email template
  const rentCall = await this.rentCallFinder.findByIdAndEntity(rentCallId, entityId);
  if (!rentCall) throw new NotFoundException();

  // 3. Dispatch command (aggregate emits event)
  await this.commandBus.execute(new SendAReminderEmailCommand(rentCallId, entityId, rentCall.tenantEmail));

  // 4. Send email (infrastructure)
  const html = renderReminderEmailHtml({ ... });
  await this.emailService.send({ to: rentCall.tenantEmail, subject: '...', html, bcc: entity.email });

  return; // 202 Accepted
}
```

**Tier 2 (formal notice PDF):**
```typescript
// POST /api/entities/:entityId/rent-calls/:rentCallId/escalation/formal-notice
async handle(@Res() res: Response, ...) {
  // 1. Ownership + data load
  // 2. Dispatch command
  // 3. Generate PDF
  const data = await this.assembler.assemble(rentCallId, entityId);
  const buffer = await this.pdfGenerator.generate((doc) => renderFormalNoticePdf(doc, data));

  // 4. Return PDF buffer
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
  res.end(buffer);
}
```

### Escalation Aggregate State Machine

```
Initial State: No escalation record
  ↓ (first tier action)
EscalationInitiated → tier1SentAt=null, tier2SentAt=null, tier3SentAt=null
  ↓ (Tier 1 OR skip to Tier 2)
ReminderEmailSent → tier1SentAt=Date, tier1RecipientEmail=email
  ↓ (Tier 2 OR skip to Tier 3)
FormalNoticeGenerated → tier2SentAt=Date
  ↓ (Tier 3)
StakeholderNotificationGenerated → tier3SentAt=Date
```

**Guards:**
- `sendReminderEmail()`: no-op if `tier1SentAt` already set (idempotent)
- `generateFormalNotice()`: no-op if `tier2SentAt` already set
- `generateStakeholderNotifications()`: no-op if `tier3SentAt` already set
- No strict ordering required — tiers can be skipped (AC6)

### Existing Infrastructure to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `UnpaidRentCallFinder` | `presentation/rent-call/finders/` | Fetch unpaid rent call data for email/PDF templates |
| `useUnpaidRentCalls(entityId)` | `frontend/src/hooks/` | Already fetches unpaid rent calls for dashboard |
| `EmailService` | `infrastructure/email/` | Send reminder emails (follow 4.3 pattern) |
| `PdfGeneratorService` | `infrastructure/document/` | Generate formal notice + stakeholder PDFs |
| `renderRentCallEmailHtml()` | `infrastructure/email/templates/` | Reference template for reminder email style |
| `renderReceiptPdf()` | `infrastructure/document/templates/` | Reference template for formal notice PDF structure |
| `RentCallPdfAssembler` | `presentation/rent-call/` | Reference pattern for FormalNoticePdfAssembler |
| `escapeHtml()` | `infrastructure/email/templates/` | Escape all interpolated strings in email HTML |
| `sanitizeForFilename()` | `infrastructure/document/` | Sanitize tenant name for PDF filename |
| `downloadPdf()` helper | `frontend/src/lib/api/` | DRY download helper from Story 5.6 |
| `EntityFinder` | `presentation/entity/finders/` | Ownership check in controllers |
| `RentCallFinder` | `presentation/rent-call/finders/` | Fetch rent call data for template assembly |

### UnitMosaic Color Priority (No Change)

Color priority remains unchanged from Story 6.1:
```
1. RED (bg-red-100) — Unpaid/late rent call (highest priority)
2. GREEN (bg-green-100) — Paid/overpaid
3. AMBER (bg-amber-100) — Partially paid
4. ORANGE (bg-orange-100) — Sent (pending payment)
5. MUTED (bg-muted) — Vacant or no rent call
```

### ActionFeed Priority Order (Updated)

```
1. CRITICAL — Unpaid rent alerts WITH escalation status
2. HIGH — Insurance expired/expiring alerts
3. HIGH — "Envoyez vos appels de loyer" (unsent rent calls)
4. HIGH — "Générez vos appels de loyer" (no rent calls for month)
5. MEDIUM — Onboarding progression steps
```

### Formal Notice (Mise en Demeure) — French Legal Requirements

The mise en demeure PDF must contain:
1. **Header:** Entity name, address, SIRET
2. **Recipient:** Tenant name, address
3. **Object:** "MISE EN DEMEURE" (capitalized, prominent)
4. **Lease reference:** Lease start date, unit address
5. **Unpaid details:** Period(s), individual amounts, total debt
6. **Escalation history:** Date of initial reminder (if sent)
7. **Formal demand:** "Je vous mets en demeure de régler la somme de {amount} dans un délai de 8 jours à compter de la réception de la présente"
8. **Legal mention:** Reference to articles 7 and 24 of the law of July 6, 1989 (loi n° 89-462)
9. **Consequences:** "À défaut de règlement dans le délai imparti, je me réserve le droit d'engager toute action judiciaire aux fins de recouvrement"
10. **Signature line:** Entity name, date

### Stakeholder Notification Letter Content

The stakeholder letter must contain:
1. **Recipient type:** Insurance company / Lawyer / Guarantor (garant)
2. **Entity details** (sender)
3. **Tenant details** (subject of notification)
4. **Lease reference**
5. **Debt summary:** Total amount, unpaid periods
6. **Escalation history:** Tier 1 date, Tier 2 date
7. **Request for action:** Varies by recipient type
   - Insurance: "Nous vous informons de la situation de défaut de paiement..."
   - Lawyer: "Nous souhaitons engager une procédure de recouvrement..."
   - Guarantor: "En application de la clause de cautionnement..."

### StatusTimeline Component Design

```
┌─────────────────────────────────────┐
│  Suivi de la procédure              │
│                                     │
│  ● Tier 1 — Relance par email       │
│  │  ✅ Envoyé le 10/02/2026         │
│  │  └── dupont@email.com            │
│  │                                   │
│  ● Tier 2 — Mise en demeure         │
│  │  🔵 Disponible                    │
│  │  └── [Générer la mise en demeure]│
│  │                                   │
│  ○ Tier 3 — Signalement             │
│     ⏳ En attente (Tier 2 requis)   │
│     └── [Générer les courriers]     │
│                                     │
└─────────────────────────────────────┘
```

**Visual states per tier:**
- `completed` (●✅): Green dot, date displayed, action disabled
- `available` (●🔵): Blue dot, action button enabled
- `skipped` (●⏭): Gray dot with strikethrough, "Ignoré" label
- `pending` (○⏳): Hollow dot, action disabled (greyed out)

**Tier availability rules:**
- Tier 1: always available if not completed
- Tier 2: available if not completed (Tier 1 can be skipped — AC6)
- Tier 3: available if not completed (Tier 2 can be skipped — AC6)

### Rent Call Detail Page Extension

The rent call detail page (`/rent-calls/:id`) must be created or extended to show:
1. **Rent call header:** Tenant name, unit, month, total amount
2. **Payment status:** Paid/partial/unpaid badge
3. **Days late:** If unpaid, show days late with destructive badge
4. **StatusTimeline:** (if unpaid — show escalation tiers)
5. **Billing lines breakdown:** Existing from lease detail
6. **PDF download:** Download rent call PDF (existing from 4.2)

### Testing Patterns

**Backend tests:**
- `EscalationAggregate` tests: follow exact pattern from `RentCallAggregate` tests (mock-cqrx.ts for ESM mock)
- Use `mock-cqrx.ts` from `backend/src/billing/rent-call/__tests__/` — copy or share
- Handler tests: mock `AggregateRepository`, `EmailService`, `PdfGeneratorService`
- Template tests: verify HTML output contains expected French text, amounts, IBAN
- PDF template tests: verify doc.text() calls via mock doc spy (follow renderRentCallPdf test pattern)

**Frontend tests:**
- StatusTimeline: render with various states (all pending, partial completion, all completed)
- Hooks: mock fetchWithAuth, verify query keys and mutation callbacks
- Detail page: follow `LeaseDetailContent` extraction pattern (avoid `use(Promise)` in jsdom)
- ActionFeed: extend existing `action-feed-unpaid.test.tsx` with escalation status

**E2E tests:**
- Serial mode (like lease/unpaid tests)
- Set delay threshold to 0 for immediate unpaid detection
- Verify StatusTimeline renders on rent call detail page
- Test email reminder (check MailHog if available, else verify UI update)
- Test PDF download (use `page.waitForEvent('download')` pattern from 4.2)

### Project Structure Notes

- New BC: `backend/src/recovery/` — 4th bounded context, contains EscalationAggregate
- Path alias: `@recovery/*` added to tsconfig.json, Jest moduleNameMapper, webpack.config.js
- Presentation: `backend/src/presentation/escalation/` — controllers, finders, projection, DTO, queries
- Frontend: `frontend/src/components/features/escalation/` — StatusTimeline, hooks, detail page components
- No new frontend route needed — extend existing `/rent-calls/:id` detail page
- Prisma migration: add `escalations` table with `@@unique([rentCallId])`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Stories 6.2-6.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Recovery BC, lines 391-421]
- [Source: _bmad-output/planning-artifacts/architecture.md — BC Directory Pattern, lines 440-466]
- [Source: _bmad-output/planning-artifacts/architecture.md — Document & Email Services, lines 437-438]
- [Source: _bmad-output/planning-artifacts/architecture.md — Formal Notice template, line 1255]
- [Source: _bmad-output/planning-artifacts/architecture.md — Stakeholder Letter template, line 1257]
- [Source: docs/project-context.md — CQRS/Event Sourcing Patterns]
- [Source: docs/project-context.md — Backend Architecture, Domain Layer Rules]
- [Source: _bmad-output/implementation-artifacts/6-1-detect-late-payments-and-display-unpaid-status.md — Previous story intelligence]
- [Source: _bmad-output/implementation-artifacts/epic-5-retro-2026-02-14.md — Epic 6 readiness assessment]
- [Source: backend/src/infrastructure/email/email.service.ts — Email sending infrastructure]
- [Source: backend/src/infrastructure/document/pdf-generator.service.ts — PDF generation infrastructure]
- [Source: backend/src/presentation/rent-call/finders/unpaid-rent-call.finder.ts — Unpaid detection finder]
- [Source: frontend/src/components/features/dashboard/action-feed.tsx — useUnpaidAlerts hook]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

**New Files (55):**
- `backend/src/recovery/recovery.module.ts`
- `backend/src/recovery/escalation/escalation.module.ts`
- `backend/src/recovery/escalation/escalation.aggregate.ts`
- `backend/src/recovery/escalation/events/escalation-initiated.event.ts`
- `backend/src/recovery/escalation/events/reminder-email-sent.event.ts`
- `backend/src/recovery/escalation/events/formal-notice-generated.event.ts`
- `backend/src/recovery/escalation/events/stakeholder-notification-generated.event.ts`
- `backend/src/recovery/escalation/commands/send-a-reminder-email.command.ts`
- `backend/src/recovery/escalation/commands/send-a-reminder-email.handler.ts`
- `backend/src/recovery/escalation/commands/generate-a-formal-notice.command.ts`
- `backend/src/recovery/escalation/commands/generate-a-formal-notice.handler.ts`
- `backend/src/recovery/escalation/commands/generate-stakeholder-notifications.command.ts`
- `backend/src/recovery/escalation/commands/generate-stakeholder-notifications.handler.ts`
- `backend/src/recovery/escalation/__tests__/mock-cqrx.ts`
- `backend/src/recovery/escalation/__tests__/escalation.aggregate.spec.ts`
- `backend/src/recovery/escalation/__tests__/send-a-reminder-email.handler.spec.ts`
- `backend/src/recovery/escalation/__tests__/generate-a-formal-notice.handler.spec.ts`
- `backend/src/recovery/escalation/__tests__/generate-stakeholder-notifications.handler.spec.ts`
- `backend/src/presentation/escalation/escalation-presentation.module.ts`
- `backend/src/presentation/escalation/controllers/get-escalation-status.controller.ts`
- `backend/src/presentation/escalation/controllers/send-a-reminder-email.controller.ts`
- `backend/src/presentation/escalation/controllers/generate-a-formal-notice.controller.ts`
- `backend/src/presentation/escalation/controllers/generate-stakeholder-notifications.controller.ts`
- `backend/src/presentation/escalation/dto/stakeholder-notification.dto.ts`
- `backend/src/presentation/escalation/finders/escalation.finder.ts`
- `backend/src/presentation/escalation/projections/escalation.projection.ts`
- `backend/src/presentation/escalation/services/formal-notice-pdf-assembler.service.ts`
- `backend/src/presentation/escalation/services/stakeholder-letter-pdf-assembler.service.ts`
- `backend/src/presentation/escalation/__tests__/get-escalation-status.controller.spec.ts`
- `backend/src/presentation/escalation/__tests__/send-a-reminder-email.controller.spec.ts`
- `backend/src/presentation/escalation/__tests__/escalation.finder.spec.ts`
- `backend/src/presentation/escalation/__tests__/escalation.projection.spec.ts`
- `backend/src/presentation/escalation/__tests__/formal-notice-pdf-assembler.spec.ts`
- `backend/src/presentation/escalation/__tests__/stakeholder-letter-pdf-assembler.spec.ts`
- `backend/src/presentation/escalation/__tests__/generate-a-formal-notice.controller.spec.ts`
- `backend/src/presentation/escalation/__tests__/generate-stakeholder-notifications.controller.spec.ts`
- `backend/src/presentation/escalation/controllers/get-batch-escalation-status.controller.ts`
- `backend/src/presentation/escalation/__tests__/get-batch-escalation-status.controller.spec.ts`
- `backend/src/infrastructure/document/formal-notice-pdf-data.interface.ts`
- `backend/src/infrastructure/document/stakeholder-letter-pdf-data.interface.ts`
- `backend/src/infrastructure/document/templates/formal-notice.template.ts`
- `backend/src/infrastructure/document/templates/stakeholder-letter.template.ts`
- `backend/src/infrastructure/document/templates/__tests__/formal-notice.template.spec.ts`
- `backend/src/infrastructure/document/templates/__tests__/stakeholder-letter.template.spec.ts`
- `backend/src/infrastructure/email/templates/reminder-email.template.ts`
- `backend/src/infrastructure/email/templates/__tests__/reminder-email.template.spec.ts`
- `frontend/src/lib/api/escalation-api.ts`
- `frontend/src/hooks/use-escalation.ts`
- `frontend/src/components/features/escalation/status-timeline.tsx`
- `frontend/src/components/features/escalation/rent-call-detail-content.tsx`
- `frontend/src/app/(auth)/rent-calls/[id]/page.tsx`
- `frontend/src/hooks/__tests__/use-escalation.test.ts`
- `frontend/src/components/features/escalation/__tests__/status-timeline.test.tsx`
- `frontend/src/components/features/escalation/__tests__/rent-call-detail-content.test.tsx`
- `frontend/e2e/escalation.spec.ts`

**Modified Files (19):**
- `backend/src/app.module.ts` — import RecoveryModule + EscalationPresentationModule
- `backend/tsconfig.json` — add @recovery/* path alias
- `backend/webpack.config.js` — add @recovery/* alias
- `backend/package.json` — add @recovery/* Jest moduleNameMapper
- `backend/prisma/schema.prisma` — add escalations table
- `backend/src/infrastructure/document/pdf-generator.service.ts` — extract shared formatDate
- `frontend/src/components/features/dashboard/action-feed.tsx` — add useEscalationStatuses integration, unpaid alert href to detail page
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx` — add "Voir détails" link on unpaid cards
- `frontend/src/components/layout/sidebar.tsx` — add unpaid badge on "Appels de loyer" nav item
- `frontend/src/components/features/dashboard/__tests__/action-feed-unpaid.test.tsx` — add escalation mock + escalation tests
- `frontend/src/components/features/dashboard/__tests__/action-feed.test.tsx` — add escalation mock
- `frontend/src/components/features/dashboard/__tests__/action-feed-insurance.test.tsx` — add escalation mock
- `frontend/src/components/features/dashboard/__tests__/action-feed-lease.test.tsx` — add escalation mock
- `frontend/src/components/features/dashboard/__tests__/action-feed-rent-calls.test.tsx` — add escalation mock
- `frontend/src/components/features/dashboard/__tests__/action-feed-send-rent-calls.test.tsx` — add escalation mock
- `frontend/src/components/features/dashboard/__tests__/action-feed-import-bank-statement.test.tsx` — add escalation mock
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-paid.test.tsx` — update mock for escalation hooks
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-sent.test.tsx` — update mock for escalation hooks
- `frontend/e2e/fixtures/api.fixture.ts` — add escalation API helpers
