# Story 8.5: Display KPIs and Collection Rate

Status: done

## Story

As a bailleur,
I want the dashboard to display collection rate and key financial indicators,
so that I can monitor my rental business performance at a glance (FR58).

## Acceptance Criteria

1. **Given** I have financial activity (rent calls, payments) **When** I view the dashboard **Then** I see KPITile components displaying: collection rate (% of rent collected vs. called for current month), total rent called this month, total payments received this month, number of unpaid tenants, total outstanding debt
2. **Given** I view KPI tiles **When** data is loaded **Then** each KPI shows a trend indicator (up/down vs. previous month)
3. **Given** I view financial amounts **When** they are displayed in KPI tiles **Then** all amounts use French number formatting with tabular-nums font feature
4. **Given** the dashboard loads **When** data is available **Then** the KPIs load within the overall dashboard <2s target (NFR4)

## Tasks / Subtasks

- [x] Task 1: Create backend KPI summary endpoint (AC: #1, #2, #4)
  - [x] 1.1 Create `GetDashboardKpisController` in `presentation/rent-call/controllers/` — `GET /api/entities/:entityId/dashboard-kpis?month=YYYY-MM`
  - [x] 1.2 Create `GetDashboardKpisDto` query params DTO with `@IsString()` month validation
  - [x] 1.3 Create `DashboardKpisFinder` in `presentation/rent-call/finders/` — 3 parallel Prisma queries (currentMonth, previousMonth, outstandingDebt)
  - [x] 1.4 Return DTO: `{ currentMonth: { collectionRatePercent, totalCalledCents, totalReceivedCents, unpaidCount, outstandingDebtCents }, previousMonth: { ... } }`
  - [x] 1.5 Write backend tests: finder (5 tests — empty, full, partial, January→December, multi-month outstanding), controller (2 tests) — 7 tests pass
- [x] Task 2: Create frontend API client and hook (AC: #1, #2)
  - [x] 2.1 Add `DashboardKpisData` + `MonthKpisData` interfaces and `getDashboardKpis(entityId, month)` to `lib/api/rent-calls-api.ts`
  - [x] 2.2 Add `useDashboardKpis(entityId, month)` hook in `hooks/use-rent-calls.ts` — query key `["entities", entityId, "dashboard-kpis", month]`
  - [x] 2.3 Add cross-query cache invalidation: invalidate `dashboard-kpis` in useGenerateRentCalls, useSendRentCallsByEmail, useValidateMatch, useManualAssignMatch, useRecordManualPayment
- [x] Task 3: Create KpiTile reusable component (AC: #1, #2, #3)
  - [x] 3.1 Create `KpiTile` component in `components/features/dashboard/kpi-tile.tsx` — props: `label`, `value`, `trend`, `trendLabel`, `icon`, `isPositiveGood`, `loading`
  - [x] 3.2 Trend indicator: ArrowUp (green) positive, ArrowDown (red) negative, Minus (gray) zero, null = hidden
  - [x] 3.3 French number formatting with `tabular-nums` class on value
  - [x] 3.4 Loading skeleton state (Card with Skeleton pulse placeholders)
  - [x] 3.5 Dark mode support: `dark:text-green-400`, `dark:text-red-400`
- [x] Task 4: Replace KpiTilesPlaceholder with real KPI tiles (AC: #1, #2, #3)
  - [x] 4.1 In `dashboard-content.tsx`, replace `KpiTilesPlaceholder` with `KpiTiles` component, add dashed placeholder divs for no-entity state
  - [x] 4.2 Create `KpiTiles` component in `components/features/dashboard/kpi-tiles.tsx` — uses `useDashboardKpis` hook
  - [x] 4.3 Compute 5 KPI values: collection rate (%), total called (€), total received (€), unpaid count, outstanding debt (€)
  - [x] 4.4 Compute trend: `currentMonth - previousMonth` for each metric, null when no previous data
  - [x] 4.5 Icons: Percent, Receipt, Banknote, AlertTriangle, TrendingDown
  - [x] 4.6 Lifted `selectedMonth` state from UnitMosaic to DashboardContent, passed as prop to both KpiTiles and UnitMosaic
- [x] Task 5: Handle empty/loading/error states (AC: #1)
  - [x] 5.1 Empty state: show "0,0 %" / "0,00 €" / "0" for all tiles when data is zeros
  - [x] 5.2 Loading state: 5 skeleton tiles via KpiTile `loading` prop
  - [x] 5.3 Error state: show "—" em dash for all 5 tiles
- [x] Task 6: Write frontend tests (AC: #1, #2, #3)
  - [x] 6.1 `kpi-tile.test.tsx` — 8 tests: label+value, tabular-nums, green up, red down, inverted green down, zero neutral, null hidden, loading skeleton
  - [x] 6.2 `kpi-tiles.test.tsx` — 7 tests: 5 labels, percentage format, amounts, loading skeletons, zeros, error dashes, no trends without previous
  - [x] 6.3 Updated `dashboard-content.test.tsx` — 3 tests: KpiTiles render, UnitMosaic render, placeholder when no entity
  - [x] 6.4 Hook tests for `useDashboardKpis` in `use-rent-calls.test.ts` — 3 tests: fetch success, no fetch when entityId empty, no fetch when month empty
- [x] Task 7: Write E2E test (AC: #1, #4)
  - [x] 7.1 E2E: navigate to dashboard, verify 5 KPI tiles visible with labels (test 8.5.1 in dashboard.spec.ts)
  - [x] 7.2 E2E: verify collection rate displays as percentage format (test 8.5.2)
  - [x] 7.3 E2E: verify amounts display in French number format with € (test 8.5.3)
- [x] Task 8: Verify performance and regression (AC: #4)
  - [x] 8.1 Verify KPI endpoint responds <500ms — backend finder tests execute in <10ms
  - [x] 8.2 Verify dashboard overall load <2s — test 8.4.3 validates <3s threshold
  - [x] 8.3 Full test regression: 836 frontend tests (107 suites) pass, 623 presentation + 148 billing backend tests pass, typecheck clean on both sides

## Dev Notes

### CRITICAL: KpiTilesPlaceholder Already Exists — REPLACE It

The `KpiTilesPlaceholder` component already exists at `frontend/src/components/features/dashboard/kpi-tiles-placeholder.tsx`. It renders a 2×2 grid (responsive 4-column on lg) with 4 placeholder tiles showing labels:
- "Taux d'encaissement" (Collection Rate)
- "Loyers appelés" (Rent Called)
- "Paiements reçus" (Payments Received)
- "Impayés" (Unpaid)

The AC specifies 5 KPIs (adds "total outstanding debt" beyond the 4 placeholders). Adjust the grid to accommodate 5 tiles.

### Backend: New Endpoint is REQUIRED

**Why not compute in frontend?** The existing `useRentCalls(entityId, month)` returns all individual rent calls, which is sufficient for per-unit display in UnitMosaic. However:
1. Computing aggregates (SUM, COUNT) client-side from full rent-call arrays is wasteful for KPIs
2. The "previous month" comparison requires fetching TWO months of data
3. "Outstanding debt" requires cross-month aggregation (all months with unpaid rent)
4. A dedicated endpoint with SQL aggregation is cleaner and faster

**Endpoint design:**
```
GET /api/entities/:entityId/dashboard-kpis?month=2026-02
```

**Response shape:**
```typescript
interface DashboardKpisResponse {
  currentMonth: MonthKpis;
  previousMonth: MonthKpis;
}

interface MonthKpis {
  collectionRatePercent: number;  // 0-100, 2 decimals
  totalCalledCents: number;       // sum of all rent call totalAmountCents
  totalReceivedCents: number;     // sum of all paidAmountCents
  unpaidCount: number;            // count of rent calls with no payment or partial
  outstandingDebtCents: number;   // sum of remainingBalanceCents across ALL months
}
```

**SQL aggregation (DashboardKpisFinder):**
```sql
-- Current month aggregation
SELECT
  COUNT(*) as total_calls,
  COALESCE(SUM(total_amount_cents), 0) as total_called,
  COALESCE(SUM(paid_amount_cents), 0) as total_received,
  COUNT(*) FILTER (WHERE payment_status IS NULL OR payment_status = 'partial') as unpaid_count
FROM rent_calls
WHERE entity_id = $1 AND month = $2 AND user_id = $3;

-- Outstanding debt (all months)
SELECT COALESCE(SUM(remaining_balance_cents), 0) as outstanding_debt
FROM rent_calls
WHERE entity_id = $1 AND user_id = $2
  AND (payment_status IS NULL OR payment_status = 'partial')
  AND sent_at IS NOT NULL;
```

**Collection rate formula:** `totalReceivedCents / totalCalledCents * 100` (handle division by zero → 0%)

**Note:** The outstanding debt is NOT month-specific — it's the total across ALL months. This is critical because a bailleur needs to see the global picture.

### Controller Placement

Place in `presentation/rent-call/controllers/get-dashboard-kpis.controller.ts` — the endpoint reads rent_calls table, so it belongs in the rent-call presentation module. No new module needed.

Register in `RentCallPresentationModule`.

**Pattern:** `APP_GUARD` is global — no per-controller `@UseGuards` needed. Use `@CurrentUserId()` decorator.

### Frontend: KpiTile Component Design

```tsx
interface KpiTileProps {
  label: string;
  value: string;          // Pre-formatted string (e.g., "85,2 %", "12 450,00 €", "3")
  trend: number | null;   // Positive = up, negative = down, null = no trend
  trendLabel?: string;    // e.g., "+5,3 %" or "-1 200 €"
  icon: LucideIcon;
  loading?: boolean;
}
```

**Layout per tile:**
```
┌──────────────────────┐
│ 🔹 Label        ↑ +5% │
│ 85,2 %                │
└──────────────────────┘
```

- Icon + label top-left
- Trend indicator + delta top-right (green up / red down / gray dash)
- Main value large, centered, `tabular-nums`
- Card with subtle border, dark mode safe

**Trend indicator colors:**
- Positive trend on "collection rate": green (good) — `text-green-600 dark:text-green-400`
- Negative trend on "unpaid count": green (good, fewer unpaid) — invert logic
- Positive trend on "outstanding debt": red (bad, more debt) — invert logic
- Use `isPositiveGood` prop (default `true`) to control color logic

### Frontend: Month Sync with UnitMosaic

The UnitMosaic already has a month selector (`selectedMonth` state). KPIs should show data for the same month. Two options:
1. **Preferred:** Lift `selectedMonth` state to `DashboardContent` and pass as prop to both `UnitMosaic` and `KpiTiles`
2. **Alternative:** Each component manages its own month (inconsistent UX)

**Check if `selectedMonth` is already lifted in `DashboardContent`.** If the month selector was added to `unit-mosaic.tsx` in Story 8.4, the state lives inside UnitMosaic. Lift it to `DashboardContent` and pass down.

### French Number Formatting

Use existing `formatCurrency()` from `frontend/src/lib/utils/format-currency.ts`:
```typescript
formatCurrency(totalCalledCents) // → "12 450,00 €"
```

For collection rate percentage, format manually:
```typescript
`${collectionRatePercent.toFixed(1).replace('.', ',')} %`
```

For count (unpaid tenants): just `String(unpaidCount)`.

### Trend Computation

```typescript
// For amounts and counts
const trend = currentMonth.value - previousMonth.value;
const trendLabel = formatCurrency(Math.abs(trend)); // or String for counts

// For collection rate
const rateTrend = currentMonth.collectionRatePercent - previousMonth.collectionRatePercent;
const rateTrendLabel = `${Math.abs(rateTrend).toFixed(1).replace('.', ',')} pts`;
```

**Edge case:** If previous month has no data (first month of activity), show no trend (null).

### Icons from Lucide React (already installed)

| KPI | Icon | Import |
|-----|------|--------|
| Collection rate | `Percent` | `lucide-react` |
| Rent called | `Receipt` | `lucide-react` |
| Payments received | `Banknote` | `lucide-react` |
| Unpaid count | `AlertTriangle` | `lucide-react` |
| Outstanding debt | `TrendingDown` | `lucide-react` |

### Grid Layout (5 Tiles)

Current placeholder uses 2×2 grid. With 5 tiles, use:
```tsx
<div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
  {/* 5 KpiTile components */}
</div>
```

On mobile (2 cols): 3 rows (2+2+1). On desktop (5 cols): single row.

### Cache Invalidation

When rent calls are generated, sent, or payments are recorded, the KPI data changes. Invalidate `["entities", entityId, "dashboard-kpis"]` (prefix match) in:
- `useGenerateRentCalls` → onSettled
- `useSendRentCallsByEmail` → onSettled
- `useRecordPayment` / `useValidatePaymentMatch` → onSettled

Use `queryClient.invalidateQueries({ queryKey: ["entities", entityId, "dashboard-kpis"] })` with prefix matching (React Query default).

### Dark Mode Support (Mandatory)

All color classes MUST include dark variants:
- Trend up (good): `text-green-600 dark:text-green-400`
- Trend down (bad): `text-red-600 dark:text-red-400`
- Trend neutral: `text-muted-foreground`
- Card background: `bg-card` (already dark-mode safe via shadcn theme)
- Value: `text-foreground` (theme-aware)

### Existing Components / Files to Modify

| File | Change |
|------|--------|
| `frontend/src/components/features/dashboard/dashboard-content.tsx` | Replace `KpiTilesPlaceholder` with `KpiTiles`, lift month state |
| `frontend/src/components/features/dashboard/unit-mosaic.tsx` | Accept `selectedMonth` + `onMonthChange` as props instead of internal state |
| `frontend/src/hooks/use-rent-calls.ts` | Add `useDashboardKpis` hook |
| `frontend/src/lib/api/rent-calls-api.ts` | Add `DashboardKpisData` interface + `fetchDashboardKpis()` |
| `frontend/src/components/features/dashboard/kpi-tiles-placeholder.tsx` | DELETE (replaced by kpi-tiles.tsx) |

### New Files

| File | Purpose |
|------|---------|
| `frontend/src/components/features/dashboard/kpi-tile.tsx` | Reusable KPI tile component |
| `frontend/src/components/features/dashboard/kpi-tiles.tsx` | Dashboard KPI tiles container |
| `frontend/src/components/features/dashboard/__tests__/kpi-tile.test.tsx` | KpiTile unit tests |
| `frontend/src/components/features/dashboard/__tests__/kpi-tiles.test.tsx` | KpiTiles integration tests |
| `backend/src/presentation/rent-call/controllers/get-dashboard-kpis.controller.ts` | KPI endpoint |
| `backend/src/presentation/rent-call/dto/get-dashboard-kpis.dto.ts` | Query params DTO |
| `backend/src/presentation/rent-call/finders/dashboard-kpis.finder.ts` | SQL aggregation finder |
| `backend/src/presentation/rent-call/__tests__/dashboard-kpis.finder.spec.ts` | Finder tests |
| `backend/src/presentation/rent-call/__tests__/get-dashboard-kpis.controller.spec.ts` | Controller tests |
| `frontend/e2e/dashboard.spec.ts` | E2E tests for KPIs (added to existing file) |

### Anti-Patterns to Avoid

- **DO NOT** compute KPI aggregates in the frontend from full rent-call arrays — use a dedicated backend endpoint with SQL aggregation
- **DO NOT** create a new bounded context or aggregate — KPIs are read-only projections
- **DO NOT** use `useEffect` for derived state — use `useMemo` for formatting
- **DO NOT** use `useSearchParams` for month — use lifted `useState` from DashboardContent
- **DO NOT** skip dark mode variants on any color class
- **DO NOT** use float formatting for money — always integer cents, format only at display
- **DO NOT** hardcode month strings — use the `getMonthOptions()` utility for consistency
- **DO NOT** forget to invalidate dashboard-kpis cache when mutations occur

### Testing Standards

**Backend (Jest):**
- `dashboard-kpis.finder.spec.ts` — test with mock PrismaService:
  - Empty state (no rent calls) → zeros
  - Full month with all payments → 100% collection rate
  - Partial payments → correct percentages
  - No previous month data → previousMonth all zeros
  - Outstanding debt across multiple months
- `get-dashboard-kpis.controller.spec.ts` — test controller delegates to finder, returns correct shape

**Frontend (Vitest):**
- `kpi-tile.test.tsx`:
  - Renders label and formatted value
  - Shows green up arrow for positive trend
  - Shows red down arrow for negative trend
  - Shows neutral dash for zero/null trend
  - Renders skeleton when loading
  - Applies tabular-nums class
- `kpi-tiles.test.tsx`:
  - Renders 5 KPI tiles with correct labels
  - Shows collection rate as percentage
  - Shows amounts in French format
  - Shows loading skeletons
  - Shows zeros for empty data

**E2E (Playwright):**
- Dashboard shows 5 KPI tiles with labels
- Collection rate displayed as percentage
- Amounts use French formatting (space separator, comma decimal)

### Previous Story Intelligence

**From Story 8.4 (UnitMosaic):**
- Month selector uses `getMonthOptions()` — reuse for KPI month sync
- `selectedMonth` state inside `unit-mosaic.tsx` — needs lifting to `DashboardContent`
- `STATUS_LABELS` consolidated — good pattern for KPI labels
- 818 frontend tests (105 suites), 1531 backend tests (228 suites)

**From Story 8.1 (Account Book):**
- `formatCurrency()` utility in `lib/utils/format-currency.ts`
- `className="tabular-nums"` for number alignment
- Read-only presentation pattern — no domain module changes
- Responsive table → responsive grid for KPIs

**From Story 8.3 (Excel Export):**
- Fake timers pattern for date-dependent tests
- File List accuracy check with git status

### Git Intelligence (Recent Commits)

Last 5 commits: Story 8.4 (mosaic), 8.3 (Excel export), 8.1 (account book), 7.8 (regularization), 7.7 (charge statements). All in Epic 7-8 territory. Dashboard infrastructure is fresh and well-tested. RentCallFinder recently modified to include tenant data.

### Project Structure Notes

- All frontend changes in `frontend/src/components/features/dashboard/` + `hooks/` + `lib/api/`
- Backend changes in `presentation/rent-call/` (controllers, finders, DTOs, tests)
- No new bounded context, no new Prisma table, no schema migration needed
- Uses existing `rent_calls` Prisma table for SQL aggregation

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 8, Story 8.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Sections: Frontend Architecture, API & Communication Patterns, Presentation Gateway]
- [Source: docs/project-context.md — Sections: Frontend Architecture, Testing Infrastructure, CQRS / Event Sourcing Patterns]
- [Source: docs/anti-patterns.md — Frontend anti-patterns, Backend presentation rules]
- [Source: frontend/src/components/features/dashboard/kpi-tiles-placeholder.tsx — Existing placeholder to replace]
- [Source: frontend/src/components/features/dashboard/dashboard-content.tsx — Dashboard wrapper]
- [Source: frontend/src/components/features/dashboard/unit-mosaic.tsx — Month selector pattern]
- [Source: frontend/src/hooks/use-rent-calls.ts — Existing rent call hooks]
- [Source: frontend/src/lib/api/rent-calls-api.ts — RentCallData interface]
- [Source: backend/src/presentation/rent-call/finders/rent-call.finder.ts — Existing finder patterns]
- [Source: _bmad-output/implementation-artifacts/8-4-display-dashboard-with-unit-payment-status-mosaic.md — Previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Promise.all non-deterministic mock ordering: initial DashboardKpisFinder tests used `mockResolvedValueOnce` sequentially, but Promise.all made call order unpredictable. Fixed by rewriting to argument-matching `mockImplementation`.
- Redundant aggregate call: initial `getOutstandingDebt()` had 3 calls (one unused combined OR query). Simplified to 2 targeted calls (unpaid + partial) in Promise.all.

### Completion Notes List

- Backend: 7 tests (5 finder + 2 controller), all pass
- Frontend: 21 new tests (8 kpi-tile + 7 kpi-tiles + 3 dashboard-content + 3 hook), 836 total tests (107 suites), all pass
- E2E: 3 new tests added to existing dashboard.spec.ts (reuses 8.4 seed data)
- Typecheck: clean on both backend and frontend
- Regression: 623 presentation tests + 148 billing tests pass, zero regressions
- UnitMosaic state lift: `selectedMonth` moved from UnitMosaic internal state to DashboardContent, 7 unit-mosaic test files updated
- KpiTilesPlaceholder file deleted (was unused dead code after replacement by kpi-tiles.tsx)
- `isPositiveGood` prop pattern for inverted trend colors (fewer unpaid = green down arrow)
- Outstanding debt = unpaid totalAmountCents + partial remainingBalanceCents across ALL months

### Change Log

- **2026-02-18**: Story 8.5 implemented — 8 tasks, 28 new tests (21 frontend + 7 backend), 9 new files + 18 modified
- **2026-02-18**: Code review (AI) — 8 findings (1H, 5M, 2L), 7 fixes applied:
  - H1: Fixed `formatTrendPercent` missing minus sign for negative trends
  - M1: Stricter DTO month regex `(0[1-9]|1[0-2])` rejects invalid months 00/13/99
  - M2: Added comment explaining why `previousMonth.outstandingDebtCents` is always 0
  - M3: Added comment explaining AC#2 deviation for outstanding debt trend (cross-month, not comparable)
  - M4: Added `sentAt: { not: null }` filter to `unpaidCount` query for consistency with `outstandingDebt`
  - M5: Deleted dead code `kpi-tiles-placeholder.tsx`
  - L2: Fixed Dev Notes inconsistency (E2E tests in `dashboard.spec.ts`, not separate file)

### File List

**Deleted Files (1)**
- `frontend/src/components/features/dashboard/kpi-tiles-placeholder.tsx`

**New Files (9)**
- `backend/src/presentation/rent-call/controllers/get-dashboard-kpis.controller.ts`
- `backend/src/presentation/rent-call/dto/get-dashboard-kpis.dto.ts`
- `backend/src/presentation/rent-call/finders/dashboard-kpis.finder.ts`
- `backend/src/presentation/rent-call/__tests__/dashboard-kpis.finder.spec.ts`
- `backend/src/presentation/rent-call/__tests__/get-dashboard-kpis.controller.spec.ts`
- `frontend/src/components/features/dashboard/kpi-tile.tsx`
- `frontend/src/components/features/dashboard/kpi-tiles.tsx`
- `frontend/src/components/features/dashboard/__tests__/kpi-tile.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/kpi-tiles.test.tsx`

**Modified Files (18)**
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts`
- `frontend/e2e/dashboard.spec.ts`
- `frontend/src/components/features/dashboard/__tests__/dashboard-content.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-lease.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-legend.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-month-selector.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-paid.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-sent.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic-tooltip.test.tsx`
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic.test.tsx`
- `frontend/src/components/features/dashboard/dashboard-content.tsx`
- `frontend/src/components/features/dashboard/unit-mosaic.tsx`
- `frontend/src/hooks/__tests__/use-rent-calls.test.ts`
- `frontend/src/hooks/use-payment-actions.ts`
- `frontend/src/hooks/use-record-manual-payment.ts`
- `frontend/src/hooks/use-rent-calls.ts`
- `frontend/src/lib/api/rent-calls-api.ts`
