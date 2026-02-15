# Story 7.5c: Normalize Billing Lines with Charge Category Table

Status: done

## Story

As a bailleur,
I want billing lines on a lease to directly reference charge categories from a shared table,
So that the mapping between provisions collected and actual annual charges is automatic, reliable, and free of data mismatch.

## Context

The current billing line model stores a JSON blob on the Lease and RentCall tables: `{ label, amountCents, type, category }`. This creates 3 problems:
1. **Label/category mismatch**: The label is a free-text field independent from the category select, so a user can set `label="Charges"` with `category="water"` — nonsensical.
2. **Type field is redundant**: The `provision` vs `option` distinction adds no value. Everything on a billing line is a charge. Whether it participates in annual regularization is a property of the charge category, not the billing line.
3. **Custom categories are disconnected**: Custom charges entered in `/charges` (e.g. "Tva", "Charges") are not available as options in the billing lines form on leases.

### Target model

Replace the JSON blob with a normalized relation:

```
ChargeCategory (new table)
├── id (UUID, PK)
├── entityId (FK → entities)
├── slug (string, unique per entity: "water", "electricity", "teom", "cleaning", "tva", "parking"...)
├── label (string: "Eau", "Électricité", "TEOM", "Nettoyage", "Tva", "Parking"...)
├── isStandard (boolean: true for 4 seeded categories, false for custom)
├── createdAt, updatedAt

LeaseBillingLine (new table, replaces Lease.billingLines JSON)
├── id (UUID, PK)
├── leaseId (FK → leases)
├── chargeCategoryId (FK → charge_categories)
├── amountCents (Int)
```

RentCall.billingLines JSON stays as a **denormalized snapshot** (historical record at generation time), but now includes `chargeCategoryId` + `label` (derived from the category at generation time).

The billing line form on leases becomes: `[Category Select ▾] [Amount €] [🗑️]`. One select, one input. No label field, no type field.

### Migration strategy

- Not in production — existing data can be wiped/rebuilt
- Seed 4 standard charge categories per entity on first access (or via migration)
- Custom categories created via `/charges` page are auto-available in billing line form
- Existing rent call JSON snapshots remain unchanged (backward compatible read)

## Acceptance Criteria

1. **Given** an entity exists, **When** I view the billing lines form on a lease, **Then** I see a single Select dropdown listing all charge categories for this entity (4 standard + any custom ones from `/charges`), and an amount input. No label field, no type field.

2. **Given** custom charges "Tva" and "Charges" exist in `/charges` for my entity, **When** I configure billing lines on a lease, **Then** "Tva" and "Charges" appear as options in the category Select alongside the 4 standard categories.

3. **Given** billing lines are configured on a lease referencing charge categories, **When** rent calls are generated, **Then** each rent call billing line snapshot includes the `chargeCategoryId` and the category `label` (resolved at generation time).

4. **Given** rent calls with categorized billing lines are paid, **When** I view the annual charges comparison on `/charges`, **Then** provisions are matched to actual charges by `chargeCategoryId` — automatic, no label-based matching.

5. **Given** I add a new custom category in `/charges`, **When** I go back to a lease's billing lines form, **Then** the new category is immediately available in the Select dropdown (no form reload needed if using React Query cache invalidation).

6. **Given** the existing `Lease.billingLines` JSON column, **When** the migration runs, **Then** it is replaced by the `lease_billing_lines` relation table. No data loss — existing billing lines are converted to FK references.

7. **Given** existing rent calls with old-format billing lines JSON (no `chargeCategoryId`), **When** provisions are queried, **Then** old rent calls without `chargeCategoryId` are matched by label as fallback (backward compatibility for historical data).

## Tasks / Subtasks

- [x] Task 1 — Create ChargeCategory Prisma model and seeding (Indexation BC)
  - [x] 1.1 Add `ChargeCategory` model to Prisma schema: `id`, `entityId`, `slug`, `label`, `isStandard`, `createdAt`, `updatedAt`. Add `@@unique([entityId, slug])`.
  - [x] 1.2 Run `prisma generate` and `prisma db push`
  - [x] 1.3 Create `ChargeCategoryFinder` — `findByEntityId(entityId)`, `findBySlug(entityId, slug)`
  - [x] 1.4 Create seed logic: auto-create 4 standard categories (water/Eau, electricity/Électricité, teom/TEOM, cleaning/Nettoyage) for an entity on first access if missing
  - [x] 1.5 Create `GetChargeCategoriesController` — `GET /api/entities/:entityId/charge-categories` → returns all categories for entity
  - [x] 1.6 Create `CreateChargeCategoryController` — `POST /api/entities/:entityId/charge-categories` → creates a custom category (slug auto-generated from label)
  - [x] 1.7 Write finder + controller unit tests

- [x] Task 2 — Create LeaseBillingLine Prisma model (Tenancy BC)
  - [x] 2.1 Add `LeaseBillingLine` model to Prisma schema: `id`, `leaseId`, `chargeCategoryId`, `amountCents`. Add `@@unique([leaseId, chargeCategoryId])` (one billing line per category per lease).
  - [x] 2.2 Remove `billingLines Json` column from `Lease` model (replaced by relation)
  - [x] 2.3 Add relation: `Lease.billingLines → LeaseBillingLine[]`
  - [x] 2.4 Run `prisma generate` and `prisma db push`
  - [x] 2.5 Write migration to convert existing JSON data to relation rows (dev-only, can be destructive)

- [x] Task 3 — Update LeaseAggregate and domain layer (Tenancy BC)
  - [x] 3.1 Simplify `BillingLine` VO: remove `label`, remove `type`, replace `category: ChargeCategory | null` with `chargeCategoryId: string`
  - [x] 3.2 Update `BillingLinePrimitives` interface: `{ chargeCategoryId: string, amountCents: number }`
  - [x] 3.3 Update `LeaseAggregate.configureBillingLines()` — accept simplified billing line data
  - [x] 3.4 Update `LeaseBillingLinesConfigured` event — simplified payload
  - [x] 3.5 Update `ConfigureLeaseBillingLinesCommand` — simplified payload
  - [x] 3.6 Delete `BillingLineType` VO (no longer needed)
  - [x] 3.7 Remove cross-BC `ChargeCategory` VO import from `BillingLine` (validation now done at presentation layer via FK lookup)
  - [x] 3.8 Write updated aggregate + VO tests

- [x] Task 4 — Update lease presentation layer (Presentation)
  - [x] 4.1 Simplify `ConfigureLeaseBillingLinesDto` — `billingLines: { chargeCategoryId: string, amountCents: number }[]`
  - [x] 4.2 Update `ConfigureLeaseBillingLinesController` — validate chargeCategoryIds belong to entity via `ChargeCategoryFinder`
  - [x] 4.3 Update lease projection — write to `lease_billing_lines` table instead of JSON column
  - [x] 4.4 Update lease detail endpoint — join `LeaseBillingLine` with `ChargeCategory` to return `{ chargeCategoryId, categoryLabel, categorySlug, amountCents }`
  - [x] 4.5 Write controller + projection tests

- [x] Task 5 — Update rent call pipeline (Billing BC)
  - [x] 5.1 Update `ActiveLeaseData` interface — billing lines become `{ chargeCategoryId: string, categoryLabel: string, amountCents: number }`
  - [x] 5.2 Update `RentCallCalculationService` — carry `chargeCategoryId` + `categoryLabel` through pro-rata calculation
  - [x] 5.3 Update `RentCallAggregate.generate()` — store `chargeCategoryId` + `categoryLabel` in billing lines snapshot
  - [x] 5.4 Update `RentCallGeneratedData` event — add `chargeCategoryId` to billing lines
  - [x] 5.5 Update `generate-rent-calls-for-month.controller.ts` — join lease billing lines with category data before passing to calculation service
  - [x] 5.6 Write updated calculation service + aggregate tests

- [x] Task 6 — Update provisions controller and annual charges (Indexation/Presentation)
  - [x] 6.1 Update `GetProvisionsCollectedController` — match by `chargeCategoryId` instead of category string. Fallback to label matching for old rent calls without `chargeCategoryId`.
  - [x] 6.2 Update `AnnualChargesAggregate` — reference charge categories by ID instead of string enum
  - [x] 6.3 Update annual charges form to use charge categories from table (standard pre-filled + custom listed)
  - [x] 6.4 When recording annual charges, auto-create missing custom charge categories for the entity
  - [x] 6.5 Write updated controller + form tests

- [x] Task 7 — Simplify frontend billing lines form
  - [x] 7.1 Create `useChargeCategories(entityId)` hook — fetches all charge categories for entity via React Query
  - [x] 7.2 Simplify `BillingLinesForm` — replace label input + category select + type select with single category Select + amount input
  - [x] 7.3 Update `billingLinesSchema` — `{ chargeCategoryId: z.string().uuid(), amount: z.number().min(0).max(999999.99) }`
  - [x] 7.4 Update `BillingLineData` type in `leases-api.ts` — `{ chargeCategoryId: string, categoryLabel: string, amountCents: number }`
  - [x] 7.5 Update lease detail page — display category label (from API response), no more raw label
  - [x] 7.6 Update `RentCallBillingLine` type in `rent-calls-api.ts` — add `chargeCategoryId`, keep `label` for display
  - [x] 7.7 Write form + page tests

- [x] Task 8 — Update ChargesSummary and annual charges page
  - [x] 8.1 Update `ChargesSummary` — match by `chargeCategoryId` (trivial with FK). No more label-based fallback for new data.
  - [x] 8.2 Update `ProvisionsData` type — include `chargeCategoryId` in details
  - [x] 8.3 Update annual charges form — use `useChargeCategories()` hook, show standard + custom categories
  - [x] 8.4 Remove `CHARGE_CATEGORY_LABELS` constant (labels come from database)
  - [x] 8.5 Remove `FIXED_CATEGORIES` constant (standard categories identified by `isStandard` flag)
  - [x] 8.6 Write summary + form tests

- [x] Task 9 — Update PDF templates, email templates, and receipts
  - [x] 9.1 Update `RentCallPdfAssembler` — resolve category labels from rent call snapshot (already denormalized)
  - [x] 9.2 Update `renderRentCallPdf` template — use `categoryLabel` instead of `label` for billing line display
  - [x] 9.3 Update receipt template — same change
  - [x] 9.4 Update email template — same change
  - [x] 9.5 Write template tests

- [x] Task 10 — E2E tests and cleanup
  - [x] 10.1 Update E2E rent-calls spec — billing lines form now uses category Select
  - [x] 10.2 Add E2E test: create custom charge in `/charges` → configure billing line with that category on lease → generate rent call → pay → verify provisions match
  - [x] 10.3 Delete `BillingLineType` VO file and tests
  - [x] 10.4 Delete `ChargeCategory` VO from indexation BC (replaced by database table + finder)
  - [x] 10.5 Run full test suite (backend + frontend + E2E) and verify clean typecheck

## Dev Notes

### Architecture Decisions

**ChargeCategory as a database table, not a VO**: The current `ChargeCategory` VO is a hardcoded enum (`water | electricity | teom | cleaning | custom`). This prevents users from creating their own categories. By moving to a database table, categories become entity-scoped and extensible.

**No more `type` field (provision/option)**: The `provision` vs `option` distinction on billing lines was meant to separate regularizable charges from fixed fees. But in practice: (1) the user doesn't care about this distinction at billing line level, (2) whether something is regularizable can be inferred from whether an annual charge entry exists for that category, (3) removing it simplifies the form from 4 fields to 2.

**Rent call billingLines stays as JSON**: Rent calls are immutable snapshots. Normalizing them would break historical data and add unnecessary complexity. The JSON just gains a `chargeCategoryId` field alongside the existing `label`/`amountCents`.

**Standard categories seeded per entity**: The 4 standard categories (water, electricity, teom, cleaning) are auto-created for each entity on first access. This ensures they're always available without requiring user action.

**@@unique([leaseId, chargeCategoryId])**: A lease can only have one billing line per charge category. This prevents duplicates and makes the form deterministic.

### Data Model Changes

```
BEFORE (JSON blob):
Lease.billingLines = [
  { label: "Eau", amountCents: 34000, type: "provision", category: "water" },
  { label: "Tva", amountCents: 13200, type: "provision", category: "teom" },  ← WRONG
]

AFTER (normalized):
charge_categories:
  { id: "cat-1", entityId: "e1", slug: "water",  label: "Eau",  isStandard: true  }
  { id: "cat-2", entityId: "e1", slug: "teom",   label: "TEOM", isStandard: true  }
  { id: "cat-3", entityId: "e1", slug: "tva",    label: "Tva",  isStandard: false }

lease_billing_lines:
  { leaseId: "l1", chargeCategoryId: "cat-1", amountCents: 34000 }
  { leaseId: "l1", chargeCategoryId: "cat-2", amountCents: 13200 }
  { leaseId: "l1", chargeCategoryId: "cat-3", amountCents: 12000 }
```

No label field. No type field. No mismatch possible.

### Form UX Change

```
BEFORE:
[Label input  ] [Category ▾] [Amount €] [Type ▾] [🗑️]
[Eau          ] [Eau       ] [340,00  ] [Prov. ] [🗑️]

AFTER:
[Category ▾   ] [Amount €] [🗑️]
[Eau          ] [340,00  ] [🗑️]
[TEOM         ] [132,00  ] [🗑️]
[Tva          ] [120,00  ] [🗑️]  ← custom category from /charges
[+ Ajouter]
```

### Backward Compatibility for Rent Calls

Old rent calls have billing lines without `chargeCategoryId`:
```json
[{"type": "option", "label": "Charges", "amountCents": 34000}]
```

The provisions controller handles this with a fallback:
1. If `chargeCategoryId` exists → match by FK (exact)
2. If `chargeCategoryId` is missing → match by `label` (fuzzy, legacy)

### Existing Code to Leverage

1. **Radix `Select` component** — already used throughout the app
2. **React Query hooks pattern** — `useChargeCategories(entityId)` follows existing `useEntities()` pattern
3. **Prisma relation pattern** — `LeaseBillingLine` follows existing table patterns
4. **Entity-level auth pattern** — charge categories scoped by entity, validated via `entityFinder`

### Existing Code to Delete

1. `backend/src/tenancy/lease/billing-line-type.ts` — BillingLineType VO (no more type field)
2. `backend/src/indexation/annual-charges/charge-category.ts` — ChargeCategory VO (replaced by DB table)
3. `frontend/src/lib/constants/charge-categories.ts` — hardcoded labels (replaced by DB data)
4. Associated test files for deleted code

### References

- [Source: Story 7.5 — Annual charges entry, ChargeCategory VO, ChargesSummary component]
- [Source: Story 7.5b — Category field on billing lines, cross-BC import]
- [Source: Story 3.4 — BillingLine VO, configureBillingLines(), BillingLinesForm]
- [Source: Story 4.1 — RentCallCalculationService, rent call generation pipeline]

## Completion Notes

### Summary (2026-02-14)

- 10 tasks, 1262 backend tests (176 suites) + 695 frontend tests (90 suites)
- 10 new files + 67 modified + 5 deleted
- Major normalization refactoring: billingLines JSON → LeaseBillingLine FK relation + ChargeCategory table

### Key Changes

1. **ChargeCategory Prisma model + seeder**: `charge_categories` table with `@@unique([entityId, slug])`, auto-seeds 4 standard categories (water/Eau, electricity/Électricité, teom/TEOM, cleaning/Nettoyage) on first access per entity
2. **LeaseBillingLine Prisma model**: replaced `Lease.billingLines Json` column with normalized `lease_billing_lines` relation table (`@@unique([leaseId, chargeCategoryId])`)
3. **BillingLine VO simplified**: removed `label`, `type`, `category` fields → replaced with single `chargeCategoryId: string`
4. **Deleted BillingLineType VO**: no more `provision`/`option` distinction — everything is a charge
5. **Deleted ChargeCategory VO from indexation BC**: replaced by database table + `ChargeCategoryFinder`
6. **Rent call pipeline updated**: `RentCallCalculationService` + `RentCallAggregate` carry `chargeCategoryId` + `categoryLabel` through snapshot
7. **Provisions matching by FK**: `GetProvisionsCollectedController` matches by `chargeCategoryId` with label-based fallback for old rent calls
8. **PDF/receipt/email templates**: use `categoryLabel` from denormalized snapshot instead of old `label` field

### Additional Functional Changes (post-implementation)

9. **Annual charges form refactored**: removed hardcoded `FIXED_CATEGORIES` and `CHARGE_CATEGORY_LABELS` constants, replaced with dynamic `useChargeCategories()` hook. Standard categories pre-filled, custom categories from DB listed. `ChargeEntryData` interface changed from `category: string` to `chargeCategoryId: string`.
10. **Inline category creation**: added `useCreateChargeCategory(entityId)` mutation hook + inline Input/Button UI in `AnnualChargesForm` for creating new charge categories directly from the `/charges` page. Removed redundant "Ajouter une catégorie" button — unified with Select for existing unused categories + Input for new categories.
11. **Billing lines form layout fix**: CSS Grid DOM order bug fixed — amount input and delete button columns were swapped due to DOM order not matching `sm:grid-cols-[1fr_140px_40px]` template (category, amount, delete).

## File List

### New Files (12)
- `backend/src/presentation/charge-category/charge-category-presentation.module.ts`
- `backend/src/presentation/charge-category/charge-category-seeder.ts`
- `backend/src/presentation/charge-category/controllers/get-charge-categories.controller.ts`
- `backend/src/presentation/charge-category/controllers/create-charge-category.controller.ts`
- `backend/src/presentation/charge-category/dto/create-charge-category.dto.ts`
- `backend/src/presentation/charge-category/finders/charge-category.finder.ts`
- `backend/src/presentation/charge-category/__tests__/charge-category.finder.spec.ts`
- `backend/src/presentation/charge-category/__tests__/get-charge-categories.controller.spec.ts`
- `backend/src/presentation/charge-category/__tests__/create-charge-category.controller.spec.ts`
- `backend/src/presentation/charge-category/__tests__/charge-category-seeder.spec.ts`
- `frontend/src/hooks/use-charge-categories.ts`
- `frontend/src/lib/api/charge-categories-api.ts`

### Deleted Files (5)
- `backend/src/indexation/annual-charges/charge-category.ts`
- `backend/src/indexation/annual-charges/__tests__/charge-category.spec.ts`
- `backend/src/indexation/annual-charges/exceptions/invalid-charge-category.exception.ts`
- `frontend/src/lib/constants/billing-line-types.ts`
- `frontend/src/lib/constants/charge-categories.ts`

### Modified Files — Backend (44)
- `backend/prisma/schema.prisma`
- `backend/src/app.module.ts`
- `backend/src/billing/rent-call/__tests__/generate-rent-calls-for-month.handler.spec.ts`
- `backend/src/billing/rent-call/__tests__/rent-call-calculation.service.spec.ts`
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.partial-payment.spec.ts`
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts`
- `backend/src/billing/rent-call/events/rent-call-generated.event.ts`
- `backend/src/billing/rent-call/rent-call-calculation.service.ts`
- `backend/src/billing/rent-call/rent-call.aggregate.ts`
- `backend/src/indexation/annual-charges/__tests__/annual-charges.aggregate.spec.ts`
- `backend/src/indexation/annual-charges/__tests__/charge-entry.spec.ts`
- `backend/src/indexation/annual-charges/__tests__/record-annual-charges.handler.spec.ts`
- `backend/src/indexation/annual-charges/annual-charges.aggregate.ts`
- `backend/src/indexation/annual-charges/charge-entry.ts`
- `backend/src/indexation/annual-charges/events/annual-charges-recorded.event.ts`
- `backend/src/infrastructure/document/__tests__/receipt-pdf-data.fixture.ts`
- `backend/src/infrastructure/document/__tests__/receipt.template.spec.ts`
- `backend/src/infrastructure/document/__tests__/rent-call-pdf-data.fixture.ts`
- `backend/src/infrastructure/document/receipt-pdf-data.interface.ts`
- `backend/src/infrastructure/document/rent-call-pdf-data.interface.ts`
- `backend/src/infrastructure/document/templates/receipt.template.ts`
- `backend/src/infrastructure/document/templates/rent-call.template.ts`
- `backend/src/presentation/annual-charges/__tests__/get-provisions-collected.controller.spec.ts`
- `backend/src/presentation/annual-charges/__tests__/record-annual-charges.controller.spec.ts`
- `backend/src/presentation/annual-charges/controllers/get-provisions-collected.controller.ts`
- `backend/src/presentation/annual-charges/dto/record-annual-charges.dto.ts`
- `backend/src/presentation/lease/__tests__/configure-lease-billing-lines.controller.spec.ts`
- `backend/src/presentation/lease/__tests__/get-a-lease.controller.spec.ts`
- `backend/src/presentation/lease/__tests__/lease.projection.spec.ts`
- `backend/src/presentation/lease/controllers/configure-lease-billing-lines.controller.ts`
- `backend/src/presentation/lease/controllers/get-a-lease.controller.ts`
- `backend/src/presentation/lease/dto/configure-lease-billing-lines.dto.ts`
- `backend/src/presentation/lease/finders/lease.finder.ts`
- `backend/src/presentation/lease/lease-presentation.module.ts`
- `backend/src/presentation/lease/projections/lease.projection.ts`
- `backend/src/presentation/rent-call/__tests__/generate-rent-calls-for-month.controller.spec.ts`
- `backend/src/presentation/rent-call/controllers/generate-rent-calls-for-month.controller.ts`
- `backend/src/presentation/rent-call/services/receipt-pdf-assembler.service.ts`
- `backend/src/presentation/rent-call/services/rent-call-pdf-assembler.service.ts`
- `backend/src/tenancy/lease/__tests__/billing-line.spec.ts`
- `backend/src/tenancy/lease/__tests__/configure-lease-billing-lines.handler.spec.ts`
- `backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts`
- `backend/src/tenancy/lease/billing-line.ts`
- `backend/src/tenancy/lease/commands/configure-lease-billing-lines.command.ts`
- `backend/src/tenancy/lease/events/lease-billing-lines-configured.event.ts`
- `backend/src/tenancy/lease/exceptions/invalid-billing-line.exception.ts`
- `backend/src/tenancy/lease/lease.aggregate.ts`

### Modified Files — Frontend (23)
- `frontend/e2e/fixtures/api.fixture.ts`
- `frontend/e2e/rent-calls.spec.ts`
- `frontend/src/app/(auth)/charges/__tests__/charges-page.test.tsx`
- `frontend/src/app/(auth)/charges/page.tsx`
- `frontend/src/app/(auth)/leases/[id]/__tests__/lease-detail-page.test.tsx`
- `frontend/src/components/features/charges/__tests__/annual-charges-form.test.tsx`
- `frontend/src/components/features/charges/__tests__/charges-summary.test.tsx`
- `frontend/src/components/features/charges/annual-charges-form.tsx`
- `frontend/src/components/features/charges/annual-charges-schema.ts`
- `frontend/src/components/features/charges/charges-summary.tsx`
- `frontend/src/components/features/leases/__tests__/billing-lines-form.test.tsx`
- `frontend/src/components/features/leases/billing-lines-form.tsx`
- `frontend/src/components/features/leases/billing-lines-schema.ts`
- `frontend/src/components/features/leases/lease-detail-content.tsx`
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx`
- `frontend/src/components/features/rent-calls/rent-call-list.tsx`
- `frontend/src/hooks/__tests__/use-annual-charges.test.ts`
- `frontend/src/lib/api/annual-charges-api.ts`
- `frontend/src/lib/api/leases-api.ts`
- `frontend/src/lib/api/rent-calls-api.ts`

## Dev Agent Record

- **Date**: 2026-02-14
- **Duration**: ~3h (across 2 sessions due to context window)
- **Backend tests**: 1262 (176 suites) — all passing
- **Frontend tests**: 695 (90 suites) — all passing
- **Typecheck**: clean (backend + frontend)
- **Scope**: largest single refactoring in project history — touched 67 modified + 10 new + 5 deleted files across 5 BCs (Portfolio, Tenancy, Billing, Indexation, Presentation) + frontend
- **Post-implementation fixes**: annual charges form category creation, redundant button removal, billing lines form grid layout bug
