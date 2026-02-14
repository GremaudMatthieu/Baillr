# Story 7.5: Enter Actual Annual Charges by Category

Status: done

## Story

As a bailleur,
I want to enter actual annual charges by category (water, electricity, TEOM, cleaning, custom),
So that I can calculate the difference between provisions paid and actual costs (FR48).

## Acceptance Criteria

1. **Given** a fiscal year has ended, **When** I navigate to the charges page, **Then** I see a fiscal year selector and can enter actual charges for my entity.

2. **Given** I am on the charges entry form, **When** I enter amounts, **Then** I can enter amounts per category: water (eau), electricity (électricité), property tax (TEOM), cleaning (nettoyage), and custom categories with label.

3. **Given** I enter charge amounts, **Then** each amount is stored as integer cents and the event `AnnualChargesRecorded` is stored in KurrentDB.

4. **Given** I have custom categories to enter, **When** I click "Ajouter une catégorie", **Then** I can add a custom category with label + amount, and remove custom categories I added.

5. **Given** annual charges have been recorded, **When** I view the charges page, **Then** the total actual charges are displayed alongside total provisions collected for the same fiscal year.

6. **Given** annual charges already exist for a fiscal year, **When** I submit new values for the same fiscal year, **Then** the previous values are replaced (PUT full replacement pattern — idempotent overwrite).

7. **Given** I enter invalid data, **When** I submit the form, **Then** I see clear error messages (negative amounts, missing label for custom categories, etc.).

## Tasks / Subtasks

- [x] Task 1 — Create AnnualChargesAggregate in Indexation BC (AC: #3, #6)
  - [x] 1.1 Create `annual-charges/` folder under `backend/src/indexation/`
  - [x] 1.2 Create `ChargeCategory` VO — enum-like: `'water' | 'electricity' | 'teom' | 'cleaning' | 'custom'`
  - [x] 1.3 Create `ChargeEntry` composite VO — `{ category: ChargeCategory, label: string, amountCents: number }`
  - [x] 1.4 Create `FiscalYear` VO — validates integer ≥ 2000 and ≤ current year + 1
  - [x] 1.5 Create `AnnualChargesRecorded` event with full charge data
  - [x] 1.6 Create `AnnualChargesAggregate` with `record()` method — separate stream `annual-charges-{id}`
  - [x] 1.7 Create `RecordAnnualChargesCommand` and `RecordAnnualChargesHandler`
  - [x] 1.8 Create named exceptions: `InvalidChargeCategoryException`, `InvalidFiscalYearException`, `EmptyChargeLabelException`, `NegativeChargeAmountException`
  - [x] 1.9 Write aggregate + VO + handler unit tests — 41 tests, 5 suites

- [x] Task 2 — Create Prisma model and projection (AC: #3, #5)
  - [x] 2.1 Add `AnnualCharges` model to Prisma schema — `annual_charges` table with `id`, `entityId`, `userId`, `fiscalYear`, `charges` (JSON), `totalAmountCents`, `createdAt`, `updatedAt`
  - [x] 2.2 Add `@@unique([entityId, fiscalYear])` constraint for idempotency
  - [x] 2.3 Run `prisma generate` and `prisma db push`
  - [x] 2.4 Create `AnnualChargesProjection` — subscribes to `annual-charges_` stream, upserts on `AnnualChargesRecorded`
  - [x] 2.5 Write projection unit tests — 5 tests

- [x] Task 3 — Create presentation layer: controllers + finder + DTO (AC: #1, #2, #3, #6, #7)
  - [x] 3.1 Create `RecordAnnualChargesController` — `POST /api/entities/:entityId/annual-charges` → 202 Accepted
  - [x] 3.2 Create `GetAnnualChargesController` — `GET /api/entities/:entityId/annual-charges?fiscalYear=YYYY`
  - [x] 3.3 Create `RecordAnnualChargesDto` with full DTO validation (class-validator decorators per dto-checklist.md)
  - [x] 3.4 Create `AnnualChargesFinder` — find by entityId + fiscalYear, query all for entity
  - [x] 3.5 Create `AnnualChargesPresentationModule` and register in app module
  - [x] 3.6 Write controller + finder unit tests — 16 tests

- [x] Task 4 — Create provisions query endpoint (AC: #5)
  - [x] 4.1 Create `GetProvisionsCollectedController` — `GET /api/entities/:entityId/provisions?fiscalYear=YYYY`
  - [x] 4.2 Query rent_calls table: filter by entityId + year (month starts with YYYY-), extract billing lines where type='provision', sum amountCents across all paid rent calls
  - [x] 4.3 Return `{ totalProvisionsCents: number, details: { label: string, totalCents: number }[] }`
  - [x] 4.4 Write controller unit tests — 7 tests

- [x] Task 5 — Frontend: API client + hooks (AC: #1, #2, #5)
  - [x] 5.1 Create `frontend/src/lib/api/annual-charges-api.ts` with `useAnnualChargesApi()` factory hook
  - [x] 5.2 Create `frontend/src/hooks/use-annual-charges.ts` — `useAnnualCharges(entityId, fiscalYear)`, `useRecordAnnualCharges(entityId)`, `useProvisionsCollected(entityId, fiscalYear)`
  - [x] 5.3 Write hook unit tests — 8 tests

- [x] Task 6 — Frontend: charges page + form (AC: #1, #2, #4, #5, #6, #7)
  - [x] 6.1 Create `frontend/src/app/(auth)/charges/page.tsx` — fiscal year selector + form + summary
  - [x] 6.2 Create `AnnualChargesForm` component — 4 fixed categories (eau, électricité, TEOM, nettoyage) + dynamic custom categories with `useFieldArray`
  - [x] 6.3 Create Zod schema for charges form (no `.default()`, no `.refine()`)
  - [x] 6.4 Create `ChargesSummary` component — table with actual charges vs provisions collected, difference per category
  - [x] 6.5 Add `CHARGE_CATEGORY_LABELS` constant: `{ water: "Eau", electricity: "Électricité", teom: "TEOM", cleaning: "Nettoyage" }`
  - [x] 6.6 Add "Charges" navigation item to sidebar (Coins icon, href: `/charges`)
  - [x] 6.7 Write component unit tests (form, summary, page)

- [x] Task 7 — Frontend unit tests (AC: #1-#7)
  - [x] 7.1 AnnualChargesForm: renders 4 fixed fields + custom add/remove, submits with cents conversion — 11 tests
  - [x] 7.2 ChargesSummary: displays actual vs provisions, difference calculation, empty state — 7 tests
  - [x] 7.3 Charges page: no-entity state, loading state, error state, fiscal year switching — 7 tests
  - [x] 7.4 Hooks: fetch, mutation, error handling, disabled states — 8 tests

- [x] Task 8 — E2E tests (AC: #1, #2, #3, #4, #5)
  - [x] 8.1 E2E: Navigate to charges page from sidebar → enter charges in 4 categories → submit → verify success
  - [x] 8.2 E2E: Add custom category → enter label + amount → submit → verify success
  - [x] 8.3 E2E: Re-submit charges for same fiscal year → verify values updated (overwrite)

## Dev Notes

### Architecture & Domain Design

**New aggregate in Indexation BC**: `AnnualChargesAggregate` in `backend/src/indexation/annual-charges/`. This is a separate aggregate (not child data in EntityAggregate) because:
1. It has its own lifecycle (record per fiscal year, independent of entity CRUD)
2. It has domain validation rules (category types, fiscal year constraints)
3. It will be consumed by Story 7.7 (charge regularization) as input data
4. Following the pattern of RevisionAggregate and InseeIndexAggregate in the same BC

**Stream naming**: `annual-charges-{id}` — follows `{aggregate}-{id}` convention.

**Aggregate ID strategy**: Use deterministic composite ID `{entityId}-{fiscalYear}` for the aggregate stream. This ensures:
- One aggregate per entity per fiscal year (natural idempotency)
- Subsequent recordings for the same entity+year replay on the same stream
- No need for separate @@unique lookup before command dispatch
- The `record()` method on the aggregate handles overwrite via no-op guard on unchanged data, or emits new event for changed data

**PUT full replacement pattern**: When charges are re-submitted for the same fiscal year, the aggregate emits a new `AnnualChargesRecorded` event with the complete new set of charges. The projection upserts the read model. This matches the `configureBillingLines()` pattern from Story 3.4.

### Domain Model

**ChargeCategory VO** (enum-like):
```
ALLOWED_CATEGORIES = ['water', 'electricity', 'teom', 'cleaning', 'custom']
```
- Private constructor, static `fromString(value: string)` factory
- Throws `InvalidChargeCategoryException.invalid(value)` for unknown categories

**ChargeEntry composite VO**:
```
{ category: ChargeCategory, label: string, amountCents: number }
```
- `label` required for ALL categories (predefined categories get default French labels in frontend, but backend stores whatever label is sent)
- `amountCents` must be non-negative integer, max 99_999_999 (same as BillingLine)
- `label` max 100 chars (same as BillingLine)
- Static `fromPrimitives()` factory, validates all fields

**FiscalYear VO**:
```
value: number — integer, >= 2000, <= current year + 1
```
- Prevents absurd years (negative, far future)
- Private constructor, static `create(year: number)` factory

### Event Design

**AnnualChargesRecorded event data**:
```typescript
{
  annualChargesId: string;       // aggregate ID = {entityId}-{fiscalYear}
  entityId: string;
  userId: string;
  fiscalYear: number;
  charges: Array<{
    category: string;            // 'water' | 'electricity' | 'teom' | 'cleaning' | 'custom'
    label: string;               // "Eau", "Électricité", etc.
    amountCents: number;         // integer cents
  }>;
  totalAmountCents: number;      // sum of all charge amountCents
  recordedAt: string;            // ISO datetime
}
```

### Prisma Model

```prisma
model AnnualCharges {
  id               String   @id
  entityId         String   @map("entity_id")
  userId           String   @map("user_id")
  fiscalYear       Int      @map("fiscal_year")
  charges          Json     @default("[]")
  totalAmountCents Int      @map("total_amount_cents")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([entityId, fiscalYear])
  @@map("annual_charges")
  @@index([entityId])
}
```

**Projection**: Upsert on `AnnualChargesRecorded` event — use `prisma.annualCharges.upsert()` with `where: { entityId_fiscalYear: { entityId, fiscalYear } }`, `create: { ... }`, `update: { charges, totalAmountCents, updatedAt }`.

### API Endpoints

**POST** `/api/entities/:entityId/annual-charges` → 202 Accepted
- Body: `{ id, fiscalYear, charges: [{ category, label, amountCents }] }`
- Frontend generates `id = ${entityId}-${fiscalYear}` deterministically
- Controller dispatches `RecordAnnualChargesCommand`

**GET** `/api/entities/:entityId/annual-charges?fiscalYear=YYYY`
- Returns `{ data: AnnualCharges | null }` for specific year
- If no fiscalYear param, returns all fiscal years for entity: `{ data: AnnualCharges[] }`

**GET** `/api/entities/:entityId/provisions?fiscalYear=YYYY`
- Computes provisions from rent_calls table (billing lines where type='provision')
- Filters by entityId and rent calls where month starts with `YYYY-`
- Only counts PAID rent calls (where `paidAt IS NOT NULL`)
- Returns:
```json
{
  "data": {
    "totalProvisionsCents": 12000,
    "details": [
      { "label": "Provisions sur charges", "totalCents": 6000 },
      { "label": "Eau", "totalCents": 3000 },
      { "label": "Nettoyage", "totalCents": 3000 }
    ]
  }
}
```

### DTO Validation (per dto-checklist.md)

**RecordAnnualChargesDto**:
```typescript
class ChargeEntryDto {
  @IsString()
  @IsIn(['water', 'electricity', 'teom', 'cleaning', 'custom'])
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @IsInt()
  @Min(0)
  @Max(99999999)
  amountCents!: number;
}

class RecordAnnualChargesDto {
  @IsUUID()
  id!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)  // reasonable upper bound
  fiscalYear!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ChargeEntryDto)
  charges!: ChargeEntryDto[];
}
```

### Frontend Design

**Charges page layout**:
```
┌──────────────────────────────────────────────────┐
│ Charges annuelles                    [2025 ▼]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─ Catégories de charges ──────────────────┐   │
│  │ Eau                          [    0,00 €] │   │
│  │ Électricité                  [    0,00 €] │   │
│  │ TEOM                        [    0,00 €] │   │
│  │ Nettoyage                   [    0,00 €] │   │
│  │                                          │   │
│  │ ── Catégories personnalisées ──          │   │
│  │ [Label............]  [    0,00 €] [✕]   │   │
│  │          [+ Ajouter une catégorie]       │   │
│  │                                          │   │
│  │        [Enregistrer les charges]         │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Comparaison charges / provisions ───────┐   │
│  │ Catégorie    │ Charges réelles │ Provisions│  │
│  │──────────────┼─────────────────┼──────────│  │
│  │ Eau          │     450,00 €    │ 360,00 € │  │
│  │ Nettoyage    │     200,00 €    │ 240,00 € │  │
│  │ ...          │                 │          │  │
│  │──────────────┼─────────────────┼──────────│  │
│  │ TOTAL        │   1 200,00 €    │ 960,00 € │  │
│  │              │     Différence: +240,00 €  │  │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Fiscal year selector**: Select component with current year - 1 as default, range from first lease year to current year. Similar approach to month selector in rent calls but simpler.

**Form pattern**: Follow `BillingLinesForm` from Story 3.4 — `useFieldArray` for custom categories, fixed fields for the 4 standard categories. Euros→cents conversion on submit: `Math.round(parseFloat(amount) * 100)`.

**Optimistic UI**: On submit, optimistically update cache with new charges. Invalidate after 1.5s delay.

**ChargesSummary component**:
- Only renders when both annual charges AND provisions data exist
- Provisions query: `useProvisionsCollected(entityId, fiscalYear)` — groups by label from billing line labels
- Matching between actual charges and provisions is BY LABEL (best-effort match — exact same label text)
- Difference: positive = tenant underpaid (debit), negative = tenant overpaid (credit)
- Color coding: red for debit (tenant owes), green for credit (tenant gets back)

### Existing Code to Leverage (DO NOT reinvent)

1. **InseeIndexAggregate pattern** — for simple single-event aggregate with VOs
2. **BillingLine VO** — for `ChargeEntry` composite VO structure (label + amountCents + type)
3. **IndexType VO** — for `ChargeCategory` enum-like VO
4. **FiscalYear** — similar to `IndexYear` VO (integer, range-bounded)
5. **InseeIndex Prisma model** — for `AnnualCharges` model structure (entity-scoped, unique constraint)
6. **InseeIndex presentation module** — for controller, finder, projection registration
7. **BillingLinesForm** — for dynamic field array pattern (useFieldArray, add/remove)
8. **Month selector pattern** (rent calls) — for fiscal year selector
9. **mock-cqrx.ts** — reuse from `indexation/revision/__tests__/mock-cqrx.ts`

### Existing Code to Modify

**Backend:**
- `backend/prisma/schema.prisma` — add `AnnualCharges` model
- `backend/src/indexation/indexation.module.ts` — import new AnnualCharges command handlers (currently empty module)
- `backend/src/app.module.ts` — register `AnnualChargesPresentationModule`
- `backend/tsconfig.json` — no new path alias needed (`@indexation/*` already exists)

**Frontend:**
- `frontend/src/components/layout/sidebar.tsx` — add "Charges" nav item
- No other existing files modified — all new files for this feature

### Testing Approach

**Backend unit tests (co-located `__tests__/`):**
- `charge-category.spec.ts` — VO validation (valid categories, invalid throws)
- `charge-entry.spec.ts` — composite VO validation (label, amount, category)
- `fiscal-year.spec.ts` — range validation
- `annual-charges.aggregate.spec.ts` — record, overwrite, no-op guard
- `record-annual-charges.handler.spec.ts` — handler delegation to aggregate
- `annual-charges.projection.spec.ts` — upsert behavior on AnnualChargesRecorded
- `record-annual-charges.controller.spec.ts` — DTO validation, 202 response
- `get-annual-charges.controller.spec.ts` — query by year, all years
- `get-provisions-collected.controller.spec.ts` — SQL aggregation, empty state
- `annual-charges.finder.spec.ts` — query methods

**Frontend unit tests (co-located `__tests__/`):**
- `annual-charges-form.test.tsx` — 4 fixed fields, custom add/remove, submit cents conversion, validation
- `charges-summary.test.tsx` — actual vs provisions display, difference, empty state
- `charges-page.test.tsx` — no-entity state, loading, error, year switching, form+summary integration
- `use-annual-charges.test.tsx` — hooks: optimistic update, cache invalidation

**E2E tests:**
- `frontend/e2e/charges.spec.ts` — full workflow: navigate, enter charges, verify display, re-submit overwrite, custom categories

### Key Patterns to Follow

- **Controller-per-action**: separate `record-annual-charges.controller.ts` and `get-annual-charges.controller.ts`
- **202 Accepted for commands**: POST returns 202, no body
- **Server-side UUID for deterministic ID**: `id = ${entityId}-${fiscalYear}` — NOT client-generated random UUID
- **VO validation in aggregate**: DTOs validate format, VOs validate business rules
- **Upsert projection**: `prisma.annualCharges.upsert()` instead of create (supports overwrite)
- **No `.default()` or `.refine()` in Zod**: use `defaultValues` in `useForm()`, cross-field validation in `onSubmit`
- **Radix Select for year**: use placeholder-based selectors in tests
- **Dark mode**: all new UI components must include dark mode variants
- **Double-click guard**: disable submit button while mutation is pending
- **French labels**: all UI labels in French, data in English (category keys)
- **Integer cents**: all amounts stored and transmitted as integer cents, display with `€` formatting

### Cross-Story Dependencies

- **Story 7.6** (water meter readings): will USE this story's charge data — water charges category feeds into per-unit distribution
- **Story 7.7** (charge regularization statements): will READ annual charges + provisions to calculate per-tenant regularization
- **Story 7.8** (apply credits/debits): will apply Story 7.7 results to tenant accounts

The `AnnualCharges` Prisma model and `AnnualChargesFinder` created here will be consumed by Stories 7.6-7.8. Ensure the API response format is stable.

### Project Structure Notes

- New aggregate folder: `backend/src/indexation/annual-charges/` — follows `indexation/insee-index/` and `indexation/revision/` sibling pattern
- New presentation module: `backend/src/presentation/annual-charges/` — follows `presentation/insee-index/` and `presentation/revision/` sibling pattern
- New frontend page: `frontend/src/app/(auth)/charges/` — follows `(auth)/indices/` and `(auth)/revisions/` sibling pattern
- New frontend components: `frontend/src/components/features/charges/` — follows `features/revisions/` and `features/indices/` sibling pattern
- No new path aliases needed — `@indexation/*` already covers `indexation/annual-charges/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 7, Story 7.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Indexation BC, Financial Precision, CQRS patterns]
- [Source: docs/project-context.md — CQRS flow, optimistic UI, aggregate patterns]
- [Source: docs/anti-patterns.md — DTO validation, Zod rules, testing patterns]
- [Source: docs/dto-checklist.md — class-validator decorator requirements]
- [Source: Story 7.4 completion notes — Indexation BC structure, revision patterns, mock-cqrx.ts]
- [Source: Story 3.4 completion notes — BillingLine VO, PUT full replacement, useFieldArray]
- [Source: backend/src/indexation/ — InseeIndexAggregate, RevisionAggregate patterns]
- [Source: backend/src/tenancy/lease/billing-line.ts — ChargeEntry VO reference pattern]
- [Source: backend/src/billing/rent-call/ — provisions calculation, rent_calls schema]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `prisma migrate dev` failed due to schema divergence → switched to `prisma db push`
- `--testPathPattern` deprecated in Jest 30 → switched to `--testPathPatterns`
- `mkdir -p` needed before `cp` for `__tests__/` directory creation

### Completion Notes List

- 8 tasks completed, all acceptance criteria met
- Backend: 64 tests (10 suites) — domain (41 tests, 5 suites) + presentation (23 tests, 5 suites)
- Frontend: 689 tests (90 suites) — 33 new tests (4 new suites) for charges feature
- E2E: 5 tests (1 suite) — seed + navigation + enter + custom + overwrite
- AnnualChargesAggregate in Indexation BC with deterministic composite ID `{entityId}-{fiscalYear}`
- PUT full replacement with no-op guard for identical data (isSameData comparison)
- Projection uses upsert for overwrite support
- Provisions endpoint aggregates billing lines from paid rent_calls by label
- Sidebar icon: Coins (not Receipt — avoids collision with existing icons)
- Default fiscal year: previous year (currentYear - 1)
- Year selector range: current year back to current year - 5

### Senior Developer Review (AI)

**Reviewed by:** Monsieur on 2026-02-14
**Findings:** 1 Critical, 3 High, 4 Medium, 4 Low
**Fixes applied:** 6 (1C + 3H + 2M)

**C1 [FIXED]** — Handler used `new AnnualChargesAggregate(id)` instead of `this.repository.load(id)` → no-op guard was dead code. Changed to `load()` for proper rehydration on overwrite (AC #6).

**H1 [FIXED]** — `EmptyChargeLabelException.create()` was thrown for "label too long" case. Added `tooLong()` factory method with correct error message. Updated charge-entry.ts and test assertion.

**H2 [FIXED]** — DTO `id` field lacked `@MaxLength()` decorator. Added `@MaxLength(100)` for defense-in-depth per dto-checklist.md.

**H3 [NOTED]** — FiscalYear VO uses dynamic max (`currentYear+1`) vs DTO static `@Max(2100)`. Acceptable defense-in-depth pattern — DTO is coarse filter, VO is precise.

**M1 [FIXED]** — File List count said "(12)" but listed 11 files. Added missing `annual-charges.projection.spec.ts`. Fixed count to 42.

**M3 [FIXED]** — `NegativeChargeAmountException` renamed to `InvalidChargeAmountException` with `negative()`, `tooLong()`, `mustBeInteger()` factories. Backward-compatible export alias preserved.

**M5 [NOTED]** — E2E tests don't use entity switcher, relying on auto-selection of last-created entity. Acceptable for serial mode.

**L1-L4 [NOTED]** — Minor cosmetic issues (useMemo stale deps, seed test counted in E2E total). Not blocking.

### Change Log

- `backend/prisma/schema.prisma` — Added AnnualCharges model with @@unique([entityId, fiscalYear])
- `backend/src/app.module.ts` — Registered AnnualChargesPresentationModule
- `frontend/src/components/layout/sidebar.tsx` — Added "Charges" nav item with Coins icon
- `backend/src/indexation/annual-charges/commands/record-annual-charges.handler.ts` — [Review] Changed `new Aggregate(id)` → `repository.load(id)` for rehydration
- `backend/src/indexation/annual-charges/exceptions/empty-charge-label.exception.ts` — [Review] Added `tooLong()` factory, parameterized constructor
- `backend/src/indexation/annual-charges/charge-entry.ts` — [Review] Use `tooLong()` for label length, `InvalidChargeAmountException` rename
- `backend/src/indexation/annual-charges/exceptions/negative-charge-amount.exception.ts` — [Review] Renamed to `InvalidChargeAmountException`, backward-compat alias
- `backend/src/presentation/annual-charges/dto/record-annual-charges.dto.ts` — [Review] Added `@MaxLength(100)` on `id` field
- `backend/src/indexation/annual-charges/__tests__/charge-entry.spec.ts` — [Review] Updated label-too-long assertion
- `backend/src/indexation/annual-charges/__tests__/record-annual-charges.handler.spec.ts` — [Review] Mock `load()`, added no-op guard test

### File List

**New Files (42):**

Backend — Domain (17):
- `backend/src/indexation/annual-charges/exceptions/invalid-charge-category.exception.ts`
- `backend/src/indexation/annual-charges/exceptions/invalid-fiscal-year.exception.ts`
- `backend/src/indexation/annual-charges/exceptions/empty-charge-label.exception.ts`
- `backend/src/indexation/annual-charges/exceptions/negative-charge-amount.exception.ts`
- `backend/src/indexation/annual-charges/charge-category.ts`
- `backend/src/indexation/annual-charges/charge-entry.ts`
- `backend/src/indexation/annual-charges/fiscal-year.ts`
- `backend/src/indexation/annual-charges/events/annual-charges-recorded.event.ts`
- `backend/src/indexation/annual-charges/annual-charges.aggregate.ts`
- `backend/src/indexation/annual-charges/commands/record-annual-charges.command.ts`
- `backend/src/indexation/annual-charges/commands/record-annual-charges.handler.ts`
- `backend/src/indexation/annual-charges/__tests__/mock-cqrx.ts`
- `backend/src/indexation/annual-charges/__tests__/charge-category.spec.ts`
- `backend/src/indexation/annual-charges/__tests__/charge-entry.spec.ts`
- `backend/src/indexation/annual-charges/__tests__/fiscal-year.spec.ts`

Backend — Presentation (12):
- `backend/src/presentation/annual-charges/dto/record-annual-charges.dto.ts`
- `backend/src/presentation/annual-charges/finders/annual-charges.finder.ts`
- `backend/src/presentation/annual-charges/controllers/record-annual-charges.controller.ts`
- `backend/src/presentation/annual-charges/controllers/get-annual-charges.controller.ts`
- `backend/src/presentation/annual-charges/controllers/get-provisions-collected.controller.ts`
- `backend/src/presentation/annual-charges/projections/annual-charges.projection.ts`
- `backend/src/presentation/annual-charges/annual-charges-presentation.module.ts`
- `backend/src/presentation/annual-charges/__tests__/record-annual-charges.controller.spec.ts`
- `backend/src/presentation/annual-charges/__tests__/get-annual-charges.controller.spec.ts`
- `backend/src/presentation/annual-charges/__tests__/get-provisions-collected.controller.spec.ts`
- `backend/src/presentation/annual-charges/__tests__/annual-charges.projection.spec.ts`
- `backend/src/presentation/annual-charges/__tests__/annual-charges.finder.spec.ts`

Frontend — API + Hooks (2):
- `frontend/src/lib/api/annual-charges-api.ts`
- `frontend/src/hooks/use-annual-charges.ts`

Frontend — Components (4):
- `frontend/src/app/(auth)/charges/page.tsx`
- `frontend/src/components/features/charges/annual-charges-form.tsx`
- `frontend/src/components/features/charges/annual-charges-schema.ts`
- `frontend/src/components/features/charges/charges-summary.tsx`

Frontend — Constants (1):
- `frontend/src/lib/constants/charge-categories.ts`

Frontend — Tests (4):
- `frontend/src/hooks/__tests__/use-annual-charges.test.ts`
- `frontend/src/components/features/charges/__tests__/annual-charges-form.test.tsx`
- `frontend/src/components/features/charges/__tests__/charges-summary.test.tsx`
- `frontend/src/app/(auth)/charges/__tests__/charges-page.test.tsx`

E2E (1):
- `frontend/e2e/charges.spec.ts`

**Modified Files (3):**
- `backend/prisma/schema.prisma`
- `backend/src/app.module.ts`
- `frontend/src/components/layout/sidebar.tsx`
