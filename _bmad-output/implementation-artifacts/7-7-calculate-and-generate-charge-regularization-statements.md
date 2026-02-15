# Story 7.7: Calculate and Generate Charge Regularization Statements

Status: review

## Story

As a bailleur,
I want the system to calculate per-tenant charge regularization statements and generate detailed documents,
so that tenants receive an accurate breakdown of actual vs. provisioned charges (FR50, FR51, FR26, FR27).

## Acceptance Criteria

1. **Given** actual annual charges and water meter readings have been entered for a fiscal year, **When** I navigate to the charges page and click "Générer la régularisation", **Then** the system calculates per-tenant regularization statements: actual charges pro-rated by occupancy period (days occupied / days in year), minus provisions paid during the period.

2. **Given** a regularization has been calculated, **When** I view the regularization results, **Then** each tenant statement shows: tenant name, unit identifier, occupancy period (start/end dates, days count), per-category charge breakdown (total charge, tenant's pro-rata share), total provisions paid, final balance (credit or debit).

3. **Given** a tenant has a positive balance (charges > provisions), **Then** the result shows "Complément" with the amount due. **Given** a negative balance (provisions > charges), **Then** the result shows "Trop-perçu" with the credit amount.

4. **Given** a tenant occupied a unit for only part of the fiscal year (lease started mid-year or terminated mid-year), **When** the system calculates their share, **Then** charges are pro-rated using `Math.floor((occupiedDays * amountCents) / daysInYear)` — truncation per French rental law (NFR18).

5. **Given** water meter readings exist for the fiscal year, **When** calculating the water charge category, **Then** water charges are distributed by consumption (from Story 7.6 WaterDistributionService), NOT pro-rated by occupancy.

6. **Given** regularization statements are calculated, **When** I click "Télécharger PDF" for a specific tenant, **Then** the system generates a charge regularization PDF statement with: entity details, tenant details, unit address, occupancy period, per-category breakdown table (total charge + tenant share), total provisions paid, final balance, legal mentions, and date. PDF generation completes in under 3 seconds (NFR3).

7. **Given** I re-trigger regularization for the same fiscal year, **When** the system processes it, **Then** previous statements are replaced (PUT full replacement, idempotent overwrite — same pattern as annual charges).

8. **Given** regularization statements are generated, **When** I reload the page, **Then** the previously generated statements are displayed with all details.

## Tasks / Subtasks

- [x] Task 1: Create RegularizationStatement domain model in Indexation BC (AC: #1, #3, #4, #7)
  - [x] 1.1: Create `RegularizationStatement` composite VO — { leaseId, tenantId, tenantName, unitId, unitIdentifier, occupancyStart, occupancyEnd, occupiedDays, charges[], totalShareCents, totalProvisionsPaidCents, balanceCents }
  - [x] 1.2: Create `ChargeRegularizationAggregate` with `calculate()` method + no-op guard
  - [x] 1.3: Create `ChargeRegularizationCalculated` domain event
  - [x] 1.4: Create `CalculateChargeRegularizationCommand` + handler
  - [x] 1.5: Create named exceptions: `NoChargesRecordedException`, `NoLeasesFoundException`
  - [x] 1.6: Write unit tests for VO, aggregate, handler

- [x] Task 2: Create RegularizationCalculationService in presentation layer (AC: #1, #4, #5)
  - [x] 2.1: Create `RegularizationCalculationService` — presentation-layer service (reads from multiple finders across BCs, NOT domain)
  - [x] 2.2: Implement per-tenant occupancy calculation reusing `calculateOccupiedDays()` from `@tenancy/lease/pro-rata`
  - [x] 2.3: Implement per-category pro-rata distribution: `Math.floor((occupiedDays * categoryCents) / daysInYear)` with rounding remainder to first tenant
  - [x] 2.4: Integrate water distribution: for water categories, use WaterDistributionService results instead of pro-rata
  - [x] 2.5: Handle edge cases: no leases, no charges, partial year occupancy, terminated leases
  - [x] 2.6: Write comprehensive service tests with BDD scenarios

- [x] Task 3: Create Prisma model and projection (AC: #7, #8)
  - [x] 3.1: Add `ChargeRegularization` model to `schema.prisma` with `@@unique([entityId, fiscalYear])`
  - [x] 3.2: Stored as JSON `statements` column (matches AnnualCharges + WaterMeterReadings pattern)
  - [x] 3.3: Run `prisma generate` + migration
  - [x] 3.4: Create `ChargeRegularizationProjection` — upsert on event
  - [x] 3.5: Write projection tests

- [x] Task 4: Create presentation layer — controllers, finders, DTOs (AC: #1, #2, #7, #8)
  - [x] 4.1: Create `CalculateChargeRegularizationController` (POST `/api/entities/:entityId/charge-regularization`)
  - [x] 4.2: Create `GetChargeRegularizationController` (GET `/api/entities/:entityId/charge-regularization?fiscalYear=YYYY`)
  - [x] 4.3: Create `CalculateChargeRegularizationDto` with defense-in-depth validation
  - [x] 4.4: Create `ChargeRegularizationFinder`
  - [x] 4.5: Create `GetChargeRegularizationQueryHandler`
  - [x] 4.6: Create `ChargeRegularizationPresentationModule`
  - [x] 4.7: Register module in `app.module.ts`
  - [x] 4.8: Write controller + finder + handler tests

- [x] Task 5: Create PDF template and generation endpoint (AC: #6)
  - [x] 5.1: Create `ChargeRegularizationPdfData` interface in `infrastructure/document/`
  - [x] 5.2: Create `renderChargeRegularizationPdf()` pure template function
  - [x] 5.3: Add `generateChargeRegularizationPdf()` method to `PdfGeneratorService`
  - [x] 5.4: Create `ChargeRegularizationPdfAssembler` — maps Prisma read model → PDF data
  - [x] 5.5: Create `GetChargeRegularizationPdfController` (GET `/api/entities/:entityId/charge-regularization/:fiscalYear/pdf/:leaseId`)
  - [x] 5.6: Write template tests (mock doc spy) + controller tests

- [x] Task 6: Create frontend API + hooks (AC: all)
  - [x] 6.1: Create `charge-regularization-api.ts` with interfaces and fetch functions
  - [x] 6.2: Create `useChargeRegularization(entityId, fiscalYear)` query hook
  - [x] 6.3: Create `useCalculateChargeRegularization(entityId)` mutation hook
  - [x] 6.4: Create `useDownloadRegularizationPdf(entityId, fiscalYear)` download hook (blob pattern)
  - [x] 6.5: Hook tests via component tests (project convention)

- [x] Task 7: Create frontend components (AC: #1, #2, #3, #6, #8)
  - [x] 7.1: Create `ChargeRegularizationSection` component with generate button + results display
  - [x] 7.2: Create `RegularizationStatementCard` per-tenant statement display (occupancy, charges table, provisions, balance)
  - [x] 7.3: Create PDF download button per tenant with blob download pattern
  - [x] 7.4: Integrate into charges page as new section below water distribution
  - [x] 7.5: Write component tests (section tests + card tests)

- [x] Task 8: E2E tests (AC: all)
  - [x] 8.1: E2E: seed entity + property + 2 units + 2 tenants + leases + annual charges via API fixture
  - [x] 8.2: E2E: navigate to charges page, generate regularization
  - [x] 8.3: E2E: verify per-tenant statements display (amounts, balance type)
  - [x] 8.4: E2E: download PDF + verify filename

## Dev Notes

### Architecture Decision: Calculation Service in Presentation Layer (NOT Domain)

The regularization calculation requires reading from MULTIPLE finders across different BCs:
1. `AnnualChargesFinder` — actual annual charges (Indexation BC read model)
2. `WaterMeterReadingsFinder` — water meter readings (Indexation BC read model)
3. `WaterDistributionService` — computed water distribution (Indexation BC presentation)
4. `LeaseFinder` — active leases with tenant/unit details (Tenancy BC read model)
5. `AnnualChargesFinder.findPaidBillingLinesByEntityAndYear()` — provisions paid from rent calls

**This is a presentation-layer service** because it orchestrates cross-BC read models. The aggregate only stores the RESULT (statements), not the calculation logic. This follows the same pattern as `WaterDistributionService` from Story 7.6.

### Aggregate Pattern: Follow AnnualChargesAggregate

```
ChargeRegularizationAggregate (stream: 'charge-regularization')
├── calculate(entityId, userId, fiscalYear, statements[]) → ChargeRegularizationCalculated
├── No-op guard: isSameData(existing, new)
├── State: calculated: boolean, statements: StatementPrimitives[], fiscalYear: number
└── ID: {entityId}-{fiscalYear} (deterministic, server-generated — NOT UUID)
```

**Key design**: The controller orchestrates the calculation (via `RegularizationCalculationService`), then passes the computed statements TO the aggregate. The aggregate stores them as an event. This keeps the aggregate simple (validation + event emission) while the calculation logic lives in the presentation service.

### Data Model

**RegularizationStatement composite VO:**
```typescript
interface StatementPrimitives {
  leaseId: string;
  tenantId: string;
  tenantName: string;           // Full name or company name
  unitId: string;
  unitIdentifier: string;       // e.g., "Apt A"
  occupancyStart: string;       // ISO date — max(leaseStart, Jan 1 of fiscalYear)
  occupancyEnd: string;         // ISO date — min(leaseEnd, Dec 31 of fiscalYear)
  occupiedDays: number;         // inclusive count
  daysInYear: number;           // 365 or 366 for leap years
  charges: {
    chargeCategoryId: string;
    label: string;
    totalChargeCents: number;   // total actual charge for this category
    tenantShareCents: number;   // pro-rata'd amount (integer cents)
    isWaterByConsumption: boolean; // true if distributed by water meter, not pro-rata
  }[];
  totalShareCents: number;       // sum of all tenantShareCents
  totalProvisionsPaidCents: number; // sum of billing lines from paid rent calls
  balanceCents: number;          // totalShareCents - totalProvisionsPaidCents
}
```

**Prisma model:**
```prisma
model ChargeRegularization {
  id               String   @id
  entityId         String   @map("entity_id")
  userId           String   @map("user_id")
  fiscalYear       Int      @map("fiscal_year")
  statements       Json     @default("[]")  // StatementPrimitives[]
  totalBalanceCents Int     @map("total_balance_cents")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([entityId, fiscalYear])
  @@index([entityId])
  @@map("charge_regularizations")
}
```

### Calculation Algorithm

```
Input: entityId, fiscalYear, userId
Output: StatementPrimitives[]

1. LOAD DEPENDENCIES (via finders — all entity-scoped)
   a. annualCharges = AnnualChargesFinder.findByEntityAndYear(entityId, fiscalYear)
      → if null: throw NoChargesRecordedException
   b. leases = LeaseFinder.findAllActiveByEntityAndUser(entityId, userId, Jan 1 of fiscalYear)
      → include terminated leases that overlapped the fiscal year
      → filter: startDate <= Dec 31 AND (endDate is null OR endDate >= Jan 1)
      → if empty: throw NoLeasesFoundException
   c. waterDistribution = WaterDistributionService.calculate(entityId, fiscalYear) — optional, may be null
   d. provisions = for each lease: AnnualChargesFinder.findPaidBillingLinesByEntityAndYear()
      → aggregate billing lines by chargeCategoryId per lease

2. FOR EACH LEASE → CALCULATE STATEMENT
   a. Determine occupancy period in fiscal year:
      - occupancyStart = max(leaseStartDate, Jan 1 of fiscalYear)
      - occupancyEnd = min(leaseEndDate ?? Dec 31, Dec 31 of fiscalYear)
      - occupiedDays = calculateOccupiedDaysInYear(occupancyStart, occupancyEnd) — inclusive
      - daysInYear = isLeapYear(fiscalYear) ? 366 : 365

   b. For each charge category in annualCharges:
      - IF category is water AND waterDistribution exists:
          → tenantShareCents = waterDistribution for this unit (already computed by consumption)
      - ELSE:
          → tenantShareCents = Math.floor((occupiedDays * totalChargeCents) / daysInYear)

   c. Sum all tenantShareCents → totalShareCents

   d. Calculate provisions paid for this lease:
      - Query rent calls for leaseId + fiscalYear months (paidAt not null)
      - Sum billingLines amountCents from those rent calls
      - totalProvisionsPaidCents = sum

   e. Balance: balanceCents = totalShareCents - totalProvisionsPaidCents
      - Positive = tenant owes additional (Complément)
      - Negative = tenant overpaid (Trop-perçu)
      - Zero = balanced (Équilibré)

3. ROUNDING REMAINDER DISTRIBUTION
   Per charge category: sum of all tenant shares may differ from total charge by a few cents.
   → Distribute remainder to first tenant alphabetically (deterministic, reproducible)
   → Ensure: sum(tenantShareCents for all tenants) === totalChargeCents

4. RETURN statements[]
```

### Important: Lease Query for Fiscal Year Overlap

The existing `findAllActiveByEntityAndUser()` takes a `monthStart: Date` parameter and filters:
```typescript
OR: [{ endDate: null }, { endDate: { gte: monthStart } }]
```

For regularization, we need ALL leases that overlapped the fiscal year, including:
- Active leases (endDate is null)
- Terminated leases whose endDate >= Jan 1 of fiscal year
- Leases that started after Jan 1 but before Dec 31

**New finder method needed**: `findAllByEntityAndFiscalYear(entityId, userId, fiscalYear)`:
```typescript
where: {
  entityId,
  userId,
  startDate: { lte: new Date(`${fiscalYear}-12-31`) },
  OR: [{ endDate: null }, { endDate: { gte: new Date(`${fiscalYear}-01-01`) } }],
}
include: { tenant: true, unit: true, billingLineRows: true }
```

### Provisions Calculation Per Lease

The existing `GetProvisionsCollectedHandler` aggregates provisions at ENTITY level. For regularization, we need provisions **per lease** (per tenant).

**New finder method needed** on `AnnualChargesFinder`: `findPaidBillingLinesByLeaseAndYear(leaseId, fiscalYear)`:
```typescript
return this.prisma.rentCall.findMany({
  where: {
    leaseId,
    month: { startsWith: `${fiscalYear}-` },
    paidAt: { not: null },
  },
  select: { billingLines: true },
});
```

### Water Distribution Integration

When `waterDistribution` data exists for the fiscal year, the water charge category should NOT be pro-rated by occupancy. Instead, use the per-unit allocation from `WaterDistributionService`:

```typescript
// In RegularizationCalculationService
for (const charge of annualCharges.charges) {
  if (isWaterCategory(charge) && waterDistribution) {
    const unitDistribution = waterDistribution.distributions.find(
      d => d.unitId === lease.unitId
    );
    tenantShareCents = unitDistribution?.amountCents ?? 0;
    isWaterByConsumption = true;
  } else {
    tenantShareCents = Math.floor((occupiedDays * charge.amountCents) / daysInYear);
    isWaterByConsumption = false;
  }
}
```

**Water category detection**: Reuse the `isWaterCategory()` function from `charges-summary.tsx` logic — check `chargeCategoryId` or label for water-related indicators. Backend equivalent: query charge categories for entity, find the one with slug `'eau'` or label containing `'eau'`.

### API Endpoints

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| POST | `/api/entities/:entityId/charge-regularization` | Calculate + store | 202 Accepted |
| GET | `/api/entities/:entityId/charge-regularization?fiscalYear=YYYY` | Fetch statements | `{ data: ChargeRegularization \| null }` |
| GET | `/api/entities/:entityId/charge-regularization/:fiscalYear/pdf/:leaseId` | Download PDF | `application/pdf` |

### DTO Validation (per dto-checklist.md)

```typescript
class CalculateChargeRegularizationDto {
  @IsString()
  @MaxLength(100)
  id!: string;  // Composite ID: {entityId}-{fiscalYear} — NOT UUID

  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear!: number;
}
```

**Note**: The DTO is minimal — the controller orchestrates the calculation by querying all needed data server-side. The frontend only sends the `fiscalYear` + deterministic `id`. No charge data sent from frontend — it's all fetched server-side.

### PDF Template

**`renderChargeRegularizationPdf(doc, data)` — pure template function**

```
Document layout:
┌─────────────────────────────────────────────────────────┐
│ RÉGULARISATION DES CHARGES                               │
│ Exercice fiscal {fiscalYear}                             │
│ Date: {statementDate}                                    │
├──────────────────────────┬──────────────────────────────┤
│ Bailleur:                │ Locataire:                    │
│ {entityName}             │ {tenantName}                  │
│ {entitySiret}            │ {tenantAddress}               │
│ {entityAddress}          │                               │
├──────────────────────────┴──────────────────────────────┤
│ Lot: {unitIdentifier} — {unitAddress}                    │
│ Période d'occupation: du {start} au {end} ({days} jours) │
├─────────────────────────────────────────────────────────┤
│ DÉTAIL DES CHARGES                                       │
│ ─────────────────────────────────────────────────────── │
│ Catégorie      │ Total annuel  │ Part locataire          │
│ ────────────── │ ────────────  │ ────────────            │
│ Eau (conso)    │ 600,00 €      │ 187,50 €               │
│ TEOM           │ 800,00 €      │ 438,36 €               │
│ Nettoyage      │ 1 200,00 €    │ 657,53 €               │
│ ────────────── │ ────────────  │ ────────────            │
│ TOTAL CHARGES  │ 2 600,00 €    │ 1 283,39 €             │
├─────────────────────────────────────────────────────────┤
│ Provisions versées:                    1 200,00 €        │
│ ─────────────────────────────────────────────────────── │
│ SOLDE:                                    +83,39 €       │
│ → Complément dû par le locataire                         │
├─────────────────────────────────────────────────────────┤
│ Conformément à la loi n°89-462 du 6 juillet 1989...     │
└─────────────────────────────────────────────────────────┘
```

**ChargeRegularizationPdfData interface:**
```typescript
interface ChargeRegularizationPdfData {
  // Entity
  entityName: string;
  entitySiret: string | null;
  entityAddress: string;
  // Tenant
  tenantName: string;
  tenantAddress: string;
  // Unit
  unitIdentifier: string;
  unitAddress: string;
  // Period
  fiscalYear: number;
  statementDate: string;        // French format: "15/02/2026"
  occupancyStart: string;       // French format
  occupancyEnd: string;         // French format
  occupiedDays: number;
  daysInYear: number;
  // Charges table
  charges: {
    label: string;
    totalChargeCents: number;
    tenantShareCents: number;
    isWaterByConsumption: boolean;
  }[];
  totalChargesCents: number;
  totalShareCents: number;
  // Provisions & balance
  totalProvisionsPaidCents: number;
  balanceCents: number;
  balanceLabel: string;         // "Complément" | "Trop-perçu" | "Équilibré"
}
```

**Filename convention**: `regularisation-charges-{tenantLastName}-{fiscalYear}.pdf`

### Frontend Design

**Integration point**: Charges page (`/charges`) — add a new Card section below "Comparaison charges / provisions".

**ChargeRegularizationSection layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Régularisation des charges — {fiscalYear}                │
├─────────────────────────────────────────────────────────┤
│ [Générer la régularisation]  (AlertDialog confirmation)  │
│                                                          │
│ (if already calculated:)                                 │
│                                                          │
│ ┌─ Statement Card: Dupont ─────────────────────────────┐│
│ │ Apt A — 01/01/2025 → 31/12/2025 (365 jours)         ││
│ │                                                       ││
│ │ Eau (conso)     600,00 €    187,50 €                 ││
│ │ TEOM            800,00 €    438,36 €                 ││
│ │ Nettoyage     1 200,00 €    657,53 €                 ││
│ │ ────────────────────────────────────                  ││
│ │ Total charges              1 283,39 €                ││
│ │ Provisions versées         1 200,00 €                ││
│ │ ─────────────────                                    ││
│ │ SOLDE: +83,39 € (Complément)         [Télécharger]  ││
│ └───────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Statement Card: Martin ─────────────────────────────┐│
│ │ ...                                                   ││
│ └───────────────────────────────────────────────────────┘│
│                                                          │
│ Total régularisation: +83,39 € (2 locataires)           │
└─────────────────────────────────────────────────────────┘
```

**Key UX decisions:**
- Generate button triggers AlertDialog confirmation ("Voulez-vous générer la régularisation des charges pour l'exercice {year} ? Cela remplacera les résultats existants.")
- Results displayed as individual cards per tenant
- Each card has a "Télécharger PDF" button (blob download pattern)
- Balance colored: red for Complément (tenant owes), green for Trop-perçu (credit)
- Summary line at bottom with total balance across all tenants
- Double-click guard on generate button

**Conditional visibility:**
- Section only visible when annual charges exist for the selected fiscal year
- Generate button disabled if no charges recorded
- PDF download only shown for calculated statements

### React Query Cache Keys

```typescript
// Charge regularization
["entities", entityId, "charge-regularization", fiscalYear]

// Invalidate on calculate:
["entities", entityId, "charge-regularization", fiscalYear]
```

### Optimistic Update Pattern

Follow existing `useRecordAnnualCharges` pattern:
1. `onMutate`: cancel in-flight queries, snapshot cache
2. Note: no optimistic insert for regularization (results are server-computed)
3. `onSettled`: invalidate with 1.5s delay (CQRS eventual consistency)

### Occupancy Days Calculation for Full Year

The existing `calculateOccupiedDays()` in `pro-rata.ts` works month-by-month. For annual pro-rata, create a helper:

```typescript
function calculateOccupiedDaysInYear(
  leaseStartDate: Date,
  leaseEndDate: Date | null,
  fiscalYear: number,
): number {
  const yearStart = new Date(Date.UTC(fiscalYear, 0, 1));  // Jan 1
  const yearEnd = new Date(Date.UTC(fiscalYear, 11, 31));   // Dec 31

  const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart;
  const effectiveEnd = (leaseEndDate && leaseEndDate < yearEnd) ? leaseEndDate : yearEnd;

  if (effectiveStart > effectiveEnd) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / msPerDay) + 1; // inclusive
}
```

Place this in `RegularizationCalculationService` (NOT in pro-rata.ts — different scope).

### Project Structure Notes

**New files location — Backend domain:**
```
backend/src/indexation/charge-regularization/
├── regularization-statement.ts              # Composite VO
├── charge-regularization.aggregate.ts       # Aggregate
├── events/
│   └── charge-regularization-calculated.event.ts
├── commands/
│   ├── calculate-charge-regularization.command.ts
│   └── calculate-charge-regularization.handler.ts
├── exceptions/
│   ├── no-charges-recorded.exception.ts
│   └── no-leases-found.exception.ts
└── __tests__/
    ├── mock-cqrx.ts
    ├── regularization-statement.spec.ts
    ├── charge-regularization.aggregate.spec.ts
    └── calculate-charge-regularization.handler.spec.ts
```

**New files location — Backend presentation:**
```
backend/src/presentation/charge-regularization/
├── charge-regularization-presentation.module.ts
├── controllers/
│   ├── calculate-charge-regularization.controller.ts
│   ├── get-charge-regularization.controller.ts
│   └── get-charge-regularization-pdf.controller.ts
├── queries/
│   ├── get-charge-regularization.query.ts
│   └── get-charge-regularization.handler.ts
├── dto/
│   └── calculate-charge-regularization.dto.ts
├── finders/
│   └── charge-regularization.finder.ts
├── services/
│   └── regularization-calculation.service.ts
├── projections/
│   └── charge-regularization.projection.ts
└── __tests__/
    ├── calculate-charge-regularization.controller.spec.ts
    ├── get-charge-regularization.controller.spec.ts
    ├── get-charge-regularization-pdf.controller.spec.ts
    ├── charge-regularization.finder.spec.ts
    ├── charge-regularization.projection.spec.ts
    ├── regularization-calculation.service.spec.ts
    └── get-charge-regularization.handler.spec.ts
```

**New files location — Backend PDF:**
```
backend/src/infrastructure/document/
├── charge-regularization-pdf-data.interface.ts
├── templates/
│   └── charge-regularization.template.ts
├── charge-regularization-pdf-assembler.ts
└── __tests__/
    └── charge-regularization.template.spec.ts
```

**New files location — Frontend:**
```
frontend/src/
├── lib/api/
│   └── charge-regularization-api.ts
├── hooks/
│   └── use-charge-regularization.ts
├── components/features/charges/
│   ├── charge-regularization-section.tsx
│   ├── regularization-statement-card.tsx
│   └── __tests__/
│       ├── charge-regularization-section.test.tsx
│       └── regularization-statement-card.test.tsx
└── e2e/
    └── charge-regularization.spec.ts
```

**Modified files:**
```
backend/prisma/schema.prisma                              # Add ChargeRegularization model
backend/src/app.module.ts                                 # Register ChargeRegularizationPresentationModule
backend/src/infrastructure/document/pdf-generator.service.ts  # Add generateChargeRegularizationPdf()
backend/src/presentation/lease/finders/lease.finder.ts    # Add findAllByEntityAndFiscalYear()
backend/src/presentation/annual-charges/finders/annual-charges.finder.ts  # Add findPaidBillingLinesByLeaseAndYear()
frontend/src/app/(auth)/charges/page.tsx                  # Add ChargeRegularizationSection
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic7-Story7.7] — FR50, FR51, FR26, FR27 requirements
- [Source: _bmad-output/implementation-artifacts/7-6-enter-individual-water-meter-readings-per-unit.md] — WaterDistributionService, WaterMeterReadings, charges page layout
- [Source: _bmad-output/implementation-artifacts/7-5-enter-actual-annual-charges-by-category.md] — AnnualChargesAggregate pattern, ChargeEntry VO, fiscal year selector
- [Source: _bmad-output/implementation-artifacts/7-5c-normalize-billing-lines-with-charge-category-table.md] — ChargeCategory table, chargeCategoryId matching
- [Source: backend/src/tenancy/lease/pro-rata.ts] — calculateOccupiedDays(), calculateProRataAmountCents(), daysInMonth()
- [Source: backend/src/presentation/annual-charges/queries/get-provisions-collected.handler.ts] — Provisions aggregation logic per billing line
- [Source: backend/src/presentation/lease/finders/lease.finder.ts] — Lease queries, active lease filtering
- [Source: backend/src/infrastructure/document/pdf-generator.service.ts] — PDF generation buffer pattern, template function pattern
- [Source: backend/src/presentation/rent-call/finders/account-entry.finder.ts] — AccountEntry model for Story 7.8
- [Source: docs/project-context.md] — CQRS patterns, optimistic update, delayed invalidation
- [Source: docs/anti-patterns.md] — Zod no .default()/.refine(), named exceptions, DTO defense-in-depth
- [Source: docs/dto-checklist.md] — class-validator patterns, VO double-validation

### Critical Patterns to Follow

1. **AnnualChargesAggregate is your template** — same stream naming, deterministic ID, no-op guard, overwrite-via-event
2. **FiscalYear VO reuse** — import from `@indexation/annual-charges/fiscal-year` (already exists)
3. **mock-cqrx.ts** — copy from `@indexation/annual-charges/__tests__/mock-cqrx.ts`
4. **Controller-per-action** — separate controllers for calculate, get-regularization, get-pdf
5. **202 Accepted** for command endpoint, **200 OK** for queries
6. **Integer cents** for all monetary results — NEVER use floats for money
7. **Math.floor()** for all monetary divisions (troncature per French law — favors tenant)
8. **No cross-BC aggregate imports** — service reads from Prisma finders (presentation layer)
9. **Entity-scoped queries** — all finders filter by `entityId` + `userId` (multi-tenant isolation)
10. **Delayed invalidation** — 1.5s setTimeout in onSettled for CQRS eventual consistency
11. **staleTime: 30_000** on all query hooks
12. **Double-click guard** on generate button (`isSubmitting` state)
13. **AlertDialog** for generate action (destructive: replaces existing)
14. **Dark mode** — all new components must have dark mode variants (`dark:` Tailwind classes)
15. **French labels, English code** — UI text in French, variable/file names in English
16. **ARIA accessibility** — proper form labels, error messages, status announcements
17. **Prisma generate** — run after schema changes
18. **Blob download pattern** — `URL.createObjectURL(blob)` + hidden `<a>` click (from Story 4.2)
19. **Content-Disposition CORS** — expose header for PDF downloads (from Story 4.2 fix)
20. **PdfAssembler pattern** — map Prisma read model → PDF data interface (keeps controller thin)
21. **Rounding remainder** — distribute to first tenant (deterministic) so sum === total exactly
22. **Leap year** — use `daysInYear = isLeapYear(fiscalYear) ? 366 : 365` for pro-rata denominator

### Previous Story Intelligence (from Story 7.6)

- **Deviation patterns**: Composite ID uses `@IsString()` + `@MaxLength(100)` not `@IsUUID()` — same applies here
- **Prisma JSON type**: Cast via `unknown` for typed arrays ↔ `Prisma.InputJsonValue` (4 casts needed in 7.6)
- **Form-level validation**: Cross-field validation in submit handler, NOT in Zod schema
- **Component tests mock hooks**: Use `vi.mock()` for all custom hooks, provide typed mock implementations
- **E2E serial mode**: Use `test.describe.serial` for seed→action→verify test sequences
- **React Compiler warning**: `form.watch()` triggers incompatible-library warning — expected, ignore
- **Water category detection**: Uses string `.includes('eau')` on label — fragile but acceptable for MVP

### BDD Test Scenarios

**Scenario 1: Full-year tenant with all categories**
- Given: Tenant Dupont in Apt A, lease active all year (365 days)
- Annual charges: Eau 60000¢, TEOM 80000¢, Nettoyage 50000¢ (total: 190000¢)
- Provisions paid: 12 months × 15833¢ = 189996¢
- Then: share = 190000¢ (full year = no pro-rata)
- Balance: 190000 - 189996 = +4¢ (Complément)

**Scenario 2: Partial-year tenant (lease started July 1)**
- Given: Tenant Martin in Apt B, lease started 2025-07-01 (184 days in year)
- Annual charges: Eau 60000¢, TEOM 80000¢ (total: 140000¢)
- Water distribution for Apt B: 25000¢ (by consumption)
- TEOM share: Math.floor(184 * 80000 / 365) = 40328¢
- Total share: 25000 + 40328 = 65328¢
- Provisions paid: 6 months × 11667¢ = 70002¢
- Balance: 65328 - 70002 = -4674¢ (Trop-perçu)

**Scenario 3: Rounding remainder distribution**
- Given: 3 tenants all full year, charge = 10000¢
- Each share: Math.floor(365 * 10000 / 365) = 10000¢ each — no remainder (easy case)
- Given: 3 tenants, charge = 10001¢
- Each: Math.floor(365 * 10001 / 365) = 10001¢ — still no remainder with full year
- Remainder only occurs with partial-year tenants

**Scenario 4: No annual charges recorded**
- When: Trigger regularization without annual charges
- Then: Error "Aucune charge annuelle enregistrée pour l'exercice {year}"

**Scenario 5: Overwrite existing regularization**
- Given: Regularization already calculated for 2025
- When: Re-trigger for 2025 with updated charges
- Then: Previous statements replaced, new results displayed

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- 8 tasks completed across 2 sessions
- Backend: 1405 tests (213 suites) — all passing
- Frontend: 733 tests (95 suites) — all passing
- New backend tests: 70 (19 domain + 17 service + 5 projection + 14 presentation + 15 PDF)
- New frontend tests: 22 (12 section + 10 card)
- E2E: 4 tests (1 seed + 3 validation)
- Typecheck: clean (both backend + frontend)
- WaterDistributionService exported from WaterMeterReadingsPresentationModule (cross-module dependency fix)
- API fixture extended with `recordAnnualCharges()`, `getChargeRegularization()`, `waitForChargeRegularization()`

### File List

**New files (backend domain — 13 files):**
- backend/src/indexation/charge-regularization/regularization-statement.ts
- backend/src/indexation/charge-regularization/charge-regularization.aggregate.ts
- backend/src/indexation/charge-regularization/events/charge-regularization-calculated.event.ts
- backend/src/indexation/charge-regularization/commands/calculate-charge-regularization.command.ts
- backend/src/indexation/charge-regularization/commands/calculate-charge-regularization.handler.ts
- backend/src/indexation/charge-regularization/exceptions/no-charges-recorded.exception.ts
- backend/src/indexation/charge-regularization/exceptions/no-leases-found.exception.ts
- backend/src/indexation/charge-regularization/__tests__/mock-cqrx.ts
- backend/src/indexation/charge-regularization/__tests__/regularization-statement.spec.ts
- backend/src/indexation/charge-regularization/__tests__/charge-regularization.aggregate.spec.ts
- backend/src/indexation/charge-regularization/__tests__/calculate-charge-regularization.handler.spec.ts
- backend/prisma/migrations/20260215211352_add_charge_regularization/migration.sql

**New files (backend presentation — 14 files):**
- backend/src/presentation/charge-regularization/charge-regularization-presentation.module.ts
- backend/src/presentation/charge-regularization/dto/calculate-charge-regularization.dto.ts
- backend/src/presentation/charge-regularization/controllers/calculate-charge-regularization.controller.ts
- backend/src/presentation/charge-regularization/controllers/get-charge-regularization.controller.ts
- backend/src/presentation/charge-regularization/controllers/get-charge-regularization-pdf.controller.ts
- backend/src/presentation/charge-regularization/finders/charge-regularization.finder.ts
- backend/src/presentation/charge-regularization/queries/get-charge-regularization.query.ts
- backend/src/presentation/charge-regularization/queries/get-charge-regularization.handler.ts
- backend/src/presentation/charge-regularization/services/regularization-calculation.service.ts
- backend/src/presentation/charge-regularization/services/charge-regularization-pdf-assembler.service.ts
- backend/src/presentation/charge-regularization/projections/charge-regularization.projection.ts
- backend/src/presentation/charge-regularization/__tests__/calculate-charge-regularization.controller.spec.ts
- backend/src/presentation/charge-regularization/__tests__/get-charge-regularization.controller.spec.ts
- backend/src/presentation/charge-regularization/__tests__/get-charge-regularization.handler.spec.ts
- backend/src/presentation/charge-regularization/__tests__/charge-regularization.finder.spec.ts
- backend/src/presentation/charge-regularization/__tests__/regularization-calculation.service.spec.ts
- backend/src/presentation/charge-regularization/__tests__/charge-regularization.projection.spec.ts
- backend/src/presentation/charge-regularization/__tests__/charge-regularization-pdf-assembler.spec.ts
- backend/src/presentation/charge-regularization/__tests__/get-charge-regularization-pdf.controller.spec.ts

**New files (backend PDF — 3 files):**
- backend/src/infrastructure/document/charge-regularization-pdf-data.interface.ts
- backend/src/infrastructure/document/templates/charge-regularization.template.ts
- backend/src/infrastructure/document/__tests__/charge-regularization.template.spec.ts

**New files (frontend — 8 files):**
- frontend/src/lib/api/charge-regularization-api.ts
- frontend/src/hooks/use-charge-regularization.ts
- frontend/src/hooks/use-download-regularization-pdf.ts
- frontend/src/components/features/charges/charge-regularization-section.tsx
- frontend/src/components/features/charges/regularization-statement-card.tsx
- frontend/src/components/features/charges/__tests__/charge-regularization-section.test.tsx
- frontend/src/components/features/charges/__tests__/regularization-statement-card.test.tsx
- frontend/e2e/charge-regularization.spec.ts

**Modified files (8 files):**
- backend/prisma/schema.prisma — Add ChargeRegularization model
- backend/src/app.module.ts — Register ChargeRegularizationPresentationModule
- backend/src/infrastructure/document/pdf-generator.service.ts — Add generateChargeRegularizationPdf()
- backend/src/presentation/lease/finders/lease.finder.ts — Add findAllByEntityAndFiscalYear()
- backend/src/presentation/annual-charges/finders/annual-charges.finder.ts — Add findPaidBillingLinesByLeaseAndYear()
- backend/src/presentation/water-meter-readings/water-meter-readings-presentation.module.ts — Export WaterDistributionService
- frontend/src/app/(auth)/charges/page.tsx — Add ChargeRegularizationSection integration
- frontend/src/app/(auth)/charges/__tests__/charges-page.test.tsx — Add mocks for new hooks
- frontend/e2e/fixtures/api.fixture.ts — Add recordAnnualCharges, getChargeRegularization, waitForChargeRegularization
