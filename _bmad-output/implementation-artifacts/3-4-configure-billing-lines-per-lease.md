# Story 3.4: Configure Billing Lines Per Lease

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to configure billing lines for each lease (rent, charge provisions, billable options),
So that rent calls reflect the exact amounts due per tenant (FR13).

## Acceptance Criteria

1. **Given** I have an active lease, **When** I view the lease detail page, **Then** I see a "Lignes de facturation" section displaying the default rent line (from lease creation, label "Loyer", type `rent`, amount = lease's `rentAmountCents`)
2. **Given** I view the billing lines section, **When** I click "Configurer les lignes", **Then** I see an editable form with the existing billing lines and can add/remove/edit lines
3. **Given** I am editing billing lines, **When** I add a charge provision line (provisions sur charges), **Then** I can set a label and a monthly amount in euros (stored as integer cents), and the line type is `provision`
4. **Given** I am editing billing lines, **When** I add a billable option line, **Then** I can select from the unit's configured billable options (boiler, parking, custom) with their pre-filled amounts, and the line type is `option`
5. **Given** I configure billing lines, **Then** each line has: label (string, max 100 chars), amountCents (integer, >= 0), type (`rent` | `provision` | `option`)
6. **Given** I save billing lines, **Then** the total monthly amount is displayed as the sum of all lines, formatted in French number format (1 234,56 €)
7. **Given** I save billing lines, **Then** the event `LeaseBillingLinesConfigured` is stored in KurrentDB with the complete billing lines array
8. **Given** I have no billing lines configured beyond the default rent, **When** I view the lease detail, **Then** only the rent line is shown with a prompt to "Ajouter des provisions et options"

## Tasks / Subtasks

- [x] Task 1: Create BillingLine VO and domain infrastructure (AC: 5, 7)
  - [x] 1.1: Create BillingLine VO — `billing-line.ts` with `fromPrimitives()`, `toPrimitives()`, `empty()`, validation (label required, max 100 chars, amountCents >= 0 integer, type in `rent|provision|option`)
  - [x] 1.2: Create BillingLineType VO — `billing-line-type.ts` with guard clause against `ALLOWED_BILLING_LINE_TYPES`
  - [x] 1.3: Create `InvalidBillingLineException` with factories: `.labelRequired()`, `.labelTooLong()`, `.amountMustBeNonNegative()`, `.amountMustBeInteger()`
  - [x] 1.4: Create `InvalidBillingLineTypeException` with factory: `.invalidType()`
  - [x] 1.5: Create `LeaseBillingLinesConfigured` event
  - [x] 1.6: Create `ConfigureLeaseBillingLinesCommand` + `ConfigureLeaseBillingLinesHandler`
  - [x] 1.7: Extend `LeaseAggregate` — add `billingLines: Map<string, BillingLineState>`, add `configureBillingLines()` method, handle `LeaseBillingLinesConfigured` event replay
  - [x] 1.8: Write aggregate + handler + VO unit tests

- [x] Task 2: Create Prisma migration and projection update (AC: 7)
  - [x] 2.1: Add `billingLines Json @default("[]") @map("billing_lines")` to Prisma Lease model
  - [x] 2.2: Run migration
  - [x] 2.3: Update `lease.projection.ts` — handle `LeaseBillingLinesConfigured` event (update billingLines field in Prisma)
  - [x] 2.4: Write projection tests for new event

- [x] Task 3: Create billing lines presentation layer (AC: 2, 5, 7)
  - [x] 3.1: Create `ConfigureLeaseBillingLinesDto` with class-validator decorators (nested array of `{ label, amountCents, type }`)
  - [x] 3.2: Create `ConfigureLeaseBillingLinesController` — `PUT /api/leases/:id/billing-lines` (202 Accepted)
  - [x] 3.3: Update `GetALeaseQuery` handler to include `billingLines` in response (billingLines already included via Prisma Json field — no change needed)
  - [x] 3.4: Write controller unit tests (success 202, unauthorized, validation errors)

- [x] Task 4: Create frontend API client and hooks (AC: 2, 6)
  - [x] 4.1: Update `LeaseData` interface in `leases-api.ts` — add `billingLines: BillingLineData[]`
  - [x] 4.2: Add `configureBillingLines(leaseId, payload)` to API client — `PUT /leases/:id/billing-lines`
  - [x] 4.3: Create `useConfigureBillingLines(leaseId)` mutation hook with optimistic update + delayed invalidation
  - [x] 4.4: Create `BILLING_LINE_TYPE_LABELS` constant — `{ rent: "Loyer", provision: "Provisions sur charges", option: "Option" }`

- [x] Task 5: Create billing lines form component (AC: 2, 3, 4, 5, 6)
  - [x] 5.1: Create `billing-lines-schema.ts` — Zod schema for billing lines array (label, amountCents as euros, type)
  - [x] 5.2: Create `billing-lines-form.tsx` — `useFieldArray` for dynamic rows, euro/cents conversion, type select, total display, pre-fill from unit's billable options
  - [x] 5.3: Fetch unit's billable options via existing `useUnit(unitId)` to offer "Add from unit options" quick-fill
  - [x] 5.4: Write billing-lines-form frontend tests (9 tests)

- [x] Task 6: Update lease detail page (AC: 1, 6, 8)
  - [x] 6.1: Add "Lignes de facturation" Card section to lease detail page — display billing lines as table (label, type badge, amount in euros)
  - [x] 6.2: Show total monthly amount as sum of all lines (French number format)
  - [x] 6.3: Add inline edit toggle — "Configurer les lignes" button opens `BillingLinesForm`
  - [x] 6.4: Default rent line display when no billing lines configured + prompt
  - [x] 6.5: Write lease detail page frontend tests for billing lines section (7 tests)
  - [x] 6.6: Extract `LeaseDetailContent` component to avoid `use(Promise)` jsdom issue

- [x] Task 7: E2E tests (AC: 1, 2, 5, 6)
  - [x] 7.1: Add billing lines API fixture methods (configureBillingLines, getLease)
  - [x] 7.2: E2E: Configure billing lines on existing lease → verify display on detail page (test 6.5)

## Dev Notes

### Architecture Decisions

- **Child data in LeaseAggregate**: Billing lines stored as `Map<string, BillingLineState>` inside LeaseAggregate (same Map pattern as bank accounts in EntityAggregate, billable options in UnitAggregate). NOT a separate aggregate — billing lines are always managed through the lease and have no independent lifecycle.
- **Separate event for billing lines**: `LeaseBillingLinesConfigured` is a new event, NOT a modification of `LeaseCreated`. This follows the backward-compatible event extension pattern from Story 3.2. Old leases without billing lines produce empty arrays via default `[]`.
- **First update operation on LeaseAggregate**: Story 3.3 was create-only. This story adds the first update command (`ConfigureLeaseBillingLinesCommand`). The aggregate now needs to handle event replay for both `LeaseCreated` and `LeaseBillingLinesConfigured`.
- **Billing line types**: Three types — `rent` (base rent from lease creation), `provision` (charge provisions), `option` (from unit's billable options). Type is validated via `BillingLineType` VO with guard clause.
- **Default rent line**: The "Loyer" line is derived from the existing `rentAmountCents` on the lease. It is NOT stored in billingLines — it's the implicit first line. Billing lines in storage represent ADDITIONAL lines only (provisions + options). Total = rentAmountCents + sum(billingLines amountCents).
- **PUT endpoint for full replacement**: `PUT /api/leases/:id/billing-lines` replaces ALL billing lines (not PATCH). Frontend sends the complete array each time. Simpler, idempotent, matches the Unit billable options pattern.
- **Unit billable options pre-fill**: Frontend fetches the unit's billable options and offers a "quick-add" button per option. This is a UI convenience, NOT a domain requirement — the user can add any billing line they want.

### Value Objects

| VO | File | Type | Validation | Null Object |
|---|---|---|---|---|
| BillingLine | `billing-line.ts` | composite | label required + max 100, amountCents >= 0 integer, type valid | Yes (`.empty()`, `.isEmpty`) |
| BillingLineType | `billing-line-type.ts` | enum string | `rent` \| `provision` \| `option` guard | No |

BillingLine follows the exact same composite VO pattern as BillableOption from Story 2.5:
- `private constructor(label, amountCents, type)`
- `static fromPrimitives({ label, amountCents, type }): BillingLine`
- `toPrimitives(): BillingLinePrimitives`
- `static empty(): BillingLine`
- `get isEmpty(): boolean`

### Events

| Event | Trigger | Data Fields |
|---|---|---|
| `LeaseBillingLinesConfigured` | ConfigureLeaseBillingLinesCommand | `{ leaseId, billingLines: BillingLinePrimitives[] }` |

Metadata: `{ userId, entityId, timestamp, correlationId }`

### Commands

| Command | Handler | Logic |
|---|---|---|
| `ConfigureLeaseBillingLinesCommand` | `ConfigureLeaseBillingLinesHandler` | Load existing LeaseAggregate, call `configureBillingLines(billingLines)`, save. Handler has ZERO business logic. |

Command payload: `{ leaseId, userId, entityId, billingLines: { label: string, amountCents: number, type: string }[] }`

### API Endpoints

| Method | Path | Purpose | Response |
|---|---|---|---|
| `PUT` | `/api/leases/:id/billing-lines` | Configure billing lines | 202 Accepted (no body) |

Existing endpoints unchanged:
- `POST /api/entities/:entityId/leases` — Create lease (no billing lines at creation)
- `GET /api/entities/:entityId/leases` — List leases (now includes `billingLines` in response)
- `GET /api/leases/:id` — Get single lease (now includes `billingLines` in response)

**Authorization flow** (controller-level):
1. Extract `userId` from JWT via `@CurrentUserId()`
2. Verify lease ownership: `LeaseFinder.findByIdAndUser(leaseId, userId)` → throw UnauthorizedException
3. Validate billing lines DTO (class-validator on nested array)
4. Dispatch command

### Prisma Model Update

```prisma
model Lease {
  // ... existing fields ...
  billingLines          Json     @default("[]") @map("billing_lines")
  // ... relations unchanged ...
}
```

`billingLines` stores: `[{ "label": "Provisions sur charges", "amountCents": 5000, "type": "provision" }, ...]`

### Frontend Zod Schema

```typescript
const billingLineSchema = z.object({
  label: z.string().min(1, { error: "Libellé requis" }).max(100, { error: "Libellé trop long" }),
  amount: z.number().min(0, { error: "Montant invalide" }).max(999999.99, { error: "Montant trop élevé" }),
  type: z.enum(["provision", "option"], { error: "Type requis" }),
});

const billingLinesSchema = z.object({
  billingLines: z.array(billingLineSchema),
});
```

**Critical rules**:
- NO `.default()` on schema — use `defaultValues` in `useForm()`
- `amount` displayed in euros (user types 50.00), converted to cents on submit (`Math.round(value * 100)`)
- `rent` type lines should be read-only in the form (derived from lease base rent)
- Use `{ error: "..." }` (Zod v4 API)

### Billing Lines Display

| Line | Label | Type Badge | Amount |
|---|---|---|---|
| Default | Loyer | `rent` (blue badge) | 630,00 € |
| Added | Provisions sur charges | `provision` (teal badge) | 50,00 € |
| Added | Entretien chaudière | `option` (gray badge) | 12,50 € |
| Added | Parking | `option` (gray badge) | 30,00 € |
| **Total** | | | **722,50 €** |

French number formatting: `1 234,56 €` using `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`

### Cross-Query Cache Invalidation

Billing lines configuration must invalidate:
- `["leases", leaseId]` — lease detail (primary)
- `["entities", entityId, "leases"]` — lease list (totals may change)

Use `setTimeout(1500ms)` delayed invalidation pattern (established in Story 2.1).

### Testing Standards

**Backend (Jest)**:
- BillingLine VO: valid creation, label required, label too long, amount negative, amount non-integer, type invalid (~8 tests)
- BillingLineType VO: valid types, invalid type (~4 tests)
- LeaseAggregate.configureBillingLines: valid config, empty array, reject before create, idempotent update (~6 tests)
- ConfigureLeaseBillingLinesHandler: success, aggregate-not-found (~3 tests)
- ConfigureLeaseBillingLinesController: success 202, unauthorized, validation errors (~5 tests)
- Lease projection: on LeaseBillingLinesConfigured → update, idempotent (~3 tests)

**Frontend (Vitest)**:
- BillingLinesForm: render fields, add line, remove line, submit valid data, validation errors, pre-fill from unit options (~8 tests)
- Lease detail page: billing lines display, total calculation, empty state with prompt (~4 tests)
- useConfigureBillingLines hook: optimistic update test (~2 tests)

**E2E (Playwright)**:
- Configure billing lines → verify display (~1 test)
- Total monthly amount calculation (~1 test)

### Previous Story Intelligence

**From Story 3.3 (Leases)**:
- LeaseAggregate is create-only — this story adds the first update operation
- LeaseProjection subscribes to `lease_*` streams — new event will be caught automatically
- LeaseFinder already has `findByIdAndUser()` for authorization
- Frontend has `useLease(id)` hook with staleTime 30s
- E2E lease tests use serial mode with seed test
- Private constructor exceptions: use `toThrow(DomainException)` or `toThrow('message string')`, NOT `toThrow(ClassName)`

**From Story 2.5 (Units — BillableOption pattern)**:
- Exact pattern to clone: `Map<string, BillableOptionState>` in aggregate
- VO: `BillableOption.fromPrimitives()`, `toPrimitives()`, validation
- Prisma: `Json @default("[]")` storage
- Frontend: `useFieldArray` for dynamic rows, euros/cents conversion
- Dynamic field array: `append({ label: "", amountCents: 0 })`, `remove(index)`
- Fieldset + legend pattern for semantic HTML grouping

**From Story 2.2 (Bank Accounts — child entity pattern)**:
- Map-based child entity storage in aggregate
- Update commands that replace the entire collection
- AlertDialog not needed here (no delete confirmation — full replacement via PUT)

### Known Pitfalls to Avoid

1. **DO NOT create a separate BillingLine aggregate** — billing lines are child data in LeaseAggregate, always managed through the lease
2. **DO NOT store the "Loyer" line in billingLines** — it's derived from `rentAmountCents`. billingLines contains ONLY additional lines (provisions + options). Total = rentAmountCents + sum(billingLines)
3. **DO NOT use float for money** — integer cents only, convert at UI boundary
4. **DO NOT call `invalidateQueries` immediately** — use delayed invalidation (1500ms)
5. **DO NOT use `.default()` or `.refine()` on Zod schema** with zodResolver
6. **DO NOT add logic in command handler** — all business rules in aggregate
7. **DO NOT forget cross-aggregate authorization** at controller level (LeaseFinder.findByIdAndUser)
8. **DO NOT use `as` cast for billing line type validation** — guard clause + named exception in aggregate
9. **DO NOT forget `prisma generate`** after schema changes
10. **DO NOT modify LeaseCreated event** — create new `LeaseBillingLinesConfigured` event for backward compatibility
11. **DO NOT forget that the "rent" type line should be read-only** in the billing lines form — user cannot change base rent via billing lines (that's a lease update in a future story)

### Project Structure Notes

**New files to create:**

```
backend/src/tenancy/lease/billing-line.ts
backend/src/tenancy/lease/billing-line-type.ts
backend/src/tenancy/lease/commands/configure-lease-billing-lines.command.ts
backend/src/tenancy/lease/commands/configure-lease-billing-lines.handler.ts
backend/src/tenancy/lease/events/lease-billing-lines-configured.event.ts
backend/src/tenancy/lease/exceptions/invalid-billing-line.exception.ts
backend/src/tenancy/lease/exceptions/invalid-billing-line-type.exception.ts
backend/src/tenancy/lease/__tests__/billing-line.spec.ts
backend/src/tenancy/lease/__tests__/billing-line-type.spec.ts
backend/src/tenancy/lease/__tests__/configure-lease-billing-lines.handler.spec.ts
backend/src/presentation/lease/controllers/configure-lease-billing-lines.controller.ts
backend/src/presentation/lease/dto/configure-lease-billing-lines.dto.ts
backend/src/presentation/lease/__tests__/configure-lease-billing-lines.controller.spec.ts
backend/prisma/migrations/YYYYMMDDHHMMSS_add_billing_lines_to_lease/migration.sql
frontend/src/components/features/leases/billing-lines-form.tsx
frontend/src/components/features/leases/billing-lines-schema.ts
frontend/src/components/features/leases/__tests__/billing-lines-form.test.tsx
frontend/src/lib/constants/billing-line-types.ts
```

**Files to modify:**

```
backend/src/tenancy/lease/lease.aggregate.ts                    (add billingLines Map + configureBillingLines method + event handler)
backend/src/tenancy/lease/lease.module.ts                       (register ConfigureLeaseBillingLinesHandler)
backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts     (add configureBillingLines tests)
backend/src/presentation/lease/lease-presentation.module.ts     (register ConfigureLeaseBillingLinesController)
backend/src/presentation/lease/projections/lease.projection.ts  (handle LeaseBillingLinesConfigured)
backend/src/presentation/lease/__tests__/lease.projection.spec.ts (add LeaseBillingLinesConfigured test)
backend/prisma/schema.prisma                                    (add billingLines field)
frontend/src/lib/api/leases-api.ts                              (add billingLines to LeaseData + configureBillingLines API call)
frontend/src/hooks/use-leases.ts                                (add useConfigureBillingLines hook)
frontend/src/app/(auth)/leases/[id]/page.tsx                    (add billing lines Card section + inline edit)
frontend/src/app/(auth)/leases/__tests__/leases-page.test.tsx   (may need update for billingLines in data)
frontend/e2e/fixtures/api.fixture.ts                            (add configureBillingLines fixture)
frontend/e2e/leases.spec.ts                                     (add billing lines E2E test)
_bmad-output/implementation-artifacts/sprint-status.yaml
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.4] — User story, acceptance criteria, FR13
- [Source: _bmad-output/planning-artifacts/architecture.md — Bounded Contexts] — Tenancy BC contains Lease aggregate (FR9-17)
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture] — `lease-{id}` stream, `leases` table
- [Source: _bmad-output/planning-artifacts/architecture.md — Naming Conventions] — VerbANoun commands, PastTense events
- [Source: _bmad-output/planning-artifacts/architecture.md — Controller Pattern] — One controller per action, 202 Accepted
- [Source: _bmad-output/planning-artifacts/prd.md — FR13] — Billing lines: rent, charge provisions, billable options per lease
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — French number formatting, domain-native language
- [Source: _bmad-output/implementation-artifacts/3-3-create-a-lease-linking-tenant-to-unit.md] — LeaseAggregate structure, Prisma model, frontend form, VOs, E2E fixtures
- [Source: _bmad-output/implementation-artifacts/2-5-create-and-configure-units-within-a-property.md] — BillableOption VO + useFieldArray pattern (exact clone target)
- [Source: docs/project-context.md — CQRS/ES Patterns] — Optimistic UI, delayed invalidation, child entity in aggregate
- [Source: docs/project-context.md — Form Patterns] — Zod + react-hook-form, euros/cents conversion
- [Source: docs/anti-patterns.md] — DTO checklist, no `.default()` on Zod schemas, integer cents only

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Frontend test failures: `use(Promise)` from React 19 renders empty `<body><div /></body>` in jsdom — fixed by extracting `LeaseDetailContent` component (same pattern as DashboardContent from Story 2.6)
- `getByDisplayValue("Provisions sur charges")` collision: BILLING_LINE_TYPE_LABELS.provision = "Provisions sur charges" collides with billing line label text — fixed by using `getByRole("textbox")` and changing test data label
- `vi.fn()` type mismatch with typed props: `ReturnType<typeof vi.fn>` not assignable to `(billingLines: BillingLineData[]) => void` — fixed with `(...args: unknown[]) => void` type

### Completion Notes List

- 458 backend tests (67 suites), 281 frontend tests (36 suites), 5 E2E tests (1 new)
- LeaseDetailContent extracted from page.tsx for testability — thin page wrapper with `use(params)`, content component takes `leaseId: string`
- Default rent line NOT stored in billingLines — derived from `rentAmountCents`. Total = rent + sum(billingLines)
- PUT full replacement at `/api/leases/:id/billing-lines` — idempotent, matches Unit billable options pattern
- Unit billable options pre-fill via quick-add buttons in form
- Cross-query cache invalidation: `["leases", leaseId]` + `["entities", entityId, "leases"]` with delayed invalidation

### File List

**New files (21):**
```
backend/src/tenancy/lease/billing-line.ts
backend/src/tenancy/lease/billing-line-type.ts
backend/src/tenancy/lease/commands/configure-lease-billing-lines.command.ts
backend/src/tenancy/lease/commands/configure-lease-billing-lines.handler.ts
backend/src/tenancy/lease/events/lease-billing-lines-configured.event.ts
backend/src/tenancy/lease/exceptions/invalid-billing-line.exception.ts
backend/src/tenancy/lease/exceptions/invalid-billing-line-type.exception.ts
backend/src/tenancy/lease/exceptions/lease-not-created.exception.ts
backend/src/tenancy/lease/__tests__/billing-line.spec.ts
backend/src/tenancy/lease/__tests__/billing-line-type.spec.ts
backend/src/tenancy/lease/__tests__/configure-lease-billing-lines.handler.spec.ts
backend/src/presentation/lease/controllers/configure-lease-billing-lines.controller.ts
backend/src/presentation/lease/dto/configure-lease-billing-lines.dto.ts
backend/src/presentation/lease/__tests__/configure-lease-billing-lines.controller.spec.ts
backend/prisma/migrations/20260212184508_add_billing_lines_to_lease/migration.sql
frontend/src/components/features/leases/billing-lines-form.tsx
frontend/src/components/features/leases/billing-lines-schema.ts
frontend/src/components/features/leases/lease-detail-content.tsx
frontend/src/components/features/leases/__tests__/billing-lines-form.test.tsx
frontend/src/app/(auth)/leases/[id]/__tests__/lease-detail-page.test.tsx
frontend/src/lib/constants/billing-line-types.ts
```

**Modified files (14):**
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
frontend/src/app/(auth)/leases/[id]/page.tsx
frontend/src/app/(auth)/leases/__tests__/leases-page.test.tsx
frontend/e2e/fixtures/api.fixture.ts
frontend/e2e/leases.spec.ts
_bmad-output/implementation-artifacts/sprint-status.yaml
```

## Senior Developer Review (AI)

**Reviewer:** Monsieur — 2026-02-12
**Outcome:** Approved with 7 fixes applied + 11 adversarial review fixes

### Review Summary

- **AC Validation:** All 8 ACs verified as IMPLEMENTED
- **Task Audit:** All 7 tasks (21 subtasks) verified as complete
- **Git vs Story File List:** 0 discrepancies (perfect match)
- **Tests:** 103 backend + 282 frontend passing, 0 TypeScript errors

### Findings — Pass 1 (2H, 5M, 2L)

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| H1 | HIGH | Unused `BillingLinePrimitives` import in `lease.aggregate.ts` — ESLint `no-unused-vars` | Removed unused import |
| H2 | HIGH | `@typescript-eslint/no-unsafe-assignment` in handler spec — untyped `jest.fn()` | Added explicit type params `jest.fn<Promise<LeaseAggregate>, [string]>()` |
| M1 | MEDIUM | 13 prettier formatting errors across 8 backend files | `prettier --write` on all affected files |
| M2 | MEDIUM | `BillingLine.fromPrimitives()` used `amountMustBeNonNegative()` for both non-integer and negative — `amountMustBeInteger()` factory never called | Split validation: integer check first, then negativity check |
| M3 | MEDIUM | `onLeaseBillingLinesConfigured` used `line.label` as Map key — duplicate labels silently overwritten on replay | Changed to index-based key (`i.toString()`) |
| M4 | MEDIUM | No duplicate label validation in frontend Zod schema — related to M3 data loss risk | Resolved by M3 fix (index keys prevent data loss) |
| M5 | MEDIUM | File List directory entry ambiguity for `[id]/__tests__/` | Verified correct — no action needed |
| L1 | LOW | `BillingLinePrimitives.type` is `string` instead of `BillingLineTypeValue` | Not fixed (acceptable for serialization boundary) |
| L2 | LOW | Form total includes base rent — correct UX showing full monthly amount | No fix needed (total = rent + additional, as implemented) |

### Findings — Pass 2: Adversarial Review (4M, 7L)

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| A1 | MEDIUM | `InvalidBillingLineTypeException` error message claims "Allowed: rent, provision, option" but rent is NOT allowed | Fixed message to "Allowed: provision, option" |
| A2 | MEDIUM | `BillingLine.empty()` / `isEmpty` bypasses `fromPrimitives()` validation — YAGNI (never used in production code) | Removed `empty()` and `isEmpty` entirely |
| A3 | MEDIUM | `ConfigureLeaseBillingLinesCommand` carries `userId` + `entityId` never read by handler — dead fields | Removed dead fields from command, updated controller + specs |
| A4 | MEDIUM | No no-op guard in `configureBillingLines()` — empty reconfiguration bloats event stream (violates Story 2.4 pattern) | Added JSON.stringify comparison guard + 2 tests |
| A5 | LOW | Zod schema missing `.max(50)` on billingLines array — backend has `@ArrayMaxSize(50)` but frontend doesn't mirror it | Added `.max(50)` to `billingLinesSchema` |
| A6 | LOW | Optimistic update sets `updatedAt` to client time but projection never updates it — flicker on reconciliation | Removed `updatedAt` from optimistic update |
| A7 | LOW | Duplicate "Lignes de facturation" heading — CardTitle + fieldset legend render identical text | Changed legend to `sr-only` |
| A8 | LOW | Story Zod schema section includes `"rent"` in enum but implementation correctly excludes it | Fixed story doc to match implementation |
| A9 | LOW | BillingLinesForm tests never verify form submission with cents conversion | Added form submission test verifying `Math.round(amount * 100)` path |
| A10 | LOW | Pass 1 L2 finding text contradicts actual code | Fixed review text |
| A11 | LOW | Stray `bug/` directory with debug screenshot in project root | Deleted |

### Post-Fix Verification

- ESLint: 0 errors, 0 warnings
- Backend tests: 103/103 passing (15 suites)
- Frontend tests: 282/282 passing (36 suites)
- TypeScript: 0 errors (both backend + frontend)

