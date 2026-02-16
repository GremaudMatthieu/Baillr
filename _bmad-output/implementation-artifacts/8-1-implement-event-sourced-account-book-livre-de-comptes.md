# Story 8.1: Implement Event-Sourced Account Book (Livre de Comptes)

Status: done

## Story

As a bailleur,
I want the system to maintain an event-sourced account book per ownership entity,
so that every financial operation is recorded with a complete audit trail (FR53, FR56).

## Acceptance Criteria

1. **AC1 — Account book page:** A new `/accounting` page displays the account book (livre de comptes) for the selected entity, scoped by `entityId`. The page title is "Livre de comptes". The sidebar already has a "Comptabilité" navigation item pointing to `/accounting` (BookOpen icon) — verify it works, do NOT re-add it.
2. **AC2 — Entity-level account entries:** The account book shows ALL financial operations for the entity (not per tenant), aggregated from the existing `account_entries` table. Each entry displays: date, operation type (badge), description, debit amount, credit amount, running balance, related tenant name. Entries are sorted by `entryDate DESC, createdAt DESC` (newest first).
3. **AC3 — Filtering:** The account book supports 3 filters that can be combined: date range (start date / end date), operation type (`rent_call`, `payment`, `overpayment_credit`, `charge_regularization`), and tenant (dropdown of entity tenants). Filters use local React state (`useState`) — the project does NOT use `useSearchParams` for filtering (established pattern in charges page, payments page).
4. **AC4 — Running balance display:** The table shows a running balance column. The entity-level total balance (sum of all tenant balances) is displayed prominently above the table as a summary card.
5. **AC5 — Backend endpoint:** `GET /api/entities/:entityId/accounting` returns all account entries for the entity with tenant name denormalization. Supports optional query params: `startDate`, `endDate`, `category`, `tenantId`. Queries return results in under 3 seconds for 5 years of event history (NFR5). Uses CQRS QueryBus pattern (C2-1 norm).
6. **AC6 — Immutability guarantee:** No update or delete operations exist on the account entries table (NFR14). The API only exposes GET endpoints. The Prisma model has no update/delete methods exposed.
7. **AC7 — Audit trail completeness:** Every entry includes: timestamp (`entryDate`), reference to source event (`referenceId`), entry category, and the entry was created by the `AccountEntryProjection` from domain events only — no manual inserts.
8. **AC8 — French number formatting:** All amounts use French number formatting (`1 234,56 €`) with `tabular-nums` font feature for column alignment. Negative balances displayed in red.
9. **AC9 — Responsive design:** Desktop: full table with all columns. Tablet: reduced columns (date, description, amount, balance). Mobile: card-based layout.
10. **AC10 — Tests:** Backend: query handler test, finder test with filters. Frontend: component test (table rendering, filters, empty state, balance display), hook test. E2E: navigate to accounting page, verify entries visible after creating a rent call + payment.
11. **AC11 — All tests green:** All existing backend + frontend + E2E tests pass. No regressions.

## Tasks / Subtasks

- [x] Task 1: Add Prisma relation and create AccountingFinder (AC: #2, #5, #6, #7)
  - [x] 1.1 Add Prisma relation from `AccountEntry` to `Tenant`
  - [x] 1.2 Create `backend/src/presentation/accounting/` module structure
  - [x] 1.3 Create `AccountingFinder` with `findByEntity(entityId, filters?)` method
  - [x] 1.4 Create `GetAccountBookQuery` + `GetAccountBookHandler` using QueryBus pattern
  - [x] 1.5 Create `GetAccountBookController` — `GET /api/entities/:entityId/accounting`
  - [x] 1.6 Create `AccountingPresentationModule`
  - [x] 1.7 Register module in `app.module.ts`
  - [x] 1.8 Unit tests: handler (4 tests), controller (3 tests), finder (10 tests) — 17 tests passing

- [x] Task 2: Create accounting API and hooks on frontend (AC: #2, #3, #5)
  - [x] 2.1 Create `frontend/src/lib/api/accounting-api.ts`
  - [x] 2.2 Create `frontend/src/hooks/use-accounting.ts`
  - [x] 2.3 Define `AccountEntryWithTenant` type interface in API module
  - [x] 2.4 Hook tests: 4 tests passing

- [x] Task 3: Create accounting page and account book table component (AC: #1, #2, #4, #8, #9)
  - [x] 3.1 Create `frontend/src/app/(auth)/accounting/page.tsx` — Server Component with metadata
  - [x] 3.2 Create `account-book-content.tsx` — main client component
  - [x] 3.3 Create `account-book-table.tsx` — desktop table + mobile card layout
  - [x] 3.4 Create `account-book-filters.tsx` — date range, category Select, tenant Select
  - [x] 3.5 Create `account-book-summary.tsx` — balance summary card
  - [x] 3.6 OPERATION_TYPE_LABELS constant

- [x] Task 4: Verify sidebar navigation and add empty state (AC: #1)
  - [x] 4.1 Verified existing "Comptabilité" sidebar item (line 48) — works correctly, NOT re-added
  - [x] 4.2 Empty state implemented in AccountBookContent

- [x] Task 5: Frontend component tests (AC: #10)
  - [x] 5.1 `account-book-content.test.tsx` — 6 tests
  - [x] 5.2 `account-book-table.test.tsx` — 7 tests
  - [x] 5.3 `account-book-filters.test.tsx` — 4 tests
  - [x] 5.4 `account-book-summary.test.tsx` — 4 tests — 21 tests passing

- [x] Task 6: E2E test (AC: #10, #11)
  - [x] 6.1 E2E spec: `accounting.spec.ts` — 4 tests (seed, empty state, debit after rent call, credit after payment)
  - [x] 6.2 Full test suite regression: backend 1493 tests (224 suites), frontend 793 tests (101 suites) — all green

- [x] Task 7: ActionFeed integration (AC: #1)
  - [x] 7.1 Added "Consultez votre livre de comptes" action — BookOpen icon, priority low, href `/accounting`, triggers when rent calls exist

## Dev Notes

### CRITICAL: Build on Existing AccountEntry Infrastructure

**The event-sourced accounting ledger already exists.** The `AccountEntryProjection` (Story 5.5 + 7.8) already subscribes to financial events and creates `account_entries` rows. This story does NOT create a new aggregate or new events. It creates a **new presentation module** (`presentation/accounting/`) that reads the existing `account_entries` table at the entity level (not just per tenant).

**What already exists (DO NOT duplicate):**
- `AccountEntryProjection` in `presentation/rent-call/projections/` — subscribes to `RentCallGenerated`, `PaymentRecorded`, `ChargeRegularizationApplied` events → creates entries
- `AccountEntryFinder` in `presentation/rent-call/finders/` — queries by `tenantId + entityId`
- `GetTenantAccountController` — `GET /entities/:entityId/tenants/:tenantId/account` (per-tenant view)
- `TenantCurrentAccount` component — per-tenant table view
- Prisma `AccountEntry` model with `@@unique([referenceId, category])` idempotency

**What this story ADDS:**
- `presentation/accounting/` — a NEW presentation module (read-only, no BC counterpart per architecture)
- Entity-level view: query ALL entries for entityId (not scoped to one tenant), JOIN tenant names
- Filters: date range, category, tenantId
- Frontend: `/accounting` page with table, filters, summary card
- This is exactly what the architecture planned: `presentation/accounting/` as a read-only module

### Architecture Compliance

Per architecture doc: `presentation/accounting/` is a **read-only module** (FR53-56) with no domain counterpart. It projects financial events from Billing, Recovery, and Indexation into the account book. The projection already exists in `presentation/rent-call/`; this module creates a separate **query path** for entity-level accounting views.

**AccountingFinder vs AccountEntryFinder:**
- `AccountEntryFinder` (existing, in rent-call module): per-tenant queries, used by `GetTenantAccountHandler`
- `AccountingFinder` (new, in accounting module): entity-level queries with filters and tenant name denormalization, used by `GetAccountBookHandler`
- Both query the SAME `account_entries` Prisma table — no duplication of data

### Backend Structure

```
backend/src/presentation/accounting/
├── controllers/
│   └── get-account-book.controller.ts     # GET /api/entities/:entityId/accounting
├── dto/
│   └── get-account-book-query-params.dto.ts  # Query param validation (class-validator)
├── queries/
│   ├── get-account-book.query.ts
│   └── get-account-book.handler.ts
├── finders/
│   └── accounting.finder.ts               # Entity-level queries with filters
├── accounting-presentation.module.ts
└── __tests__/
    ├── get-account-book.controller.spec.ts
    ├── get-account-book.handler.spec.ts
    └── accounting.finder.spec.ts
```

### Frontend Structure

```
frontend/src/
├── app/(auth)/accounting/
│   └── page.tsx                           # Server Component (metadata)
├── components/features/accounting/
│   ├── account-book-content.tsx           # Client wrapper
│   ├── account-book-table.tsx             # Table component
│   ├── account-book-filters.tsx           # Filter bar
│   ├── account-book-summary.tsx           # Balance summary card
│   └── __tests__/
│       ├── account-book-content.test.tsx
│       ├── account-book-table.test.tsx
│       ├── account-book-filters.test.tsx
│       └── account-book-summary.test.tsx
├── hooks/use-accounting.ts
└── lib/api/accounting-api.ts
```

### AccountingFinder Query Strategy

```typescript
// Entity-level query with optional filters — uses Prisma relation for tenant names
async findByEntity(entityId: string, filters?: {
  startDate?: string;  // ISO date string
  endDate?: string;    // ISO date string
  category?: string;   // 'rent_call' | 'payment' | 'overpayment_credit' | 'charge_regularization'
  tenantId?: string;
}): Promise<AccountEntryWithTenant[]> {
  return this.prisma.accountEntry.findMany({
    where: {
      entityId,
      ...(filters?.startDate && { entryDate: { gte: new Date(filters.startDate) } }),
      ...(filters?.endDate && { entryDate: { lte: new Date(filters.endDate) } }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.tenantId && { tenantId: filters.tenantId }),
    },
    include: { tenant: true },  // Prisma relation added in Task 1.1
    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
  });
}

// Total balance = sum of latest balance per tenant (subquery approach)
async getTotalBalance(entityId: string): Promise<number> {
  // Use raw SQL: SELECT SUM(balance_cents) FROM (
  //   SELECT DISTINCT ON (tenant_id) balance_cents
  //   FROM account_entries WHERE entity_id = $1
  //   ORDER BY tenant_id, entry_date DESC, created_at DESC
  // ) sub;
  // OR use Prisma groupBy + follow-up query
}
```

**Tenant name denormalization:** Task 1.1 adds a Prisma relation `tenant Tenant @relation(...)` to the AccountEntry model. After migration, use `include: { tenant: true }` in the finder. The `@@index([entityId, tenantId])` composite index covers entity-level queries (PostgreSQL uses leftmost columns).

### Existing Prisma AccountEntry Model

```prisma
model AccountEntry {
  id             String   @id @default(uuid())
  entityId       String   @map("entity_id")
  tenantId       String   @map("tenant_id")
  tenant         Tenant   @relation(fields: [tenantId], references: [id])  // ← ADD THIS (Task 1.1)
  type           String   // 'debit' | 'credit'
  category       String   // 'rent_call' | 'payment' | 'overpayment_credit' | 'adjustment' | 'charge_regularization'
  description    String
  amountCents    Int      @map("amount_cents")
  balanceCents   Int      @map("balance_cents")  // Per-TENANT running balance
  referenceId    String   @map("reference_id")
  referenceMonth String   @map("reference_month")
  entryDate      DateTime @map("entry_date")
  createdAt      DateTime @default(now()) @map("created_at")

  @@map("account_entries")
  @@unique([referenceId, category])
  @@index([entityId, tenantId])
  @@index([tenantId])
}

// Also add to Tenant model:
// accountEntries AccountEntry[]
```

**IMPORTANT — balanceCents is per-tenant, not per-entity.** The `balanceCents` column tracks the running balance FOR A SPECIFIC TENANT. For the entity-level account book view:
- Display the per-tenant `balanceCents` as-is in the table (it shows each tenant's balance at that point)
- Compute `totalBalanceCents` as the sum of the LATEST balance for each tenant (server-side in the finder/handler)
- Alternative: add a computed column or aggregation query for entity-level totals

### Category Badge Colors

| Category | Label | Badge Variant |
|----------|-------|---------------|
| `rent_call` | Appel de loyer | `default` (neutral) |
| `payment` | Paiement | `success` (green) |
| `overpayment_credit` | Trop-perçu | `secondary` (muted) |
| `charge_regularization` | Régularisation | `outline` |
| `adjustment` | Ajustement | `warning` (amber) |

### Previous Story Learnings

From C2-2 (most recent):
- **entityId scoping on all Finder queries** — defense-in-depth, never rely on frontend to enforce
- **`await res.json()` not `res.json() as Promise<T>`** — always await before cast
- **Cache invalidation plural keys** — invalidate `["entities", entityId, "accounting"]` on mutations
- **Settle/send guards** — consistent with aggregate state progression patterns
- **CircleDollarSign icon** — used for financial alerts, BookOpen for accounting navigation

From Epic 7 retro:
- **DTO defense-in-depth** — `@IsNotEmpty`, `@MaxLength`, `@IsString` per checklist
- **entityId isolation** — every query MUST include entityId in WHERE
- **CQRS presentation discipline** — Finders in presentation, no PrismaService in handlers

### Performance Considerations (NFR5)

Target: under 3 seconds for 5 years of event history. Assumptions: ~50 units × 12 months × 5 years = ~3,000 rent calls + ~3,000 payments = ~6,000 entries. With overpayments and regularizations: ~7,000 entries max.

- Existing `@@index([entityId, tenantId])` covers entity-level queries
- Pagination NOT needed for MVP (7K rows is manageable)
- If performance degrades, add `@@index([entityId, entryDate])` for date-filtered queries
- Consider cursor-based pagination in a future story if data grows beyond expectations

### Sidebar Navigation (ALREADY EXISTS)

The sidebar at `frontend/src/components/layout/sidebar.tsx` line 48 already has:
```typescript
{ label: "Comptabilité", icon: BookOpen, href: "/accounting" },
```
Do NOT re-add or modify this item. Just verify the page route works when the new `page.tsx` is created.

### French Number Formatting (use existing utility)

Use `formatCurrency()` from `frontend/src/lib/utils/format-currency.ts`:
```typescript
import { formatCurrency } from "@/lib/utils/format-currency";
// formatCurrency(123456) → "1 234,56 €"
```
Do NOT use `formatEuros()` from `lib/format.ts` (legacy duplicate). For `tabular-nums` alignment, add `className="tabular-nums"` on the amount `<td>` or parent `<table>` element.

### Table Rendering Pattern (follow existing conventions)

The project uses **raw HTML `<table>` elements** (no shared Table component). Follow the established pattern from `revision-table.tsx` and `charges-summary.tsx`:
```html
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b bg-muted/50">
        <th className="px-4 py-3 text-left font-medium">Label</th>
        <th className="px-4 py-3 text-right font-medium tabular-nums">Amount</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id} className="border-b last:border-b-0">
          <td className="px-4 py-3">{content}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### "adjustment" Category Note

The Prisma schema lists `adjustment` as a valid category, but NO projection handler currently creates entries with this category. Include `adjustment: "Ajustement"` in `OPERATION_TYPE_LABELS` for forward compatibility, but the filter UI should only show categories that have actual entries (filter the Select options from the data).

### Testing Strategy

**Backend (Jest):**
- `AccountingFinder` — test with Prisma mock: filter combinations, ordering, tenant join
- `GetAccountBookHandler` — test delegation to finder, balance computation
- `GetAccountBookController` — test auth guard, entityId validation, query param parsing

**Frontend (Vitest):**
- `AccountBookContent` — loading, empty, populated states
- `AccountBookTable` — entry rendering, French formatting, debit/credit columns, responsive
- `AccountBookFilters` — select interactions, date inputs, state callback propagation
- `AccountBookSummary` — balance display, negative red, entry count

**E2E (Playwright):**
- Navigate to `/accounting` → verify page loads with title "Livre de comptes"
- If entries exist, verify table renders with correct columns
- Filter by category → verify table updates

### Project Structure Notes

- `presentation/accounting/` is a NEW top-level presentation module (14th module, after the existing 13)
- Architecture alignment: read-only module with no BC counterpart, per architecture spec
- One Prisma migration needed: add `Tenant` relation to `AccountEntry` model (Task 1.1) — this is a relation-only migration, no schema data changes
- `AccountEntryFinder` in rent-call module is NOT exported and must NOT be reused — create a new `AccountingFinder` in the accounting module (separate read path, entity-level queries)

### References

- [Source: architecture.md#Bounded Contexts & Context Map] — `presentation/accounting/` planned as read-only module
- [Source: architecture.md#Structure Patterns] — presentation module structure pattern
- [Source: epics.md#Story 8.1] — FR53, FR56 acceptance criteria
- [Source: project-context.md#CQRS / Event Sourcing Patterns] — QueryBus pattern
- [Source: epic-7-retro-2026-02-15.md] — Saga/Reaction pattern, entityId isolation, DTO checklist
- [Source: c2-2-close-open-circuits-from-epic-7.md] — AccountEntry projection completeness, latest test counts

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed EntityFinder import path: initially `@infrastructure/database/finders/entity.finder.js` → corrected to `../../entity/finders/entity.finder.js` (project convention)
- Fixed Jest CLI flag: `--testPathPattern` → `--testPathPatterns` (Jest 30 breaking change)

### Completion Notes List

- Read-only presentation module: no domain counterpart, queries existing `account_entries` table
- `AccountingFinder` vs `AccountEntryFinder`: separate read paths (entity-level vs per-tenant)
- `getTotalBalance` uses raw SQL `DISTINCT ON (tenant_id)` subquery for entity-level sum
- Filters use local `useState` (project convention, not `useSearchParams`)
- Badge variants mapped to available project variants (default, secondary, destructive, outline, ghost)
- Sidebar "Comptabilité" item already existed at line 48 — verified, not re-added
- ActionFeed: BookOpen icon added to iconMap, "Consultez votre livre de comptes" triggers when `hasRentCalls` is true

### File List

**New files (24):**
- `backend/prisma/migrations/20260216191637_add_account_entry_tenant_relation/migration.sql`
- `backend/src/presentation/accounting/accounting-presentation.module.ts`
- `backend/src/presentation/accounting/controllers/get-account-book.controller.ts`
- `backend/src/presentation/accounting/dto/get-account-book-query-params.dto.ts`
- `backend/src/presentation/accounting/queries/get-account-book.query.ts`
- `backend/src/presentation/accounting/queries/get-account-book.handler.ts`
- `backend/src/presentation/accounting/finders/accounting.finder.ts`
- `backend/src/presentation/accounting/__tests__/get-account-book.handler.spec.ts`
- `backend/src/presentation/accounting/__tests__/get-account-book.controller.spec.ts`
- `backend/src/presentation/accounting/__tests__/accounting.finder.spec.ts`
- `frontend/src/app/(auth)/accounting/page.tsx`
- `frontend/src/components/features/accounting/account-book-content.tsx`
- `frontend/src/components/features/accounting/account-book-table.tsx`
- `frontend/src/components/features/accounting/account-book-filters.tsx`
- `frontend/src/components/features/accounting/account-book-summary.tsx`
- `frontend/src/components/features/accounting/__tests__/account-book-content.test.tsx`
- `frontend/src/components/features/accounting/__tests__/account-book-table.test.tsx`
- `frontend/src/components/features/accounting/__tests__/account-book-filters.test.tsx`
- `frontend/src/components/features/accounting/__tests__/account-book-summary.test.tsx`
- `frontend/src/hooks/use-accounting.ts`
- `frontend/src/hooks/__tests__/use-accounting.test.ts`
- `frontend/src/lib/api/accounting-api.ts`
- `frontend/src/lib/constants/operation-types.ts`
- `frontend/e2e/accounting.spec.ts`

**Modified files (4):**
- `backend/prisma/schema.prisma` — added `tenant Tenant @relation(...)` on AccountEntry + `accountEntries AccountEntry[]` on Tenant
- `backend/src/app.module.ts` — registered `AccountingPresentationModule`
- `frontend/src/components/features/dashboard/action-feed.tsx` — added BookOpen import, iconMap entry, "Consultez votre livre de comptes" action
- `frontend/e2e/fixtures/api.fixture.ts` — added `getAccountBook()` and `waitForAccountEntryCount()` helper methods

### Change Log

| Change | Reason | AC |
|--------|--------|-----|
| Added Prisma relation AccountEntry→Tenant | Denormalize tenant names in entity-level queries | AC2, AC5 |
| Created AccountingPresentationModule | New read-only module for entity-level accounting | AC5, AC6 |
| Created AccountingFinder with filters | Entity-level queries with optional date/category/tenant filters | AC2, AC3, AC5 |
| Created GetAccountBookHandler + Controller | CQRS QueryBus pattern, ownership validation via EntityFinder | AC5, AC7 |
| Created accounting-api.ts + use-accounting.ts | Frontend API layer and React Query hook | AC2, AC3 |
| Created /accounting page + 4 components | Server Component page, content, table, filters, summary | AC1, AC4, AC8, AC9 |
| Created OPERATION_TYPE_LABELS constant | Category badge labels in French | AC8 |
| Created 4 frontend test suites (21 tests) | Component tests for table, filters, content, summary | AC10 |
| Created 3 backend test suites (17 tests) | Handler, controller, finder tests | AC10 |
| Created E2E accounting.spec.ts (4 tests) | Seed, empty state, debit/credit verification | AC10 |
| Created hook test (4 tests) | useAccountBook loading/success/filter forwarding | AC10 |
| Added ActionFeed "Consultez votre livre de comptes" | BookOpen icon, low priority, shown when rent calls exist | AC1 |
| Full regression: 1493 backend + 793 frontend tests | All green, no regressions | AC11 |

### Code Review Fixes (12 findings, 12 fixes)

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| H1 | High | AC9 responsive: no tablet breakpoint, Type column shown at all sizes | Added `hidden lg:table-cell` to Type and Locataire columns |
| H2 | High | getTotalBalance not filtered by tenantId — shows entity total even when tenant filter active | Added `tenantId?` param to getTotalBalance, pass from handler |
| M1 | Med | Unsafe `as unknown as` double cast in finder where clause building | Changed to `Prisma.AccountEntryWhereInput` typed where clause |
| M2 | Med | No DTO validation on query params (startDate, endDate, category, tenantId) | Created `GetAccountBookQueryParamsDto` with class-validator decorators |
| M3 | Med | Story File List count "20" is wrong (actually 23 new files) | Fixed to 21 (original 20 + new DTO file) |
| M4 | Med | Payment badge should be green (success) but uses `secondary` (grey) | Added `CATEGORY_BADGE_CLASS` with green CSS classes (no success variant) |
| M5 | Med | Date parsing timezone risk — `new Date(dateStr)` can shift day | Added `timeZone: "UTC"` to `toLocaleDateString()` |
| M6 | Med | Finder test doesn't verify SQL query content — only checks call count | Added tests verifying tagged template args (entityId, tenantId) |
| L1 | Low | AccountingFinder exported from module but unused externally | Removed `exports: [AccountingFinder]` |
| L2 | Low | availableCategories computed from filtered entries — disappear when filtering | Moved to backend: `getAvailableCategories()` using `groupBy` (unfiltered) |
| L3 | Low | No aria-label on table | Added `aria-label="Livre de comptes"` to `<table>` |
| L4 | Low | Redundant "use client" on table component (only used by client parent) | Removed `"use client"` directive |
