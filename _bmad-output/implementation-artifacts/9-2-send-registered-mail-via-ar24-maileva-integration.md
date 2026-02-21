# Story 9.2: Send Registered Mail via AR24/Maileva Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to send registered mail (lettres recommandees) directly via AR24 from the application,
So that I can dispatch formal notices without visiting a post office (FR40).

## Acceptance Criteria

1. **Given** I have generated a formal notice PDF (mise en demeure from Epic 6), **When** I choose to send via registered mail integration, **Then** the system transmits the document to AR24 API with: recipient address, sender address, document PDF, registered mail options (AR — accuse de reception).
2. **And** the system receives a tracking number and dispatch confirmation.
3. **And** the event `RegisteredMailDispatched` is stored in KurrentDB with tracking reference.
4. **And** the StatusTimeline in Epic 6 updates with the tracking status.
5. **And** the cost of the registered mail is displayed before confirmation.
6. **And** if AR24 API credentials are not configured, the registered mail option is hidden (graceful degradation).
7. **And** the sent registered mail tracking information is visible in the escalation detail.

## Tasks / Subtasks

- [x] Task 1 — Create RegisteredMailModule infrastructure service with AR24 adapter (AC: #1, #6)
  - [x] 1.1 Create `backend/src/infrastructure/registered-mail/registered-mail.module.ts` as @Global() module
  - [x] 1.2 Create `ar24.service.ts` with authentication (token + AES-256-CBC signature), `sendLetter()`, `uploadAttachment()`, `getStatus()`
  - [x] 1.3 Create `ar24-crypto.util.ts` for AES-256-CBC signature generation and response decryption
  - [x] 1.4 Implement `isAvailable` property for graceful degradation (env vars: `AR24_TOKEN`, `AR24_PRIVATE_KEY`, `AR24_USER_ID`)
  - [x] 1.5 Unit tests for crypto utility, service methods (HTTP mocked)

- [x] Task 2 — Create domain event and extend EscalationAggregate (AC: #3)
  - [x] 2.1 Create `RegisteredMailDispatched` event in `recovery/escalation/events/`
  - [x] 2.2 Add aggregate state: `registeredMailTrackingId`, `registeredMailProvider`, `registeredMailCostCents`, `registeredMailDispatchedAt`
  - [x] 2.3 Add `dispatchViaRegisteredMail(trackingId, provider, costCents)` method with no-op guard
  - [x] 2.4 Unit tests for aggregate method and event application

- [x] Task 3 — Create command, handler, and controller (AC: #1, #2, #5)
  - [x] 3.1 Create `DispatchViaRegisteredMailCommand` + handler in `recovery/escalation/commands/`
  - [x] 3.2 Handler flow: load escalation → dispatch via registered mail → save aggregate
  - [x] 3.3 Create `SendFormalNoticeViaRegisteredMailController` at `POST /api/entities/:entityId/rent-calls/:rentCallId/escalation/formal-notice/registered-mail`
  - [x] 3.4 Create `GetRegisteredMailCostController` at `GET /api/entities/:entityId/escalation/registered-mail/cost` for cost pre-display
  - [x] 3.5 Unit tests for handler (mocked repository)

- [x] Task 4 — Extend Prisma schema and projection (AC: #3, #4, #7)
  - [x] 4.1 Add fields to Escalation model: `registeredMailTrackingId`, `registeredMailProvider`, `registeredMailCostCents`, `registeredMailDispatchedAt`, `registeredMailStatus`, `registeredMailProofUrl`
  - [x] 4.2 Create Prisma migration
  - [x] 4.3 Extend `EscalationProjection` to handle `RegisteredMailDispatched` and `RegisteredMailStatusUpdated` events
  - [x] 4.4 Extend `EscalationFinder` with `findByRegisteredMailTrackingId()`
  - [x] 4.5 Extend `EscalationStatusResponse` interface and both query handlers

- [x] Task 5 — AR24 webhook controller for status tracking (AC: #4)
  - [x] 5.1 Create `Ar24WebhookController` at `POST /api/webhooks/ar24` (public endpoint, IP-whitelisted)
  - [x] 5.2 Parse webhook payload (status updates: sent, AR, negligence, refused, bounced)
  - [x] 5.3 Create `UpdateRegisteredMailStatusCommand` + handler to update aggregate
  - [x] 5.4 Add `RegisteredMailStatusUpdated` event with delivery status
  - [x] 5.5 Extend projection for status updates
  - [x] 5.6 Unit tests for handler

- [x] Task 6 — Frontend: cost preview and send button in StatusTimeline (AC: #4, #5, #7)
  - [x] 6.1 Create `useRegisteredMailCost(entityId)` hook — fetches cost from API
  - [x] 6.2 Create `useSendRegisteredMail(entityId)` mutation hook
  - [x] 6.3 Create `useRegisteredMailStatus()` hook — reads availability from `/api/registered-mail/status`
  - [x] 6.4 Create `SendRegisteredMailDialog` AlertDialog with cost confirmation
  - [x] 6.5 Extend `StatusTimeline` Tier 2 section: show "Envoyer en recommandé" button (hidden if `!isAvailable`), tracking info after dispatch
  - [x] 6.6 Extend `use-escalation.ts` to expose registered mail fields
  - [x] 6.7 Vitest tests for dialog, hooks, StatusTimeline extension
  - [x] 6.8 Extend `EscalationStatusData` interface with 6 new registered mail fields
  - [x] 6.9 Extend `rent-call-detail-content.tsx` to wire new hooks and dialog

- [x] Task 7 — Backend availability endpoint and graceful degradation (AC: #6)
  - [x] 7.1 Create `GetRegisteredMailStatusController` at `GET /api/registered-mail/status` → `{ available: boolean }`
  - [x] 7.2 Ensure all registered mail UI is conditionally rendered based on availability

- [x] Task 8 — E2E tests and integration verification (AC: all)
  - [x] 8.1 E2E test: verify graceful degradation (no AR24 config → button hidden)
  - [x] 8.2 E2E test: verify registered mail status endpoint returns availability
  - [x] 8.3 Run full test suite, typecheck, lint

## Dev Notes

### Provider Choice: AR24

AR24 is recommended over Maileva for this integration:
- **Direct eIDAS qualification** by ANSSI (since 2018) — no intermediary
- **Pay-per-use pricing** (3.99 EUR HT/LRE) — no subscription, better for SaaS with varied volumes
- **Single API call to send** vs Maileva's 4-step flow (create → upload → recipients → submit)
- **Robust webhook system** — per-mail webhooks, 48 retry attempts, whitelisted IP `185.183.140.195`
- **256 MB attachment limit** — generous for PDF documents
- **Property management domain expertise** — AR24 has specific products for syndics

### AR24 API Technical Details

**Authentication** (non-standard, NOT OAuth2):
- `token` parameter: personal API token (env var `AR24_TOKEN`)
- `date` parameter: `YYYY-MM-DD HH:mm:ss` (UTC+1/UTC+2, valid 10 minutes)
- `signature` header: AES-256-CBC encrypted using private key (`AR24_PRIVATE_KEY`) with date as IV component
- **Responses are AES-256-CBC encrypted** (must decrypt); error responses are NOT encrypted

**Key Endpoints:**
- `POST /api/attachment` — Upload PDF (multipart/form-data) → returns `file_id`
- `POST /api/mail` — Send LRE with `eidas=1`, `to_*` fields, `attachment[]` IDs
- `POST /api/webhook/registered_letter` — Register webhook for status updates
- Paper registered mail also available via `POST /api/paper` (physical LRAR)

**Environment Variables:**
```
AR24_TOKEN=           # Personal API token
AR24_PRIVATE_KEY=     # AES-256-CBC private key
AR24_USER_ID=         # Sender's AR24 user ID
AR24_BASE_URL=https://sandbox.ar24.fr/api  # Sandbox for dev
```

**Mail Status Progression:**
- `waiting` → `sent` → `AR` (accuse de reception) — happy path
- `waiting` → `sent` → `negligence` (no action within 15 days)
- `waiting` → `sent` → `refused` (recipient rejected)
- `waiting` → `bounced` (delivery failure)
- `error` (technical failure, no charge)

**Webhook Payload:**
- HTTP POST, URL-encoded (JSON available upon request to `api@ar24.fr`)
- Fields: `id_mail`, `new_state`, `proof_url`
- Expects HTTP 200 response; retries every 15 min, up to 48 attempts

### Architecture Pattern: Infrastructure Service

Follow the established pattern from `OpenBankingModule` (Story 9.1) and `EmailModule`:

```
backend/src/infrastructure/registered-mail/
  registered-mail.module.ts         # @Global() NestJS module
  ar24.service.ts                   # AR24 API client (token, upload, send, status)
  ar24-crypto.util.ts               # AES-256-CBC signature + response decryption
  __tests__/
    ar24.service.spec.ts
    ar24-crypto.util.spec.ts
```

**Key Design Decisions:**
- Concrete `Ar24Service` (YAGNI) — extract `IRegisteredMailProvider` interface only if second provider added (same pattern as GoCardless in 9.1)
- `isAvailable` property for graceful degradation — when env vars not set, module registers but returns `{ available: false }`
- API credentials ONLY in env vars (never DB/events) — same security pattern as all infrastructure services
- Token/signature computed per-request (10-minute validity window)

### Domain Integration: Recovery BC

The `EscalationAggregate` in `recovery/escalation/` already handles the 3-tier escalation:
- Tier 1: `sendReminderEmail()` → `ReminderEmailSent` event
- Tier 2: `generateFormalNotice()` → `FormalNoticeGenerated` event ← **extend here**
- Tier 3: `generateStakeholderNotifications()` → `StakeholderNotificationGenerated` event

**New method:** `dispatchViaRegisteredMail(trackingId, provider, costCents)` → `RegisteredMailDispatched` event
- Guard: `if (this.registeredMailTrackingId !== null) return;` (no-op, idempotent)
- Guard: `if (this.tier2SentAt === null) throw FormalNoticeNotGeneratedException` — must generate PDF first
- Separate from `generateFormalNotice()` — registered mail is optional, PDF can be downloaded manually

### Frontend: StatusTimeline Extension

Current Tier 2 section shows "Generer la mise en demeure" button. Extend with:
1. After PDF generated (`tier2SentAt !== null`), show "Envoyer en recommande" button (if `isAvailable`)
2. Click → `SendRegisteredMailDialog` (AlertDialog) showing cost (fetched from AR24 API)
3. On confirm → `POST /escalation/formal-notice/registered-mail`
4. After dispatch → show tracking info (tracking number, status badge, dispatch date)
5. Webhook updates refresh status automatically via cache invalidation

### Existing Code to Reuse

- `FormalNoticePdfAssembler` — assembles PDF data from Prisma models (reuse for registered mail)
- `PdfGeneratorService.generateFormalNoticePdf()` — generates Buffer (upload to AR24)
- `EscalationProjection` — extend for new event
- `EscalationFinder` — extend to return registered mail fields
- `StatusTimeline` component — extend Tier 2 section
- `use-escalation.ts` hooks — extend for registered mail actions

### Webhook Security

AR24 webhook calls come from IP `185.183.140.195`. Options:
1. **IP whitelisting** — validate `req.ip` against known AR24 IP (simplest, recommended)
2. The webhook endpoint must be **public** (no Clerk auth) — bypass `APP_GUARD` for this route
3. Validate payload structure before processing

### Cost Display Flow

1. User clicks "Envoyer en recommande" button
2. Frontend fetches cost via `GET /api/entities/:entityId/escalation/registered-mail/cost`
3. Backend calls AR24 API or returns cached/static pricing (3.99 EUR HT for LRE)
4. Dialog shows: "Cout: 4.79 EUR TTC — Confirmer l'envoi ?"
5. User confirms → POST dispatches the command

### Project Structure Notes

- Alignment with infrastructure service pattern (`@Global()` module, env var config, `isAvailable` flag)
- Escalation aggregate extended in `recovery/escalation/` (existing BC)
- Webhook controller OUTSIDE `APP_GUARD` — needs route exclusion in `app.module.ts` or dedicated module with `@Public()` decorator
- No new BC or path alias needed — reuses existing `@recovery/*` alias

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9, Story 9.2] — ACs and user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Recovery-BC] — 3-tier escalation, StatusTimeline
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure-Services] — @Global() module pattern
- [Source: docs/project-context.md#CQRS-Patterns] — event sourcing, projection, aggregate
- [Source: backend/src/recovery/escalation/escalation.aggregate.ts] — existing aggregate
- [Source: backend/src/infrastructure/open-banking/] — API integration pattern (BridgeService)
- [Source: backend/src/infrastructure/email/] — EmailModule pattern
- [Source: frontend/src/components/features/escalation/status-timeline.tsx] — UI component to extend
- [Source: AR24 API Documentation — https://developers.ar24.fr/doc/] — API endpoints, auth, webhooks
- [Source: Story 9.1 Dev Notes] — infrastructure module pattern, graceful degradation, token caching

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- AR24 crypto test: dates '2026-02-21 14:30:00' and '2026-02-21 14:31:00' share first 16 bytes for IV — fixed with distant date '2099-12-31 23:59:59'
- Buffer→Blob TypeScript error: `new Blob([pdfBuffer])` — fixed with `new Blob([new Uint8Array(pdfBuffer)])`
- Prisma tenant field names: `addressLine1`→`addressStreet`, `city`→`addressCity`, `postalCode`→`addressPostalCode`
- Query handler tests missing new fields: added 6 registered mail null fields to all expected response objects

### Completion Notes List
- 8 tasks completed, all ACs satisfied
- Backend: 1731 tests (256 suites) — 0 failures, 0 regressions
- Frontend: 928 tests (117 suites) — 0 failures, 0 regressions
- TypeScript: clean compilation for both frontend and backend
- E2E: 2 new tests added (graceful degradation + status endpoint)
- Infrastructure pattern follows OpenBankingModule + EmailModule (@Global() module)
- Domain events: RegisteredMailDispatched + RegisteredMailStatusUpdated
- Webhook: @Public() + IP whitelisting (185.183.140.195)
- Graceful degradation: `isAvailable` checks env vars, frontend conditionally renders
- SendRegisteredMailDialog: AlertDialog with cost preview (HT/TTC)
- StatusTimeline: "Envoyer en recommandé" button + tracking info panel

### File List

#### New Files
- `backend/src/infrastructure/registered-mail/registered-mail.module.ts`
- `backend/src/infrastructure/registered-mail/ar24.service.ts`
- `backend/src/infrastructure/registered-mail/ar24-crypto.util.ts`
- `backend/src/infrastructure/registered-mail/__tests__/ar24.service.spec.ts`
- `backend/src/infrastructure/registered-mail/__tests__/ar24-crypto.util.spec.ts`
- `backend/src/recovery/escalation/events/registered-mail-dispatched.event.ts`
- `backend/src/recovery/escalation/events/registered-mail-status-updated.event.ts`
- `backend/src/recovery/escalation/commands/dispatch-via-registered-mail.command.ts`
- `backend/src/recovery/escalation/commands/dispatch-via-registered-mail.handler.ts`
- `backend/src/recovery/escalation/commands/update-registered-mail-status.command.ts`
- `backend/src/recovery/escalation/commands/update-registered-mail-status.handler.ts`
- `backend/src/recovery/escalation/__tests__/dispatch-via-registered-mail.handler.spec.ts`
- `backend/src/recovery/escalation/__tests__/update-registered-mail-status.handler.spec.ts`
- `backend/src/presentation/escalation/controllers/send-formal-notice-via-registered-mail.controller.ts`
- `backend/src/presentation/escalation/controllers/get-registered-mail-cost.controller.ts`
- `backend/src/presentation/escalation/controllers/ar24-webhook.controller.ts`
- `backend/src/presentation/escalation/controllers/get-registered-mail-status.controller.ts`
- `backend/prisma/migrations/20260221130000_add_registered_mail_fields_to_escalation/migration.sql`
- `frontend/src/components/features/escalation/send-registered-mail-dialog.tsx`
- `frontend/src/components/features/escalation/__tests__/send-registered-mail-dialog.test.tsx`

#### Modified Files
- `backend/src/app.module.ts` — RegisteredMailModule import
- `backend/src/recovery/escalation/escalation.aggregate.ts` — 2 new methods, 2 event handlers, 6 state fields
- `backend/src/recovery/escalation/__tests__/escalation.aggregate.spec.ts` — 5 new test cases
- `backend/prisma/schema.prisma` — 6 new nullable fields + index on Escalation model
- `backend/src/presentation/escalation/escalation-presentation.module.ts` — 4 new controllers + 2 handlers
- `backend/src/presentation/escalation/projections/escalation.projection.ts` — 2 new event handlers
- `backend/src/presentation/escalation/finders/escalation.finder.ts` — findByRegisteredMailTrackingId()
- `backend/src/presentation/escalation/queries/escalation-status-response.ts` — 6 new fields
- `backend/src/presentation/escalation/queries/get-escalation-status.handler.ts` — 6 new response fields
- `backend/src/presentation/escalation/queries/get-batch-escalation-status.handler.ts` — 6 new response fields
- `backend/src/presentation/escalation/__tests__/get-escalation-status.handler.spec.ts` — added new fields to expectations
- `backend/src/presentation/escalation/__tests__/get-batch-escalation-status.handler.spec.ts` — added new fields to expectations
- `frontend/src/lib/api/escalation-api.ts` — EscalationStatusData + 3 new API methods + fetchRegisteredMailStatus
- `frontend/src/hooks/use-escalation.ts` — 3 new hooks (useRegisteredMailStatus, useRegisteredMailCost, useSendRegisteredMail)
- `frontend/src/hooks/__tests__/use-escalation.test.ts` — 4 new test cases for new hooks
- `frontend/src/components/features/escalation/status-timeline.tsx` — 3 new props, registered mail button + tracking panel
- `frontend/src/components/features/escalation/__tests__/status-timeline.test.tsx` — 8 new test cases for registered mail
- `frontend/src/components/features/escalation/rent-call-detail-content.tsx` — wired 3 new hooks + dialog
- `frontend/src/components/features/escalation/__tests__/rent-call-detail-content.test.tsx` — added new hook mocks + fields
- `frontend/e2e/escalation.spec.ts` — 2 new E2E tests (graceful degradation + status endpoint)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status: in-progress → review

## Change Log
- 2026-02-21: Story 9.2 implementation complete — 20 new files + 21 modified files
