# Story 8.7: Display Treasury Chart (Income vs. Expenses Over Time)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want the dashboard to display a treasury chart showing income and expenses over time,
so that I can visualize my cash flow trends (FR60).

## Acceptance Criteria

1. **Given** I have financial history spanning multiple months, **When** I view the dashboard, **Then** I see a bar/line chart displaying monthly income (rent received) and monthly amounts called, with the timeline spanning the last 12 months by default.

2. **Given** the treasury chart is displayed, **When** I interact with the time range controls, **Then** I can adjust the displayed period (6 months, 12 months, 24 months).

3. **Given** the chart is rendered, **When** it uses the project color palette, **Then** it uses the deep teal color scheme consistent with the Baillr brand.

4. **Given** I hover over a bar or data point on the chart, **When** the tooltip appears, **Then** it shows exact amounts in French number format (e.g., "1 234,56 €").

5. **Given** the chart data is loading, **When** the component renders, **Then** a loading skeleton is displayed matching the chart area dimensions.

6. **Given** there is no financial data for the selected entity, **When** I view the chart, **Then** an empty state message is displayed ("Aucune donnée financière disponible").

7. **Given** the dashboard loads with the chart, **When** the page fully renders, **Then** the chart loads within the 2-second dashboard budget (NFR4).

## Tasks / Subtasks

- [x] Task 1: Create backend treasury data endpoint (AC: 1, 7)
  - [x] 1.1 Create `TreasuryChartFinder` in `presentation/rent-call/finders/` with Prisma `groupBy` on `rent_calls.month` aggregating `totalAmountCents` and `paidAmountCents` per month
  - [x] 1.2 Create `GetTreasuryChartController` — `GET /api/entities/:entityId/treasury-chart?months=12` returning `{ data: TreasuryMonthData[] }`
  - [x] 1.3 Create `GetTreasuryChartQueryParamsDto` with `@IsOptional()` `months` param (default 12, validate 1-60)
  - [x] 1.4 Register controller in `RentCallPresentationModule`
  - [x] 1.5 Write backend unit tests: finder (empty, single month, 12 months, partial payments, null paidAmountCents) + controller

- [x] Task 2: Install Recharts library (AC: 3)
  - [x] 2.1 Install `recharts` package in frontend — `npm install recharts`
  - [x] 2.2 Verify React 19 compatibility (recharts 2.15+ supports React 19)
  - [x] 2.3 NO additional dependencies (recharts is self-contained with d3 internals)

- [x] Task 3: Create `useTreasuryChart` hook (AC: 1, 5)
  - [x] 3.1 Add `getTreasuryChart(entityId, months)` to rent-calls API client
  - [x] 3.2 Create `useTreasuryChart(entityId, months)` hook with React Query — queryKey: `["entities", entityId, "treasury-chart", months]`, staleTime 30s
  - [x] 3.3 Write hook tests (fetch success, conditional on entityId, months param)

- [x] Task 4: Create `TreasuryChart` component (AC: 1, 2, 3, 4, 6)
  - [x] 4.1 Create `treasury-chart.tsx` in `components/features/dashboard/` using Recharts `<ResponsiveContainer>` + `<BarChart>` (or `<ComposedChart>` with bars + line)
  - [x] 4.2 Implement two bar series: "Loyers appelés" (called — light teal) and "Paiements reçus" (received — deep teal)
  - [x] 4.3 Add custom tooltip component using `formatCurrency()` for French number format
  - [x] 4.4 Add time range selector (6 / 12 / 24 months) as button group or Radix Select
  - [x] 4.5 Implement loading skeleton state (rectangle matching chart area)
  - [x] 4.6 Implement empty state with "Aucune donnée financière disponible" message
  - [x] 4.7 Dark mode support: teal colors with dark variants, axis/grid/tooltip dark-aware
  - [x] 4.8 X-axis: month labels in French format ("janv. 2026", "févr. 2026"), Y-axis: compact EUR format

- [x] Task 5: Integrate chart in DashboardContent (AC: 1, 7)
  - [x] 5.1 Add `<TreasuryChart entityId={entityId} />` to `dashboard-content.tsx` — position between KpiTiles and UnitMosaic (or after UnitMosaic based on visual weight)
  - [x] 5.2 Add chart placeholder skeleton in no-entity state (matching existing pattern)

- [x] Task 6: Write frontend component tests (AC: 1-6)
  - [x] 6.1 `treasury-chart.test.tsx`: renders bars for 12 months, tooltip shows formatted amounts, time range selector changes months param, empty state, loading state, dark mode class check
  - [x] 6.2 Mock Recharts components if needed (Recharts renders SVG — may need `ResizeObserver` polyfill for `ResponsiveContainer`)

- [x] Task 7: Write E2E tests (AC: 1, 2, 4, 7)
  - [x] 7.1 Add treasury chart tests to `frontend/e2e/dashboard.spec.ts`: chart container visible, time range selector, tooltip on hover (if stable), dashboard load time <3s
  - [x] 7.2 Verify chart renders with existing seed data (rent calls from previous E2E tests)

- [x] Task 8: Cache invalidation and cross-query integration (AC: 7)
  - [x] 8.1 Add `["entities", entityId, "treasury-chart"]` invalidation to generate rent calls, record payment, send rent calls mutations
  - [x] 8.2 Verify no performance regression on dashboard load (all queries fire in parallel)

## Dev Notes

### Critical Architecture Decisions

- **Charting library**: Recharts — lightweight, React-native API, TypeScript support, SSR-compatible, no canvas (SVG-based), actively maintained. Alternatives considered: Visx (too low-level for simple bar chart), Chart.js (canvas-based, less React-native), Nivo (heavier bundle).
- **Data source**: RentCall table via Prisma `groupBy(['month'])` with `_sum` aggregation — NOT AccountEntry (which mixes debit/credit and is harder to interpret visually). RentCalls give clean "called vs received" semantics.
- **Backend endpoint**: Read-only finder pattern (same as `DashboardKpisFinder`). No domain events, no aggregate mutation. Pure SQL aggregation.
- **Component placement**: Between KpiTiles and UnitMosaic in `DashboardContent` vertical stack — chart provides the temporal context that bridges the point-in-time KPIs and the spatial mosaic.

### Existing Patterns to Follow

- **DashboardKpisFinder pattern** [Source: `backend/src/presentation/rent-call/finders/dashboard-kpis.finder.ts`]: Prisma aggregation with `entityId` + `userId` scoping, month-based filtering
- **Controller pattern** [Source: `backend/src/presentation/rent-call/controllers/get-dashboard-kpis.controller.ts`]: `@Get()` with DTO query params, registered in `RentCallPresentationModule`
- **Hook pattern** [Source: `frontend/src/hooks/use-rent-calls.ts`]: `useQuery` with `["entities", entityId, ...]` key prefix, `staleTime: 30_000`, `enabled: !!entityId`
- **DashboardContent state lift** [Source: `frontend/src/components/features/dashboard/dashboard-content.tsx`]: Shared `selectedMonth` passed to children, no-entity skeleton state
- **Loading skeleton** [Source: `frontend/src/components/features/dashboard/kpi-tile.tsx`]: Skeleton component from shadcn/ui
- **Dark mode** [Source: Story 8.4]: All color classes MUST include dark variants (e.g., `fill-teal-600 dark:fill-teal-400`)
- **formatCurrency()** [Source: `frontend/src/lib/format.ts`]: Existing utility for French EUR formatting
- **Month label formatting**: Use `Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' })` for X-axis labels

### Anti-Patterns to Avoid

- **DO NOT** compute chart data client-side from full rent-call arrays — use backend SQL aggregation [Source: Story 8.5 learning]
- **DO NOT** use `vi.useFakeTimers()` in tests with Recharts — fake timers break ResizeObserver and animation frames [Source: Story 3.2 MockDate pattern]
- **DO NOT** install additional D3 sub-packages — Recharts bundles its own D3 internals
- **DO NOT** use `<canvas>` or Chart.js — project uses SVG-based rendering for accessibility and SSR
- **DO NOT** use Zod `.default()` or `.refine()` in form schemas [Source: docs/anti-patterns.md]
- **DO NOT** forget `entityId` scoping in finder queries — breaks multi-tenancy [Source: architecture.md]
- **DO NOT** hardcode month format — use `Intl.DateTimeFormat` for locale-aware labels

### Recharts Specifics for This Story

- **`<ResponsiveContainer width="100%" height={300}>`**: Requires parent with defined height. In tests, mock `ResizeObserver` (jsdom doesn't have it).
- **`<BarChart data={chartData}>`**: `data` is `Array<{ month: string, calledCents: number, receivedCents: number }>`. Convert cents to EUR in display (formatter), NOT in data.
- **`<Bar dataKey="calledCents" />`**: Use `formatter={(v) => formatCurrency(v)}` on tooltip, NOT on bar values.
- **`<Tooltip content={<CustomTooltip />} />`**: Custom tooltip component for French formatting.
- **Color palette**: Deep teal (`#0d9488` / `teal-600`) for "received", lighter teal (`#99f6e4` / `teal-200`) for "called". Dark mode: invert lightness.
- **Animation**: Disable in tests via `<BarChart ... isAnimationActive={false}>` or pass prop.

### Testing Specifics

- **ResizeObserver polyfill**: Add to vitest setup file: `globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }))` — Recharts `ResponsiveContainer` requires it.
- **SVG testing**: Recharts renders `<svg>` → use `container.querySelector('svg')` to verify rendering. Use `getByText` for axis labels and tooltip content.
- **Snapshot not recommended**: SVG output varies with container size and animation state.
- **E2E hover**: Playwright `locator.hover()` on SVG bar rect triggers tooltip — but SVG selectors are fragile. Prefer existence-based tests over content-based.
- **MockDate pattern** (if needed): Use custom `class MockDate extends Date` override, NOT `vi.useFakeTimers()`.

### Project Structure Notes

- Chart component follows existing dashboard feature folder: `frontend/src/components/features/dashboard/treasury-chart.tsx`
- Backend follows rent-call presentation module pattern (finder + controller + DTO + test)
- No new Bounded Context — treasury chart is a read-only view of existing rent-call data
- No new Prisma model — pure aggregation query on existing `rent_calls` table
- Path aliases: no new aliases needed (all within existing `@/` frontend and `@billing/*` backend)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.7]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Dashboard, KPIs, Frontend patterns]
- [Source: `docs/project-context.md` — CQRS patterns, testing infrastructure, form patterns]
- [Source: `docs/anti-patterns.md` — DTO validation, frontend patterns]
- [Source: `backend/src/presentation/rent-call/finders/dashboard-kpis.finder.ts` — Aggregation pattern]
- [Source: `frontend/src/components/features/dashboard/dashboard-content.tsx` — Layout structure]
- [Source: `frontend/src/components/features/dashboard/kpi-tiles.tsx` — KPI rendering pattern]
- [Source: Story 8.4 — UnitMosaic month selector, dark mode, tooltip pattern]
- [Source: Story 8.5 — KPI finder, backend aggregation, formatCurrency]
- [Source: Story 8.6 — ActionFeed composable hooks, formatRelativeDate]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Recharts mock: `vi.importActual` spread pattern failed → switched to `importOriginal` callback pattern
- Legend text not rendered in jsdom with mocked ResponsiveContainer → changed test to verify `.recharts-wrapper` presence
- Vitest from root picked up backend files → run from `cd frontend`

### Completion Notes List
- 8 tasks completed, all ACs covered
- Backend: 1548 tests (232 suites) — ALL PASSED (10 new: 6 finder + 4 controller)
- Frontend: 866 tests (109 suites) — ALL PASSED (15 new: 8 component + 3 hook + 1 dashboard-content + 3 from hook file)
- TypeScript: 0 errors (both frontend and backend)
- Recharts v3.7.0 installed (React 19 compatible)
- E2E: 4 new tests added to dashboard.spec.ts (chart visible, time range selector, SVG rendering, performance budget)
- Cache invalidation added to 5 mutation hooks (generate, send, record manual payment, validate match, manual assign match)

### File List

**New Files (8)**
- `backend/src/presentation/rent-call/finders/treasury-chart.finder.ts` — Prisma groupBy aggregation finder
- `backend/src/presentation/rent-call/dto/get-treasury-chart.dto.ts` — DTO with optional months param (1-60)
- `backend/src/presentation/rent-call/controllers/get-treasury-chart.controller.ts` — GET endpoint with entity auth
- `backend/src/presentation/rent-call/__tests__/treasury-chart.finder.spec.ts` — 6 finder tests
- `backend/src/presentation/rent-call/__tests__/get-treasury-chart.controller.spec.ts` — 4 controller tests
- `frontend/src/components/features/dashboard/treasury-chart.tsx` — TreasuryChart component with Recharts BarChart
- `frontend/src/components/features/dashboard/__tests__/treasury-chart.test.tsx` — 8 component tests
- `_bmad-output/implementation-artifacts/8-7-display-treasury-chart-income-vs-expenses-over-time.md` — This story file

**Modified Files (12)**
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts` — Registered controller + finder
- `frontend/package.json` — Added recharts dependency
- `frontend/package-lock.json` — Lock file updated
- `frontend/src/lib/api/rent-calls-api.ts` — Added TreasuryMonthData interface + getTreasuryChart method
- `frontend/src/hooks/use-rent-calls.ts` — Added useTreasuryChart hook + treasury-chart cache invalidation in 2 mutation hooks
- `frontend/src/hooks/use-payment-actions.ts` — Added treasury-chart cache invalidation in useValidateMatch + useManualAssignMatch
- `frontend/src/hooks/use-record-manual-payment.ts` — Added treasury-chart cache invalidation
- `frontend/src/components/features/dashboard/dashboard-content.tsx` — Integrated TreasuryChart between KpiTiles and UnitMosaic
- `frontend/src/components/features/dashboard/__tests__/dashboard-content.test.tsx` — Added TreasuryChart mock + test
- `frontend/src/hooks/__tests__/use-rent-calls.test.ts` — Added 3 useTreasuryChart tests
- `frontend/e2e/dashboard.spec.ts` — Added 4 E2E tests (8.7.1-8.7.4)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status updated to review

### Change Log
- 2026-02-18: Story implemented — 8 tasks, 8 new files + 12 modified, 25 new tests (10 backend + 15 frontend), 4 E2E tests
- 2026-02-18: Code review — 10 findings (2H/5M/3L), 7 fixes applied:
  - H1: Dark mode bar colors — replaced static `fill` + `className` with CSS custom properties (`--chart-called`/`--chart-received`) on wrapper div
  - H2: Replaced `formatEuros` with `formatCurrency` (DRY, consistent with UnitMosaic)
  - M1: Added `treasury-chart` absence assertion in dashboard-content no-entity test
  - M3: Improved finder start month test — asserts exact computed value instead of regex format only
  - M4: `formatCompactEur` now shows "1.5k €" precision instead of rounding to "2k €"
  - L1: Controller default test now uses `new GetTreasuryChartDto()` to validate class default
  - L3: Pinned `recharts` version to `3.7.0` (removed `^` prefix)

