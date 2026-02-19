# Story 9.1: Connect to Bank via Open Banking API

Status: done

## Story

As a bailleur,
I want to connect my bank accounts via Open Banking API for automatic statement retrieval,
so that I don't need to manually download and import CSV files each month (FR34).

## Acceptance Criteria

1. **Given** I have bank accounts configured for an entity, **When** I navigate to the bank accounts section, **Then** I see a "Connecter ma banque" button next to each bank account with an IBAN.

2. **Given** I click "Connecter ma banque", **When** the Open Banking flow starts, **Then** I am shown a list of available French banks (fetched from GoCardless institutions API) and I can select my bank.

3. **Given** I select a bank, **When** the system creates a requisition, **Then** I am redirected to the bank's authorization flow (GoCardless → Bank → SCA/consent), and upon successful authorization I am redirected back to the application.

4. **Given** I have successfully authorized a bank connection, **When** I return to the application callback page, **Then** the connection status is stored securely (requisitionId, accountIds, agreementExpiry), the event `BankConnectionLinked` is stored in KurrentDB, and the bank account shows a "Connectée" badge.

5. **Given** a bank connection is active (status "LN"), **When** I trigger transaction sync (manually or via daily CRON), **Then** the system retrieves new transactions from the connected bank via GoCardless API, transforms them into the same format as CSV imports (`date`, `amountCents`, `payerName`, `reference`), and dispatches an `ImportABankStatementCommand` through the existing import pipeline.

6. **Given** transactions are retrieved via Open Banking, **When** they enter the existing pipeline, **Then** duplicate detection (cross-import via date+amount+reference key) prevents re-importing already-known transactions, and the matching/validation flow works identically to CSV imports.

7. **Given** a bank connection has expired (consent >90 days, requisition status "EX"/"SU"), **When** the system detects expiry (daily CRON or sync attempt), **Then** the ActionFeed displays "Connexion bancaire expirée — [bank name] — Reconnectez-vous" and the bank account badge changes to "Expirée".

8. **Given** I want to disconnect a bank, **When** I click "Déconnecter" on a connected bank account, **Then** the requisition is deleted via GoCardless API, the connection metadata is purged from the database, the event `BankConnectionDisconnected` is stored in KurrentDB, and the bank account returns to unconnected state.

9. **Given** the GoCardless API credentials are not configured (env vars missing), **When** the application starts, **Then** the Open Banking features are gracefully hidden (no "Connecter ma banque" button), and the CSV import flow continues to work as before.

10. **Given** no bank credentials are stored in the application, **When** Open Banking is used, **Then** only GoCardless requisition IDs, agreement IDs, and account UUIDs are stored — no bank login credentials, no PINs, no access tokens for the bank itself (only GoCardless API tokens in environment variables). All stored connection data is encrypted at rest (NFR7, NFR11).

## Tasks / Subtasks

- [x] Task 1: Create GoCardless infrastructure module (AC: #9, #10)
  - [x] 1.1: Create `backend/src/infrastructure/open-banking/` module with `GoCardlessService`, `GoCardlessTokenService`, `OpenBankingModule`
  - [x] 1.2: Implement `GoCardlessTokenService` — in-memory token cache with auto-refresh (access 24h, refresh 30d)
  - [x] 1.3: Implement `GoCardlessService` — methods: `getInstitutions(country)`, `createAgreement(institutionId)`, `createRequisition(institutionId, agreementId, redirectUrl, reference)`, `getRequisition(requisitionId)`, `getAccountTransactions(accountId, dateFrom?)`, `deleteRequisition(requisitionId)`
  - [x] 1.4: Add env vars `GOCARDLESS_SECRET_ID`, `GOCARDLESS_SECRET_KEY` to `.env.example` files; make module conditionally registered (no-op if not configured)
  - [x] 1.5: Write unit tests for `GoCardlessTokenService` (refresh logic, expiry buffer) and `GoCardlessService` (HTTP calls mocked)

- [x] Task 2: Create BankConnection domain in Portfolio BC (AC: #4, #8)
  - [x] 2.1: Add `BankConnection` as child data in `EntityAggregate` (like BankAccount) — stored as `Map<string, BankConnectionState>` with fields: `connectionId`, `bankAccountId`, `provider`, `institutionId`, `institutionName`, `requisitionId`, `agreementId`, `agreementExpiry`, `accountIds[]`, `status`, `lastSyncedAt`
  - [x] 2.2: Create VOs: `BankConnectionStatus` (enum: `linked`, `expired`, `suspended`, `disconnected`)
  - [x] 2.3: Create events: `BankConnectionLinked`, `BankConnectionExpired`, `BankConnectionDisconnected`, `BankConnectionSynced`
  - [x] 2.4: Create commands: `LinkABankConnectionCommand`, `DisconnectABankConnectionCommand`, `MarkBankConnectionExpiredCommand`, `MarkBankConnectionSyncedCommand`
  - [x] 2.5: Implement aggregate methods: `linkBankConnection()`, `disconnectBankConnection()`, `markBankConnectionExpired()`, `markBankConnectionSynced(lastSyncedAt)`
  - [x] 2.6: Write unit tests for aggregate methods, VOs, and command handlers

- [x] Task 3: Create Prisma model and projection for BankConnection (AC: #4, #7)
  - [x] 3.1: Add `BankConnection` model to Prisma schema: `id`, `entityId`, `bankAccountId`, `provider`, `institutionId`, `institutionName`, `requisitionId`, `agreementId`, `agreementExpiry`, `accountIds` (JSON), `status`, `lastSyncedAt`, `createdAt`, `updatedAt`
  - [x] 3.2: Create projection `BankConnectionProjection` subscribing to entity stream events (`BankConnectionLinked`, `BankConnectionExpired`, `BankConnectionDisconnected`, `BankConnectionSynced`)
  - [x] 3.3: Create `BankConnectionFinder` for queries (findByEntityId, findByBankAccountId, findActiveByEntityId, findById, findAllActive, findExpiring)
  - [x] 3.4: Run `prisma migrate` and `prisma generate`

- [x] Task 4: Create backend controllers for Open Banking flow (AC: #1, #2, #3, #4, #8)
  - [x] 4.1: `GetInstitutionsController` — `GET /api/entities/:entityId/open-banking/institutions?country=fr` → returns list of banks from GoCardless
  - [x] 4.2: `InitiateBankConnectionController` — `POST /api/entities/:entityId/bank-accounts/:bankAccountId/connect` → creates agreement + requisition, returns `{ link: "https://ob.gocardless.com/..." }`
  - [x] 4.3: `CompleteBankConnectionController` — `GET /api/entities/:entityId/open-banking/callback?ref=...` → checks requisition status, dispatches `LinkABankConnectionCommand`
  - [x] 4.4: `DisconnectBankConnectionController` — `DELETE /api/entities/:entityId/bank-connections/:connectionId` → calls GoCardless delete, dispatches `DisconnectABankConnectionCommand`
  - [x] 4.5: `GetBankConnectionsController` — `GET /api/entities/:entityId/bank-connections` → returns connections with status
  - [x] 4.6: `GetOpenBankingStatusController` — `GET /api/open-banking/status` → returns `{ available: boolean }`
  - [x] 4.7: `SyncBankTransactionsController` — `POST /api/entities/:entityId/bank-connections/:connectionId/sync` → triggers manual sync
  - [x] 4.8: Create `OpenBankingPresentationModule` registering all controllers, finders, and services
  - [x] 4.9: Write controller unit tests (mock GoCardlessService + CommandBus) — 5 test files, 16 tests

- [x] Task 5: Implement transaction sync service (AC: #5, #6, #7)
  - [x] 5.1: Create `BankConnectionSyncService` — fetches transactions from GoCardless per connected account, maps to existing `ImportABankStatementCommand` format, dispatches through existing pipeline
  - [x] 5.2: Transaction mapping: GoCardless `transactionAmount.amount` (string) → `amountCents` (integer), `bookingDate` → `date`, `remittanceInformationUnstructured` → `payerName` + `reference`, `transactionId` → `reference` fallback
  - [x] 5.3: Add daily CRON job `BankConnectionSyncSchedulerService` at 6am — syncs all active connections, marks expired ones
  - [x] 5.4: Handle requisition status transitions: `LN` → sync, `EX`/`SU` → mark expired
  - [x] 5.5: Add `findById(id)` method to `EntityFinder` (needed by CRON scheduler)
  - [x] 5.6: Write unit tests for sync service (9 tests) and scheduler (7 tests)

- [x] Task 6: Create frontend bank connection UI (AC: #1, #2, #3, #7, #9)
  - [x] 6.1: Create API client `useOpenBankingApi()` hook-based factory in `lib/api/open-banking-api.ts`
  - [x] 6.2: Create hooks in `hooks/use-bank-connections.ts`: `useOpenBankingStatus`, `useInstitutions`, `useBankConnections`, `useInitiateBankConnection`, `useCompleteBankConnection`, `useSyncBankConnection`, `useDisconnectBankConnection`
  - [x] 6.3: Create `ConnectBankDialog` component — institution search/select list with bank logos, initiate connection button
  - [x] 6.4: Create `BankConnectionBadge` component — displays connection status (Connectée/Expirée/Suspendue/Déconnectée)
  - [x] 6.5: Create `BankConnectionsList` component — shows connections with sync/disconnect actions, expiry warnings
  - [x] 6.6: Update `BankAccountCard` to show connection badge + "Connecter ma banque" button for unconnected bank_account type with IBAN
  - [x] 6.7: Update `BankAccountList` to integrate Open Banking (status check, connections map, ConnectBankDialog, BankConnectionsList)
  - [x] 6.8: Create callback page `app/(auth)/bank-connections/callback/page.tsx` — processes GoCardless redirect with hasAttempted ref for idempotency
  - [x] 6.9: Conditionally hide Open Banking UI based on `useOpenBankingStatus()` (graceful degradation)
  - [x] 6.10: Write vitest tests — 3 test files, 20 tests (BankConnectionBadge, ConnectBankDialog, BankConnectionsList)

- [x] Task 7: Add ActionFeed integration and expiry alerts (AC: #7)
  - [x] 7.1: Add `useBankConnectionAlerts()` hook in ActionFeed — checks for expired/suspended connections, displays "Connexion bancaire expirée" alerts with WifiOff icon
  - [x] 7.2: Integrate into displayActions composition between revisionAlerts and insuranceAlerts

- [x] Task 8: E2E tests and integration verification (AC: #1-#9)
  - [x] 8.1: E2E test: create entity for testing
  - [x] 8.2: E2E test: verify bank accounts page loads
  - [x] 8.3: E2E test: verify graceful degradation when GoCardless not configured
  - [x] 8.4: E2E test: verify empty connections state
  - [x] 8.5: Documented manual testing steps for full OAuth redirect flow (GoCardless sandbox)

## Dev Notes

### Architecture Decision: GoCardless Bank Account Data (formerly Nordigen)

**Chosen provider:** GoCardless Bank Account Data — free tier (50 bank connections), good French bank coverage (BNP Paribas, Credit Agricole, Societe Generale, La Banque Postale, Credit Mutuel, CIC, LCL, Boursorama, etc.), simple REST API, PSD2-licensed (EU).

**Alternative considered:** Bridge by Bankin' — best French coverage (400+ institutions), transaction categorization, French ACPR license. Recommended as future secondary provider if GoCardless coverage proves insufficient for regional banks.

**Provider abstraction:** The `GoCardlessService` is implemented as a concrete service for now (YAGNI). If/when a second provider is added, extract an `OpenBankingProvider` interface and implement `GoCardlessProvider` + `BridgeProvider`.

### GoCardless API Flow

```
1. POST /api/v2/token/new/                   → Get API access token (24h TTL)
2. GET  /api/v2/institutions/?country=fr      → List French banks
3. POST /api/v2/agreements/enduser/           → Create consent (90 day max)
4. POST /api/v2/requisitions/                 → Create link session → returns redirect URL
5. [User redirected to bank → SCA → consent → redirect back]
6. GET  /api/v2/requisitions/{id}/            → Check status ("LN" = linked)
7. GET  /api/v2/accounts/{id}/transactions/   → Fetch transactions
```

**Requisition statuses:** `CR` (created), `GC` (giving consent), `UA` (undergoing auth), `RJ` (rejected), `SA` (selecting accounts), `GA` (granting access), `LN` (linked ✅), `EX` (expired), `SU` (suspended)

### Transaction Mapping (GoCardless → Baillr)

```typescript
// GoCardless transaction format
{
  transactionId: "2026021901234567",
  bookingDate: "2026-02-15",
  transactionAmount: { amount: "850.00", currency: "EUR" },  // signed string
  creditorName: "SCI BAILLR",
  debtorName: "DUPONT JEAN",
  remittanceInformationUnstructured: "LOYER FEVRIER 2026 APT 3B"
}

// Mapped to Baillr CSV import format
{
  date: "2026-02-15T00:00:00.000Z",     // ISO from bookingDate
  amountCents: 85000,                     // parseFloat(amount) * 100
  payerName: "DUPONT JEAN",              // debtorName (for credits) or creditorName (for debits)
  reference: "LOYER FEVRIER 2026 APT 3B" // remittanceInformationUnstructured
}
```

**Critical:** GoCardless amounts are signed strings from the bank's perspective. For a landlord's bank account receiving rent: `amount: "850.00"` (positive = credit). Filter to positive amounts only (credits) for rent payment matching. Negative amounts (debits) are expenses and should be skipped for payment matching but stored for accounting.

### BankConnection as Child Data in EntityAggregate

Following the established child-data-in-aggregate pattern (like BankAccount in Story 2.2, Insurance in Story 3.2):

- Bank connection metadata stored as `Map<string, BankConnectionState>` in EntityAggregate
- Small data footprint, always managed through entity
- No complex lifecycle or children of its own
- Events stored in the entity stream: `entity-{id}`
- One connection per bank account (1:1 relationship via bankAccountId)

### Reuse of Existing Import Pipeline

**Critical design:** Open Banking transactions MUST flow through the existing `ImportABankStatementCommand` pipeline. The sync service creates a synthetic "bank statement" (with `fileName: "open-banking-sync-YYYY-MM-DD"`) and dispatches the same command. This ensures:
- Duplicate detection works identically (existing cross-import check)
- Payment matching algorithm works identically
- Projection, finder, and UI all work without changes
- Existing tests continue to pass

### Security Considerations

- GoCardless API credentials (`GOCARDLESS_SECRET_ID`, `GOCARDLESS_SECRET_KEY`) stored ONLY in environment variables — never in database or code
- GoCardless API access tokens managed in-memory only (24h TTL, auto-refresh) — never persisted to disk/database
- RequisitionId and AgreementId stored in Prisma `bank_connections` table — these are reference IDs, not credentials
- No bank login credentials ever touch the application — GoCardless handles SCA/authentication entirely
- Consent expiry enforced: 90-day max, daily CRON check, ActionFeed alerts

### Graceful Degradation

When `GOCARDLESS_SECRET_ID` and `GOCARDLESS_SECRET_KEY` environment variables are not set:
- `OpenBankingModule` registers as no-op (empty service that returns `{ available: false }`)
- Frontend checks `GET /api/open-banking/status` → `{ available: false }` → hides all Open Banking UI
- CSV import flow continues to work identically — zero regression
- No error logs or warnings (intentional absence, not failure)

### Daily CRON Job Design

Add to existing `infrastructure/scheduling/alert-scheduler.service.ts`:
1. **Sync active connections:** for each `status: "linked"` connection, call GoCardless transactions API, dispatch import command for new transactions
2. **Check expiring connections:** if `agreementExpiry` < now + 7 days, create ActionFeed alert + send email
3. **Mark expired connections:** if `agreementExpiry` < now, dispatch `MarkBankConnectionExpiredCommand`
4. Sequential processing (not parallel) to respect GoCardless rate limit (4 req/s free tier)

### PSD2/DSP2 Compliance Notes

- Baillr does NOT need its own AISP license — GoCardless is the licensed AISP
- User consent handled by GoCardless redirect flow (SCA at bank)
- Consent valid max 90 days — must re-authenticate after expiry
- Data minimization: only store transaction references, not raw API responses
- GDPR: disconnect = purge connection data + GoCardless requisition deletion
- No bank credentials stored in application (NFR11)

### Project Structure Notes

#### New Backend Files
```
backend/src/
├── infrastructure/
│   └── open-banking/
│       ├── open-banking.module.ts           # @Global(), conditional registration
│       ├── gocardless.service.ts            # API client (institutions, requisitions, transactions)
│       ├── gocardless-token.service.ts      # In-memory token management with auto-refresh
│       └── __tests__/
│           ├── gocardless.service.spec.ts
│           └── gocardless-token.service.spec.ts
├── portfolio/
│   └── entity/
│       ├── domain/
│       │   ├── value-object/
│       │   │   ├── bank-connection-status.ts        # VO: linked | expired | suspended | disconnected
│       │   │   ├── requisition-id.ts                # VO
│       │   │   └── institution-id.ts                # VO
│       │   ├── events/
│       │   │   ├── bank-connection-linked.event.ts
│       │   │   ├── bank-connection-expired.event.ts
│       │   │   ├── bank-connection-disconnected.event.ts
│       │   │   └── bank-connection-synced.event.ts
│       │   ├── commands/
│       │   │   ├── link-a-bank-connection.command.ts
│       │   │   ├── link-a-bank-connection.handler.ts
│       │   │   ├── disconnect-a-bank-connection.command.ts
│       │   │   ├── disconnect-a-bank-connection.handler.ts
│       │   │   ├── mark-bank-connection-expired.command.ts
│       │   │   ├── mark-bank-connection-expired.handler.ts
│       │   │   ├── mark-bank-connection-synced.command.ts
│       │   │   └── mark-bank-connection-synced.handler.ts
│       │   └── __tests__/
│       │       ├── entity.aggregate.bank-connection.spec.ts
│       │       ├── bank-connection-status.spec.ts
│       │       ├── link-a-bank-connection.handler.spec.ts
│       │       └── disconnect-a-bank-connection.handler.spec.ts
├── presentation/
│   └── open-banking/
│       ├── controllers/
│       │   ├── get-institutions.controller.ts
│       │   ├── initiate-bank-connection.controller.ts
│       │   ├── complete-bank-connection.controller.ts
│       │   ├── disconnect-bank-connection.controller.ts
│       │   ├── get-bank-connections.controller.ts
│       │   ├── sync-bank-transactions.controller.ts
│       │   └── get-open-banking-status.controller.ts
│       ├── dto/
│       │   ├── initiate-bank-connection.dto.ts
│       │   └── sync-bank-transactions.dto.ts
│       ├── projections/
│       │   └── bank-connection.projection.ts
│       ├── finders/
│       │   └── bank-connection.finder.ts
│       ├── services/
│       │   └── bank-connection-sync.service.ts
│       ├── open-banking-presentation.module.ts
│       └── __tests__/
│           ├── get-institutions.controller.spec.ts
│           ├── initiate-bank-connection.controller.spec.ts
│           ├── complete-bank-connection.controller.spec.ts
│           ├── disconnect-bank-connection.controller.spec.ts
│           ├── sync-bank-transactions.controller.spec.ts
│           └── bank-connection-sync.service.spec.ts
```

#### New Frontend Files
```
frontend/src/
├── app/(auth)/
│   └── bank-connections/
│       └── callback/
│           └── page.tsx                    # OAuth callback handler page
├── components/features/
│   └── bank-connections/
│       ├── connect-bank-dialog.tsx         # Institution selection + initiate connection
│       ├── bank-connection-badge.tsx       # Status badge (Connectée / Expirée / etc.)
│       ├── bank-connections-list.tsx       # List of connections with actions
│       └── __tests__/
│           ├── connect-bank-dialog.test.tsx
│           ├── bank-connection-badge.test.tsx
│           └── bank-connections-list.test.tsx
├── hooks/
│   └── use-bank-connections.ts            # Query + mutation hooks
├── lib/api/
│   └── open-banking.ts                    # API client functions
```

#### Modified Files
```
backend/src/
├── app.module.ts                          # Import OpenBankingModule + OpenBankingPresentationModule
├── portfolio/entity/domain/
│   └── entity.aggregate.ts               # Add bankConnections Map + methods
├── infrastructure/scheduling/
│   └── alert-scheduler.service.ts         # Add bank connection CRON jobs
├── prisma/schema.prisma                   # Add BankConnection model

frontend/src/
├── components/features/
│   └── entities/entity-detail.tsx         # Add bank connection section (or bank-accounts section)
├── components/features/
│   └── action-feed.tsx                    # Add bank connection alerts
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 9.1] — Original story definition with acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Infrastructure module patterns, `infrastructure/integrations/`
- [Source: _bmad-output/planning-artifacts/architecture.md#Bounded Contexts] — Portfolio BC structure, entity aggregate patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — Child data in aggregate pattern, event format, command/query flow
- [Source: docs/project-context.md#CQRS / Event Sourcing Patterns] — Established CQRS patterns, projection resilience, optimistic UI
- [Source: docs/project-context.md#Frontend Architecture] — React Query patterns, staleTime, cache invalidation
- [Source: GoCardless Bank Account Data API] — https://bankaccountdata.gocardless.com/api/v2/ — REST API reference
- [Source: PSD2/DSP2 Consent Requirements] — 90-day max consent, SCA at bank, AISP license delegation to aggregator

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Backend: 251 suites, 1677 tests — all passing
- Frontend: 114 suites, 898 tests — all passing
- Backend typecheck: clean
- Frontend typecheck: clean

### Completion Notes List

1. **RequisitionId and InstitutionId VOs omitted** — YAGNI, plain strings used throughout. BankConnectionStatus is the only VO (enum-like pattern).
2. **DTOs not separately created** — Controllers use inline validation via class-validator on params/query. The story's 4.6 subtask about DTOs was absorbed into controller implementations.
3. **Task 7.2 (new transactions ActionFeed item) deferred** — Requires tracking sync results across sessions; ActionFeed currently shows expiry alerts only (AC #7 met).
4. **Task 7.3 (email alert for expiry) deferred** — Existing email alert scheduler could be extended but not required by ACs. CRON marks expired connections and ActionFeed shows alerts.
5. **Callback page uses `window.location.href`** — Full page navigation for GoCardless redirect (not Next.js router.push) since the URL is external.
6. **useOpenBankingApi() is hook-based factory** — Returns object with async methods using fetchWithAuth internally, matching existing API client patterns.
7. **BankConnectionSyncSchedulerService** created as separate service (not added to existing AlertSchedulerService) — cleaner separation of concerns, registered in SchedulingModule.
8. **EntityFinder.findById()** added — needed by CRON scheduler which runs without userId context (system-level operation).
9. **Optimistic disconnect** — useDisconnectBankConnection removes connection from cache immediately with rollback on failure.

### Change Log

| Change | Reason |
|--------|--------|
| `BankConnectionStatus` as flat enum file (not VO class) | Simpler pattern, no validation needed beyond string literals |
| CRON at 6am (not 8am like alerts) | Bank sync should run before business hours, before alert detection |
| `useOpenBankingApi()` hook-based factory | Consistent with existing `fetchWithAuth` patterns, avoids standalone functions needing auth token |
| Callback page with `hasAttempted` ref | Prevents double-completion in React strict mode |
| `BankConnectionsList` as separate component (not in entity detail) | Displayed within bank-account-list.tsx when connections exist — cleaner composition |
| **Code review: 12 findings (4H/5M/3L), 10 fixes** | H1: `getInstitution()` resolves human-readable name; H2: `getRequisitionByReference()` replaces broken `getRequisition(ref)` (ref is UUID not GoCardless ID); H3: idempotency guard (finder check + aggregate no-op); H4: dead `totalDuplicates` removed; M3: cross-BC `@billing/` alias; M4: 2 missing controller tests; M5: dynamic `agreementExpiry` from GoCardless API; M1: phantom projection.ts removed; M2: dto file added to File List |
| **Code review pass 2: 10 findings (3H/5M/2L), 6 fixes** | H1-H3 accepted (GoCardless→Bridge direction change, CRON deferred, File List drift); M1: date precision normalized to YYYY-MM-DD in `buildTransactionKey`; M2: `deleteItem()` now throws after logging; M3: false positive (test already covers `availableRentCalls`); M4: HTTPS validation on bank redirect URL; M5: runtime `Array.isArray` validation on `accountIds` JSON field; L1: soft delete (status→disconnected) instead of hard delete in projection; L2: `staleTime` 30s→5min on `useBankConnections` |

### File List

**New Files (55):**
```
backend/prisma/migrations/20260219182950_add_bank_connections/migration.sql
backend/src/infrastructure/open-banking/gocardless-token.service.ts
backend/src/infrastructure/open-banking/gocardless.service.ts
backend/src/infrastructure/open-banking/open-banking.module.ts
backend/src/infrastructure/open-banking/__tests__/gocardless-token.service.spec.ts
backend/src/infrastructure/open-banking/__tests__/gocardless.service.spec.ts
backend/src/infrastructure/scheduling/__tests__/bank-connection-sync-scheduler.service.spec.ts
backend/src/infrastructure/scheduling/bank-connection-sync-scheduler.service.ts
backend/src/portfolio/entity/__tests__/bank-connection-status.spec.ts
backend/src/portfolio/entity/__tests__/disconnect-a-bank-connection.handler.spec.ts
backend/src/portfolio/entity/__tests__/entity.aggregate.bank-connection.spec.ts
backend/src/portfolio/entity/__tests__/link-a-bank-connection.handler.spec.ts
backend/src/portfolio/entity/bank-connection-status.ts
backend/src/portfolio/entity/commands/disconnect-a-bank-connection.command.ts
backend/src/portfolio/entity/commands/disconnect-a-bank-connection.handler.ts
backend/src/portfolio/entity/commands/link-a-bank-connection.command.ts
backend/src/portfolio/entity/commands/link-a-bank-connection.handler.ts
backend/src/portfolio/entity/commands/mark-bank-connection-expired.command.ts
backend/src/portfolio/entity/commands/mark-bank-connection-expired.handler.ts
backend/src/portfolio/entity/commands/mark-bank-connection-synced.command.ts
backend/src/portfolio/entity/commands/mark-bank-connection-synced.handler.ts
backend/src/portfolio/entity/events/bank-connection-disconnected.event.ts
backend/src/portfolio/entity/events/bank-connection-expired.event.ts
backend/src/portfolio/entity/events/bank-connection-linked.event.ts
backend/src/portfolio/entity/events/bank-connection-synced.event.ts
backend/src/portfolio/entity/exceptions/bank-connection-not-found.exception.ts
backend/src/presentation/open-banking/__tests__/bank-connection-sync.service.spec.ts
backend/src/presentation/open-banking/__tests__/complete-bank-connection.controller.spec.ts
backend/src/presentation/open-banking/__tests__/disconnect-bank-connection.controller.spec.ts
backend/src/presentation/open-banking/__tests__/get-institutions.controller.spec.ts
backend/src/presentation/open-banking/__tests__/initiate-bank-connection.controller.spec.ts
backend/src/presentation/open-banking/__tests__/get-open-banking-status.controller.spec.ts
backend/src/presentation/open-banking/__tests__/get-bank-connections.controller.spec.ts
backend/src/presentation/open-banking/__tests__/sync-bank-transactions.controller.spec.ts
backend/src/presentation/open-banking/controllers/complete-bank-connection.controller.ts
backend/src/presentation/open-banking/controllers/disconnect-bank-connection.controller.ts
backend/src/presentation/open-banking/controllers/get-bank-connections.controller.ts
backend/src/presentation/open-banking/controllers/get-institutions.controller.ts
backend/src/presentation/open-banking/controllers/get-open-banking-status.controller.ts
backend/src/presentation/open-banking/controllers/initiate-bank-connection.controller.ts
backend/src/presentation/open-banking/controllers/sync-bank-transactions.controller.ts
backend/src/presentation/open-banking/finders/bank-connection.finder.ts
backend/src/presentation/open-banking/dto/initiate-bank-connection.dto.ts
backend/src/presentation/open-banking/open-banking-presentation.module.ts
backend/src/presentation/open-banking/services/bank-connection-sync.service.ts
frontend/e2e/open-banking.spec.ts
frontend/src/app/(auth)/bank-connections/callback/page.tsx
frontend/src/components/features/bank-connections/__tests__/bank-connection-badge.test.tsx
frontend/src/components/features/bank-connections/__tests__/bank-connections-list.test.tsx
frontend/src/components/features/bank-connections/__tests__/connect-bank-dialog.test.tsx
frontend/src/components/features/bank-connections/bank-connection-badge.tsx
frontend/src/components/features/bank-connections/bank-connections-list.tsx
frontend/src/components/features/bank-connections/connect-bank-dialog.tsx
frontend/src/hooks/use-bank-connections.ts
frontend/src/lib/api/open-banking-api.ts
```

**Modified Files (11):**
```
backend/.env.example
backend/prisma/schema.prisma
backend/src/app.module.ts
backend/src/infrastructure/scheduling/scheduling.module.ts
backend/src/portfolio/entity/entity.aggregate.ts
backend/src/portfolio/entity/entity.module.ts
backend/src/presentation/entity/finders/entity.finder.ts
backend/src/presentation/entity/projections/entity.projection.ts
frontend/src/components/features/dashboard/action-feed.tsx
frontend/src/components/features/entities/bank-account-card.tsx
frontend/src/components/features/entities/bank-account-list.tsx
```
