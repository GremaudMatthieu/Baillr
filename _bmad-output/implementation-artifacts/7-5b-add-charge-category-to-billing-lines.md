# Story 7.5b: Add Charge Category to Billing Lines

Status: done

## Story

As a bailleur,
I want each billing line on a lease to be associated with a charge category (water, electricity, TEOM, cleaning, custom),
So that the annual charges comparison table can automatically match provisions collected to actual charges by category.

## Context

Story 7.5 introduced annual charges entry and a comparison table (ChargesSummary) that matches charges to provisions. The matching currently uses exact label text, which is fragile — billing line labels like "Provision eau froide" won't match charge category labels like "Eau". Adding a `category` field to billing lines creates a reliable link between provisions and actual charges.

This is not in production — backward compatibility with existing data is not required. All existing events, read models, and tests can be updated in place.

## Acceptance Criteria

1. **Given** I configure billing lines on a lease, **When** I add a provision-type line, **Then** I can select a charge category (Eau, Électricité, TEOM, Nettoyage, Autre).

2. **Given** a billing line has type "option", **When** I view the form, **Then** the category field is hidden (options are not linked to charge categories).

3. **Given** billing lines with categories exist on a lease, **When** rent calls are generated, **Then** the category field is carried through to the rent call billing lines.

4. **Given** I view the annual charges comparison table, **When** provisions and charges exist for the same fiscal year, **Then** matching is done by category (not label), and categories without provisions show 0 in the provisions column.

5. **Given** a provision billing line has category "custom", **When** matched against annual charges, **Then** matching falls back to label-based matching for custom categories only.

6. **Given** existing billing lines in the database, **When** the migration runs, **Then** lines without a category field are treated as `null` (unmatched) — no data loss.

## Tasks / Subtasks

- [x] Task 1 — Extend BillingLine VO with category field (Tenancy BC)
  - [x] 1.1 Add `category: string | null` to `BillingLinePrimitives` interface
  - [x] 1.2 Add `_category` private field to `BillingLine` class — nullable, validated via `ChargeCategory.fromString()` when non-null
  - [x] 1.3 Update `fromPrimitives()` — accept optional `category`, validate if present, default to `null`
  - [x] 1.4 Update `toPrimitives()` — include `category` in output
  - [x] 1.5 Update `equals()` — include `category` in comparison
  - [x] 1.6 Import `ChargeCategory` from `@indexation/annual-charges/charge-category` (cross-BC VO import for validation only)
  - [x] 1.7 Update `BillingLine` tests — add category field to all test cases

- [x] Task 2 — Update LeaseAggregate and event (Tenancy BC)
  - [x] 2.1 Update `LeaseBillingLinesConfiguredData` interface — add `category: string | null` to billing line entries
  - [x] 2.2 Update `LeaseAggregate.configureBillingLines()` — pass category through to BillingLine VO
  - [x] 2.3 Update `onLeaseBillingLinesConfigured` handler — store category in state
  - [x] 2.4 Update lease aggregate tests — include category in billing line test data
  - [x] 2.5 Update configure-billing-lines DTO — add optional `@IsOptional() @IsIn([...CATEGORIES, null]) category` field to `BillingLineDto`

- [x] Task 3 — Propagate category through rent call pipeline (Billing BC)
  - [x] 3.1 Update `ActiveLeaseData` interface in `RentCallCalculationService` — add `category: string | null` to billing line type
  - [x] 3.2 Update `RentCallCalculation` interface — add `category` to billing line output
  - [x] 3.3 Update `calculateForMonth()` — carry `category` through pro-rata calculation
  - [x] 3.4 Update `RentCallGeneratedData` event interface — add `category` to billing lines
  - [x] 3.5 Update `RentCallAggregate.generate()` — accept and store category
  - [x] 3.6 Update `generate-rent-calls-for-month.controller.ts` — map `category` from lease to ActiveLeaseData
  - [x] 3.7 Update rent call calculation service tests
  - [x] 3.8 Update rent call aggregate tests

- [x] Task 4 — Update provisions controller to aggregate by category (Indexation/Presentation)
  - [x] 4.1 Update `GetProvisionsCollectedController` — aggregate billing lines by `category` instead of `label`
  - [x] 4.2 Return `{ category: string | null, label: string, totalCents: number }` in details array
  - [x] 4.3 For `category: null` lines, fall back to label-based grouping
  - [x] 4.4 Update provisions controller tests

- [x] Task 5 — Update frontend billing lines form
  - [x] 5.1 Update `billingLineSchema` — add `category: z.string().nullable()`
  - [x] 5.2 Update `BillingLinesForm` — add category Select on each provision-type row (hidden for option type)
  - [x] 5.3 Use `CHARGE_CATEGORY_LABELS` from `@/lib/constants/charge-categories.ts` for Select options, plus "Autre" for custom
  - [x] 5.4 Update `BillingLineData` type in `leases-api.ts` — add `category: string | null`
  - [x] 5.5 Update `RentCallBillingLine` type in `rent-calls-api.ts` — add `category: string | null`
  - [x] 5.6 Update billing lines form tests

- [x] Task 6 — Update ChargesSummary to match by category
  - [x] 6.1 Update `ProvisionsData` details to include `category` field
  - [x] 6.2 Update `ChargesSummary` — match charges to provisions by `category` (not label)
  - [x] 6.3 For `custom` category, match by label as fallback
  - [x] 6.4 Update charges-summary tests

- [x] Task 7 — Update all impacted tests
  - [x] 7.1 Update BillingLinesForm tests — verify category Select renders for provisions
  - [x] 7.2 Update lease detail page tests — include category in mock data
  - [x] 7.3 Update rent call list tests — include category in mock data
  - [x] 7.4 Update E2E fixtures and rent-calls spec — include category in billing line data

## Dev Notes

### Scope of Change

This is a **cross-BC change** touching 3 bounded contexts:
1. **Tenancy BC**: BillingLine VO, LeaseAggregate, event, DTO
2. **Billing BC**: RentCallCalculationService, RentCallAggregate, event, controller
3. **Indexation BC** (presentation): GetProvisionsCollectedController, ChargesSummary

### Cross-BC VO Import

The `BillingLine` VO in Tenancy needs to validate `category` against the same allowed values as `ChargeCategory` in Indexation. Two options:
1. **Import `ChargeCategory` VO** from `@indexation/annual-charges/charge-category` — cross-BC import but for validation only (no aggregate dependency)
2. **Duplicate validation** — inline `ALLOWED_CATEGORIES` array in BillingLine

**Recommendation**: Option 1 — single source of truth. The VO is a pure value type with no infrastructure dependency. Cross-BC VO imports are acceptable per project conventions (see `calculateProRata` import from Tenancy into Billing BC in Story 4.1).

### BillingLine VO Changes

```typescript
// Before:
interface BillingLinePrimitives {
  label: string;
  amountCents: number;
  type: string;
}

// After:
interface BillingLinePrimitives {
  label: string;
  amountCents: number;
  type: string;
  category: string | null;  // NEW — 'water' | 'electricity' | 'teom' | 'cleaning' | 'custom' | null
}
```

`category` is nullable because:
- Option-type billing lines don't have charge categories
- Backward compatibility during replay of old events (old events won't have `category`)

### Event Backward Compatibility

Since the app is not in production, we **update events in place** rather than creating backward-compatible extensions. All existing `LeaseBillingLinesConfigured` and `RentCallGenerated` events in KurrentDB can be wiped (dev database only).

However, the `fromPrimitives()` factory should still handle missing `category` gracefully:
```typescript
static fromPrimitives(data: BillingLinePrimitives): BillingLine {
  // ... existing validation ...
  const category = data.category
    ? ChargeCategory.fromString(data.category)
    : null;
  return new BillingLine(label, data.amountCents, type, category);
}
```

### Provisions Matching Logic

```
Charge Category    | Provision Category | Match Strategy
-------------------|--------------------|------------------
water              | water              | By category ✓
electricity        | electricity        | By category ✓
teom               | teom               | By category ✓
cleaning           | cleaning           | By category ✓
custom ("Gardien") | custom ("Gardien") | By category + label ✓
custom ("Gardien") | custom ("Parking") | No match ✗
water              | null               | No match (legacy) ✗
```

### Frontend Form Changes

The billing lines form gains a category Select per provision row:

```
┌─ Billing Lines ────────────────────────────────────┐
│                                                     │
│ Loyer : 630,00 € (non modifiable)                 │
│                                                     │
│ ── Provisions ──                                   │
│ [Eau       ▼] [Provision eau    ] [  60,00 €] [✕] │
│ [Électricité▼] [Élec. communs   ] [  40,00 €] [✕] │
│ [TEOM      ▼] [TEOM             ] [  20,00 €] [✕] │
│             [+ Ajouter une provision]              │
│                                                     │
│ ── Options ──                                      │
│ [Garage         ] [  50,00 €] [✕]                 │
│             [+ Ajouter une option]                 │
│                                                     │
│ Total mensuel : 800,00 €                           │
│                                                     │
│       [Annuler]  [Enregistrer]                     │
└─────────────────────────────────────────────────────┘
```

Category Select options for provisions:
- Eau
- Électricité
- TEOM
- Nettoyage
- Autre (maps to `custom`)

### Existing Code to Modify

**Backend (Tenancy BC):**
- `backend/src/tenancy/lease/billing-line.ts` — add `category` field
- `backend/src/tenancy/lease/events/lease-billing-lines-configured.event.ts` — add `category` to interface
- `backend/src/tenancy/lease/lease.aggregate.ts` — pass category through
- `backend/src/presentation/lease/dto/configure-billing-lines.dto.ts` — add `category` to DTO

**Backend (Billing BC):**
- `backend/src/billing/rent-call/rent-call-calculation.service.ts` — add `category` to interfaces
- `backend/src/billing/rent-call/rent-call.aggregate.ts` — add `category` to billing lines
- `backend/src/billing/rent-call/events/rent-call-generated.event.ts` — add `category`
- `backend/src/presentation/rent-call/controllers/generate-rent-calls-for-month.controller.ts` — map `category`

**Backend (Indexation/Presentation):**
- `backend/src/presentation/annual-charges/controllers/get-provisions-collected.controller.ts` — aggregate by `category`

**Frontend:**
- `frontend/src/components/features/leases/billing-lines-schema.ts` — add `category`
- `frontend/src/components/features/leases/billing-lines-form.tsx` — add category Select
- `frontend/src/lib/api/leases-api.ts` — add `category` to `BillingLineData`
- `frontend/src/lib/api/rent-calls-api.ts` — add `category` to `RentCallBillingLine`
- `frontend/src/lib/api/annual-charges-api.ts` — add `category` to `ProvisionsData.details`
- `frontend/src/components/features/charges/charges-summary.tsx` — match by category

**Tests (all co-located `__tests__/`):**
- All billing line, lease, rent call, and charges tests need `category` field added to mock data

### Existing Code to Leverage

1. **`ChargeCategory` VO** from Story 7.5 — reuse for validation
2. **`CHARGE_CATEGORY_LABELS`** constant — reuse for Select options
3. **`BillingLineType` VO** — same pattern for the existing `type` field
4. **Radix `Select` component** — already used throughout the app
5. **`@IsOptional()` + `@IsIn()` pattern** — established in DTO validation

### Testing Approach

**Unit tests**: Update all existing tests to include `category: null` or `category: 'water'` in billing line data. Add specific tests for:
- BillingLine VO with valid/invalid categories
- Category carried through rent call calculation (including pro-rata)
- Provisions aggregation by category
- ChargesSummary matching by category

**E2E**: Update `charges.spec.ts` to verify category-based matching works end-to-end (create lease with categorized billing lines → generate rent calls → pay → enter charges → verify comparison).

### References

- [Source: Story 7.5 — Annual charges entry, ChargeCategory VO, ChargesSummary component]
- [Source: Story 3.4 — BillingLine VO, configureBillingLines(), BillingLinesForm]
- [Source: Story 4.1 — RentCallCalculationService, rent call generation pipeline]
- [Source: docs/anti-patterns.md — cross-BC imports, DTO validation patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None.

### Completion Notes List

- Cross-BC VO import: `ChargeCategory` from `@indexation/annual-charges/charge-category.js` into `BillingLine` VO — single source of truth for allowed category values
- Custom category matching bug fixed: `matchedProvisionKeys` key generation for `custom` category now uses `custom:${label}` prefix (not `cat:custom`) to avoid key collision between different custom categories
- Command type updated: `ConfigureLeaseBillingLinesCommand.billingLines` type extended with `category: string | null`
- Controller maps `category: line.category ?? null` to ensure null safety
- All existing tests updated to include `category` in billing line mock data
- 3 new frontend tests added: category Select rendering for provisions, hidden for options, submit with null category
- 2 new charges-summary tests: category-based matching, custom category label fallback

### File List

**Modified (33 files):**

Backend — Domain (Tenancy BC):
- `backend/src/tenancy/lease/billing-line.ts` — added `category: string | null` to BillingLinePrimitives, `_category: ChargeCategory | null` field, cross-BC import
- `backend/src/tenancy/lease/lease.aggregate.ts` — added `category` to BillingLineState, configureBillingLines(), event handler
- `backend/src/tenancy/lease/commands/configure-lease-billing-lines.command.ts` — added `category` to billingLines type
- `backend/src/tenancy/lease/__tests__/billing-line.spec.ts` — added category to all test data
- `backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts` — added category to billing line test data
- `backend/src/tenancy/lease/__tests__/configure-lease-billing-lines.handler.spec.ts` — added category to command test data

Backend — Domain (Billing BC):
- `backend/src/billing/rent-call/rent-call-calculation.service.ts` — added `category` to ActiveLeaseData and RentCallCalculation interfaces
- `backend/src/billing/rent-call/rent-call.aggregate.ts` — added `category` to billing lines state and generate()
- `backend/src/billing/rent-call/events/rent-call-generated.event.ts` — added `category` to RentCallGeneratedData
- `backend/src/billing/rent-call/__tests__/rent-call-calculation.service.spec.ts` — added category to test data
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts` — added category to test data
- `backend/src/billing/rent-call/__tests__/rent-call.aggregate.partial-payment.spec.ts` — added category to test data
- `backend/src/billing/rent-call/__tests__/generate-rent-calls-for-month.handler.spec.ts` — added category to test data

Backend — Presentation:
- `backend/src/presentation/lease/dto/configure-lease-billing-lines.dto.ts` — added `@IsOptional() @ValidateIf() @IsString() @IsIn()` category field
- `backend/src/presentation/lease/controllers/configure-lease-billing-lines.controller.ts` — maps `category: line.category ?? null`
- `backend/src/presentation/lease/__tests__/configure-lease-billing-lines.controller.spec.ts` — added category to test data
- `backend/src/presentation/rent-call/controllers/generate-rent-calls-for-month.controller.ts` — added category to cast type
- `backend/src/presentation/annual-charges/controllers/get-provisions-collected.controller.ts` — category-based aggregation
- `backend/src/presentation/annual-charges/__tests__/get-provisions-collected.controller.spec.ts` — added category tests

Frontend — API types:
- `frontend/src/lib/api/leases-api.ts` — added `category: string | null` to BillingLineData
- `frontend/src/lib/api/rent-calls-api.ts` — added `category: string | null` to RentCallBillingLine
- `frontend/src/lib/api/annual-charges-api.ts` — added `category: string | null` to ProvisionDetail

Frontend — Components:
- `frontend/src/components/features/leases/billing-lines-schema.ts` — added `category: z.enum(["water", ...]).nullable()` (validated enum, not open string)
- `frontend/src/components/features/leases/billing-lines-form.tsx` — added category Select per provision row
- `frontend/src/components/features/charges/charges-summary.tsx` — category-based matching with custom label fallback

Frontend — Tests:
- `frontend/src/components/features/leases/__tests__/billing-lines-form.test.tsx` — 3 new tests + category in mock data
- `frontend/src/app/(auth)/leases/[id]/__tests__/lease-detail-page.test.tsx` — category in mock data
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx` — category in mock data
- `frontend/src/components/features/charges/__tests__/charges-summary.test.tsx` — 2 new tests + category in provisions

Frontend — E2E:
- `frontend/e2e/fixtures/api.fixture.ts` — added category to billingLines type
- `frontend/e2e/rent-calls.spec.ts` — added category to billing line data

Sprint management:
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status updated
- `_bmad-output/implementation-artifacts/7-5b-add-charge-category-to-billing-lines.md` — story file updated

## Senior Developer Review (AI)

**Reviewer:** Monsieur — 2026-02-14
**Outcome:** Approved with fixes (all applied)

### Review Summary

- **Total findings:** 10 (1 High, 5 Medium, 4 Low)
- **Fixed:** 7 (1H, 2M, 4L)
- **Skipped (by design):** 3 (M3: follows entity-level auth pattern; M4/M5: AC says "can select" not "must select")

### Findings & Fixes Applied

**H1 [FIXED] — Duplicate VO `BillingLineCategory` instead of cross-BC import from `ChargeCategory`**
- Story Task 1.6 specified importing `ChargeCategory` from `@indexation/annual-charges/charge-category`, but implementation created a duplicate local VO with identical logic
- **Fix:** Replaced `BillingLineCategory` import with `ChargeCategory` from `@indexation/annual-charges/charge-category.js` in `billing-line.ts`. Deleted 3 duplicate files: `billing-line-category.ts`, `invalid-billing-line-category.exception.ts`, `billing-line-category.spec.ts`

**M1 [FIXED] — File List missing 3 new files**
- Auto-resolved by H1 fix — duplicate files deleted, File List now accurate (33 modified, 0 new)

**M2 [FIXED] — Zod schema `category` too permissive (`z.string()` instead of `z.enum()`)**
- `billing-lines-schema.ts` accepted any string, bypassing client-side validation
- **Fix:** Changed to `z.enum(["water", "electricity", "teom", "cleaning", "custom"]).nullable()`. Added type casts in `billing-lines-form.tsx` for `defaultValues` and `onValueChange`

**M3 [SKIPPED] — Provisions controller no `userId` in Prisma query**
- Follows established entity-level authorization pattern: entity ownership verified via `entityFinder.findByIdAndUserId`, then queries scoped to `entityId`. Consistent with all other controllers.

**M4 [SKIPPED] — Select cannot be cleared once category chosen**
- AC1 says "I can select a charge category" — selecting is optional, provisions should have categories (whole point of story). Deselecting defeats purpose.

**M5 [SKIPPED] — New provision lines default to `null` category**
- AC says "can select" not "must select". Category is optional by design.

**L1 [FIXED] — `BillingLineCategory` missing `equals()` method**
- Auto-resolved by H1 fix — `ChargeCategory` already has `equals()`

**L2 [FIXED] — Unsafe `as` cast before validation in `fromString()`**
- Auto-resolved by H1 fix — `ChargeCategory` doesn't have this issue

**L3 [FIXED] — Architectural decision not documented in Completion Notes**
- Auto-resolved by H1 fix — now correctly uses cross-BC import as specified

**L4 [FIXED] — File List inaccuracy for `generate-rent-calls-for-month.handler.spec.ts`**
- File present in git diff but not explicitly called out in Tasks. File List already includes it — minor task description gap only.

### Change Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-14 | Code review | 10 findings (1H, 5M, 4L), 7 fixes applied |
