# Story 7.5b: Add Charge Category to Billing Lines

Status: ready-for-dev

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

- [ ] Task 1 — Extend BillingLine VO with category field (Tenancy BC)
  - [ ] 1.1 Add `category: string | null` to `BillingLinePrimitives` interface
  - [ ] 1.2 Add `_category` private field to `BillingLine` class — nullable, validated via `ChargeCategory.fromString()` when non-null
  - [ ] 1.3 Update `fromPrimitives()` — accept optional `category`, validate if present, default to `null`
  - [ ] 1.4 Update `toPrimitives()` — include `category` in output
  - [ ] 1.5 Update `equals()` — include `category` in comparison
  - [ ] 1.6 Import `ChargeCategory` from `@indexation/annual-charges/charge-category` (cross-BC VO import for validation only)
  - [ ] 1.7 Update `BillingLine` tests — add category field to all test cases

- [ ] Task 2 — Update LeaseAggregate and event (Tenancy BC)
  - [ ] 2.1 Update `LeaseBillingLinesConfiguredData` interface — add `category: string | null` to billing line entries
  - [ ] 2.2 Update `LeaseAggregate.configureBillingLines()` — pass category through to BillingLine VO
  - [ ] 2.3 Update `onLeaseBillingLinesConfigured` handler — store category in state
  - [ ] 2.4 Update lease aggregate tests — include category in billing line test data
  - [ ] 2.5 Update configure-billing-lines DTO — add optional `@IsOptional() @IsIn([...CATEGORIES, null]) category` field to `BillingLineDto`

- [ ] Task 3 — Propagate category through rent call pipeline (Billing BC)
  - [ ] 3.1 Update `ActiveLeaseData` interface in `RentCallCalculationService` — add `category: string | null` to billing line type
  - [ ] 3.2 Update `RentCallCalculation` interface — add `category` to billing line output
  - [ ] 3.3 Update `calculateForMonth()` — carry `category` through pro-rata calculation
  - [ ] 3.4 Update `RentCallGeneratedData` event interface — add `category` to billing lines
  - [ ] 3.5 Update `RentCallAggregate.generate()` — accept and store category
  - [ ] 3.6 Update `generate-rent-calls-for-month.controller.ts` — map `category` from lease to ActiveLeaseData
  - [ ] 3.7 Update rent call calculation service tests
  - [ ] 3.8 Update rent call aggregate tests

- [ ] Task 4 — Update provisions controller to aggregate by category (Indexation/Presentation)
  - [ ] 4.1 Update `GetProvisionsCollectedController` — aggregate billing lines by `category` instead of `label`
  - [ ] 4.2 Return `{ category: string | null, label: string, totalCents: number }` in details array
  - [ ] 4.3 For `category: null` lines, fall back to label-based grouping
  - [ ] 4.4 Update provisions controller tests

- [ ] Task 5 — Update frontend billing lines form
  - [ ] 5.1 Update `billingLineSchema` — add `category: z.string().nullable()`
  - [ ] 5.2 Update `BillingLinesForm` — add category Select on each provision-type row (hidden for option type)
  - [ ] 5.3 Use `CHARGE_CATEGORY_LABELS` from `@/lib/constants/charge-categories.ts` for Select options, plus "Autre" for custom
  - [ ] 5.4 Update `BillingLineData` type in `leases-api.ts` — add `category: string | null`
  - [ ] 5.5 Update `RentCallBillingLine` type in `rent-calls-api.ts` — add `category: string | null`
  - [ ] 5.6 Update billing lines form tests

- [ ] Task 6 — Update ChargesSummary to match by category
  - [ ] 6.1 Update `ProvisionsData` details to include `category` field
  - [ ] 6.2 Update `ChargesSummary` — match charges to provisions by `category` (not label)
  - [ ] 6.3 For `custom` category, match by label as fallback
  - [ ] 6.4 Update charges-summary tests

- [ ] Task 7 — Update all impacted tests
  - [ ] 7.1 Update BillingLinesForm tests — verify category Select renders for provisions
  - [ ] 7.2 Update lease detail page tests — include category in mock data
  - [ ] 7.3 Update rent call list tests — include category in mock data
  - [ ] 7.4 Update charges page E2E — verify category-based matching

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
