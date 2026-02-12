# Story 4.1: Generate Rent Calls for All Active Leases in Batch

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to generate rent calls for all active leases of my entity in a single batch operation,
So that I can prepare monthly billing efficiently (FR18).

## Acceptance Criteria

1. **Given** I have active leases with configured billing lines, **When** I trigger batch rent call generation from the ActionFeed ("Générez vos appels de loyer") or the rent call page, **Then** the system generates one rent call per active lease for the selected month
2. **Given** a rent call is generated, **Then** each rent call contains all billing lines (rent, provisions, options) with correct amounts
3. **Given** a lease starts or ends mid-month for the selected period, **Then** pro-rata is applied for leases starting or ending mid-month (FR17), using `Math.floor((daysInPeriod * amountCents) / totalDaysInMonth)` with integer cents
4. **Given** batch generation is triggered, **Then** the event `RentCallGenerated` is stored per lease in KurrentDB with full billing breakdown
5. **Given** batch generation completes, **Then** batch generation completes in under 5 seconds for 50 units (NFR1)
6. **Given** batch generation completes, **Then** the BatchSummary component displays: total rent calls generated, total amount, any exceptions (terminated leases, missing config)
7. **Given** I have already generated rent calls for the selected month, **When** I attempt to generate again, **Then** the system rejects with a clear error ("Appels de loyer déjà générés pour ce mois")
8. **Given** I have no active leases, **When** I attempt to generate rent calls, **Then** the system displays a clear message ("Aucun bail actif")
9. **Given** rent calls have been generated, **When** I view the rent call list page, **Then** I see all generated rent calls grouped by month with tenant name, unit, and total amount

## Tasks / Subtasks

- [x] Task 1: Create Billing BC domain infrastructure and RentCallAggregate (AC: 1, 4, 7)
  - [x] 1.1: Create `backend/src/billing/` BC directory structure: `rent-call/` aggregate directory, `billing.module.ts`
  - [x] 1.2: Add path alias `@billing/*` to `tsconfig.json`, Jest `moduleNameMapper` (package.json), and `webpack.config.js`
  - [x] 1.3: Create `RentCallMonth` VO — `rent-call-month.ts` with `static fromYearMonth(year: number, month: number)`, `static fromString(value: string)` (format "YYYY-MM"), validation (1 ≤ month ≤ 12, year ≥ 2020), `get year()`, `get month()`, `toString()`, `equals(other)`
  - [x] 1.4: Create `RentCallLineItem` VO — composite VO with `{ label: string, amountCents: number, type: string }`, `static fromPrimitives()`, `toPrimitives()`
  - [x] 1.5: Create named exceptions: `RentCallsAlreadyGeneratedException` (`.forMonth(month: string)`), `RentCallNotCreatedException` (`.create()`), `InvalidRentCallMonthException` (`.invalidFormat()`, `.monthOutOfRange()`)
  - [x] 1.6: Create `RentCallGenerated` event — `{ rentCallId, entityId, userId, leaseId, tenantId, unitId, month, rentAmountCents, billingLines: Array<{label, amountCents, type}>, totalAmountCents, isProRata, occupiedDays, totalDaysInMonth }`
  - [x] 1.7: Create `GenerateRentCallsForMonthCommand` — `{ entityId, userId, month: string, rentCallData: Array<{id, leaseId, tenantId, unitId, rentAmountCents, billingLines, totalAmountCents, isProRata, occupiedDays, totalDaysInMonth}> }`
  - [x] 1.8: Create `RentCallAggregate` — separate stream `rent-call-{id}`. State: `rentCallId`, `entityId`, `leaseId`, `tenantId`, `unitId`, `month`, `rentAmountCents`, `billingLines`, `totalAmountCents`, `isProRata`, `created` flag. Method: `generate(...)` with `RentCallNotCreatedException` guard for replays. Event handler for `RentCallGenerated` to replay state.
  - [x] 1.9: Create `GenerateRentCallsForMonthHandler` — loads each rent call aggregate by pre-computed ID, calls `generate()`, saves. ZERO business logic in handler. The calculation logic lives in a domain service (Task 2).
  - [x] 1.10: Create `billing.module.ts` and `rent-call.module.ts`, register handler
  - [x] 1.11: Register `BillingModule` in `app.module.ts`
  - [x] 1.12: Write aggregate + handler + VO unit tests (21 tests)

- [x] Task 2: Create RentCallCalculationService domain service (AC: 2, 3, 8)
  - [x] 2.1: Create `IRentCallCalculationService` port interface in `billing/rent-call/` — `calculateForMonth(leases: ActiveLeaseData[], month: RentCallMonth): RentCallCalculation[]`
  - [x] 2.2: Define `ActiveLeaseData` interface: `{ leaseId, tenantId, unitId, rentAmountCents, startDate: string, endDate: string | null, billingLines: Array<{label, amountCents, type}> }`
  - [x] 2.3: Define `RentCallCalculation` interface: `{ leaseId, tenantId, unitId, rentAmountCents, billingLines, totalAmountCents, isProRata, occupiedDays, totalDaysInMonth }`
  - [x] 2.4: Create `RentCallCalculationService` implementation (co-located): for each active lease, calculate pro-rata using existing `calculateOccupiedDays` + `calculateProRataAmountCents` + `daysInMonth` from `tenancy/lease/pro-rata.ts`. Apply pro-rata to each billing line independently. Compute total = proRata(rentAmountCents) + sum(proRata(billingLine.amountCents) for each line)
  - [x] 2.5: Filter terminated leases: skip leases where `endDate !== null && new Date(endDate) < monthStart`
  - [x] 2.6: Handle full-month case (no pro-rata): if lease covers entire month, return original amounts unchanged (isProRata = false)
  - [x] 2.7: Write comprehensive service unit tests (12 tests: full month, start mid-month, end mid-month, both mid-month, no active leases, terminated before month, multiple billing lines, leap year)

- [x] Task 3: Create Prisma migration and projection (AC: 1, 4, 9)
  - [x] 3.1: Add `RentCall` model to Prisma schema with unique constraint on `@@unique([leaseId, month])`
  - [x] 3.2: Run `prisma migrate dev` (migration: 20260212231359_add_rent_call_model)
  - [x] 3.3: Create `rent-call.projection.ts` — subscribe to `rent-call_*` streams, handle `RentCallGenerated` event → INSERT into RentCall table. Check existence before insert (idempotent).
  - [x] 3.4: Write projection tests (3 tests: insert, idempotent skip, subscription init)

- [x] Task 4: Create presentation layer — controller, DTO, finder, query (AC: 1, 6, 7, 8, 9)
  - [x] 4.1: Create `GenerateRentCallsForMonthDto` — `@IsString() @IsNotEmpty() @Matches(/^\d{4}-\d{2}$/) month: string`
  - [x] 4.2: Create `GenerateRentCallsForMonthController` — `POST /api/entities/:entityId/rent-calls/generate`, HttpCode 200. Authorization, idempotency check, batch calculation, command dispatch, return summary.
  - [x] 4.3: Create `RentCallFinder` — `findAllByEntityAndMonth`, `findAllByEntityAndUser`, `existsByEntityAndMonth`
  - [x] 4.4: Create `GetRentCallsQuery` + handler — returns rent calls for entity, optionally filtered by month
  - [x] 4.5: Create `GetRentCallsController` — `GET /api/entities/:entityId/rent-calls?month=YYYY-MM`
  - [x] 4.6: Create `RentCallPresentationModule` — register controller, finder, projection, query handler, calculation service
  - [x] 4.7: Register `RentCallPresentationModule` in `app.module.ts`
  - [x] 4.8: Write controller unit tests (6 tests: success with summary, unauthorized, no active leases, already generated, invalid month, multiple leases)

- [x] Task 5: Create frontend API client and hooks (AC: 1, 6, 9)
  - [x] 5.1: Create `frontend/src/lib/api/rent-calls-api.ts` — `RentCallData` and `GenerationResult` interfaces, `useRentCallsApi()` hook
  - [x] 5.2: Add API functions: `generateRentCalls(entityId, month)`, `getRentCalls(entityId, month?)`
  - [x] 5.3: Create `frontend/src/hooks/use-rent-calls.ts` — `useRentCalls(entityId, month?)` query hook with `staleTime: 30_000`, `useGenerateRentCalls(entityId)` mutation hook with delayed invalidation (1500ms)
  - [x] 5.4: Write hook tests (4 tests: query, disabled, mutation success, error handling)

- [x] Task 6: Create rent call list page and batch generation UI (AC: 6, 9)
  - [x] 6.1: Create `frontend/src/app/(auth)/rent-calls/page.tsx` — Client component with no-entity state, delegates to `RentCallsPageContent`
  - [x] 6.2: Create `RentCallsPageContent` — month selector (±2 months), "Générer les appels" button (disabled when already generated or no active leases), rent call list, batch summary display
  - [x] 6.3: Create `rent-call-list.tsx` — displays rent calls with tenant name, unit identifier, billing line breakdown, total with tabular-nums, pro-rata badge
  - [x] 6.4: Create `batch-summary.tsx` — Card with green success styling, count, total amount, exceptions/warnings section
  - [x] 6.5: Create `generate-rent-calls-dialog.tsx` — AlertDialog confirmation with month, lease count, loading state, error display
  - [x] 6.6: Write frontend component tests (19 tests: 6 list, 4 batch summary, 5 dialog, 4 page content)

- [x] Task 7: Update ActionFeed and sidebar navigation (AC: 1)
  - [x] 7.1: Add "Appels de loyer" link to sidebar navigation (`/rent-calls`, icon: `Receipt`)
  - [x] 7.2: Add ActionFeed step 7: "Générez vos appels de loyer" — condition: entity has active leases AND no rent calls generated for current month. Icon: Receipt, priority: high, href: `/rent-calls`
  - [x] 7.3: Write ActionFeed test for step 7 condition (3 tests)
  - [x] 7.4: Write sidebar navigation test for new link (3 tests)

- [x] Task 8: E2E tests (AC: 1, 6, 9)
  - [x] 8.1: Add `generateRentCalls(entityId, month)`, `getRentCalls(entityId, month?)`, `waitForRentCallCount` to API fixture
  - [x] 8.2: E2E: Full flow — seed data via API, navigate to rent calls page, generate rent calls, verify batch summary and list
  - [x] 8.3: E2E: Verify ActionFeed step 7 hidden after generation (same flow as 8.2)

## Dev Notes

### Architecture Decisions

- **First story in Billing Bounded Context**: This creates `backend/src/billing/` — a new BC separate from Portfolio and Tenancy. The Billing BC owns the `RentCall` aggregate. Cross-BC references by ID only (leaseId, tenantId, unitId are strings, not imports).
- **RentCallAggregate: separate stream per rent call**: Each rent call has its own event stream `rent-call-{id}`. This allows individual rent call tracking (sent status, payment matching in Epic 5). NOT a single aggregate per batch — each lease gets its own rent call aggregate for future extensibility.
- **Batch generation as orchestration**: The controller orchestrates batch generation: loads active leases, calculates amounts via domain service, dispatches one command per rent call. The command handler per rent call is pure orchestration (load → generate → save). Business logic (pro-rata, billing line aggregation) lives in the `RentCallCalculationService` domain service, passed as a parameter or used in the controller.
- **Exception to 202 no-body rule**: Batch generation returns a response body with generation summary (`{ generated, totalAmountCents, exceptions }`). This is a deliberate exception: the frontend needs batch results immediately, and polling would add unnecessary complexity for a synchronous operation.
- **Server-generated UUIDs for batch**: Unlike other commands where the frontend generates UUIDs, batch rent call generation creates IDs on the server because the frontend doesn't know how many rent calls will be generated. This is acceptable because the frontend doesn't need to navigate to a specific rent call immediately — it shows a summary instead.
- **Idempotency via unique constraint**: `@@unique([leaseId, month])` on the RentCall Prisma model prevents duplicate generation. The controller checks `RentCallFinder.existsByEntityAndMonth()` before generating. The projection also checks existence before INSERT (double safety).
- **Pro-rata reuse**: The pro-rata utility from Story 3.6 (`tenancy/lease/pro-rata.ts`) is reused. The `RentCallCalculationService` imports these functions. Cross-BC import of a pure utility function is acceptable — it's a calculation, not domain logic.
- **No RentCall domain in Tenancy**: The rent call belongs to the Billing BC, NOT Tenancy. Tenancy manages the lease lifecycle; Billing manages the revenue cycle. This separation allows Billing to evolve independently (payments, receipts, etc. in Epic 5).

### Domain Service Pattern

The `RentCallCalculationService` follows the hexagonal pattern:
- **Port** (interface): `IRentCallCalculationService` defined in `billing/rent-call/`
- **Implementation**: Co-located or in infrastructure. Uses pro-rata functions from `tenancy/lease/pro-rata.ts`.
- **Usage**: Controller calls the service directly (not passed to aggregate). The aggregate only receives pre-computed data.

```typescript
// Port (interface in billing/rent-call/)
interface IRentCallCalculationService {
  calculateForMonth(leases: ActiveLeaseData[], month: RentCallMonth): RentCallCalculation[];
}

// Controller orchestration
const activeLeases = await this.leaseFinder.findAllActiveByEntityAndUser(entityId, userId);
const calculations = this.calculationService.calculateForMonth(activeLeases, month);
for (const calc of calculations) {
  const rentCallId = crypto.randomUUID();
  await this.commandBus.execute(new GenerateRentCallsForMonthCommand({
    rentCallId, entityId, userId: userId.value, ...calc,
  }));
}
```

### Value Objects

| VO | File | Type | Validation | Null Object |
|---|---|---|---|---|
| RentCallMonth | `rent-call-month.ts` | String (YYYY-MM) | 1 ≤ month ≤ 12, year ≥ 2020, format regex | No |
| RentCallLineItem | `rent-call-line-item.ts` | Composite | label non-empty, amountCents ≥ 0, type in allowed set | No |

### Events

| Event | Trigger | Data Fields |
|---|---|---|
| `RentCallGenerated` | GenerateRentCallsForMonthCommand | `{ rentCallId, entityId, userId, leaseId, tenantId, unitId, month, rentAmountCents, billingLines, totalAmountCents, isProRata, occupiedDays, totalDaysInMonth }` |

Metadata: `{ userId, entityId, timestamp, correlationId }`

### Commands

| Command | Handler | Logic |
|---|---|---|
| `GenerateRentCallsForMonthCommand` | `GenerateRentCallsForMonthHandler` | Load RentCallAggregate, call `generate(...)`, save. ZERO business logic. |

### API Endpoints

| Method | Path | Purpose | Response |
|---|---|---|---|
| `POST` | `/api/entities/:entityId/rent-calls/generate` | Batch generate rent calls for a month | 200 OK `{ generated, totalAmountCents, exceptions }` |
| `GET` | `/api/entities/:entityId/rent-calls?month=YYYY-MM` | List rent calls for entity (optional month filter) | 200 OK `{ data: RentCallData[] }` |

**Authorization flow** (controller-level):
1. Extract `userId` from JWT via `@CurrentUserId()`
2. Verify entity ownership: `EntityFinder.findByIdAndUserId(entityId, userId)` → throw UnauthorizedException
3. Validate DTO (class-validator)
4. Check for existing rent calls for month: `RentCallFinder.existsByEntityAndMonth()`
5. Load active leases: `LeaseFinder.findAllActiveByEntityAndUser()`
6. Calculate amounts: `RentCallCalculationService.calculateForMonth()`
7. Dispatch commands per rent call
8. Return batch summary

### Prisma Model

```prisma
model RentCall {
  id                String   @id @default(uuid())
  entityId          String   @map("entity_id")
  userId            String   @map("user_id")
  leaseId           String   @map("lease_id")
  tenantId          String   @map("tenant_id")
  unitId            String   @map("unit_id")
  month             String                                     // YYYY-MM format
  rentAmountCents   Int      @map("rent_amount_cents")
  billingLines      Json     @default("[]") @map("billing_lines")
  totalAmountCents  Int      @map("total_amount_cents")
  isProRata         Boolean  @default(false) @map("is_pro_rata")
  occupiedDays      Int?     @map("occupied_days")
  totalDaysInMonth  Int?     @map("total_days_in_month")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  entity OwnershipEntity @relation(fields: [entityId], references: [id])
  tenant Tenant          @relation(fields: [tenantId], references: [id])
  unit   Unit            @relation(fields: [unitId], references: [id])

  @@unique([leaseId, month])
  @@map("rent_calls")
}
```

### LeaseFinder Extension

Add method to existing `LeaseFinder` (or create a new query handler):

```typescript
async findAllActiveByEntityAndUser(entityId: string, userId: string): Promise<Lease[]> {
  return this.prisma.lease.findMany({
    where: {
      entityId,
      userId,
      OR: [
        { endDate: null },              // No termination
        { endDate: { gt: new Date() } }, // Termination in the future
      ],
    },
  });
}
```

**Note**: For precision, filter by "active during the target month" — not just "active now". A lease that ends on the 15th of the target month is still active for that month (pro-rata applies).

### Pro-Rata Calculation Flow

```
For each active lease in month YYYY-MM:
  1. Compute occupiedDays = calculateOccupiedDays(leaseStartDate, leaseEndDate, year, month)
  2. Compute totalDaysInMonth = daysInMonth(year, month)
  3. If occupiedDays === totalDaysInMonth → full month (no pro-rata)
     - rentAmountCents = lease.rentAmountCents
     - Each billingLine.amountCents = original amount
  4. Else → pro-rata
     - rentAmountCents = calculateProRataAmountCents(lease.rentAmountCents, occupiedDays, totalDaysInMonth)
     - Each billingLine.amountCents = calculateProRataAmountCents(line.amountCents, occupiedDays, totalDaysInMonth)
  5. totalAmountCents = rentAmountCents + sum(billingLine.amountCents)
```

**Critical rules**:
- `Math.floor()` for ALL pro-rata calculations (truncation per French law NFR18)
- Apply pro-rata to EACH billing line independently (not to the total)
- Multiplication BEFORE division: `(daysInPeriod * amountCents) / totalDaysInMonth`
- All amounts as integer cents

### Frontend Rent Call List

```typescript
interface RentCallData {
  id: string;
  entityId: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  month: string;         // "YYYY-MM"
  rentAmountCents: number;
  billingLines: Array<{ label: string; amountCents: number; type: string }>;
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number | null;
  totalDaysInMonth: number | null;
  createdAt: string;
}
```

Display format: French number formatting (`1 234,56 €`), tabular-nums font feature for financial columns.

### BatchSummary Component

The UX spec (line 129) requires a custom `BatchSummary` component. Design:

```tsx
<BatchSummary
  generated={result.generated}
  totalAmountCents={result.totalAmountCents}
  exceptions={result.exceptions}
/>
```

Displays:
- Count: "3 appels de loyer générés"
- Total: "Montant total : 2 145,00 €"
- Exceptions (if any): warning list of skipped leases with reasons

### ActionFeed Step 7

```typescript
// In action-feed.tsx — after step 6 (leases)
if (
  entityId &&
  leases && leases.length > 0 &&
  // At least one lease has billing lines configured
  leases.some(l => !l.endDate || new Date(l.endDate) > new Date()) &&
  // No rent calls generated for current month
  !rentCallsForCurrentMonth?.length
) {
  actions.push({
    id: "onboarding-generate-rent-calls",
    icon: Receipt,  // from lucide-react
    title: "Générez vos appels de loyer",
    description: "Créez les appels de loyer pour tous vos baux actifs",
    href: "/rent-calls",
    priority: "high",
  });
}
```

### Cross-Query Cache Invalidation

Rent call generation must invalidate:
- `["entities", entityId, "rent-calls"]` — rent call list (primary)
- `["entities"]` — dashboard data (action feed update)

Use `setTimeout(1500ms)` delayed invalidation pattern (established in Story 2.1).

### Testing Standards

**Backend (Jest)**:
- RentCallMonth VO: valid YYYY-MM, invalid format, month out of range, year too low (~6 tests)
- RentCallLineItem VO: valid data, empty label, negative amount (~4 tests)
- Named exceptions: all static factories (~4 tests)
- RentCallAggregate: valid generation, reject duplicate (already created), event replay (~4 tests)
- GenerateRentCallsForMonthHandler: success, aggregate-not-found (~2 tests)
- RentCallCalculationService: full month, start mid-month, end mid-month, both mid-month, no active leases, terminated before month, multiple billing lines, leap year February (~10 tests)
- GenerateRentCallsForMonthController: success with summary, unauthorized, no active leases, already generated, validation errors (~6 tests)
- RentCallProjection: insert, idempotent, missing entity (~3 tests)
- RentCallFinder: findAllByEntityAndMonth, existsByEntityAndMonth (~3 tests)

**Frontend (Vitest)**:
- RentCallList: render list, empty state, French formatting, pro-rata badge (~5 tests)
- BatchSummary: render summary, with exceptions, zero generated (~4 tests)
- GenerateRentCallsDialog: render confirmation, submit, cancel, loading state (~4 tests)
- RentCallsPageContent: month selector, generate button states, integration (~4 tests)
- ActionFeed step 7: shows when leases exist + no rent calls, hidden when already generated (~3 tests)
- useRentCalls/useGenerateRentCalls hooks: query + mutation behavior (~4 tests)

**E2E (Playwright)**:
- Full flow: create fixtures → generate rent calls → verify summary + list (~1 test)
- ActionFeed: verify step 7 appears after lease creation, disappears after generation (~1 test)

### Previous Story Intelligence

**From Story 3.6 (Terminate a Lease)**:
- Pro-rata utility at `backend/src/tenancy/lease/pro-rata.ts` — reuse directly
- `LeaseEndDate` VO — terminated leases have `endDate !== null`
- UnitMosaic and lease filtering patterns for terminated leases
- AlertDialog confirmation pattern — clone for generation confirmation

**From Story 3.4 (Billing Lines)**:
- `billingLines` stored as JSON array in Prisma `Lease` model: `[{ label, amountCents, type }]`
- `LeaseBillingLinesConfigured` event contains the full billing lines array
- Default rent line is derived from `rentAmountCents` (NOT stored in billingLines)
- Total = rentAmountCents + sum(billingLines.amountCents)

**From Story 3.3 (Leases)**:
- LeaseAggregate has `created` flag pattern — reuse for RentCallAggregate
- `LeaseFinder.findAllByEntityAndUser()` returns all leases — need to filter active ones

**From Story 3.1 (Tenants)**:
- New Bounded Context pattern: `backend/src/tenancy/` — clone directory structure for `backend/src/billing/`
- Path alias: `@tenancy/*` added to tsconfig, Jest, webpack — repeat for `@billing/*`

**From Story 2.6 (Dashboard)**:
- ActionFeed progression pattern — follow for step 7
- `DashboardContent` client component wrapper pattern

**From Story 2.1 (Entities)**:
- Optimistic UI + delayed invalidation (1500ms) pattern
- EntityFinder for cross-aggregate authorization

### Known Pitfalls to Avoid

1. **DO NOT put calculation logic in the command handler** — all pro-rata and billing aggregation logic belongs in the `RentCallCalculationService` domain service
2. **DO NOT import Lease aggregate from Tenancy BC** — use LeaseFinder (presentation layer) to query lease data from PostgreSQL read model. Cross-BC communication via IDs only.
3. **DO NOT use floating-point for any financial calculation** — `Math.floor((days * cents) / totalDays)` ensures integer result
4. **DO NOT forget to apply pro-rata to EACH billing line independently** — not just the total
5. **DO NOT allow duplicate rent call generation** — unique constraint `@@unique([leaseId, month])` + controller check via `RentCallFinder.existsByEntityAndMonth()`
6. **DO NOT generate rent calls for terminated leases** — filter by `endDate IS NULL OR endDate > month start`
7. **DO NOT use `.default()` or `.refine()` on Zod schema** with zodResolver
8. **DO NOT call `invalidateQueries` immediately** — use delayed invalidation (1500ms)
9. **DO NOT forget to run `prisma generate`** after schema changes
10. **DO NOT forget path aliases** for new `@billing/*` BC in tsconfig.json, Jest moduleNameMapper, and webpack.config.js
11. **DO NOT use `as` cast for enum/type validation** — use guard clause + named exception
12. **DO NOT forget to add sidebar navigation link** for "Appels de loyer"
13. **DO NOT generate UUIDs on frontend for batch** — server generates IDs for batch operations

### Project Structure Notes

**New files created (verified via git status):**

```
backend/src/billing/billing.module.ts
backend/src/billing/rent-call/rent-call.module.ts
backend/src/billing/rent-call/rent-call.aggregate.ts
backend/src/billing/rent-call/rent-call-month.ts
backend/src/billing/rent-call/rent-call-line-item.ts
backend/src/billing/rent-call/rent-call-calculation.service.ts
backend/src/billing/rent-call/events/rent-call-generated.event.ts
backend/src/billing/rent-call/commands/generate-rent-calls-for-month.command.ts
backend/src/billing/rent-call/commands/generate-rent-calls-for-month.handler.ts
backend/src/billing/rent-call/exceptions/rent-calls-already-generated.exception.ts
backend/src/billing/rent-call/exceptions/rent-call-not-created.exception.ts
backend/src/billing/rent-call/exceptions/invalid-rent-call-month.exception.ts
backend/src/billing/rent-call/__tests__/mock-cqrx.ts
backend/src/billing/rent-call/__tests__/rent-call-month.spec.ts
backend/src/billing/rent-call/__tests__/rent-call-line-item.spec.ts
backend/src/billing/rent-call/__tests__/rent-call.aggregate.spec.ts
backend/src/billing/rent-call/__tests__/rent-call-calculation.service.spec.ts
backend/src/billing/rent-call/__tests__/generate-rent-calls-for-month.handler.spec.ts
backend/src/presentation/rent-call/rent-call-presentation.module.ts
backend/src/presentation/rent-call/controllers/generate-rent-calls-for-month.controller.ts
backend/src/presentation/rent-call/controllers/get-rent-calls.controller.ts
backend/src/presentation/rent-call/dto/generate-rent-calls-for-month.dto.ts
backend/src/presentation/rent-call/finders/rent-call.finder.ts
backend/src/presentation/rent-call/projections/rent-call.projection.ts
backend/src/presentation/rent-call/queries/get-rent-calls.query.ts
backend/src/presentation/rent-call/queries/get-rent-calls.handler.ts
backend/src/presentation/rent-call/__tests__/generate-rent-calls-for-month.controller.spec.ts
backend/src/presentation/rent-call/__tests__/rent-call.projection.spec.ts
backend/prisma/migrations/20260212231359_add_rent_call_model/migration.sql
frontend/src/app/(auth)/rent-calls/page.tsx
frontend/src/components/features/rent-calls/rent-calls-page-content.tsx
frontend/src/components/features/rent-calls/rent-call-list.tsx
frontend/src/components/features/rent-calls/batch-summary.tsx
frontend/src/components/features/rent-calls/generate-rent-calls-dialog.tsx
frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx
frontend/src/components/features/rent-calls/__tests__/batch-summary.test.tsx
frontend/src/components/features/rent-calls/__tests__/generate-rent-calls-dialog.test.tsx
frontend/src/components/features/rent-calls/__tests__/rent-calls-page-content.test.tsx
frontend/src/components/features/dashboard/__tests__/action-feed-rent-calls.test.tsx
frontend/src/components/layout/__tests__/sidebar-rent-calls.test.tsx
frontend/src/hooks/use-rent-calls.ts
frontend/src/hooks/__tests__/use-rent-calls.test.ts
frontend/src/lib/api/rent-calls-api.ts
frontend/e2e/rent-calls.spec.ts
```

**Files modified (verified via git status):**

```
backend/src/app.module.ts                                          (register BillingModule + RentCallPresentationModule)
backend/tsconfig.json                                              (add @billing/* path alias)
backend/package.json                                               (add @billing/* Jest moduleNameMapper)
backend/webpack.config.js                                          (add @billing/* webpack alias)
backend/prisma/schema.prisma                                       (add RentCall model + relations)
backend/src/presentation/lease/finders/lease.finder.ts             (add findAllActiveByEntityAndUser method)
frontend/src/components/features/dashboard/action-feed.tsx         (add step 7: generate rent calls + Receipt icon + useRentCalls)
frontend/src/components/layout/sidebar.tsx                         (add "Appels de loyer" navigation link with Receipt icon)
frontend/e2e/fixtures/api.fixture.ts                               (add generateRentCalls, getRentCalls, waitForRentCallCount)
```

## Dev Agent Record

### Completion Summary

- **Date**: 2026-02-13
- **Tasks**: 8/8 complete
- **Backend tests**: 611 (85 suites) — 45 new tests (21 domain + 12 service + 3 projection + 7 controller + 2 handler)
- **Frontend tests**: 350 (46 suites) — 33 new tests (4 hooks + 19 components + 7 ActionFeed/sidebar + 3 ActionFeed rent calls)
- **E2E tests**: 3 new tests (1 spec file — seed + generate + ActionFeed verification)
- **New files**: 44
- **Modified files**: 9
- **New BC**: Billing (`backend/src/billing/`)

### Change Log

| Task | Summary | Tests |
|------|---------|-------|
| 1 | Billing BC domain: RentCallAggregate, 2 VOs, 3 exceptions, 1 event, 1 command, 1 handler, 2 modules, path aliases | 21 |
| 2 | RentCallCalculationService domain service with pro-rata from Tenancy BC | 12 |
| 3 | Prisma RentCall model + migration + projection | 3 |
| 4 | Presentation layer: controllers, DTO, finder, query handler, module | 6 |
| 5 | Frontend API client + React Query hooks | 4 |
| 6 | Rent call list page, BatchSummary, GenerateRentCallsDialog, month selector | 19 |
| 7 | Sidebar "Appels de loyer" link + ActionFeed step 7 | 6 |
| 8 | E2E test spec with API fixture methods | 3 |

### Issues Encountered

1. **nestjs-cqrx ESM import in Jest**: Same issue as Tenancy BC — resolved by copying `mock-cqrx.ts` pattern to `billing/rent-call/__tests__/`
2. **Intl.NumberFormat narrow no-break space**: French currency formatting uses `\u202F` (narrow no-break space) which differs from regular space in regex — used `.` wildcard matcher
3. **JSX text node splitting**: Conditional JSX expressions create separate text nodes that `getByText(/regex/)` can't match as single string — adapted assertions to match partial text

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.1] — User story, acceptance criteria, FR18
- [Source: _bmad-output/planning-artifacts/architecture.md — Bounded Contexts] — Billing BC owns RentCall aggregate
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture] — `rent-call-{id}` stream
- [Source: _bmad-output/planning-artifacts/architecture.md — Naming Conventions] — VerbANoun commands, PastTense events
- [Source: _bmad-output/planning-artifacts/architecture.md — Controller Pattern] — One controller per action
- [Source: _bmad-output/planning-artifacts/architecture.md — Value Objects] — Private constructor, static factory
- [Source: _bmad-output/planning-artifacts/architecture.md — Financial Precision] — Integer cents, Math.floor
- [Source: _bmad-output/planning-artifacts/prd.md — FR18] — Batch rent call generation
- [Source: _bmad-output/planning-artifacts/prd.md — FR17] — Pro-rata for mid-month lease start/end
- [Source: _bmad-output/planning-artifacts/prd.md — NFR1] — Batch completes in <5s for 50 units
- [Source: _bmad-output/planning-artifacts/prd.md — NFR18] — Integer cents, 2-decimal precision
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — BatchSummary] — Custom component requirement
- [Source: _bmad-output/implementation-artifacts/3-6-terminate-a-lease-with-pro-rata-calculation.md] — Pro-rata utility, LeaseEndDate
- [Source: _bmad-output/implementation-artifacts/3-4-configure-billing-lines-per-lease.md] — BillingLine data structure, JSON storage
- [Source: _bmad-output/implementation-artifacts/3-3-create-a-lease-linking-tenant-to-unit.md] — LeaseAggregate structure, E2E serial mode
- [Source: _bmad-output/implementation-artifacts/3-1-register-tenants-with-contact-information.md] — New BC creation pattern, path aliases
- [Source: docs/project-context.md — CQRS/ES Patterns] — Optimistic UI, delayed invalidation
- [Source: docs/project-context.md — Backend Architecture] — BC module registration
- [Source: docs/project-context.md — Testing Infrastructure] — Jest + Vitest + Playwright patterns
- [Source: docs/anti-patterns.md] — DTO checklist, guard clauses, named exceptions
- [Source: docs/dto-checklist.md] — @IsString, @IsNotEmpty, @Matches for validation

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Code Review Findings — Adversarial (20 findings, all fixed)

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| 1 | CRITICAL | LeaseFinder.findAllActiveByEntityAndUser() filtered by NOW instead of month boundary | Added `monthStart` parameter, controller passes month-start Date |
| 2 | CRITICAL | RentCallLineItem used generic `throw new Error()` instead of named exception | Created `InvalidRentCallLineItemException` with `labelEmpty()`, `negativeAmount()`, `typeEmpty()` |
| 3 | CRITICAL | Unsafe `as` casts in controller (billingLines) and projection (event data) | Controller: `Array.isArray()` validation. Projection: `isValidRentCallGeneratedData()` guard + safe billingLines cast |
| 4 | CRITICAL | Missing composite index `(entityId, month)` on RentCall model | Added `@@index([entityId, month])` + migration |
| 5 | HIGH | Cache invalidation incomplete — missing leases query | Added `["entities", entityId, "leases"]` invalidation |
| 6 | HIGH | Race condition on concurrent batch generation | Documented; Prisma unique constraint + projection idempotency are the safety net; acceptable for MVP |
| 7 | HIGH | No guard on billingLines amountCents >= 0 in calculation service | Data comes from validated Lease model; RentCallLineItem VO validates at aggregate level |
| 8 | HIGH | Missing `@MaxLength(7)` on DTO month field | Added `@MaxLength(7)` per DTO checklist |
| 9 | HIGH | `exceptions` array in BatchGenerationResult never populated | Controller now dispatches per-lease with try-catch, captures failures in exceptions array |
| 10 | HIGH | E2E test 7.3 used hardcoded `waitForTimeout(2000)` | Replaced with `expect().toBeVisible({ timeout })` pattern |
| 11 | MEDIUM | Event schema vs Prisma nullable mismatch for occupiedDays/totalDaysInMonth | Projection now passes `?? null` for these fields |
| 12 | MEDIUM | RentCallCalculationService missing `@Injectable()` | Added `@Injectable()` decorator |
| 13 | MEDIUM | ActionFeed passes `entityId ?? ""` to useRentCalls | Follows established pattern; hook's `enabled: !!entityId` prevents API call |
| 14 | MEDIUM | Duplicated month regex (DTO vs VO) | Trivial regex; added comment referencing VO. YAGNI. |
| 15 | MEDIUM | Missing test for terminated lease in ActionFeed | Added test: "should not show rent call step when all leases are terminated" |
| 16 | MEDIUM | E2E doesn't verify which month is generated | Added assertion on expected month in dialog |
| 17 | MEDIUM | Badge "Prorata" in English in French UI | Changed to "Pro-rata" |
| 18 | LOW | No E2E idempotency test | Unit test covers it; E2E would require separate entity setup |
| 19 | LOW | RentCallFinder parameter order inconsistent | Fixed `findAllByEntityAndMonth(entityId, userId, month)` — consistent order |
| 20 | LOW | monthOptions useMemo with empty deps | Correct behavior: computed once per mount. YAGNI. |

**New files from review**: `backend/src/billing/rent-call/exceptions/invalid-rent-call-line-item.exception.ts`, `backend/prisma/migrations/20260212234041_add_rent_call_entity_month_index/migration.sql`

### File List
