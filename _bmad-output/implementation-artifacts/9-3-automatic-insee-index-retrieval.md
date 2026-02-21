# Story 9.3: Retrieve INSEE Indices from Official API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to retrieve INSEE indices (IRL/ILC/ICC) directly from the official API with a single click,
so that I don't need to manually look up and enter index values (FR47).

## Acceptance Criteria

1. **Given** I am on the revisions page, **When** I click "Récupérer les indices INSEE", **Then** the system fetches the latest IRL, ILC, and ICC values from the INSEE BDM SDMX API (`https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idBank}`) and stores only genuinely new indices (type+quarter+year not yet recorded for this entity) as `IndexRecorded` events with the same validation as manual entry (FR43 — IndexType, IndexQuarter, IndexYear, IndexValue VOs).
2. **And** a summary is displayed: "X nouveaux indices enregistrés, Y déjà présents".
3. **And** the source of each index is tracked: `source: "manual" | "auto"` field added to `IndexRecorded` event and Prisma read model (backward-compatible — existing events default to `"manual"`).
4. **And** auto-retrieved indices are displayed with a badge "Auto" (blue) to distinguish from manual entries ("Manuel", gray) on the existing INSEE index list.
5. **And** if retrieval fails (network error, API down, XML parse error), an inline error message is shown: "Le service INSEE est temporairement indisponible. Saisissez les indices manuellement."
6. **And** only definitive values (`OBS_QUAL="DEF"`) are stored — provisional values are ignored.

## Tasks / Subtasks

- [x] Task 1 — Create InseeApiService infrastructure adapter (AC: #1, #5, #6)
  - [x] 1.1 Install `fast-xml-parser` dependency in backend (`npm install fast-xml-parser`)
  - [x] 1.2 Create `backend/src/infrastructure/insee/insee.module.ts` as `@Global()` module
  - [x] 1.3 Create `backend/src/infrastructure/insee/insee-api.service.ts` — concrete service (YAGNI, no interface)
  - [x] 1.4 Implement `fetchLatestIndices(): Promise<InseeIndexResult[]>` — calls BDM API with `lastNObservations=4` for all 3 series in one request, parses XML
  - [x] 1.5 Implement `InseeIndexResult` interface: `{ type: string, quarter: string, year: number, value: number, publishedAt: string }`
  - [x] 1.6 XML parsing: use `fast-xml-parser` with `{ ignoreAttributes: false, attributeNamePrefix: '' }` — extract `TIME_PERIOD` → quarter/year, `OBS_VALUE` → value from `<Obs>` elements
  - [x] 1.7 Map `TIME_PERIOD` format `YYYY-QN` to project's `quarter: "Q1"|"Q2"|"Q3"|"Q4"` and `year: number`
  - [x] 1.8 Filter: only keep observations where `OBS_QUAL === "DEF"` (definitive), discard `"P"` (provisional)
  - [x] 1.9 Error handling: catch network errors, parse errors, unexpected XML structure — throw `InseeApiUnavailableException` (extends `DomainException`)
  - [x] 1.10 Unit tests: mock `fetch()` response with real XML fixture, test parsing, test `OBS_QUAL` filtering, test error cases

- [x] Task 2 — Add `source` field to domain events and Prisma model (AC: #3)
  - [x] 2.1 Extend `IndexRecorded` event data with `source: string` (default `"manual"` for backward compatibility)
  - [x] 2.2 Extend `InseeIndexAggregate.record()` to accept `source` parameter (default `"manual"`)
  - [x] 2.3 Extend `RecordAnInseeIndexCommand` with `source: string` field (default `"manual"`)
  - [x] 2.4 Extend `RecordAnInseeIndexHandler` to pass `source` through
  - [x] 2.5 Add `source String @default("manual")` to `InseeIndex` Prisma model
  - [x] 2.6 Create Prisma migration
  - [x] 2.7 Extend `InseeIndexProjection` to store `source` from event (fallback `"manual"` for old events without field)
  - [x] 2.8 Extend `GetInseeIndicesHandler` query response to include `source`
  - [x] 2.9 Update existing aggregate tests, handler tests, projection tests for new field
  - [x] 2.10 Verify backward compatibility: replay existing `IndexRecorded` events without `source` field → projection uses `"manual"` default

- [x] Task 3 — Create fetch controller (AC: #1, #2)
  - [x] 3.1 Create `FetchInseeIndicesController` at `POST /api/entities/:entityId/insee-indices/fetch`
  - [x] 3.2 Verify entity ownership (same pattern as `RecordAnInseeIndexController`)
  - [x] 3.3 Call `InseeApiService.fetchLatestIndices()` → for each result, check `InseeIndexFinder.existsByTypeQuarterYearEntity()` → dispatch `RecordAnInseeIndexCommand` per new index with `source: "auto"`, server-side UUID
  - [x] 3.4 Return `{ fetched: number, newIndices: number, skipped: number }` summary
  - [x] 3.5 Error handling: catch `InseeApiUnavailableException` → return `503 Service Unavailable` with message
  - [x] 3.6 Add controller + handler to `InseeIndexPresentationModule`
  - [x] 3.7 Unit tests for controller

- [x] Task 4 — Frontend: source badge and fetch button (AC: #2, #4, #5)
  - [x] 4.1 Extend `InseeIndexData` interface in `insee-indices-api.ts` with `source: string` field
  - [x] 4.2 Add `fetchInseeIndices(entityId)` method to `useInseeIndicesApi()` — calls `POST /api/entities/:entityId/insee-indices/fetch`
  - [x] 4.3 Create `useFetchInseeIndices(entityId)` mutation hook in `use-insee-indices.ts` — invalidates `["entities", entityId, "insee-indices"]` on success
  - [x] 4.4 Create `InseeSourceBadge` component — renders "Auto" badge (`bg-blue-100 text-blue-800`) or "Manuel" badge (`bg-gray-100 text-gray-800`)
  - [x] 4.5 Extend `InseeIndexList` component to display `InseeSourceBadge` next to each index value
  - [x] 4.6 Add "Récupérer les indices INSEE" button on the revisions page (next to "Calculer les révisions" button)
  - [x] 4.7 Button shows `Loader2` spinner while fetching; on success show result summary inline; on error (503) show error message
  - [x] 4.8 Vitest tests: InseeSourceBadge rendering, fetch button interaction (success + error states), InseeIndexList with source badges

- [x] Task 5 — E2E tests (AC: all)
  - [x] 5.1 E2E test: click "Récupérer les indices INSEE" button, verify result summary appears (real API call — INSEE BDM is open and stable)
  - [x] 5.2 E2E test: verify source badge display ("Auto") for fetched indices
  - [x] 5.3 Run full test suite: `cd backend && npm test` + `cd frontend && npm test` + `cd frontend && npx tsc --noEmit` + `cd backend && npx tsc --noEmit`

## Dev Notes

### INSEE BDM API — Technical Specification

**Endpoint (no auth required):**
```
https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idBank}?lastNObservations=N
```

**Series IDs (idBank):**
| Index | idBank | Decimals |
|-------|--------|----------|
| IRL | `001515333` | 2 |
| ILC | `001532540` | 2 |
| ICC | `000008630` | 0 |

**Multi-series in one request:**
```
https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/001515333+001532540+000008630?lastNObservations=4
```

**Response format: XML (SDMX 2.1)** — JSON NOT available. Parse with `fast-xml-parser`.

**Key XML structure:**
```xml
<Series IDBANK="001515333" TITLE_FR="Indice de reference des loyers (IRL)">
  <Obs TIME_PERIOD="2025-Q4" OBS_VALUE="145.78" OBS_QUAL="DEF" DATE_JO="2026-01-16"/>
  <Obs TIME_PERIOD="2025-Q3" OBS_VALUE="145.77" OBS_QUAL="DEF"/>
</Series>
```

**Parsing rules:**
- `TIME_PERIOD` → split on `-Q` → `year = parseInt(parts[0])`, `quarter = "Q" + parts[1]`
- `OBS_VALUE` → `parseFloat()` → validate with existing `IndexValue.create()` (50-500 range, max 3 decimals)
- `OBS_QUAL`: `DEF` = definitive, `P` = provisional — **only store `DEF` values**
- `IDBANK` → map: `001515333` → `IRL`, `001532540` → `ILC`, `000008630` → `ICC`

**Rate limiting:** 30 calls/minute/IP — more than sufficient for user-triggered fetches.

### Architecture Pattern: Infrastructure Service

Follow `OpenBankingModule` (Story 9.1) and `EmailModule` pattern:

```
backend/src/infrastructure/insee/
  insee.module.ts              # @Global() NestJS module
  insee-api.service.ts         # INSEE BDM API client (fetch + XML parse)
  __tests__/
    insee-api.service.spec.ts
```

**Key design decisions:**
- Concrete `InseeApiService` (YAGNI) — no interface extraction until second provider
- `@Global()` module — available to all BCs without explicit import
- No authentication needed (open API) — simpler than Bridge/AR24 patterns
- `fast-xml-parser` is the ONLY new dependency — no SDMX-specific npm packages
- **No cron / no background job** — user-triggered only (indices change quarterly, a button click is simpler and sufficient)

### Existing Code to Reuse

- **`InseeIndexAggregate`** (`backend/src/indexation/insee-index/insee-index.aggregate.ts`) — extend `record()` with `source` parameter
- **`RecordAnInseeIndexCommand`** + handler — extend with `source` field
- **`InseeIndexFinder.existsByTypeQuarterYearEntity()`** — reuse for deduplication in controller
- **`InseeIndexProjection`** — extend to store `source`
- **`RecordAnInseeIndexController`** — reference for entity ownership + duplicate check patterns
- **`InseeIndexList`** component — extend to show source badge
- **`useRecordInseeIndex`** hook — reference for cache invalidation pattern (new fetch hook is simpler — no optimistic UI needed)

### Backward Compatibility: `source` Field

The `source` field is added as **backward-compatible extension** to the existing `IndexRecorded` event:
- Old events without `source` → projection uses `"manual"` (Prisma `@default("manual")` + projection fallback)
- New manual entries: `RecordAnInseeIndexController` continues to pass `source: "manual"` (default)
- API-retrieved entries: fetch controller passes `source: "auto"`
- Same pattern as Story 3.2 (insurance fields on TenantRegistered event)

### Project Structure Notes

- No new BC or path alias needed — extends existing `@indexation/*` and `@infrastructure/*`
- `InseeModule` is `@Global()` in `infrastructure/` — follows `EmailModule`, `OpenBankingModule`, `RegisteredMailModule` pattern
- Controller for fetch goes in `presentation/insee-index/controllers/` (existing module)
- No `.env` variable needed — API is open, no cron to configure

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9, Story 9.3] — ACs and user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Indexation-BC] — InseeIndexAggregate, IndexCalculatorService
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure-Services] — @Global() module pattern
- [Source: docs/project-context.md#CQRS-Patterns] — event sourcing, projection, aggregate
- [Source: backend/src/indexation/insee-index/] — existing aggregate, VOs, events
- [Source: backend/src/presentation/insee-index/] — existing controllers, finders, projection
- [Source: backend/src/infrastructure/open-banking/bridge.service.ts] — external API integration pattern
- [Source: frontend/src/hooks/use-insee-indices.ts] — existing hooks to extend
- [Source: frontend/src/lib/api/insee-indices-api.ts] — existing API client to extend
- [Source: INSEE BDM API — https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/] — open SDMX endpoint
- [Source: api.gouv.fr — https://api.gouv.fr/les-api/api_bdm] — rate limits (30/min), documentation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Private constructor `InseeApiUnavailableException` incompatible with Jest `toThrow(ClassName)` — changed to string matching `toThrow('Le service INSEE')` (known pattern from Story 3.3)
- `--testPathPattern` flag deprecated in Jest 30 → used `--testPathPatterns` (plural)
- `vitest run` from project root inadvertently ran backend files through vitest → must run from `frontend/` directory

### Completion Notes List

- All 5 tasks completed (13 + 8 + 6 + 9 + 2 subtasks = 38 subtasks)
- Backend: 1759 tests passing (259 suites) — 19 new tests (13 InseeApiService + 6 FetchInseeIndicesController) + updated existing tests
- Frontend: 937 tests passing (119 suites) — 6 new tests (3 InseeSourceBadge + 3 useFetchInseeIndices) + updated existing tests
- TypeScript compiles clean on both backend and frontend
- Backward compatibility verified: old IndexRecorded events without `source` field → projection defaults to "manual"
- `fast-xml-parser` is the only new dependency
- No new BC or path alias — extends existing `@indexation/*` and `@infrastructure/*`

### File List

**New files (10):**
- `backend/src/infrastructure/insee/insee.module.ts`
- `backend/src/infrastructure/insee/insee-api.service.ts`
- `backend/src/infrastructure/insee/insee-api-unavailable.exception.ts`
- `backend/src/infrastructure/insee/__tests__/insee-api.service.spec.ts`
- `backend/src/presentation/insee-index/controllers/fetch-insee-indices.controller.ts`
- `backend/src/presentation/insee-index/__tests__/fetch-insee-indices.controller.spec.ts`
- `backend/prisma/migrations/20260221163536_add_source_to_insee_index/migration.sql`
- `frontend/src/components/features/indices/insee-source-badge.tsx`
- `frontend/src/components/features/indices/__tests__/insee-source-badge.test.tsx`
- `frontend/src/hooks/__tests__/use-fetch-insee-indices.test.ts`

**Modified files (21):**
- `backend/package.json` (fast-xml-parser dependency)
- `backend/package-lock.json` (lockfile)
- `backend/prisma/schema.prisma` (source field on InseeIndex)
- `backend/src/app.module.ts` (InseeModule import)
- `backend/src/indexation/insee-index/events/index-recorded.event.ts` (source field)
- `backend/src/indexation/insee-index/insee-index.aggregate.ts` (source parameter)
- `backend/src/indexation/insee-index/commands/record-an-insee-index.command.ts` (source field)
- `backend/src/indexation/insee-index/commands/record-an-insee-index.handler.ts` (source passthrough)
- `backend/src/presentation/insee-index/insee-index-presentation.module.ts` (FetchInseeIndicesController)
- `backend/src/presentation/insee-index/projections/insee-index.projection.ts` (source field + fallback)
- `backend/src/indexation/insee-index/__tests__/insee-index.aggregate.spec.ts` (source tests)
- `backend/src/indexation/insee-index/__tests__/record-an-insee-index.handler.spec.ts` (source tests)
- `backend/src/presentation/insee-index/__tests__/insee-index.projection.spec.ts` (source tests)
- `frontend/src/lib/api/insee-indices-api.ts` (source field + fetchInseeIndices)
- `frontend/src/hooks/use-insee-indices.ts` (useFetchInseeIndices + source in optimistic update)
- `frontend/src/components/features/indices/insee-index-list.tsx` (Source column + badges)
- `frontend/src/app/(auth)/indices/page.tsx` (fetch button + summary/error display)
- `frontend/e2e/indices.spec.ts` (2 E2E tests)
- `frontend/src/components/features/indices/__tests__/indices-page.test.tsx` (source fixtures + fetch button tests)
- `frontend/src/components/features/indices/__tests__/insee-index-list.test.tsx` (source fixtures + badge tests)
- `frontend/src/hooks/__tests__/use-record-insee-index.test.ts` (fetchInseeIndices mock)

## Change Log

| Change | Reason |
|--------|--------|
| Added `fast-xml-parser` dependency | INSEE BDM API returns XML (SDMX format), no JSON endpoint available |
| Created `InseeModule` as @Global() | Infrastructure service pattern (follows EmailModule, OpenBankingModule) |
| Added `source` field to IndexRecorded event | Track manual vs auto entries (AC #3), backward-compatible with default "manual" |
| Added `source` column to InseeIndex Prisma model | Persist source in read model with `@default("manual")` for existing data |
| Created FetchInseeIndicesController | POST endpoint for fetching indices with deduplication (AC #1, #2) |
| Created InseeSourceBadge component | Visual distinction between auto (blue) and manual (gray) entries (AC #4) |
| Extended InseeIndexList with Source column | Display source badges in index table (AC #4) |
| Added fetch button to indices page | One-click retrieval with spinner, summary, and error display (AC #1, #2, #5) |
| **Review fix H1**: Added 15s AbortController timeout to INSEE API fetch | Prevent hanging requests if INSEE API is unresponsive |
| **Review fix H2**: Added 5 tests to indices-page.test.tsx | Fetch button presence, success/error/empty message rendering (AC #1, #2, #5) |
| **Review fix M1**: Added `role="status"` + `aria-live="polite"` to fetch message | Screen reader accessibility for dynamic result/error messages |
| **Review fix M2**: Removed unnecessary `"use client"` from InseeSourceBadge | Pure render component, no client hooks needed |
| **Review fix M3**: Better UX message when 0 indices fetched | "Aucun indice disponible" instead of "0 nouveaux, 0 déjà présents" |
| **Review fix M4**: Auto-clear success message after 10s | Prevents stale success messages persisting indefinitely |
| **Review fix L1**: Typed `source` as `"manual" \| "auto"` union | Stricter typing on InseeIndexData and InseeSourceBadge props |
| **Review fix L2**: Removed defensive `?? "manual"` fallback in InseeIndexList | API guarantees source field via Prisma @default; dead code removed |
| **Review fix L3**: Merged "Modified test files" into "Modified files" | File List consistency with project conventions |

## Senior Developer Review (AI)

**Reviewer:** Monsieur on 2026-02-21
**Model:** Claude Opus 4.6

**Findings:** 2 High, 4 Medium, 3 Low — all fixed

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| H1 | HIGH | No timeout on `fetch()` to INSEE API — can hang indefinitely | Added AbortController with 15s timeout |
| H2 | HIGH | `indices-page.test.tsx` missing tests for fetch button + result/error messages | Added 5 tests covering AC #1, #2, #5 |
| M1 | MEDIUM | No `aria-live` on fetch result/error message | Added `role="status"` + `aria-live="polite"` |
| M2 | MEDIUM | `InseeSourceBadge` has unnecessary `"use client"` directive | Removed — pure render component |
| M3 | MEDIUM | Poor UX when API returns 0 indices (shows "0 nouveaux, 0 déjà présents") | Added distinct message for empty response |
| M4 | MEDIUM | Success message persists indefinitely | Auto-clear after 10s via setTimeout + useRef cleanup |
| L1 | LOW | `source` typed as `string` instead of union `"manual" \| "auto"` | Typed correctly in InseeIndexData + InseeSourceBadge |
| L2 | LOW | Defensive `?? "manual"` fallback in InseeIndexList is dead code | Removed — API guarantees field |
| L3 | LOW | File List separates "Modified test files" from "Modified files" | Merged into single "Modified files" section |
