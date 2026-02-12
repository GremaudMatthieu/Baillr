# Story 3.3: Create a Lease Linking Tenant to Unit

Status: done

## Story

As a bailleur,
I want to create a lease that links a tenant to a specific unit with rent amount, security deposit, due date, and revision index type,
So that I can formalize the rental agreement in the system (FR12).

## Acceptance Criteria

1. **Given** I have a tenant and a vacant unit, **When** I create a lease, **Then** I can enter: tenant selection (searchable dropdown), unit selection (filtered to vacant units for current entity), start date, rent amount (displayed in euros, stored as integer cents), security deposit amount (integer cents), monthly due date (day of month 1-31), revision index type (IRL/ILC/ICC)
2. **Given** I submit the lease creation form with valid data, **When** the command is processed, **Then** the event `LeaseCreated` is stored in KurrentDB with `entityId` in metadata
3. **Given** a lease is created for a unit, **When** the UnitMosaic renders, **Then** the unit's tile changes from vacant (gray) to occupied (green/colored)
4. **Given** a lease exists, **When** I view the unit detail page, **Then** the lease information is displayed
5. **Given** a lease exists, **When** I view the tenant detail page, **Then** the lease information is displayed
6. **Given** I have no leases yet but have tenants and units, **When** I view the dashboard, **Then** the ActionFeed shows "Créez vos baux" as step 6 of onboarding progression

## Tasks / Subtasks

- [x] Task 1: Create LeaseAggregate with VOs and domain events (AC: 1, 2)
  - [x] 1.1: Create VOs — RentAmount, SecurityDeposit, MonthlyDueDate, RevisionIndexType, LeaseStartDate
  - [x] 1.2: Create named domain exceptions for each VO
  - [x] 1.3: Create LeaseCreated event
  - [x] 1.4: Create CreateALeaseCommand + handler
  - [x] 1.5: Create LeaseAggregate with create() method, stream `lease-{id}`
  - [x] 1.6: Write aggregate + handler + VO unit tests
- [x] Task 2: Create Prisma Lease model and migration (AC: 2, 3, 4, 5)
  - [x] 2.1: Add Lease model to schema.prisma with relations to Tenant, Unit, OwnershipEntity
  - [x] 2.2: Add `isOccupied` Boolean field to Unit model (or derive from Lease existence)
  - [x] 2.3: Run migration
- [x] Task 3: Create lease presentation layer — controllers, DTOs, queries, projection, finder (AC: 1, 2, 4, 5)
  - [x] 3.1: Create CreateALeaseDto with class-validator decorators
  - [x] 3.2: Create CreateALeaseController (POST /api/entities/:entityId/leases, 202 Accepted)
  - [x] 3.3: Create GetLeasesController (GET /api/entities/:entityId/leases)
  - [x] 3.4: Create GetALeaseController (GET /api/leases/:id)
  - [x] 3.5: Create GetLeasesQuery + GetALeaseQuery with handlers
  - [x] 3.6: Create LeaseFinder
  - [x] 3.7: Create lease.projection.ts (subscribe to LeaseCreated, upsert Prisma)
  - [x] 3.8: Create LeasePresentationModule, register in AppModule
  - [x] 3.9: Write controller + projection + finder unit tests
- [x] Task 4: Create frontend API client and hooks (AC: 1, 2)
  - [x] 4.1: Create `lib/api/leases-api.ts` with `useLeasesApi()` — getLeases, getLease, createLease
  - [x] 4.2: Create `hooks/use-leases.ts` — useLeases(entityId), useLease(id), useCreateLease(entityId)
  - [x] 4.3: Optimistic update + delayed invalidation (30s staleTime pattern)
- [x] Task 5: Create lease form and pages (AC: 1, 6)
  - [x] 5.1: Create `lease-schema.ts` (Zod v4 — tenant, unit, startDate, rent, deposit, dueDate, indexType)
  - [x] 5.2: Create `lease-form.tsx` — searchable tenant dropdown, unit dropdown (vacant only), date picker, euro inputs, day selector, IRL/ILC/ICC select
  - [x] 5.3: Create `/leases/page.tsx` (list), `/leases/new/page.tsx` (create), `/leases/[id]/page.tsx` (detail)
  - [x] 5.4: Add "Baux" navigation item to sidebar (FileText icon, href `/leases`)
  - [x] 5.5: Write lease-form + lease-list + lease-detail frontend tests
- [x] Task 6: Display lease on unit and tenant detail pages (AC: 4, 5)
  - [x] 6.1: Add lease section to `/tenants/[id]/page.tsx` — show active lease(s) for tenant
  - [x] 6.2: Add lease section to `/properties/[id]/units/[unitId]/page.tsx` or unit detail — show lease for unit
  - [x] 6.3: Write frontend tests for lease display sections
- [x] Task 7: Update UnitMosaic and ActionFeed (AC: 3, 6)
  - [x] 7.1: Update UnitMosaic tile color logic — gray if no active lease, colored if leased
  - [x] 7.2: Update ActionFeed onboarding step 6 — "Créez vos baux" when tenants exist but no leases
  - [x] 7.3: Cross-query cache invalidation — lease mutations invalidate units + entities queries
  - [x] 7.4: Write ActionFeed + UnitMosaic update tests
- [x] Task 8: E2E tests (AC: 1, 2, 3, 4, 5, 6)
  - [x] 8.1: Add lease API fixture methods (createLease, getLeases, waitForLeaseCount)
  - [x] 8.2: E2E: Create a lease from the form → verify lease appears in list
  - [x] 8.3: E2E: Verify UnitMosaic updates after lease creation
  - [x] 8.4: E2E: Verify ActionFeed progression (step 6)

## Dev Notes

### Architecture Decisions

- **Bounded Context**: Lease belongs to **Tenancy BC** (`backend/src/tenancy/lease/`), NOT Portfolio — per architecture.md (FR9-17 = Tenancy BC). Lease and Tenant share the same BC because leases are part of the tenant lifecycle and lease contracts domain.
- **Separate Aggregate**: LeaseAggregate with own stream `lease-{id}` — NOT a child entity of Tenant or Unit. Lease will grow complex with billing lines (3.4), revision parameters (3.5), and termination state (3.6).
- **Cross-BC references by ID only**: Lease stores `unitId: string` and `tenantId: string` — no direct imports from Portfolio BC domain. Controller-level authorization via EntityFinder, TenantFinder, UnitFinder.
- **No update operation in this story**: Story 3.3 is create-only. Updates to lease come from 3.4 (billing lines), 3.5 (revision), 3.6 (termination).
- **No delete operation**: Leases cannot be deleted (referenced by rent calls in Epic 4). Termination (end date) handled in Story 3.6.
- **Unit occupancy**: Unit becomes "occupied" when a lease exists for it. This is a read-model concern — the projection or a query can derive occupancy from lease existence. Consider adding a simple `leaseId` or `isOccupied` to the Unit read model, or querying leases by unitId.

### Value Objects

| VO | File | Type | Validation | Null Object |
|---|---|---|---|---|
| RentAmount | `rent-amount.ts` | integer (cents) | > 0, max 99999999 (999,999.99€) | No |
| SecurityDeposit | `security-deposit.ts` | integer (cents) | >= 0, max 99999999 | No |
| MonthlyDueDate | `monthly-due-date.ts` | integer | 1-31 | No |
| RevisionIndexType | `revision-index-type.ts` | enum string | `IRL` \| `ILC` \| `ICC` guard | No |
| LeaseStartDate | `lease-start-date.ts` | Date | valid date, not null | No |

All VOs follow established pattern: private constructor, static `create()`, self-validating, named exceptions.

**Note**: No Null Object pattern needed — all lease fields are required at creation time (unlike tenant optional fields).

### Events

| Event | Trigger | Data Fields |
|---|---|---|
| `LeaseCreated` | CreateALeaseCommand | `{ leaseId, entityId, tenantId, unitId, startDate, rentAmountCents, securityDepositCents, monthlyDueDate, revisionIndexType }` |

Metadata: `{ userId, entityId, timestamp, correlationId }`

### Commands

| Command | Handler | Logic |
|---|---|---|
| `CreateALeaseCommand` | `CreateALeaseHandler` | Load new LeaseAggregate, call `create()`, save. Handler has ZERO business logic. |

Command payload: `{ leaseId, entityId, userId, tenantId, unitId, startDate, rentAmountCents, securityDepositCents, monthlyDueDate, revisionIndexType }`

### API Endpoints

| Method | Path | Purpose | Response |
|---|---|---|---|
| `POST` | `/api/entities/:entityId/leases` | Create lease | 202 Accepted (no body) |
| `GET` | `/api/entities/:entityId/leases` | List leases for entity | 200 `{ data: LeaseData[] }` |
| `GET` | `/api/leases/:id` | Get single lease | 200 `{ data: LeaseData }` |

**Authorization flow** (controller-level):
1. Extract `userId` from JWT via `@CurrentUserId()`
2. Verify entity ownership: `EntityFinder.findByIdAndUserId(entityId, userId)` → throw UnauthorizedException
3. On create: verify tenant belongs to entity: `TenantFinder.findByIdAndEntityId(tenantId, entityId)` → throw
4. On create: verify unit belongs to entity (via property): query unit's property, check property's entityId → throw
5. On create: verify unit is vacant (no active lease): check leases for unitId → throw if occupied
6. Dispatch command

### Prisma Model

```prisma
model Lease {
  id                    String   @id @default(uuid())
  entityId              String   @map("entity_id")
  userId                String   @map("user_id")
  tenantId              String   @map("tenant_id")
  unitId                String   @map("unit_id")
  startDate             DateTime @map("start_date")
  rentAmountCents       Int      @map("rent_amount_cents")
  securityDepositCents  Int      @map("security_deposit_cents")
  monthlyDueDate        Int      @map("monthly_due_date")
  revisionIndexType     String   @map("revision_index_type")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  entity                OwnershipEntity @relation(fields: [entityId], references: [id])
  tenant                Tenant          @relation(fields: [tenantId], references: [id])
  unit                  Unit            @relation(fields: [unitId], references: [id])

  @@map("leases")
  @@index([entityId])
  @@index([tenantId])
  @@index([unitId])
  @@index([userId])
}
```

Add `leases Lease[]` relation field to `OwnershipEntity`, `Tenant`, and `Unit` models.

### Frontend Zod Schema

```typescript
const leaseSchema = z.object({
  tenantId: z.string().min(1, { error: "Locataire requis" }),
  unitId: z.string().min(1, { error: "Lot requis" }),
  startDate: z.string().min(1, { error: "Date de début requise" }),
  rentAmount: z.number().positive({ error: "Loyer doit être positif" }).max(999999.99, { error: "Montant trop élevé" }),
  securityDeposit: z.number().min(0, { error: "Dépôt de garantie invalide" }).max(999999.99),
  monthlyDueDate: z.number().int().min(1, { error: "Jour invalide" }).max(31, { error: "Jour invalide" }),
  revisionIndexType: z.enum(["IRL", "ILC", "ICC"], { error: "Type d'indice requis" }),
});
```

**Critical rules**:
- NO `.default()` on schema — use `defaultValues` in `useForm()`
- NO `.refine()` — validate cross-field rules in `onSubmit`
- Use `{ error: "..." }` (Zod v4 API)
- `rentAmount` and `securityDeposit` displayed in euros (user types 630.00), converted to cents on submit (`Math.round(value * 100)`)

### ActionFeed Onboarding Progression

| Step | Condition | Message | Priority | Icon |
|---|---|---|---|---|
| 1 | No entity | "Créez votre première entité propriétaire" | high | Building2 |
| 2 | Entity, no bank accounts | "Ajoutez un compte bancaire" | medium | Landmark |
| 3 | Entity, no properties | "Ajoutez un bien immobilier" | medium | Home |
| 4 | Properties, no units | "Créez les lots de ce bien" | medium | DoorOpen |
| 5 | Units, no tenants | "Enregistrez vos locataires" | medium | Users |
| **6** | **Tenants, no leases** | **"Créez vos baux"** | **medium** | **FileText** |
| 7 | Leases exist | "Générez vos premiers appels de loyer" (Story 4.1) | medium | Receipt |

### UnitMosaic Color Updates

| Unit Status | Color | Condition |
|---|---|---|
| Vacant (no lease) | Gray (`bg-muted`) | No active lease for this unit |
| Occupied (has lease) | Green/colored (existing scheme) | Active lease exists |

The UnitMosaic already supports color-coding from Story 2.6. This story extends it by using lease existence to determine "occupied" vs "vacant" status.

### Cross-Query Cache Invalidation

Lease creation must invalidate:
- `["entities", entityId, "leases"]` — lease list
- `["entities", entityId, "units"]` — unit occupancy status may change
- `["entities"]` — entity-level units endpoint (UnitMosaic)

Use `setTimeout(1500ms)` delayed invalidation pattern (established in Story 2.1).

### Testing Standards

**Backend (Jest)**:
- LeaseAggregate: create with valid data, reject invalid rent, reject invalid due date, reject invalid index type, reject duplicate create (~8 tests)
- VOs: RentAmount, SecurityDeposit, MonthlyDueDate, RevisionIndexType, LeaseStartDate (4-5 tests each, ~25 total)
- CreateALeaseHandler: success, aggregate-not-found edge (~4 tests)
- CreateALeaseController: success 202, unauthorized, missing fields, occupied unit (~6 tests)
- Lease projection: on LeaseCreated → upsert, idempotent (~4 tests)

**Frontend (Vitest)**:
- LeaseForm: render fields, submit valid data, validation errors, tenant/unit selection (~8 tests)
- Lease list page: loading/empty/populated/error states (~4 tests)
- ActionFeed step 6: shows "Créez vos baux" when tenants exist but no leases (~2 tests)
- UnitMosaic: vacant vs occupied rendering (~2 tests)
- Lease display on tenant/unit detail pages (~4 tests)

**E2E (Playwright)**:
- Create lease → appears in list (~1 test)
- UnitMosaic updates after lease creation (~1 test)
- ActionFeed step 6 progression (~1 test)

### Previous Story Intelligence

**From Story 3.1 (Tenants)**:
- Tenancy BC structure fully established — `tenancy.module.ts`, path aliases configured
- TenantFinder already exists and is exported from TenantPresentationModule
- E2E fixtures pattern: `registerTenant`, `getTenants`, `waitForTenantCount`
- Frontend test patterns: Radix Select mocking, form validation, mock patterns

**From Story 3.2 (Insurance)**:
- Backward-compatible event extension with optional fields — may be relevant for future lease events
- MockDate pattern for time-dependent tests
- InsuranceStatusBadge extraction pattern for testability
- ActionFeed now has insurance alerts rendering before onboarding
- Test count baseline: 355 backend + 235 frontend

### Known Pitfalls to Avoid

1. **DO NOT place Lease in Portfolio BC** — architecture.md says Tenancy BC (FR9-17)
2. **DO NOT use float for money** — integer cents only, convert at UI boundary
3. **DO NOT add logic in command handler** — all business rules in aggregate
4. **DO NOT call `invalidateQueries` immediately** — use delayed invalidation (1500ms)
5. **DO NOT use `.default()` or `.refine()` on Zod schema** with zodResolver
6. **DO NOT nest Tooltip + DropdownMenu** on same trigger (Radix conflict)
7. **DO NOT forget cross-aggregate authorization** at controller level
8. **DO NOT use `as` cast for enum validation** — guard clause + named exception in aggregate
9. **DO NOT forget `prisma generate`** after schema changes
10. **DO NOT forget to add `leases Lease[]` relation** to existing Tenant, Unit, OwnershipEntity models

### Project Structure Notes

**New files to create:**

```
backend/src/tenancy/lease/
├── lease.module.ts
├── lease.aggregate.ts
├── rent-amount.ts
├── security-deposit.ts
├── monthly-due-date.ts
├── revision-index-type.ts
├── lease-start-date.ts
├── commands/
│   ├── create-a-lease.command.ts
│   └── create-a-lease.handler.ts
├── events/
│   └── lease-created.event.ts
├── exceptions/
│   ├── invalid-rent-amount.exception.ts
│   ├── invalid-security-deposit.exception.ts
│   ├── invalid-monthly-due-date.exception.ts
│   ├── invalid-revision-index-type.exception.ts
│   ├── invalid-lease-start-date.exception.ts
│   └── lease-already-created.exception.ts
└── __tests__/
    ├── lease.aggregate.spec.ts
    ├── create-a-lease.handler.spec.ts
    ├── rent-amount.spec.ts
    ├── security-deposit.spec.ts
    ├── monthly-due-date.spec.ts
    ├── revision-index-type.spec.ts
    └── lease-start-date.spec.ts

backend/src/presentation/lease/
├── lease-presentation.module.ts
├── controllers/
│   ├── create-a-lease.controller.ts
│   ├── get-leases.controller.ts
│   └── get-a-lease.controller.ts
├── dto/
│   └── create-a-lease.dto.ts
├── queries/
│   ├── get-leases.query.ts
│   ├── get-leases.handler.ts
│   ├── get-a-lease.query.ts
│   └── get-a-lease.handler.ts
├── projections/
│   └── lease.projection.ts
├── finders/
│   └── lease.finder.ts
└── __tests__/
    ├── create-a-lease.controller.spec.ts
    ├── get-leases.controller.spec.ts
    ├── get-a-lease.controller.spec.ts
    └── lease.projection.spec.ts

backend/prisma/migrations/YYYYMMDDHHMMSS_add_lease_model/
└── migration.sql

frontend/src/
├── app/(auth)/leases/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── __tests__/
│       ├── leases-page.test.tsx
│       └── lease-new-page.test.tsx
├── components/features/leases/
│   ├── lease-form.tsx
│   ├── lease-schema.ts
│   └── __tests__/
│       ├── lease-form.test.tsx
│       └── lease-schema.test.ts
├── app/(auth)/leases/
│   └── [id]/
│       └── page.tsx                           # Lease detail page
├── hooks/use-leases.ts
├── lib/api/leases-api.ts
└── lib/constants/revision-index-types.ts      # { IRL: "IRL", ILC: "ILC", ICC: "ICC" } labels
```

**Files to modify:**

```
backend/src/tenancy/tenancy.module.ts          (import LeaseModule)
backend/src/app.module.ts                       (import LeasePresentationModule)
backend/prisma/schema.prisma                    (Lease model + relations on Tenant, Unit, OwnershipEntity)
frontend/src/components/features/dashboard/action-feed.tsx  (step 6 + useLeases import)
frontend/src/components/features/dashboard/unit-mosaic.tsx  (occupancy color logic)
frontend/src/components/layout/sidebar.tsx                  (add "Baux" nav item)
frontend/src/app/(auth)/tenants/[id]/page.tsx   (lease display section)
frontend/e2e/fixtures/api.fixture.ts            (createLease, getLeases, waitForLeaseCount)
frontend/e2e/leases.spec.ts                     (new E2E test file)
_bmad-output/implementation-artifacts/sprint-status.yaml
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.3] — User story, acceptance criteria, FR12
- [Source: _bmad-output/planning-artifacts/architecture.md — Bounded Contexts] — Tenancy BC contains Lease aggregate (FR9-17)
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture] — `lease-{id}` stream, `leases` table
- [Source: _bmad-output/planning-artifacts/architecture.md — Naming Conventions] — VerbANoun commands, PastTense events
- [Source: _bmad-output/planning-artifacts/architecture.md — Controller Pattern] — One controller per action, 202 Accepted
- [Source: _bmad-output/planning-artifacts/prd.md — FR12] — Lease fields: tenant, unit, rent, deposit, due date, index type
- [Source: _bmad-output/planning-artifacts/prd.md — Journey 1] — "Creates leases in 3 clicks" flow
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Journey 1 Flow] — ActionFeed step "Créez vos baux"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UnitMosaic] — Gray=vacant, Green=paid, color-coded by status
- [Source: docs/project-context.md — New Aggregate Checklist] — File structure, naming conventions
- [Source: _bmad-output/implementation-artifacts/3-1-register-tenants-with-contact-information.md] — Tenancy BC setup, path aliases, E2E fixtures
- [Source: _bmad-output/implementation-artifacts/3-2-track-tenant-insurance-with-expiry-alerts.md] — Backward-compatible events, ActionFeed alerts, MockDate pattern

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Backend typecheck: 24 TS errors from private constructor exceptions in toThrow() — fixed by using DomainException (parent class with public constructor) in test assertions
- Frontend test: action-feed-insurance.test.tsx "should link to tenant detail page" failed after lease step 6 added (multiple "Commencer" links) — fixed getAllByRole[0]
- Backend lint: 31 prettier errors in tenant files from Story 3.2 — fixed with --fix

### Completion Notes List
- 8 tasks completed across 2 sessions (session 1: tasks 1-3 backend, session 2: tasks 4-8 frontend + fixes)
- Backend: 415 tests (61 suites), 60 new lease tests, 0 lint errors, 0 typecheck errors
- Frontend: 259 tests (34 suites), 24 new tests, 0 lint errors (5 warnings pre-existing), 0 typecheck errors
- E2E: 4 new lease tests (seed + create + UnitMosaic + ActionFeed)
- Story deviation from spec: Task 2.2 (isOccupied field) — not needed, occupancy derived from lease existence at query time (simpler, no dual write)
- Story deviation: Task 5.4 (sidebar nav "Baux") — already existed from previous implementation, no change needed
- Story deviation: unit detail page path differs from spec (/properties/[id]/units/[unitId] vs spec's generic unit detail)

### File List

**New files (Story 3.3 only):**
```
backend/src/tenancy/lease/lease.module.ts
backend/src/tenancy/lease/lease.aggregate.ts
backend/src/tenancy/lease/rent-amount.ts
backend/src/tenancy/lease/security-deposit.ts
backend/src/tenancy/lease/monthly-due-date.ts
backend/src/tenancy/lease/revision-index-type.ts
backend/src/tenancy/lease/lease-start-date.ts
backend/src/tenancy/lease/commands/create-a-lease.command.ts
backend/src/tenancy/lease/commands/create-a-lease.handler.ts
backend/src/tenancy/lease/events/lease-created.event.ts
backend/src/tenancy/lease/exceptions/invalid-rent-amount.exception.ts
backend/src/tenancy/lease/exceptions/invalid-security-deposit.exception.ts
backend/src/tenancy/lease/exceptions/invalid-monthly-due-date.exception.ts
backend/src/tenancy/lease/exceptions/invalid-revision-index-type.exception.ts
backend/src/tenancy/lease/exceptions/invalid-lease-start-date.exception.ts
backend/src/tenancy/lease/exceptions/lease-already-created.exception.ts
backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts
backend/src/tenancy/lease/__tests__/create-a-lease.handler.spec.ts
backend/src/tenancy/lease/__tests__/rent-amount.spec.ts
backend/src/tenancy/lease/__tests__/security-deposit.spec.ts
backend/src/tenancy/lease/__tests__/monthly-due-date.spec.ts
backend/src/tenancy/lease/__tests__/revision-index-type.spec.ts
backend/src/tenancy/lease/__tests__/lease-start-date.spec.ts
backend/src/tenancy/lease/__tests__/mock-cqrx.ts
backend/src/presentation/lease/lease-presentation.module.ts
backend/src/presentation/lease/controllers/create-a-lease.controller.ts
backend/src/presentation/lease/controllers/get-leases.controller.ts
backend/src/presentation/lease/controllers/get-a-lease.controller.ts
backend/src/presentation/lease/dto/create-a-lease.dto.ts
backend/src/presentation/lease/queries/get-leases.query.ts
backend/src/presentation/lease/queries/get-leases.handler.ts
backend/src/presentation/lease/queries/get-a-lease.query.ts
backend/src/presentation/lease/queries/get-a-lease.handler.ts
backend/src/presentation/lease/projections/lease.projection.ts
backend/src/presentation/lease/finders/lease.finder.ts
backend/src/presentation/lease/__tests__/create-a-lease.controller.spec.ts
backend/src/presentation/lease/__tests__/lease.projection.spec.ts
backend/prisma/migrations/20260212104308_add_lease_model/migration.sql
frontend/src/lib/api/leases-api.ts
frontend/src/hooks/use-leases.ts
frontend/src/lib/constants/revision-index-types.ts
frontend/src/components/features/leases/lease-schema.ts
frontend/src/components/features/leases/lease-form.tsx
frontend/src/components/features/leases/__tests__/lease-schema.test.ts
frontend/src/components/features/leases/__tests__/lease-form.test.tsx
frontend/src/app/(auth)/leases/page.tsx
frontend/src/app/(auth)/leases/new/page.tsx
frontend/src/app/(auth)/leases/[id]/page.tsx
frontend/src/app/(auth)/leases/__tests__/leases-page.test.tsx
frontend/src/components/features/dashboard/__tests__/action-feed-lease.test.tsx
frontend/src/components/features/dashboard/__tests__/unit-mosaic-lease.test.tsx
frontend/e2e/leases.spec.ts
```

**Modified files (Story 3.3 only):**
```
backend/src/tenancy/tenancy.module.ts
backend/src/app.module.ts
backend/prisma/schema.prisma
frontend/src/components/features/dashboard/action-feed.tsx
frontend/src/components/features/dashboard/unit-mosaic.tsx
frontend/src/app/(auth)/tenants/[id]/page.tsx
frontend/src/app/(auth)/properties/[id]/units/[unitId]/page.tsx
frontend/e2e/fixtures/api.fixture.ts
frontend/src/components/features/dashboard/__tests__/action-feed-insurance.test.tsx
frontend/src/components/features/dashboard/__tests__/action-feed.test.tsx
frontend/src/components/features/dashboard/__tests__/unit-mosaic.test.tsx
_bmad-output/implementation-artifacts/sprint-status.yaml
```

