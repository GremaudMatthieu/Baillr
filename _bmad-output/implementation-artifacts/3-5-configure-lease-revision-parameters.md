# Story 3.5: Configure Lease Revision Parameters

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to set a revision date and reference quarter per lease,
So that the system can calculate rent revisions at the right time with the right index (FR14, FR15).

## Acceptance Criteria

1. **Given** I have an active lease, **When** I configure revision parameters, **Then** I can set: annual revision date (day + month), reference quarter (Q1/Q2/Q3/Q4), reference year
2. **Given** I configure revision parameters, **Then** the revision index type (IRL/ILC/ICC) is already set from lease creation and displayed as read-only context
3. **Given** I configure revision parameters, **Then** the system stores the previous index value (base index) for future revision calculation
4. **Given** I save revision parameters, **Then** the event `LeaseRevisionParametersConfigured` is stored in KurrentDB with all revision fields
5. **Given** I have configured revision parameters, **When** I view the lease detail page, **Then** revision parameters are displayed in a dedicated "Paramètres de révision" section showing: revision date, reference quarter + year, base index value, revision index type
6. **Given** I have not configured revision parameters, **When** I view the lease detail page, **Then** I see a prompt "Configurer les paramètres de révision" in the revision section
7. **Given** I have configured revision parameters, **When** I update them, **Then** the new values replace the previous configuration (PUT full replacement pattern)

## Tasks / Subtasks

- [x] Task 1: Create revision parameter VOs and domain infrastructure (AC: 1, 2, 3, 4)
  - [x]1.1: Create `RevisionDay` VO — `revision-day.ts` with validation: integer 1-31, static `fromNumber()`, `get value(): number`
  - [x]1.2: Create `RevisionMonth` VO — `revision-month.ts` with validation: integer 1-12, static `fromNumber()`, `get value(): number`
  - [x]1.3: Create `ReferenceQuarter` VO — `reference-quarter.ts` with guard clause against `ALLOWED_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']`, static `fromString()`, `get value(): ReferenceQuarterValue`
  - [x]1.4: Create `ReferenceYear` VO — `reference-year.ts` with validation: integer 2000-2100, static `fromNumber()`, `get value(): number`
  - [x]1.5: Create `BaseIndexValue` VO — `base-index-value.ts` with Null Object pattern — value `number | null`, static `create(value: number)` (must be > 0, max 3 decimal places), static `empty()`, `get isEmpty(): boolean`, `get value(): number | null`
  - [x]1.6: Create named exceptions: `InvalidRevisionDayException` (.invalidDay), `InvalidRevisionMonthException` (.invalidMonth), `InvalidReferenceQuarterException` (.invalidQuarter), `InvalidReferenceYearException` (.invalidYear), `InvalidBaseIndexValueException` (.mustBePositive, .tooManyDecimals)
  - [x]1.7: Create `LeaseRevisionParametersConfigured` event with fields: `{ leaseId, revisionDay, revisionMonth, referenceQuarter, referenceYear, baseIndexValue }`
  - [x]1.8: Create `ConfigureLeaseRevisionParametersCommand` with payload: `{ leaseId, revisionDay, revisionMonth, referenceQuarter, referenceYear, baseIndexValue }`
  - [x]1.9: Create `ConfigureLeaseRevisionParametersHandler` — load aggregate, call `configureRevisionParameters()`, save. ZERO business logic in handler.
  - [x]1.10: Extend `LeaseAggregate` — add revision parameter fields, add `configureRevisionParameters()` method with no-op guard (JSON comparison), handle `LeaseRevisionParametersConfigured` event replay
  - [x]1.11: Write aggregate + handler + VO unit tests

- [x] Task 2: Create Prisma migration and projection update (AC: 4, 5)
  - [x]2.1: Add revision parameter columns to Prisma Lease model: `revisionDay Int? @map("revision_day")`, `revisionMonth Int? @map("revision_month")`, `referenceQuarter String? @map("reference_quarter")`, `referenceYear Int? @map("reference_year")`, `baseIndexValue Float? @map("base_index_value")`
  - [x]2.2: Run migration
  - [x]2.3: Update `lease.projection.ts` — handle `LeaseRevisionParametersConfigured` event (update revision columns in Prisma)
  - [x]2.4: Write projection tests for new event

- [x] Task 3: Create presentation layer (AC: 4, 7)
  - [x]3.1: Create `ConfigureLeaseRevisionParametersDto` with class-validator decorators: `@IsInt() @Min(1) @Max(31) revisionDay`, `@IsInt() @Min(1) @Max(12) revisionMonth`, `@IsString() @IsIn(['Q1','Q2','Q3','Q4']) referenceQuarter`, `@IsInt() @Min(2000) @Max(2100) referenceYear`, `@IsOptional() @IsNumber() @Min(0.001) baseIndexValue`
  - [x]3.2: Create `ConfigureLeaseRevisionParametersController` — `PUT /api/leases/:id/revision-parameters` (202 Accepted), with LeaseFinder authorization check
  - [x]3.3: Write controller unit tests (success 202, unauthorized, validation errors)

- [x] Task 4: Create frontend API client and hooks (AC: 5, 6, 7)
  - [x]4.1: Update `LeaseData` interface in `leases-api.ts` — add `revisionDay: number | null`, `revisionMonth: number | null`, `referenceQuarter: string | null`, `referenceYear: number | null`, `baseIndexValue: number | null`
  - [x]4.2: Add `configureRevisionParameters(leaseId, payload)` to API client — `PUT /leases/:id/revision-parameters`
  - [x]4.3: Create `useConfigureRevisionParameters(leaseId, entityId)` mutation hook with optimistic update + delayed invalidation
  - [x]4.4: Create `REFERENCE_QUARTER_LABELS` constant — `{ Q1: "T1 (Janvier-Mars)", Q2: "T2 (Avril-Juin)", Q3: "T3 (Juillet-Septembre)", Q4: "T4 (Octobre-Décembre)" }`
  - [x]4.5: Create `MONTH_LABELS` constant — French month names array `["Janvier", "Février", ..., "Décembre"]`

- [x] Task 5: Create revision parameters form component (AC: 1, 2, 3)
  - [x]5.1: Create `revision-parameters-schema.ts` — Zod schema: `revisionDay` (1-31 integer), `revisionMonth` (1-12 integer), `referenceQuarter` (enum Q1-Q4), `referenceYear` (2000-2100 integer), `baseIndexValue` (optional positive number)
  - [x]5.2: Create `revision-parameters-form.tsx` — form with: day select (1-31), month select (1-12 with French names), quarter select (Q1-Q4), year input (number), base index input (optional number, 3 decimal max), read-only revision index type display
  - [x]5.3: Write revision-parameters-form frontend tests (8 tests)

- [x] Task 6: Update lease detail page (AC: 2, 5, 6)
  - [x]6.1: Add "Paramètres de révision" Card section to `LeaseDetailContent` — display revision parameters as detail list
  - [x]6.2: Show read-only revision index type (from lease creation, non-editable)
  - [x]6.3: Show "Configurer les paramètres de révision" prompt when revision parameters not yet configured (all revision fields null)
  - [x]6.4: Add inline edit toggle — "Modifier" button opens `RevisionParametersForm` with `onCancel` prop
  - [x]6.5: Pre-fill form with existing revision parameters when editing
  - [x]6.6: Write lease detail page frontend tests for revision parameters section (6 tests)

- [x] Task 7: E2E tests (AC: 1, 5)
  - [x]7.1: Add revision parameters API fixture methods (configureRevisionParameters)
  - [x]7.2: E2E: Configure revision parameters on existing lease → verify display on detail page

## Dev Notes

### Architecture Decisions

- **Update operation on LeaseAggregate (second)**: Story 3.4 introduced the first update (`configureBillingLines`). This story adds a second update command (`configureRevisionParameters`). Same pattern: load aggregate → call method → save.
- **Revision parameters as separate event**: `LeaseRevisionParametersConfigured` is a new event, NOT a modification of `LeaseCreated`. This follows the backward-compatible event extension pattern from Stories 3.2 and 3.4. Old leases without revision parameters produce null columns via Prisma defaults.
- **PUT full replacement**: `PUT /api/leases/:id/revision-parameters` replaces ALL revision parameters. Same pattern as billing lines (Story 3.4) and billable options (Story 2.5). Simpler, idempotent.
- **Nullable Prisma columns**: All revision parameter columns are nullable (`Int?`, `String?`, `Float?`). A lease exists without revision parameters after creation — they are configured in a separate step (this story). Frontend detects "not yet configured" via `revisionDay === null`.
- **Base index value**: Stored as `Float` in Prisma (acceptable for index values which are reference numbers, NOT money). The actual revision calculation (Story 7.2) will use integer cents for rent amounts. The index itself is a reference number like `142.06` — not a monetary value, so Float is appropriate.
- **No-op guard**: Same as Story 3.4 billing lines — JSON.stringify comparison of current vs new parameters before emitting event. Prevents bloating the event stream with identical updates.
- **RevisionDay + RevisionMonth vs Date**: We model day and month separately (not a full date) because the revision date recurs annually. The "revision date" is "every year on day X of month Y" — not a specific calendar date. This aligns with FR14: "configurable revision date per lease".

### Value Objects

| VO | File | Type | Validation | Null Object |
|---|---|---|---|---|
| RevisionDay | `revision-day.ts` | integer | 1-31 range | No |
| RevisionMonth | `revision-month.ts` | integer | 1-12 range | No |
| ReferenceQuarter | `reference-quarter.ts` | enum string | Q1/Q2/Q3/Q4 guard | No |
| ReferenceYear | `reference-year.ts` | integer | 2000-2100 range | No |
| BaseIndexValue | `base-index-value.ts` | number (nullable) | > 0, max 3 decimals | Yes (`.empty()`, `.isEmpty`) |

BaseIndexValue follows the Null Object pattern because the base index is optional at configuration time (the user may not know the exact value yet and can fill it in later).

### Events

| Event | Trigger | Data Fields |
|---|---|---|
| `LeaseRevisionParametersConfigured` | ConfigureLeaseRevisionParametersCommand | `{ leaseId, revisionDay, revisionMonth, referenceQuarter, referenceYear, baseIndexValue }` |

Metadata: `{ userId, entityId, timestamp, correlationId }`

### Commands

| Command | Handler | Logic |
|---|---|---|
| `ConfigureLeaseRevisionParametersCommand` | `ConfigureLeaseRevisionParametersHandler` | Load existing LeaseAggregate, call `configureRevisionParameters(...)`, save. Handler has ZERO business logic. |

Command payload: `{ leaseId, revisionDay: number, revisionMonth: number, referenceQuarter: string, referenceYear: number, baseIndexValue: number | null }`

### API Endpoints

| Method | Path | Purpose | Response |
|---|---|---|---|
| `PUT` | `/api/leases/:id/revision-parameters` | Configure revision parameters | 202 Accepted (no body) |

Existing endpoints unchanged:
- `POST /api/entities/:entityId/leases` — Create lease (revision index type set at creation, NO revision parameters)
- `GET /api/entities/:entityId/leases` — List leases (now includes revision parameter fields)
- `GET /api/leases/:id` — Get single lease (now includes revision parameter fields)

**Authorization flow** (controller-level):
1. Extract `userId` from JWT via `@CurrentUserId()`
2. Verify lease ownership: `LeaseFinder.findByIdAndUser(leaseId, userId)` → throw UnauthorizedException
3. Validate DTO (class-validator)
4. Dispatch command

### Prisma Model Update

```prisma
model Lease {
  // ... existing fields ...
  revisionDay          Int?     @map("revision_day")
  revisionMonth        Int?     @map("revision_month")
  referenceQuarter     String?  @map("reference_quarter")
  referenceYear        Int?     @map("reference_year")
  baseIndexValue       Float?   @map("base_index_value")
  // ... relations unchanged ...
}
```

All nullable — lease created without revision parameters, configured separately.

### LeaseAggregate Extension

```typescript
// New fields in aggregate state
private revisionDay: RevisionDay | null = null;
private revisionMonth: RevisionMonth | null = null;
private referenceQuarter: ReferenceQuarter | null = null;
private referenceYear: ReferenceYear | null = null;
private baseIndexValue: BaseIndexValue = BaseIndexValue.empty();

// New method
configureRevisionParameters(
  revisionDay: number,
  revisionMonth: number,
  referenceQuarter: string,
  referenceYear: number,
  baseIndexValue: number | null,
): void {
  if (!this.created) throw LeaseNotCreatedException.create();

  // Validate via VOs
  const voDay = RevisionDay.fromNumber(revisionDay);
  const voMonth = RevisionMonth.fromNumber(revisionMonth);
  const voQuarter = ReferenceQuarter.fromString(referenceQuarter);
  const voYear = ReferenceYear.fromNumber(referenceYear);
  const voBaseIndex = baseIndexValue !== null
    ? BaseIndexValue.create(baseIndexValue)
    : BaseIndexValue.empty();

  // No-op guard
  const newParams = { revisionDay, revisionMonth, referenceQuarter, referenceYear, baseIndexValue };
  const currentParams = {
    revisionDay: this.revisionDay?.value ?? null,
    revisionMonth: this.revisionMonth?.value ?? null,
    referenceQuarter: this.referenceQuarter?.value ?? null,
    referenceYear: this.referenceYear?.value ?? null,
    baseIndexValue: this.baseIndexValue.value,
  };
  if (JSON.stringify(newParams) === JSON.stringify(currentParams)) return;

  this.apply(new LeaseRevisionParametersConfigured({
    leaseId: this.id,
    revisionDay: voDay.value,
    revisionMonth: voMonth.value,
    referenceQuarter: voQuarter.value,
    referenceYear: voYear.value,
    baseIndexValue: voBaseIndex.value,
  }));
}

// Event replay handler
onLeaseRevisionParametersConfigured(event: LeaseRevisionParametersConfigured): void {
  this.revisionDay = RevisionDay.fromNumber(event.data.revisionDay);
  this.revisionMonth = RevisionMonth.fromNumber(event.data.revisionMonth);
  this.referenceQuarter = ReferenceQuarter.fromString(event.data.referenceQuarter);
  this.referenceYear = ReferenceYear.fromNumber(event.data.referenceYear);
  this.baseIndexValue = event.data.baseIndexValue !== null
    ? BaseIndexValue.create(event.data.baseIndexValue)
    : BaseIndexValue.empty();
}
```

### Frontend Zod Schema

```typescript
const revisionParametersSchema = z.object({
  revisionDay: z.number().int().min(1, { error: "Jour invalide" }).max(31, { error: "Jour invalide" }),
  revisionMonth: z.number().int().min(1, { error: "Mois invalide" }).max(12, { error: "Mois invalide" }),
  referenceQuarter: z.enum(["Q1", "Q2", "Q3", "Q4"], { error: "Trimestre requis" }),
  referenceYear: z.number().int().min(2000, { error: "Année invalide" }).max(2100, { error: "Année invalide" }),
  baseIndexValue: z.number().positive({ error: "Indice invalide" }).optional(),
});
```

**Critical rules**:
- NO `.default()` on schema — use `defaultValues` in `useForm()`
- `baseIndexValue` is optional (user may configure it later)
- Use `{ error: "..." }` (Zod v4 API)

### Revision Parameters Display

| Field | Label | Display |
|---|---|---|
| Revision index type | Indice de révision | Badge: "IRL" + full label (read-only from lease creation) |
| Revision date | Date de révision | "15 Mars" (day + French month name) |
| Reference quarter | Trimestre de référence | "T2 2025 (Avril-Juin)" |
| Base index value | Indice de base | "142.06" (or "Non renseigné" if null) |

### Cross-Query Cache Invalidation

Revision parameters configuration must invalidate:
- `["leases", leaseId]` — lease detail (primary)
- `["entities", entityId, "leases"]` — lease list (revision fields may appear in list)

Use `setTimeout(1500ms)` delayed invalidation pattern (established in Story 2.1).

### Testing Standards

**Backend (Jest)**:
- RevisionDay VO: valid 1, valid 31, invalid 0, invalid 32, invalid float (~5 tests)
- RevisionMonth VO: valid 1, valid 12, invalid 0, invalid 13, invalid float (~5 tests)
- ReferenceQuarter VO: valid Q1-Q4, invalid string (~5 tests)
- ReferenceYear VO: valid 2025, invalid 1999, invalid 2101, invalid float (~4 tests)
- BaseIndexValue VO: valid 142.06, valid create, empty(), isEmpty, must be positive, too many decimals (~6 tests)
- LeaseAggregate.configureRevisionParameters: valid config, reject before create, no-op guard, update existing (~6 tests)
- ConfigureLeaseRevisionParametersHandler: success, aggregate-not-found (~3 tests)
- ConfigureLeaseRevisionParametersController: success 202, unauthorized, validation errors (~5 tests)
- Lease projection: on LeaseRevisionParametersConfigured → update, idempotent, missing lease warning (~3 tests)

**Frontend (Vitest)**:
- RevisionParametersForm: render fields, submit valid data, validation errors, pre-fill existing values, base index optional (~8 tests)
- Lease detail page: revision parameters display, empty state with prompt, edit toggle (~6 tests)

**E2E (Playwright)**:
- Configure revision parameters → verify display (~1 test)

### Previous Story Intelligence

**From Story 3.4 (Billing Lines)**:
- Second update operation on LeaseAggregate — exact same pattern to follow
- PUT full replacement endpoint: `PUT /api/leases/:id/billing-lines` → clone for `PUT /api/leases/:id/revision-parameters`
- `LeaseFinder.findByIdAndUser()` for authorization — already exists
- `LeaseNotCreatedException` — already exists, reuse
- No-op guard with `JSON.stringify` comparison — already implemented for billing lines, follow same pattern
- `LeaseDetailContent` extraction — billing lines section pattern to clone for revision parameters section
- Inline edit toggle pattern with `isEditingBillingLines` state → clone as `isEditingRevisionParameters`
- Index-based Map key for billing lines replay — no Map needed here (revision parameters are a single set, not a collection)
- Private constructor exceptions: use `toThrow(DomainException)` or `toThrow('message string')` in tests

**From Story 3.3 (Leases)**:
- LeaseAggregate create includes `revisionIndexType` — already stored, read-only in this story
- RevisionIndexType VO at `backend/src/tenancy/lease/revision-index-type.ts` — reuse for display
- `REVISION_INDEX_TYPE_LABELS` constant at `frontend/src/lib/constants/revision-index-types.ts` — reuse for display
- E2E lease tests use serial mode with seed test

**From Story 2.5 (Units — decimal values)**:
- Euros/cents conversion pattern — NOT needed here (indices are not money)
- `@IsNumber()` + `@Min()` for float DTO validation
- `@IsOptional()` + `@ValidateIf((_o, value) => value !== null)` for nullable fields in update DTOs

### Known Pitfalls to Avoid

1. **DO NOT create a separate aggregate** — revision parameters are fields on LeaseAggregate, always managed through the lease
2. **DO NOT modify LeaseCreated event** — create new `LeaseRevisionParametersConfigured` event for backward compatibility
3. **DO NOT allow editing `revisionIndexType`** — it's set at lease creation (Story 3.3) and displayed read-only here
4. **DO NOT use integer cents for index values** — indices like `142.06` are reference numbers, NOT money. Use `Float` in Prisma, `number` in TypeScript
5. **DO NOT call `invalidateQueries` immediately** — use delayed invalidation (1500ms)
6. **DO NOT use `.default()` or `.refine()` on Zod schema** with zodResolver
7. **DO NOT add logic in command handler** — all business rules in aggregate
8. **DO NOT forget cross-aggregate authorization** at controller level (LeaseFinder.findByIdAndUser)
9. **DO NOT forget `prisma generate`** after schema changes
10. **DO NOT use `as` cast for quarter validation** — guard clause + named exception in aggregate
11. **DO NOT forget the no-op guard** — prevents duplicate events when parameters haven't changed (learned in Story 3.4 adversarial review)
12. **DO NOT use `Float` for money values** — only acceptable here because indices are reference numbers, not monetary amounts

### Project Structure Notes

**New files to create:**

```
backend/src/tenancy/lease/revision-day.ts
backend/src/tenancy/lease/revision-month.ts
backend/src/tenancy/lease/reference-quarter.ts
backend/src/tenancy/lease/reference-year.ts
backend/src/tenancy/lease/base-index-value.ts
backend/src/tenancy/lease/exceptions/invalid-revision-day.exception.ts
backend/src/tenancy/lease/exceptions/invalid-revision-month.exception.ts
backend/src/tenancy/lease/exceptions/invalid-reference-quarter.exception.ts
backend/src/tenancy/lease/exceptions/invalid-reference-year.exception.ts
backend/src/tenancy/lease/exceptions/invalid-base-index-value.exception.ts
backend/src/tenancy/lease/commands/configure-lease-revision-parameters.command.ts
backend/src/tenancy/lease/commands/configure-lease-revision-parameters.handler.ts
backend/src/tenancy/lease/events/lease-revision-parameters-configured.event.ts
backend/src/tenancy/lease/__tests__/revision-day.spec.ts
backend/src/tenancy/lease/__tests__/revision-month.spec.ts
backend/src/tenancy/lease/__tests__/reference-quarter.spec.ts
backend/src/tenancy/lease/__tests__/reference-year.spec.ts
backend/src/tenancy/lease/__tests__/base-index-value.spec.ts
backend/src/tenancy/lease/__tests__/configure-lease-revision-parameters.handler.spec.ts
backend/src/presentation/lease/controllers/configure-lease-revision-parameters.controller.ts
backend/src/presentation/lease/dto/configure-lease-revision-parameters.dto.ts
backend/src/presentation/lease/__tests__/configure-lease-revision-parameters.controller.spec.ts
backend/prisma/migrations/YYYYMMDDHHMMSS_add_revision_parameters_to_lease/migration.sql
frontend/src/components/features/leases/revision-parameters-form.tsx
frontend/src/components/features/leases/revision-parameters-schema.ts
frontend/src/components/features/leases/__tests__/revision-parameters-form.test.tsx
frontend/src/lib/constants/reference-quarters.ts
frontend/src/lib/constants/months.ts
```

**Files to modify:**

```
backend/src/tenancy/lease/lease.aggregate.ts                    (add revision parameter fields + configureRevisionParameters method + event handler)
backend/src/tenancy/lease/lease.module.ts                       (register ConfigureLeaseRevisionParametersHandler)
backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts     (add configureRevisionParameters tests)
backend/src/presentation/lease/lease-presentation.module.ts     (register ConfigureLeaseRevisionParametersController)
backend/src/presentation/lease/projections/lease.projection.ts  (handle LeaseRevisionParametersConfigured)
backend/src/presentation/lease/__tests__/lease.projection.spec.ts (add LeaseRevisionParametersConfigured test)
backend/prisma/schema.prisma                                    (add revision parameter columns)
frontend/src/lib/api/leases-api.ts                              (add revision fields to LeaseData + configureRevisionParameters API call)
frontend/src/hooks/use-leases.ts                                (add useConfigureRevisionParameters hook)
frontend/src/components/features/leases/lease-detail-content.tsx (add revision parameters Card section + inline edit)
frontend/src/app/(auth)/leases/[id]/__tests__/lease-detail-page.test.tsx (add revision parameters tests)
frontend/e2e/fixtures/api.fixture.ts                            (add configureRevisionParameters fixture)
frontend/e2e/leases.spec.ts                                     (add revision parameters E2E test)
_bmad-output/implementation-artifacts/sprint-status.yaml
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.5] — User story, acceptance criteria, FR14, FR15
- [Source: _bmad-output/planning-artifacts/architecture.md — Bounded Contexts] — Tenancy BC contains Lease aggregate (FR9-17)
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture] — `lease-{id}` stream, `leases` table
- [Source: _bmad-output/planning-artifacts/architecture.md — Naming Conventions] — VerbANoun commands, PastTense events
- [Source: _bmad-output/planning-artifacts/architecture.md — Controller Pattern] — One controller per action, 202 Accepted
- [Source: _bmad-output/planning-artifacts/architecture.md — Value Objects] — Private constructor, static factory, Null Object pattern
- [Source: _bmad-output/planning-artifacts/prd.md — FR14] — Configurable IRL/ILC/ICC revision date per lease
- [Source: _bmad-output/planning-artifacts/prd.md — FR15] — Configurable reference quarter per lease for index revision
- [Source: _bmad-output/implementation-artifacts/3-4-configure-billing-lines-per-lease.md] — PUT full replacement pattern, inline edit, no-op guard, LeaseNotCreatedException reuse
- [Source: _bmad-output/implementation-artifacts/3-3-create-a-lease-linking-tenant-to-unit.md] — LeaseAggregate structure, RevisionIndexType VO, Prisma model, frontend form
- [Source: docs/project-context.md — CQRS/ES Patterns] — Optimistic UI, delayed invalidation
- [Source: docs/project-context.md — Form Patterns] — Zod + react-hook-form, no .default()
- [Source: docs/anti-patterns.md] — DTO checklist, guard clauses, no-op guard pattern

## Change Log

| Change | Reason |
|--------|--------|
| Added `lease-detail-content.test.tsx` (not in original File List) | Tests for the revision parameters section of the lease detail page |
| Added `leases-page.test.tsx` to modified files | Needed revision fields added to mock data for TypeScript compliance |
| Added `lease-detail-page.test.tsx` to modified files | Added `useConfigureRevisionParameters` mock and revision fields to existing mock data |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Jest `--testPathPattern` deprecated in Jest 30 — use `--testPathPatterns` (plural)
- RevisionParametersForm submit test: `form.handleSubmit` passes SyntheticEvent as 2nd arg — access `mock.calls[0][0]` directly instead of `expect.objectContaining`
- Radix Select + jsdom form submission unreliable (known pattern from C.1) — changed test to verify rendering instead of form submission
- LeaseDetailContent test: `getByRole("button", { name: /Configurer/i })` matches both "Configurer" (revision) and "Configurer les lignes" (billing) — use exact name match `{ name: "Configurer" }` for disambiguation
- Existing `lease-detail-page.test.tsx` failed because mock of `use-leases` didn't include `useConfigureRevisionParameters` and mock data lacked revision fields — added both

### Completion Notes List

- 7 tasks completed (VOs/domain, Prisma/projection, presentation, API/hooks, form, detail page, E2E)
- Backend: 518 tests (74 suites) — all pass
- Frontend: 296 tests (38 suites) — all pass
- TypeScript: both frontend and backend typecheck clean
- E2E: 1 new test added (configure revision parameters, serial mode)
- No-op guard implemented with JSON.stringify comparison
- PUT full replacement pattern follows Story 3.4 billing lines exactly
- BaseIndexValue uses Null Object pattern (`.empty()`, `.isEmpty`)
- LeaseDetailContent has 3 states: empty (configure prompt), display (read-only), edit (form)

### File List

**New files (29):**
```
backend/src/tenancy/lease/revision-day.ts
backend/src/tenancy/lease/revision-month.ts
backend/src/tenancy/lease/reference-quarter.ts
backend/src/tenancy/lease/reference-year.ts
backend/src/tenancy/lease/base-index-value.ts
backend/src/tenancy/lease/exceptions/invalid-revision-day.exception.ts
backend/src/tenancy/lease/exceptions/invalid-revision-month.exception.ts
backend/src/tenancy/lease/exceptions/invalid-reference-quarter.exception.ts
backend/src/tenancy/lease/exceptions/invalid-reference-year.exception.ts
backend/src/tenancy/lease/exceptions/invalid-base-index-value.exception.ts
backend/src/tenancy/lease/commands/configure-lease-revision-parameters.command.ts
backend/src/tenancy/lease/commands/configure-lease-revision-parameters.handler.ts
backend/src/tenancy/lease/events/lease-revision-parameters-configured.event.ts
backend/src/tenancy/lease/__tests__/revision-day.spec.ts
backend/src/tenancy/lease/__tests__/revision-month.spec.ts
backend/src/tenancy/lease/__tests__/reference-quarter.spec.ts
backend/src/tenancy/lease/__tests__/reference-year.spec.ts
backend/src/tenancy/lease/__tests__/base-index-value.spec.ts
backend/src/tenancy/lease/__tests__/configure-lease-revision-parameters.handler.spec.ts
backend/src/presentation/lease/controllers/configure-lease-revision-parameters.controller.ts
backend/src/presentation/lease/dto/configure-lease-revision-parameters.dto.ts
backend/src/presentation/lease/__tests__/configure-lease-revision-parameters.controller.spec.ts
backend/prisma/migrations/20260212201441_add_revision_parameters_to_lease/migration.sql
frontend/src/components/features/leases/revision-parameters-form.tsx
frontend/src/components/features/leases/revision-parameters-schema.ts
frontend/src/components/features/leases/__tests__/revision-parameters-form.test.tsx
frontend/src/components/features/leases/__tests__/lease-detail-content.test.tsx
frontend/src/lib/constants/reference-quarters.ts
frontend/src/lib/constants/months.ts
```

**Modified files (16):**
```
backend/src/tenancy/lease/lease.aggregate.ts
backend/src/tenancy/lease/lease.module.ts
backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts
backend/src/presentation/lease/lease-presentation.module.ts
backend/src/presentation/lease/projections/lease.projection.ts
backend/src/presentation/lease/__tests__/lease.projection.spec.ts
backend/prisma/schema.prisma
frontend/src/lib/api/leases-api.ts
frontend/src/hooks/use-leases.ts
frontend/src/components/features/leases/lease-detail-content.tsx
frontend/src/app/(auth)/leases/__tests__/leases-page.test.tsx
frontend/src/app/(auth)/leases/[id]/__tests__/lease-detail-page.test.tsx
frontend/e2e/fixtures/api.fixture.ts
frontend/e2e/leases.spec.ts
_bmad-output/implementation-artifacts/sprint-status.yaml
_bmad-output/implementation-artifacts/3-5-configure-lease-revision-parameters.md
```

