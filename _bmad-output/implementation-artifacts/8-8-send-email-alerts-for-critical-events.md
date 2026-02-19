# Story 8.8: Send Email Alerts for Critical Events

Status: done

## Story

As a bailleur,
I want to receive email alerts for critical events (unpaid rent detected, insurance expiring, escalation thresholds reached),
so that I am notified even when not logged in (FR61).

## Acceptance Criteria

1. Given a new late payment is detected, when the scheduled alert process runs, then an email alert is sent to the bailleur with: event description, tenant/unit details, suggested action, and a link to the relevant page in the application.
2. Given a tenant's insurance renewal is within 15 days, when the scheduled alert process runs, then an email alert is sent to the bailleur with the tenant name, insurance expiry date, and a link to the tenant detail page.
3. Given an escalation threshold is reached (Tier 1/2/3 sent but no payment received), when the scheduled alert process runs, then an email alert is sent with escalation status, amount owed, and suggested next action.
4. Given the bailleur has configured alert preferences per entity, when an alert is triggered, then only the enabled alert types are sent.
5. Given the alert process has already sent an alert for a specific event, when the same event is detected again, then no duplicate alert is sent (idempotency).
6. Given an email alert is sent, then no sensitive data (bank details, passwords) is included in the email body (NFR11).
7. Given an alert email is generated, then it includes a direct link to the relevant page in the application (tenant detail, rent call detail, or escalation view).

## Tasks / Subtasks

- [x] Task 1 — Backend: Create AlertPreference model and CRUD (AC: #4)
  - [x] 1.1 Add `alert_preferences` table to Prisma schema (entityId, userId, alertType enum, enabled boolean, @@unique([entityId, userId, alertType]))
  - [x] 1.2 Create `AlertPreferenceController` — GET/PUT `/api/entities/:entityId/alert-preferences`
  - [x] 1.3 Create `AlertPreferenceFinder` for read queries
  - [x] 1.4 Write controller + finder tests

- [x] Task 2 — Backend: Create alert email templates (AC: #1, #2, #3, #6, #7)
  - [x] 2.1 Create `renderAlertEmailHtml(data: AlertEmailData)` pure template function in `infrastructure/email/templates/`
  - [x] 2.2 Define `AlertEmailData` interface with: alertType, entityName, tenantName, unitLabel, description, suggestedAction, applicationLink, items[]
  - [x] 2.3 Escape ALL interpolated strings with `escapeHtml()` — no bank details, no passwords (NFR11)
  - [x] 2.4 Include direct application links (`APP_URL` env var + relative path)
  - [x] 2.5 Write template rendering tests

- [x] Task 3 — Backend: Create AlertDetectionService (AC: #1, #2, #3)
  - [x] 3.1 Create `infrastructure/scheduling/alert-detection.service.ts`
  - [x] 3.2 Implement `detectUnpaidAlerts(entityId)`: query rent_calls where `paidAt IS NULL AND month < current month` (late = unpaid past due)
  - [x] 3.3 Implement `detectInsuranceAlerts(entityId)`: query tenants where `insuranceRenewalDate` is within 15 days or expired
  - [x] 3.4 Implement `detectEscalationAlerts(entityId)`: query escalation_statuses where tier sent but no subsequent payment
  - [x] 3.5 Write detection service tests with comprehensive edge cases

- [x] Task 4 — Backend: Create alert sent tracking (AC: #5)
  - [x] 4.1 Add `alert_logs` table to Prisma schema (id, entityId, userId, alertType, referenceId, sentAt, @@unique([entityId, userId, alertType, referenceId]))
  - [x] 4.2 Create `AlertLogFinder` to check already-sent alerts
  - [x] 4.3 Write finder tests

- [x] Task 5 — Backend: Create SendAlertsService with cron scheduling (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Create `infrastructure/scheduling/scheduling.module.ts` with NestJS `@nestjs/schedule` ScheduleModule
  - [x] 5.2 Create `SendAlertsService` with `@Cron('0 8 * * *')` (daily at 8:00 AM) — iterates entities, checks preferences, detects alerts, sends emails, logs sent
  - [x] 5.3 Inject `EmailService`, `AlertDetectionService`, `AlertPreferenceFinder`, `AlertLogFinder`, Prisma for alert_logs writes
  - [x] 5.4 Batch processing: iterate entities → for each entity, detect alerts → filter by preferences → filter already-sent → send email → log
  - [x] 5.5 RFC 5322 compliance: quote entity name in From header
  - [x] 5.6 BCC entity email if configured (pattern from Story 4.3)
  - [x] 5.7 Write comprehensive service tests (mocked EmailService, detection, preferences, idempotency)

- [x] Task 6 — Frontend: Alert preferences settings UI (AC: #4)
  - [x] 6.1 Create `useAlertPreferences(entityId)` hook — GET `/api/entities/:entityId/alert-preferences`
  - [x] 6.2 Create `useUpdateAlertPreferences(entityId)` mutation hook — PUT with delayed cache invalidation (1500ms)
  - [x] 6.3 Create `AlertPreferencesForm` component — toggle switches per alert type (unpaid, insurance, escalation), entity-scoped
  - [x] 6.4 Add alert preferences section to entity settings/detail page
  - [x] 6.5 Write component + hook tests

- [x] Task 7 — Frontend: Display alert status on dashboard (AC: #1, #2, #3)
  - [x] 7.1 Update ActionFeed to show "Alertes email actives" info item when preferences are configured
  - [x] 7.2 Write ActionFeed update tests

- [x] Task 8 — E2E tests (AC: #1 through #7)
  - [x] 8.1 E2E: configure alert preferences per entity (toggle on/off)
  - [x] 8.2 E2E: verify preferences persist after navigation
  - [x] 8.3 E2E: alert preferences accessible from entity settings

## Dev Notes

### Architecture Overview

This story introduces **scheduled background processing** via NestJS `@nestjs/schedule` — the first cron-based feature in the project. The alert system is a **read-side orchestration** — it queries existing read models (rent_calls, tenants, escalation_statuses) to detect conditions, then sends emails. There are NO new domain events or aggregates — alerts are infrastructure concerns, not domain concepts.

**Key architectural decision**: Alerts are NOT event-sourced. They are a scheduled query-based detection system that reads from existing projections. This avoids coupling alert logic to domain event streams and keeps the detection logic simple and testable.

### Technical Stack

- **@nestjs/schedule** (cron): Install via `npm install @nestjs/schedule` in backend — provides `@Cron()` decorator for scheduled tasks
- **Existing EmailService**: Reuse `infrastructure/email/` global module — no new email infrastructure needed
- **Existing Prisma**: Two new tables (`alert_preferences`, `alert_logs`) — run `npx prisma migrate dev` after schema changes
- **Existing escapeHtml**: Reuse `infrastructure/shared/escape-html.util.ts` for template security

### Critical Constraints

1. **No sensitive data in emails (NFR11)**: Alert emails must NEVER include bank account numbers, IBANs, BICs, or passwords. Include tenant name, unit label, amount owed, and application link only.
2. **Idempotency via `alert_logs`**: Before sending any alert, check `@@unique([entityId, userId, alertType, referenceId])` in `alert_logs` table. The `referenceId` is the specific rent_call ID, tenant ID, or escalation ID that triggered the alert. This prevents duplicate emails on each cron run.
3. **Entity email BCC**: If the entity has an email configured (pattern from Story 4.3), BCC it on alert emails for audit trail.
4. **RFC 5322 From header**: Always quote and escape entity name — `"${escaped}" <noreply@baillr.fr>`.
5. **Daily cron at 8 AM**: `@Cron('0 8 * * *')` — runs once per day. This is NOT real-time — alerts are batched daily.
6. **Per-entity preferences**: Alert types are configurable per entity. Default: all enabled. The bailleur can disable specific alert types per entity.
7. **APP_URL env var**: Application links in emails use `APP_URL` environment variable (e.g., `https://app.baillr.fr`) + relative path (e.g., `/tenants/{id}`).

### Alert Types Enum

```typescript
export enum AlertType {
  UNPAID_RENT = 'unpaid_rent',
  INSURANCE_EXPIRING = 'insurance_expiring',
  ESCALATION_THRESHOLD = 'escalation_threshold',
}
```

### Detection Logic

**Unpaid Rent** (`unpaid_rent`):
- Query: `rent_calls WHERE paidAt IS NULL AND month < currentMonth AND entityId = :entityId`
- ReferenceId: `rentCallId`
- Description: "Loyer impayé — {tenantName} — {unitLabel} — {amount} — {month}"
- Suggested action: "Consultez le détail du loyer et envoyez un rappel"
- Link: `/rent-calls` (filtered by entity)

**Insurance Expiring** (`insurance_expiring`):
- Query: `tenants WHERE insuranceRenewalDate IS NOT NULL AND insuranceRenewalDate <= now + 15 days AND entityId = :entityId`
- ReferenceId: `tenantId` + month key (to allow re-alerting next month if still not renewed)
- Description: "Assurance expirante — {tenantName} — expire le {date}" or "Assurance expirée — {tenantName} — expirée depuis le {date}"
- Suggested action: "Contactez le locataire pour renouveler son assurance"
- Link: `/tenants/{tenantId}`

**Escalation Threshold** (`escalation_threshold`):
- Query: escalation_statuses WHERE tier1SentAt/tier2SentAt/tier3SentAt is set AND rent_call still unpaid
- ReferenceId: `rentCallId` + current tier string (e.g., `{rentCallId}-tier2`)
- Description: "Seuil d'escalade atteint — {tenantName} — Niveau {tier} envoyé sans paiement"
- Suggested action: "Passez au niveau suivant de la procédure de recouvrement"
- Link: `/rent-calls` (filtered by entity)

### Prisma Schema Additions

```prisma
model AlertPreference {
  id        String   @id @default(uuid())
  entityId  String
  userId    String
  alertType String   // AlertType enum as string
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([entityId, userId, alertType])
  @@map("alert_preferences")
}

model AlertLog {
  id          String   @id @default(uuid())
  entityId    String
  userId      String
  alertType   String
  referenceId String
  sentAt      DateTime @default(now())

  @@unique([entityId, userId, alertType, referenceId])
  @@map("alert_logs")
}
```

### Email Template Structure

The alert email template renders a **digest** format — one email per entity per day, containing all alerts grouped by type:

```
Subject: "Baillr — Alertes pour {entityName} — {date}"

Body:
- Header with entity name and date
- Section per alert type (if any alerts of that type):
  - "Loyers impayés" section with list of unpaid rent calls
  - "Assurances expirantes" section with list of expiring insurance
  - "Escalades en cours" section with list of escalation thresholds
- Each item includes: description + direct link
- Footer with: "Vous recevez cet email car les alertes sont activées pour {entityName}. Gérez vos préférences dans les paramètres de l'entité."
```

**Digest approach** (one email per entity, not per alert): reduces inbox noise, provides overview, and is simpler to implement with idempotency (one `alert_logs` entry per entity per day per type).

### Alert Preferences API

**GET `/api/entities/:entityId/alert-preferences`**
- Returns: `{ data: AlertPreference[] }` — one entry per alert type
- If no preferences exist yet, return defaults (all enabled)

**PUT `/api/entities/:entityId/alert-preferences`**
- Body: `{ preferences: [{ alertType: string, enabled: boolean }] }`
- Upserts preferences for the entity+user combination
- Returns: `{ data: AlertPreference[] }`

### Frontend Components

**AlertPreferencesForm** — simple toggle list:
- 3 switches (one per AlertType)
- Labels: "Loyers impayés", "Assurances expirantes", "Escalades"
- Location: entity detail/settings page (add a new section "Alertes email")
- Save via PUT on toggle change (debounced or explicit save button)

### File Structure

```
backend/src/
├── infrastructure/
│   ├── email/
│   │   └── templates/
│   │       └── alert-email.template.ts          # NEW: renderAlertEmailHtml()
│   │       └── __tests__/
│   │           └── alert-email.template.spec.ts  # NEW
│   └── scheduling/
│       ├── scheduling.module.ts                  # NEW: ScheduleModule + providers
│       ├── alert-detection.service.ts            # NEW: detection queries
│       ├── send-alerts.service.ts                # NEW: @Cron orchestrator
│       └── __tests__/
│           ├── alert-detection.service.spec.ts   # NEW
│           └── send-alerts.service.spec.ts        # NEW
├── presentation/
│   └── alert-preference/
│       ├── alert-preference.module.ts            # NEW
│       ├── controllers/
│       │   └── alert-preference.controller.ts    # NEW: GET/PUT
│       ├── finders/
│       │   ├── alert-preference.finder.ts        # NEW
│       │   └── alert-log.finder.ts               # NEW
│       ├── dto/
│       │   └── update-alert-preferences.dto.ts   # NEW
│       └── __tests__/
│           ├── alert-preference.controller.spec.ts # NEW
│           ├── alert-preference.finder.spec.ts    # NEW
│           └── alert-log.finder.spec.ts           # NEW

frontend/src/
├── hooks/
│   └── use-alert-preferences.ts                  # NEW: useAlertPreferences + useUpdateAlertPreferences
├── components/features/
│   └── alert-preferences/
│       ├── alert-preferences-form.tsx            # NEW: toggle switches
│       └── __tests__/
│           └── alert-preferences-form.test.tsx   # NEW

e2e/
└── alert-preferences.spec.ts                     # NEW
```

### Project Structure Notes

- **`infrastructure/scheduling/`**: New directory — aligns with architecture document's infrastructure layer structure. Registers `ScheduleModule.forRoot()` and alert services.
- **`presentation/alert-preference/`**: Follows existing presentation module pattern (controllers, finders, DTOs, tests).
- **No new BC**: Alerts are infrastructure/presentation concerns, NOT a new bounded context. No aggregates, no domain events for alert sending itself.
- **`@nestjs/schedule`**: New dependency — must be added to `package.json` and registered in `app.module.ts` via `ScheduleModule.forRoot()`.

### Testing Strategy

**Backend unit tests:**
- `AlertDetectionService`: test each detection method with various data states (no alerts, some alerts, all alerts, edge cases like exactly 15 days for insurance)
- `SendAlertsService`: test full orchestration flow with mocked dependencies (EmailService, detection, preferences, alert logs)
- `AlertPreferenceController`: test GET/PUT endpoints with auth, entity scoping
- `AlertPreferenceFinder` + `AlertLogFinder`: test Prisma queries
- `alert-email.template`: test rendered HTML contains expected sections, escaping works, no sensitive data leaks

**Frontend unit tests:**
- `AlertPreferencesForm`: test toggle rendering, state changes, save mutation
- `useAlertPreferences` + `useUpdateAlertPreferences`: test fetch/mutate behavior

**E2E tests:**
- Configure preferences, verify persistence, toggle off/on
- No SMTP assertions in E2E — test UI state only

### Previous Story Learnings (Story 8.7)

- **Dark mode CSS properties**: Use CSS custom properties for theme-dependent colors
- **DRY formatting**: Reuse existing `formatCurrency` utility — don't create new formatters
- **Cache invalidation scope**: Define clear cache keys and invalidation patterns upfront
- **ResizeObserver polyfill**: Already in vitest setup from 8.7 (no action needed)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8, Story 8.8]
- [Source: Architecture — infrastructure/scheduling/ for cron jobs]
- [Source: Architecture — infrastructure/email/ for SMTP service]
- [Source: docs/anti-patterns.md — email template escaping, RFC 5322]
- [Source: docs/dto-checklist.md — @MaxLength, @ArrayMaxSize, @IsEmail]
- [Source: docs/project-context.md — CQRS patterns, eventual consistency]
- [Source: Story 4.3 — email sending patterns, BCC, RFC 5322]
- [Source: Story 6.2 — escalation tier patterns]
- [Source: Story 3.2 — insurance expiry alerts pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Jest `--testPathPattern` replaced by `--testPathPatterns` in Jest 30 — fixed during Task 1

### Completion Notes List
- 8 tasks completed, all acceptance criteria covered
- First cron-based feature in the project (@nestjs/schedule)
- Alert system is read-side orchestration — no new aggregates or domain events
- AlertPreference + AlertLog Prisma models with composite unique constraints for idempotency
- Digest email format (one email per entity per day, grouped by alert type)
- AlertDetectionService with 3 detection methods (unpaid, insurance, escalation)
- SendAlertsService with @Cron('0 8 * * *') daily scheduling
- AlertPreferencesForm with Radix Switch toggles, optimistic cache updates
- ActionFeed info item "Alertes email actives" when preferences configured
- All existing action-feed tests updated with use-alert-preferences mock
- Backend: 1595 tests (238 suites) — all pass
- Frontend: 878 tests (111 suites) — all pass
- E2E: 4 tests (seed + 3 alert preference scenarios)

### Code Review (Adversarial — 2026-02-18)
- **9 findings**: 3 High, 4 Medium, 2 Low — **all 9 fixed**
- **H1**: Escalation alert description missing amount owed (AC 3) — added `totalAmountCents` formatting + 3 test updates
- **H2**: DTO `alertType` accepted any string — added `@IsIn(ALERT_TYPES)` validation
- **H3**: Recipient email fell back to `entityEmail`/noreply — added Clerk Backend SDK `resolveUserEmail()` + failure graceful handling + 3 new tests
- **M1**: Story File List counts wrong (20→23 new, 14→15 modified) — corrected
- **M2**: N+1 idempotency queries (per-alert `findByEntityUserTypeAndReference`) — replaced with batch `findSentReferenceIds` using `WHERE IN` + 2 new finder tests
- **M3**: BCC sent even when entity email matched recipient — added `entityEmail !== recipientEmail` guard + new test
- **M4**: Dead `escapeHtml` import in send-alerts.service.ts — removed
- **L1**: DTO missing `@ArrayMinSize(1)` — added
- **L2**: Missing `.js` extensions on `@infrastructure/` path alias imports in controller — fixed

### Change Log
- Installed @nestjs/schedule in backend
- Added AlertPreference and AlertLog Prisma models + migration
- Registered AlertPreferencePresentationModule, ScheduleModule.forRoot(), SchedulingModule in app.module.ts
- Created infrastructure/scheduling/ directory (first scheduled processing in project)
- Created presentation/alert-preference/ directory (controller, finders, DTO, module)
- Created alert email template with digest format and XSS escaping
- Created AlertDetectionService with unpaid/insurance/escalation detection
- Created SendAlertsService with daily cron, preferences filtering, idempotency, RFC 5322, BCC
- Created frontend AlertPreferencesForm with Switch toggles per alert type
- Added "Alertes email" section to entity edit page
- Updated ActionFeed with useAlertPreferencesInfo hook and Bell icon
- Added use-alert-preferences mock to all 9 existing action-feed test files

### File List

**New files (23):**
- `backend/prisma/migrations/20260218220153_add_alert_preferences_and_logs/migration.sql`
- `backend/src/presentation/alert-preference/alert-type.enum.ts`
- `backend/src/presentation/alert-preference/dto/update-alert-preferences.dto.ts`
- `backend/src/presentation/alert-preference/finders/alert-preference.finder.ts`
- `backend/src/presentation/alert-preference/finders/alert-log.finder.ts`
- `backend/src/presentation/alert-preference/controllers/alert-preference.controller.ts`
- `backend/src/presentation/alert-preference/alert-preference-presentation.module.ts`
- `backend/src/presentation/alert-preference/__tests__/alert-preference.controller.spec.ts`
- `backend/src/presentation/alert-preference/__tests__/alert-preference.finder.spec.ts`
- `backend/src/presentation/alert-preference/__tests__/alert-log.finder.spec.ts`
- `backend/src/infrastructure/email/templates/alert-email.template.ts`
- `backend/src/infrastructure/email/templates/__tests__/alert-email.template.spec.ts`
- `backend/src/infrastructure/scheduling/alert-detection.service.ts`
- `backend/src/infrastructure/scheduling/send-alerts.service.ts`
- `backend/src/infrastructure/scheduling/scheduling.module.ts`
- `backend/src/infrastructure/scheduling/__tests__/alert-detection.service.spec.ts`
- `backend/src/infrastructure/scheduling/__tests__/send-alerts.service.spec.ts`
- `frontend/src/lib/api/alert-preferences-api.ts`
- `frontend/src/hooks/use-alert-preferences.ts`
- `frontend/src/components/features/alert-preferences/alert-preferences-form.tsx`
- `frontend/src/components/features/alert-preferences/__tests__/alert-preferences-form.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/action-feed-alert-preferences.test.tsx`
- `frontend/e2e/alert-preferences.spec.ts`

**Modified files (15):**
- `backend/package.json` (@nestjs/schedule dependency)
- `backend/package-lock.json`
- `backend/prisma/schema.prisma` (AlertPreference + AlertLog models)
- `backend/src/app.module.ts` (AlertPreferencePresentationModule, ScheduleModule, SchedulingModule)
- `frontend/src/app/(auth)/entities/[id]/edit/page.tsx` (AlertPreferencesForm section)
- `frontend/src/components/features/dashboard/action-feed.tsx` (Bell icon, useAlertPreferencesInfo hook)
- `frontend/src/components/features/dashboard/__tests__/action-feed.test.tsx` (use-alert-preferences mock)
- `frontend/src/components/features/dashboard/__tests__/action-feed-insurance.test.tsx` (use-alert-preferences mock)
- `frontend/src/components/features/dashboard/__tests__/action-feed-unpaid.test.tsx` (use-alert-preferences mock)
- `frontend/src/components/features/dashboard/__tests__/action-feed-revisions.test.tsx` (use-alert-preferences mock)
- `frontend/src/components/features/dashboard/__tests__/action-feed-unsettled-regularizations.test.tsx` (use-alert-preferences mock)
- `frontend/src/components/features/dashboard/__tests__/action-feed-rent-calls.test.tsx` (use-alert-preferences + use-revisions mocks)
- `frontend/src/components/features/dashboard/__tests__/action-feed-send-rent-calls.test.tsx` (use-alert-preferences + use-revisions mocks)
- `frontend/src/components/features/dashboard/__tests__/action-feed-import-bank-statement.test.tsx` (use-alert-preferences + use-revisions mocks)
- `frontend/src/components/features/dashboard/__tests__/action-feed-lease.test.tsx` (use-alert-preferences + use-revisions mocks)
