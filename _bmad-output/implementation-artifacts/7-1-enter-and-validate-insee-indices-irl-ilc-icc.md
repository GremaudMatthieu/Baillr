# Story 7.1: Enter and Validate INSEE Indices (IRL/ILC/ICC)

Status: done

## Story

As a bailleur,
I want to enter INSEE indices (IRL, ILC, ICC) with their quarter and year,
so that the system can calculate rent revisions with official reference values.

## Acceptance Criteria

1. **Given** I navigate to the index management page, **When** I enter an INSEE index, **Then** I can specify: index type (IRL/ILC/ICC), quarter (Q1/Q2/Q3/Q4), year, and value.
2. **Given** I submit an index entry, **When** the value is invalid (non-positive, non-numeric, or outside plausible range relative to previous quarter), **Then** a clear error message is displayed.
3. **Given** I submit a valid index entry, **When** the system processes it, **Then** the event `IndexRecorded` is stored in KurrentDB.
4. **Given** an index has been recorded, **Then** it is available for revision calculations across all leases using that index type and quarter.
5. **Given** I view the index management page, **Then** I see a list of all recorded indices organized by type and chronological order.
6. **Given** I try to enter a duplicate index (same type + quarter + year), **Then** the system prevents the duplicate and informs me.

## Tasks / Subtasks

- [x] Task 1 — Create Indexation bounded context with InseeIndexAggregate (AC: #3, #6)
  - [x] 1.1 Create `backend/src/indexation/` directory and IndexationModule
  - [x] 1.2 Add `@indexation/*` path alias to tsconfig.json, Jest moduleNameMapper, webpack.config.js
  - [x] 1.3 Create InseeIndexAggregate with `record()` method and domain state
  - [x] 1.4 Create Value Objects: IndexType, IndexQuarter, IndexYear, IndexValue
  - [x] 1.5 Create IndexRecorded domain event
  - [x] 1.6 Create named exceptions: InvalidIndexTypeException, InvalidIndexQuarterException, InvalidIndexYearException, InvalidIndexValueException, DuplicateIndexException
  - [x] 1.7 Register IndexationModule in app.module.ts
- [x] Task 2 — Create RecordAnInseeIndex command and handler (AC: #3)
  - [x] 2.1 Create RecordAnInseeIndexCommand with all fields
  - [x] 2.2 Create RecordAnInseeIndexHandler (load aggregate, call record, save)
- [x] Task 3 — Create Prisma model and projection (AC: #4, #5)
  - [x] 3.1 Add `insee_indices` table to Prisma schema with @@unique([type, quarter, year, entityId])
  - [x] 3.2 Run prisma generate
  - [x] 3.3 Create InseeIndexProjection (catch-up subscription → Prisma create with idempotent skip)
- [x] Task 4 — Create presentation layer (AC: #1, #2, #5, #6)
  - [x] 4.1 Create RecordAnInseeIndexController (POST /api/entities/:entityId/insee-indices)
  - [x] 4.2 Create RecordAnInseeIndexDto with class-validator decorators
  - [x] 4.3 Create GetInseeIndicesController (GET /api/entities/:entityId/insee-indices)
  - [x] 4.4 Create InseeIndexFinder with findAllByEntityAndUser, existsByTypeQuarterYearEntity
  - [x] 4.5 Create InseeIndexPresentationModule, register in app.module.ts
- [x] Task 5 — Backend tests (AC: all)
  - [x] 5.1 Unit tests for all VOs (IndexType, IndexQuarter, IndexYear, IndexValue)
  - [x] 5.2 Unit tests for InseeIndexAggregate (record, duplicate guard, validation)
  - [x] 5.3 Unit tests for RecordAnInseeIndexHandler
  - [x] 5.4 Unit tests for InseeIndexProjection
  - [x] 5.5 Unit tests for RecordAnInseeIndexController
  - [x] 5.6 Unit tests for GetInseeIndicesController
  - [x] 5.7 Unit tests for RecordAnInseeIndexDto validation
- [x] Task 6 — Frontend: index management page and form (AC: #1, #2, #5)
  - [x] 6.1 Create route `frontend/src/app/(auth)/indices/page.tsx`
  - [x] 6.2 Create InseeIndexForm component with Zod schema + react-hook-form
  - [x] 6.3 Create InseeIndexList component (table grouped by type, sorted by year+quarter desc)
  - [x] 6.4 Create API hooks: useInseeIndices, useRecordInseeIndex (with optimistic update)
  - [x] 6.5 Create API client functions: getInseeIndices, recordInseeIndex
  - [x] 6.6 Add navigation link in sidebar (TrendingUp icon, "Indices" label)
- [x] Task 7 — Frontend tests (AC: #1, #2, #5)
  - [x] 7.1 Unit tests for InseeIndexForm (rendering, validation, states, attributes)
  - [x] 7.2 Unit tests for InseeIndexList (rendering, grouping, sorting, empty state)
  - [x] 7.3 Unit tests for useRecordInseeIndex hook (API call, optimistic update, rollback)
  - [x] 7.4 Unit tests for indices page (no-entity state, form card, list card)
- [x] Task 8 — E2E tests (AC: #1, #3, #5)
  - [x] 8.1 E2E: seed entity, navigate to indices page, record an IRL index, verify in list
  - [x] 8.2 E2E: sidebar navigation includes Indices link

## Dev Notes

### New Bounded Context: Indexation

This is the **5th bounded context** (after Portfolio, Tenancy, Billing, Recovery). Per the architecture document, the `indexation/` BC houses Revision and Charge aggregates. Story 7.1 introduces the first aggregate in this BC: **InseeIndexAggregate**.

**BC Setup Checklist** (same pattern as Tenancy in 3.1, Billing in 4.1, Recovery in 6.2):
1. Create `backend/src/indexation/insee-index/` directory structure
2. Add path alias `@indexation/*` in:
   - `backend/tsconfig.json` → `paths`
   - `backend/package.json` → `jest.moduleNameMapper`
   - `backend/webpack.config.js` → `resolve.alias`
3. Create `IndexationModule` (NestJS module) and register in `app.module.ts`

### InseeIndexAggregate Design

**Stream**: `insee-index-{id}` where id is a UUID generated frontend-side.

**State**:
- `type: IndexType` (IRL | ILC | ICC)
- `quarter: IndexQuarter` (Q1 | Q2 | Q3 | Q4)
- `year: IndexYear` (2000-2100)
- `value: IndexValue` (positive decimal, max 3 decimal places)
- `entityId: string`
- `recordedAt: Date`

**Static Factory**: `InseeIndexAggregate.record(id, type, quarter, year, value, entityId)` — validates all VOs, emits `IndexRecorded` event.

**Idempotency**: The `@@unique([type, quarter, year, entityId])` constraint in Prisma prevents duplicate read-model entries. Additionally, the controller should pre-check via the finder before dispatching the command (same pattern as RentCallAggregate in Story 4.1).

**IMPORTANT**: No update or delete operations on indices — once recorded, an index is immutable. If a correction is needed, a future story could add a `CorrectedIndexRecorded` event, but this is NOT in scope for 7.1.

**ActionFeed**: No ActionFeed integration for Story 7.1 (index recording is a standalone action). Story 7.2 will add an ActionFeed step for "indices manquants pour révisions en attente" — this is out of scope here.

### Value Objects

| VO | File | Type | Validation | Pattern |
|----|------|------|------------|---------|
| `IndexType` | `index-type.ts` | string enum | IRL \| ILC \| ICC | Same as RevisionIndexType |
| `IndexQuarter` | `index-quarter.ts` | string enum | Q1 \| Q2 \| Q3 \| Q4 | Same as ReferenceQuarter |
| `IndexYear` | `index-year.ts` | number | 2000-2100, integer | Same as ReferenceYear |
| `IndexValue` | `index-value.ts` | number | > 0, max 3 decimal places | Similar to BaseIndexValue but NOT nullable |

**Key difference from lease VOs**: IndexValue is NOT nullable (an index must have a value). BaseIndexValue supports null via Null Object pattern because leases can exist without a base index. IndexValue has no Null Object — it's always required.

**IndexType vs RevisionIndexType**: `IndexType` (in Indexation BC) and `RevisionIndexType` (in Tenancy BC) both validate IRL/ILC/ICC. Cross-BC import is forbidden per architecture rules — create a separate `IndexType` VO in `backend/src/indexation/insee-index/index-type.ts`. Same values, same validation logic, separate files. This is intentional duplication to respect BC boundaries.

**Plausibility validation** (AC #2): IndexValue should validate that the value is within a reasonable range for INSEE indices. Historical IRL values range roughly 100-145 (as of 2026). A reasonable guard: min 50, max 500. This prevents typos (e.g., entering 14200 instead of 142.00) while remaining flexible for future index growth.

### Prisma Schema

```prisma
model InseeIndex {
  id        String   @id
  type      String   // IRL, ILC, ICC
  quarter   String   // Q1, Q2, Q3, Q4
  year      Int
  value     Float    // Stored as decimal (e.g., 142.06)
  entityId  String   @map("entity_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([type, quarter, year, entityId])
  @@map("insee_indices")
}
```

**Note on Float**: INSEE index values are reference numbers (like 142.06), NOT monetary values. Float is acceptable here (same rationale as BaseIndexValue in Story 3.5). All monetary calculations in Story 7.2 will use integer cents.

**Note on entityId**: Indices are scoped per entity for multi-tenant isolation, even though the same IRL value applies nationally. This allows different entities to enter their own indices independently and prevents cross-entity data leakage.

### API Design

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/api/entities/:entityId/insee-indices` | Record a new index | 202 Accepted |
| GET | `/api/entities/:entityId/insee-indices` | List all indices (optional `?type=IRL` filter) | 200 { data: InseeIndex[] } |

**POST body** (RecordAnInseeIndexDto):
```json
{
  "id": "uuid-generated-frontend",
  "type": "IRL",
  "quarter": "Q1",
  "year": 2026,
  "value": 143.46
}
```

**DTO validation** (defense-in-depth per docs/dto-checklist.md):
- `id`: @IsString, @IsUUID
- `type`: @IsString, @MaxLength(3), @IsIn(['IRL', 'ILC', 'ICC'])
- `quarter`: @IsString, @MaxLength(2), @IsIn(['Q1', 'Q2', 'Q3', 'Q4'])
- `year`: @IsInt, @Min(2000), @Max(2100)
- `value`: @IsNumber, @Min(0.001), @Max(500)

### Frontend Design

**Route**: `/indices` → `frontend/src/app/(auth)/indices/page.tsx`

**No-entity state**: When no entity is selected (`useCurrentEntity()` returns null), display the standard "Créez une entité pour commencer" prompt with link to `/entities/new` (same pattern as properties page in Story 2.4, tenants page in Story 3.1, etc.). Do NOT render the form or list without an entity context.

**Page layout** (when entity is selected):
- Header: "Indices INSEE" with entity context
- Form section: Card with InseeIndexForm (type select, quarter select, year input, value input, submit button)
- List section: InseeIndexList table with columns: Type, Trimestre, Année, Valeur, Date d'enregistrement
- List is grouped by type (IRL section, ILC section, ICC section) and sorted by year desc, quarter desc within each group

**InseeIndexForm**:
- Index type: Select component (IRL/ILC/ICC) using REVISION_INDEX_TYPE_LABELS from existing constants
- Quarter: Select component (Q1-Q4) using REFERENCE_QUARTER_LABELS from existing constants
- Year: Number input (default: current year)
- Value: Number input (step="0.01", min="0.001", max="500")
- Submit button: "Enregistrer l'indice"

**Reuse existing constants**: `REVISION_INDEX_TYPE_LABELS` and `REFERENCE_QUARTER_LABELS` from `frontend/src/lib/constants/` — do NOT duplicate these constants.

**Sidebar navigation**: Add "Indices" entry with `TrendingUp` icon from lucide-react, positioned after "Rappels" (recovery) in the sidebar order.

### Optimistic Update Pattern

Follow the established pattern from all previous stories:
```typescript
onMutate: async (newIndex) => {
  await queryClient.cancelQueries({ queryKey: ['entities', entityId, 'insee-indices'] });
  const previous = queryClient.getQueryData(['entities', entityId, 'insee-indices']);
  queryClient.setQueryData(['entities', entityId, 'insee-indices'], (old) => [...(old || []), newIndex]);
  return { previous };
},
onError: (err, vars, context) => {
  queryClient.setQueryData(['entities', entityId, 'insee-indices'], context?.previous);
},
onSettled: () => {
  setTimeout(() => queryClient.invalidateQueries({ queryKey: ['entities', entityId, 'insee-indices'] }), 1500);
},
```

### Testing Standards

**Backend** (Jest):
- All VOs: valid creation, invalid creation (boundary values), equality
- Aggregate: record() happy path, duplicate guard (if implemented at aggregate level), VO validation propagation
- Handler: standard load-call-save test with mock aggregate repository
- Controller: DTO validation, finder calls, command dispatch
- Projection: event → Prisma upsert
- mock-cqrx.ts: copy from `backend/src/billing/rent-call/__tests__/mock-cqrx.ts` and adapt

**Frontend** (Vitest + @testing-library/react):
- Form: renders all fields, validates on submit, shows errors, calls mutation
- List: renders indices, groups by type, handles empty state
- Hook: optimistic update behavior
- Page: integration of form + list

**E2E** (Playwright):
- Happy path: create index → verify in list
- Duplicate: attempt same type+quarter+year → error feedback
- E2E idempotency: use serial mode with a seed test that creates entity via UI first (same pattern as Story 3.3 lease E2E). Each test run is independent — no reliance on previous E2E data.

### Project Structure Notes

**New files to create** (backend):
```
backend/src/indexation/
  indexation.module.ts
  insee-index/
    insee-index.aggregate.ts
    index-type.ts
    index-quarter.ts
    index-year.ts
    index-value.ts
    events/
      index-recorded.event.ts
    commands/
      record-an-insee-index.command.ts
      record-an-insee-index.handler.ts
    exceptions/
      invalid-index-type.exception.ts
      invalid-index-quarter.exception.ts
      invalid-index-year.exception.ts
      invalid-index-value.exception.ts
      duplicate-index.exception.ts
    __tests__/
      mock-cqrx.ts
      index-type.spec.ts
      index-quarter.spec.ts
      index-year.spec.ts
      index-value.spec.ts
      insee-index.aggregate.spec.ts
      record-an-insee-index.handler.spec.ts

backend/src/presentation/insee-index/
  insee-index-presentation.module.ts
  controllers/
    record-an-insee-index.controller.ts
    get-insee-indices.controller.ts
  dto/
    record-an-insee-index.dto.ts
  finders/
    insee-index.finder.ts
  projections/
    insee-index.projection.ts
  __tests__/
    record-an-insee-index.controller.spec.ts
    get-insee-indices.controller.spec.ts
    record-an-insee-index.dto.spec.ts
    insee-index.projection.spec.ts
```

**New files to create** (frontend):
```
frontend/src/app/(auth)/indices/
  page.tsx

frontend/src/components/features/indices/
  insee-index-form.tsx
  insee-index-form.test.tsx
  insee-index-list.tsx
  insee-index-list.test.tsx
  insee-index-schema.ts

frontend/src/hooks/
  use-insee-indices.ts
  use-insee-indices.test.ts

frontend/src/lib/api/
  insee-indices.ts
```

**Modified files**:
```
backend/tsconfig.json                          — add @indexation/* path alias
backend/package.json                           — add @indexation/* to Jest moduleNameMapper
backend/webpack.config.js                      — add @indexation/* to resolve.alias
backend/src/app.module.ts                      — register IndexationModule + InseeIndexPresentationModule
backend/prisma/schema.prisma                   — add InseeIndex model
frontend/src/components/layout/sidebar.tsx      — add "Indices" nav item
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7, Story 7.1] — acceptance criteria, FR42/FR43
- [Source: docs/project-context.md] — CQRS patterns, optimistic update, path alias setup
- [Source: docs/anti-patterns.md] — 40 anti-patterns to avoid
- [Source: docs/dto-checklist.md] — DTO validation requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Bounded Contexts] — Indexation BC definition
- [Source: backend/src/tenancy/lease/revision-index-type.ts] — existing IRL/ILC/ICC enum VO
- [Source: backend/src/tenancy/lease/reference-quarter.ts] — existing Q1-Q4 enum VO
- [Source: backend/src/tenancy/lease/base-index-value.ts] — Float pattern for index values
- [Source: _bmad-output/implementation-artifacts/3-5-configure-lease-revision-parameters.md] — revision parameters story (foundation)
- [Source: _bmad-output/implementation-artifacts/6-2-propose-3-tier-escalation-actions.md] — new BC setup pattern (Recovery)
- [Source: _bmad-output/implementation-artifacts/epic-5-retro-2026-02-14.md] — DTO defense-in-depth, Promise.all pattern

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- jsdom `input[type="number"]` + react-hook-form `valueAsNumber` incompatibility — jsdom `valueAsNumber` returns NaN for decimal values. Form submission tests adapted to test rendering/attributes instead of full submit flow (E2E covers submit).
- `uuid` package not in frontend deps — switched to `crypto.randomUUID()` (polyfilled in test setup).
- Jest flag `--testPathPattern` renamed to `--testPathPatterns` in Jest 30.

### Completion Notes List
- 8 tasks, all completed
- Backend: 1096 tests (148 suites) — all passing, 83 new tests (10 new suites)
- Frontend: 613 tests (80 suites) — all passing, 21 new tests (4 new suites)
- E2E: 5 new tests (1 suite)
- 5th bounded context (Indexation) created following Recovery/Billing BC patterns
- Reused REVISION_INDEX_TYPE_LABELS and REFERENCE_QUARTER_LABELS from existing constants
- InseeIndexAggregate is immutable (record-only, no update/delete)
- Duplicate prevention: @@unique([type, quarter, year, entityId]) in Prisma + controller pre-check via finder
- No ActionFeed integration (per story spec — deferred to Story 7.2)

### Change Log
- 2026-02-14: Story 7.1 implemented — 8 tasks, 42 new files + 6 modified
- 2026-02-14: Code review — 12 findings (3H/4M/3L), 10 fixes applied

### File List

**New files (backend — 28):**
- `backend/src/indexation/indexation.module.ts`
- `backend/src/indexation/insee-index/insee-index.aggregate.ts`
- `backend/src/indexation/insee-index/index-type.ts`
- `backend/src/indexation/insee-index/index-quarter.ts`
- `backend/src/indexation/insee-index/index-year.ts`
- `backend/src/indexation/insee-index/index-value.ts`
- `backend/src/indexation/insee-index/events/index-recorded.event.ts`
- `backend/src/indexation/insee-index/commands/record-an-insee-index.command.ts`
- `backend/src/indexation/insee-index/commands/record-an-insee-index.handler.ts`
- `backend/src/indexation/insee-index/exceptions/invalid-index-type.exception.ts`
- `backend/src/indexation/insee-index/exceptions/invalid-index-quarter.exception.ts`
- `backend/src/indexation/insee-index/exceptions/invalid-index-year.exception.ts`
- `backend/src/indexation/insee-index/exceptions/invalid-index-value.exception.ts`
- `backend/src/indexation/insee-index/__tests__/mock-cqrx.ts`
- `backend/src/indexation/insee-index/__tests__/index-type.spec.ts`
- `backend/src/indexation/insee-index/__tests__/index-quarter.spec.ts`
- `backend/src/indexation/insee-index/__tests__/index-year.spec.ts`
- `backend/src/indexation/insee-index/__tests__/index-value.spec.ts`
- `backend/src/indexation/insee-index/__tests__/insee-index.aggregate.spec.ts`
- `backend/src/indexation/insee-index/__tests__/record-an-insee-index.handler.spec.ts`
- `backend/src/presentation/insee-index/insee-index-presentation.module.ts`
- `backend/src/presentation/insee-index/controllers/record-an-insee-index.controller.ts`
- `backend/src/presentation/insee-index/controllers/get-insee-indices.controller.ts`
- `backend/src/presentation/insee-index/dto/record-an-insee-index.dto.ts`
- `backend/src/presentation/insee-index/finders/insee-index.finder.ts`
- `backend/src/presentation/insee-index/projections/insee-index.projection.ts`
- `backend/src/presentation/insee-index/__tests__/record-an-insee-index.controller.spec.ts`
- `backend/src/presentation/insee-index/__tests__/get-insee-indices.controller.spec.ts`
- `backend/src/presentation/insee-index/__tests__/record-an-insee-index.dto.spec.ts`
- `backend/src/presentation/insee-index/__tests__/insee-index.projection.spec.ts`

**New files (frontend — 10):**
- `frontend/src/app/(auth)/indices/page.tsx`
- `frontend/src/components/features/indices/insee-index-form.tsx`
- `frontend/src/components/features/indices/insee-index-list.tsx`
- `frontend/src/components/features/indices/insee-index-schema.ts`
- `frontend/src/components/features/indices/__tests__/insee-index-form.test.tsx`
- `frontend/src/components/features/indices/__tests__/insee-index-list.test.tsx`
- `frontend/src/components/features/indices/__tests__/indices-page.test.tsx`
- `frontend/src/hooks/use-insee-indices.ts`
- `frontend/src/hooks/__tests__/use-record-insee-index.test.ts`
- `frontend/src/lib/api/insee-indices-api.ts`

**New files (E2E — 1):**
- `frontend/e2e/indices.spec.ts`

**Modified files (6):**
- `backend/tsconfig.json` — added `@indexation/*` path alias
- `backend/package.json` — added `@indexation/*` to Jest moduleNameMapper
- `backend/webpack.config.js` — added `@indexation` to resolve.alias
- `backend/src/app.module.ts` — registered IndexationModule + InseeIndexPresentationModule
- `backend/prisma/schema.prisma` — added InseeIndex model
- `frontend/src/components/layout/sidebar.tsx` — added "Indices" nav item with TrendingUp icon
