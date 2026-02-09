---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
workflowCompleted: true
completedAt: '2026-02-08'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/brainstorming/brainstorming-session-2026-02-08.md']
workflowType: 'architecture'
project_name: 'Baillr'
user_name: 'Monsieur'
date: '2026-02-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
64 FRs across 12 capability domains. Core architectural drivers: event-sourced accounting (FR53-56), batch document generation and email (FR18-27), bank statement import with automatic matching (FR28-34), 3-tier reminder escalation (FR35-41), and three INSEE index revision types (FR42-47).

**Non-Functional Requirements:**
21 NFRs across 4 categories. Architecture-shaping requirements: event immutability and zero data loss (NFR13-14), deterministic financial calculations with 2-decimal precision (NFR15, NFR18), strict multi-tenant data isolation (NFR9), and batch operation performance targets (NFR1-6).

**Scale & Complexity:**

- Primary domain: Full-stack SaaS (Next.js frontend, NestJS backend)
- Complexity level: High (event sourcing + financial domain + legal compliance)
- Estimated architectural components: 5 bounded contexts (Portfolio, Tenancy, Billing, Recovery, Indexation) + presentation gateway
- Users: single bailleur initially (dogfooding), designed for multi-tenant SaaS

### Technical Constraints & Dependencies

- **Fixed stack**: Next.js (frontend) + NestJS (backend) — non-negotiable
- **Event sourcing**: first implementation with NestJS — no pre-selected event store technology
- **Financial precision**: all money as integer cents or Decimal — no floating-point
- **Legal compliance**: French rental law (loi ALUR), GDPR, SCI accounting obligations
- **PDF generation**: server-side, must reproduce real-world document structures
- **Desktop-first**: optimized for desktop with responsive mobile adaptation

### Cross-Cutting Concerns Identified

- **Event sourcing**: affects all write operations, all state derivation, all data storage
- **Multi-tenancy**: user isolation → entity isolation → event stream isolation
- **Financial precision**: consistent decimal handling across all calculations (rent, charges, pro-rata, indices)
- **Document generation**: PDF templates for 7+ document types (rent calls, receipts, revision letters, formal notices, charge statements, stakeholder letters, account book export)
- **Email delivery**: batch SMTP with PDF attachments, deliverability tracking
- **Legal compliance**: mandatory legal mentions, correct formulas, proper document structure
- **Audit trail**: event store provides native auditability — no separate audit system needed

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SaaS: Next.js frontend + NestJS backend, deployed as two independent applications. CQRS/ES architecture with dedicated event store.

### Repository Structure Decision

**Single repository, two independent applications.** No monorepo tooling (Turborepo, Nx), no shared packages, no cross-folder dependencies. Each application is fully self-contained with its own `package.json`, `node_modules`, `tsconfig.json`, and development scripts.

```
baillr/
├── frontend/          # Next.js application (standalone)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── src/
├── backend/           # NestJS application (standalone)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
├── .gitignore
└── README.md
```

**Rationale:** Simplicity. No build orchestration overhead, no shared type synchronization to maintain, no monorepo tooling complexity. API contract between frontend and backend is the only integration point — enforced via HTTP/REST, not TypeScript imports.

### Technology Stack (Versions Verified)

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Frontend Framework | Next.js | 16.x (App Router) | UI, routing, SSR |
| Frontend Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Frontend Auth | Clerk | @clerk/nextjs 6.x | Authentication UI |
| Backend Framework | NestJS | 11.x | BFF, command/query handling |
| CQRS | @nestjs/cqrs | 11.x | Command/Query/Event buses |
| Event Store | KurrentDB (ex-EventStoreDB) | 25.x | Event storage, streams, subscriptions |
| Event Store Client | nestjs-cqrx | 5.x | NestJS ↔ KurrentDB integration |
| ORM (Read Models) | Prisma | 7.x | Projections in PostgreSQL |
| Read Model DB | PostgreSQL | 18 | Projections, queries |
| Deployment (app) | Railway | — | NestJS + PostgreSQL |
| Deployment (events) | Kurrent Cloud | — | Managed KurrentDB (free tier) |

### Data Architecture

```
KurrentDB (Kurrent Cloud)          PostgreSQL (Railway)
┌─────────────────────┐            ┌──────────────────────┐
│ Event Streams        │            │ Read Models (Prisma)  │
│ ├─ tenant-{id}      │  project   │ ├─ properties         │
│ ├─ lease-{id}       │ ────────►  │ ├─ tenants            │
│ ├─ payment-{id}     │  via       │ ├─ leases             │
│ ├─ rent-call-{id}   │  subscr.   │ ├─ payments           │
│ └─ revision-{id}    │            │ ├─ rent_calls         │
│                      │            │ └─ account_entries    │
│ Source of truth      │            │ Optimized for queries │
│ Append-only          │            │ Rebuildable from events│
└─────────────────────┘            └──────────────────────┘
```

### Initialization Commands

**Frontend (`frontend/`):**
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --turbopack
cd frontend && npm install @clerk/nextjs
```

Decisions made by create-next-app: TypeScript strict, App Router, Turbopack dev server, Tailwind 4, ESLint, `src/` directory structure.

**Backend (`backend/`):**
```bash
npx @nestjs/cli new backend --strict --package-manager npm
cd backend && npm install @nestjs/cqrs nestjs-cqrx @kurrent/kurrentdb-client @prisma/client
npx prisma init
```

Decisions made by NestJS CLI: TypeScript strict mode, Jest testing, ESLint, modular architecture.

**Development (KurrentDB local):**
```bash
docker run -d --name kurrentdb \
  -p 2113:2113 \
  -e KURRENTDB_INSECURE=true \
  -e KURRENTDB_ENABLE_ATOM_PUB_OVER_HTTP=true \
  kurrentplatform/kurrentdb:25.1.0
```

### Architectural Decisions Provided by Starters

**Language & Runtime:**
TypeScript strict mode in both applications, independent `tsconfig.json` configurations.

**Styling Solution:**
Tailwind CSS 4 — utility-first, desktop-first with responsive mobile adaptation.

**Build Tooling:**
- Frontend: Turbopack (dev), Next.js compiler (prod)
- Backend: NestJS compiler (tsc or swc)

**Testing Framework:**
- Frontend: Jest + React Testing Library
- Backend: Jest (NestJS default)

**Event Sourcing Infrastructure:**
- nestjs-cqrx integrates directly with @nestjs/cqrs decorators
- KurrentDB handles streams, subscriptions, optimistic concurrency
- PostgreSQL via Prisma handles read models (projections)
- Read models are rebuildable from events at any time

**Development Experience:**
- Frontend: Turbopack hot reload on port 3000
- Backend: NestJS watch mode on port 3001
- KurrentDB: Docker container on port 2113 (admin UI included)

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
Data architecture (dual-store CQRS/ES), authentication flow (Clerk JWT), multi-tenant isolation pattern, API design (REST + CQRS commands/queries), event versioning strategy (client-side upcasting).

**Important Decisions (Shape Architecture):**
Frontend state management, component library, form handling, CI/CD pipeline, monitoring approach.

**Deferred Decisions:**
Staging environment, advanced observability, scaling strategy — to be evaluated when moving beyond single-user dogfooding.

### Data Architecture

**Dual-Store CQRS/ES Pattern:**
- **KurrentDB**: source of truth. Events stored in streams named `{aggregate}-{id}` (e.g., `lease-abc123`, `tenant-def456`).
- **PostgreSQL**: read models only. Projections optimized for queries, managed via Prisma.
- Projections fed by **catch-up subscriptions** — NestJS subscribes to KurrentDB streams at startup, updates Prisma tables on each event, persists cursor position for restart recovery.
- Read models are **rebuildable** from events at any time.

**Event Format:**
- `type`: event name following VerbANoun convention (e.g., `TenantCreated`, `RentCallGenerated`, `PaymentReceived`)
- `data`: business payload (JSONB)
- `metadata`: `userId`, `entityId` (SCI/personal name), `timestamp`, `correlationId`
- `entityId` in metadata enforces multi-tenant isolation at the event store level.

**Event Versioning & Upcasting:**
- Client-side upcasting during deserialization, using nestjs-cqrx transformer mechanism as hook point.
- Prefer additive changes (new optional fields with defaults) over breaking changes.
- Breaking changes handled via chained upcaster pipeline (V1→V2→V3).
- Version tracking via event type name suffix (`TenantCreated_v1`, `TenantCreated_v2`) or payload shape detection.
- Aggregate/projection handlers only know the latest event version — upcasters transform before delivery.

**Hexagonal Architecture & DDD Rules:**
- **Command handlers contain ZERO business logic.** A handler loads the aggregate from the event store, calls the appropriate aggregate method, and saves. Nothing else.
- **All business logic lives in the aggregate.** The aggregate methods validate invariants, apply domain rules, and emit events.
- **Services are passed to aggregate methods as parameters** when the aggregate needs external capabilities (e.g., index calculation, date generation). The aggregate defines the interface (port), the infrastructure provides the implementation (adapter).
- **Always program against interfaces (ports).** Domain defines interfaces for repositories, services, and external dependencies. Infrastructure provides concrete implementations. No concrete class imported in domain — only interfaces.
- **Domain layer has zero dependencies on infrastructure.** Domain knows only its own interfaces. NestJS dependency injection wires the implementations at module registration.

Example flow:
```typescript
// Command Handler — NO logic, just orchestration
async execute(command: ApplyARevisionCommand): Promise<void> {
  const lease = await this.repository.load(command.leaseId);
  lease.applyRevision(command.newIndex, this.indexCalculator); // service passed as param
  await this.repository.save(lease);
}

// Aggregate — ALL logic here
applyRevision(newIndex: number, calculator: IIndexCalculator): void {
  const revisedRent = calculator.calculate(this.currentRentCents, this.previousIndex, newIndex);
  this.apply(new RentRevised({ leaseId: this.id, revisedRentCents: revisedRent, ... }));
}

// Port (interface) — defined in domain
interface IIndexCalculator {
  calculate(currentRentCents: number, previousIndex: number, newIndex: number): number;
}
```

**Value Objects (Domain-Driven Design):**

Every domain concept is a Value Object (VO). Aggregates manipulate VOs exclusively — never raw primitives (`string`, `number`). VOs are immutable, self-validating via static factory methods, and compared by value.

**VO Rules:**
- **Private constructor**: All VOs have `private constructor`. Instantiation through static factory methods only (`fromString`, `create`, `fromPrimitives`).
- **Immutable**: All properties `private readonly`. Exposed via getters.
- **Self-validating**: Factory method validates invariants, throws a **named domain exception** on invalid input (never raw `DomainException`).
- **Equality by value**: `equals(other)` method compares properties, not references.
- **No null in aggregates**: Optional concepts use VO with `static empty()` factory (Null Object pattern). Check absence via `isEmpty` getter.
- **Serialization at event boundary**: Events carry primitives. Aggregate constructs VOs from primitives when replaying events, serializes VOs to primitives when creating events.

**VO Location (vertical slice — flat in module):**
- Module-specific: `{bc}/{aggregate}/` — co-located with aggregate, e.g., `portfolio/entity/entity-name.ts`, `portfolio/entity/siret.ts`
- Shared across BCs: `shared/` — e.g., `user-id.ts`, `money.ts`
- No `value-objects/` subdirectory — opening a module folder shows everything at a glance

**File naming**: `kebab-case.ts` — e.g., `entity-name.ts`, `user-id.ts` (no `.vo.ts` suffix)

Example — required VO:
```typescript
import { InvalidEntityNameException } from './exceptions/invalid-entity-name.exception.js';

export class EntityName {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): EntityName {
    const trimmed = value.trim();
    if (!trimmed) throw InvalidEntityNameException.required();
    if (trimmed.length > 255) throw InvalidEntityNameException.tooLong();
    return new EntityName(trimmed);
  }

  get value(): string { return this._value; }
  equals(other: EntityName): boolean { return this._value === other._value; }
}
```

Example — optional VO (Null Object):
```typescript
import { InvalidSiretException } from './exceptions/invalid-siret.exception.js';

export class Siret {
  private static readonly EMPTY = new Siret(null);
  private constructor(private readonly _value: string | null) {}

  static create(value: string): Siret {
    if (!/^\d{14}$/.test(value)) throw InvalidSiretException.invalidFormat();
    return new Siret(value);
  }
  static empty(): Siret { return Siret.EMPTY; }

  get value(): string | null { return this._value; }
  get isEmpty(): boolean { return this._value === null; }
  equals(other: Siret): boolean { return this._value === other._value; }
}
```

Example — aggregate with VOs (no raw primitives):
```typescript
// Aggregate fields — always VOs, never primitives
private name!: EntityName;
private type!: EntityType;
private siret!: Siret;                       // Siret.empty() when absent, never null
private address!: Address;
private legalInformation!: LegalInformation; // LegalInformation.empty() when absent

// VOs constructed via factory methods
const voName = EntityName.fromString(name);
const voType = EntityType.fromString(type);
const voSiret = siret ? Siret.create(siret) : Siret.empty();

// Events serialize VOs → primitives at the boundary
this.apply(new EntityCreated({
  id: this.id, userId, type: voType.value, name: voName.value,
  siret: voSiret.value, address: voAddress.toPrimitives(), legalInformation: voLegalInfo.value,
}));
```

**Named Domain Exceptions:**

Domain exceptions are specific classes extending `DomainException`, with private constructors and static factory methods. Never throw raw `DomainException` — always use a named subclass.

**Exception Location:**
- Module-specific: `{bc}/{aggregate}/exceptions/` — e.g., `portfolio/entity/exceptions/invalid-siret.exception.ts`
- Shared: `shared/exceptions/` — base `DomainException` + cross-module exceptions (e.g., `invalid-user-id.exception.ts`)

**Exception Rules:**
- **Private constructor**: Instantiation through named static factory methods only.
- **Static factory methods**: Descriptive names — `required()`, `invalidFormat()`, `tooLong()`, `streetRequired()`.
- **One class per logical error group**: An exception class can have multiple factories for related validation errors (e.g., `InvalidAddressException.streetRequired()`, `.cityRequired()`).
- **Extend `DomainException`**: All exceptions carry `message`, `code`, and `statusCode`.

Example:
```typescript
import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidEntityNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }
  static required(): InvalidEntityNameException {
    return new InvalidEntityNameException('Entity name is required', 'ENTITY_NAME_REQUIRED');
  }
  static tooLong(): InvalidEntityNameException {
    return new InvalidEntityNameException('Entity name exceeds 255 characters', 'ENTITY_NAME_TOO_LONG');
  }
}
```

**Controller-per-Action (Single Responsibility):**

Each NestJS controller class handles exactly one route (one HTTP method + path). No fat controllers grouping multiple actions. This follows SRP, simplifies testing, and scales cleanly as the number of actions grows.

- **File naming**: `{verb-a-noun}.controller.ts` — matches the command/query name
- **Class naming**: `{VerbANoun}Controller` — e.g., `CreateATenantController`, `GetTenantsController`
- **Single `handle()` method** per controller

Example:
```typescript
@Controller('entities')
export class CreateAnEntityController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(@Body() dto: CreateAnEntityDto, @CurrentUser() userId: string): Promise<void> {
    await this.commandBus.execute(new CreateAnEntityCommand(dto.id, userId, ...));
  }
}
```

Presentation module structure (per module):
```
presentation/{module}/
├── controllers/
│   ├── create-a-{module}.controller.ts    # POST — command
│   ├── update-a-{module}.controller.ts    # PUT :id — command
│   ├── get-{module}s.controller.ts        # GET — query (list)
│   └── get-a-{module}.controller.ts       # GET :id — query (detail)
├── dto/
├── queries/
├── projections/
├── finders/
└── __tests__/
```

**Naming Conventions:**
- Command classes: VerbANoun pattern — `CreateATenantCommand`, `GenerateRentCallsCommand` (plural for batch), `ImportABankStatementCommand`
- Query classes: VerbANoun pattern — `GetATenantQuery`, `GetTenantsQuery`
- Event types: PastTense — `TenantCreated`, `PaymentReceived`, `RentCallGenerated`
- Stream names: `{aggregate}-{id}` — `tenant-abc123`, `lease-def456`

**Financial Precision:**
All monetary values stored as **integer cents** (e.g., 75000 = 750.00€). No floating-point anywhere in the pipeline. INSEE index calculations (IRL, ILC, ICC) rounded down to nearest cent (favoring tenant per French law).

**Caching:**
No caching layer at launch. PostgreSQL read models are sufficient for single-user scale.

### Bounded Contexts & Context Map

Each bounded context (BC) is a self-contained semantic boundary with its own ubiquitous language, aggregates, and module structure. **BCs contain domain logic only** (aggregates, commands, events, VOs, exceptions). The presentation layer (controllers, DTOs, queries, projections, finders) lives **outside** the BCs as a separate API gateway layer.

**5 Bounded Contexts (domain only):**

| BC | Directory | Aggregates | FR Coverage | Core Concept |
|----|-----------|-----------|-------------|--------------|
| Portfolio | `portfolio/` | Entity, Property, Unit | FR1-8, FR57-60 | Real estate ownership structure |
| Tenancy | `tenancy/` | Tenant, Lease | FR9-17 | Tenant lifecycle and lease contracts |
| Billing | `billing/` | RentCall, Payment | FR18-22, FR28-34 | Revenue generation and collection |
| Recovery | `recovery/` | Reminder | FR35-41 | Unpaid rent detection and escalation |
| Indexation | `indexation/` | Revision, Charge | FR42-52 | Annual adjustments per French law |

**Presentation Gateway** (`presentation/`): Sits outside BCs. Organized by resource (entity/, tenant/, lease/, etc.). Acts as the API gateway layer — receives HTTP requests, dispatches commands to BCs, reads from PostgreSQL projections. `presentation/accounting/` is a **read-only module** (FR53-56) with no domain counterpart — it projects financial events from Billing, Recovery, and Indexation into the account book.

**Shared Kernel** (`shared/`): Cross-BC value objects (`UserId`, `Money`) and base exceptions (`DomainException`). These are the **only** allowed cross-BC imports.

**Context Map — Event-Driven Relationships:**
```
Portfolio ──(UnitCreated)──► Tenancy ──(LeaseCreated)──► Billing
                                │                           │
                     (LeaseCreated)               (RentCallUnpaid)
                                │                           │
                                ▼                           ▼
                           Indexation                   Recovery

                    presentation/accounting/
                    projects financial events from
                    Billing, Recovery, Indexation
```

- **Portfolio → Tenancy**: Lease references a Unit by `unitId`. Tenancy subscribes to `UnitCreated`/`UnitUpdated` events for denormalized read models.
- **Tenancy → Billing**: RentCall references a Lease by `leaseId`. Billing subscribes to `LeaseCreated`/`LeaseTerminated` to know active leases.
- **Tenancy → Indexation**: Revision references a Lease by `leaseId`. Indexation subscribes to `LeaseCreated` to know which leases need annual revision.
- **Billing → Recovery**: Reminder references unpaid RentCalls. Recovery subscribes to `RentCallGenerated`/`PaymentReceived` to detect unpaid status.
- **All → Accounting (presentation)**: `presentation/accounting/` projects financial events (`RentCallGenerated`, `PaymentReceived`, `ChargeRegularized`, etc.) into the account book read model.

**Inter-BC Communication Rules:**
1. BCs communicate **exclusively via domain events** (KurrentDB catch-up subscriptions)
2. No direct imports between BC domain modules — only `shared/` imports allowed
3. References between BCs are **by ID only** (e.g., a Lease stores `unitId: string`, never imports Unit aggregate)
4. Each BC has its own root NestJS module that registers its domain sub-modules
5. `presentation/` is a separate layer — it dispatches commands to BCs and queries its own read models
6. `infrastructure/` remains global — provides cross-cutting adapters (auth, database, eventstore, document generation, email)

**Document & Email Services:**
Document generation (`PdfGeneratorService`) and email delivery (`SmtpService`) are **infrastructure services**, not bounded contexts. They have no business invariants — they execute on behalf of other BCs via the command bus. Located in `infrastructure/document/` and `infrastructure/email/`.

**BC Directory Pattern (domain only):**
```
{bounded-context}/
├── {aggregate}/
│   ├── {aggregate}.aggregate.ts
│   ├── {aggregate}.module.ts
│   ├── *.ts                     # VOs flat in module
│   ├── commands/
│   ├── events/
│   ├── exceptions/
│   └── __tests__/
└── {bounded-context}.module.ts   # Registers aggregate domain modules
```

**Presentation Directory Pattern (gateway):**
```
presentation/
├── {resource}/
│   ├── controllers/             # One controller per action
│   ├── dto/
│   ├── queries/
│   ├── projections/
│   ├── finders/
│   ├── {resource}-presentation.module.ts
│   └── __tests__/
└── accounting/                  # Read-only, no BC counterpart
```

### Authentication & Security

**Clerk Integration:**
- Frontend: `@clerk/nextjs` middleware handles login/signup, provides JWT in session cookies.
- Backend: custom NestJS `AuthGuard` verifies Clerk JWT using JWKS (public key verification, no Clerk API call per request).
- User identity extracted from JWT claims and injected into NestJS request context.

**Multi-Tenant Isolation:**
- Clerk user = bailleur. Each bailleur owns multiple management entities (SCIs + personal name).
- Two-level isolation:
  - **Event store level**: `entityId` in event metadata — streams filterable by entity.
  - **Read model level**: every Prisma table carries `entityId` — all queries filtered by active entity.
- NestJS middleware injects current `entityId` (selected in frontend) into request context.
- Guard verifies the requested `entityId` belongs to the authenticated user.

**Authorization:**
Two roles per entity, no RBAC library needed:
- `owner`: full access (commands + queries)
- `accountant`: read-only access (queries only, scoped to specific entities)
- Role stored in the user-entity relationship (Prisma read model).
- Guard checks: authenticated → owns or has access to entity → if `accountant`, block POST/PUT/DELETE.

**API Security:**
- CORS restricted to frontend domain only.
- Rate limiting via `@nestjs/throttler`.
- Input validation via `class-validator` + `class-transformer` (NestJS standard).
- No sensitive data in events (passwords managed by Clerk).

### API & Communication Patterns

**REST API with CQRS Semantics:**
- Commands via POST: `POST /api/tenants` → `CreateATenantCommand`
- Queries via GET: `GET /api/rent-calls?month=2026-03` → `GetRentCallsQuery`
- Batch operations via POST: `POST /api/rent-calls/generate` → `GenerateRentCallsCommand`
- No GraphQL — single frontend, REST is simpler.

**Command/Query Flow:**
- Frontend generates resource UUIDs (`crypto.randomUUID()`) and includes them in the command payload.
- Commands are fire-and-forget: backend validates, writes event, returns `202 Accepted` with no body.
- Frontend already knows the ID — navigates or updates optimistically without waiting.
- Queries return `200 OK` with data payload from read models.

**Error Handling:**
Global NestJS `ExceptionFilter` normalizing all errors:
- Business errors (invalid rent, unknown lease) → `400` / `404` / `409`
- Auth errors → `401` / `403`
- Server errors → `500` with logging, no technical details exposed.
- Error format: `{ statusCode, error, message, details? }`

**API Documentation:**
`@nestjs/swagger` with controller decorators → auto-generated OpenAPI spec.

**Eventual Consistency Strategy:**
After a command, projections may not be immediately updated. Two approaches:
- **Optimistic UI** (default): TanStack Query `onMutate` / `onError` / `onSettled` pattern — cache is updated immediately with optimistic data, rolled back on error, and synced via `invalidateQueries` on settle. See Frontend Architecture section for the full pattern.
- **Short polling**: for batch operations (rent call generation), frontend polls a status endpoint.
- No WebSocket — management tool, not real-time application.
- **FORBIDDEN**: `setTimeout` / `waitForProjection` delays — always use optimistic updates instead.

### Frontend Architecture

**Data Fetching: TanStack Query (React Query)**
- Caches GET queries, auto-invalidates after mutations.
- Handles loading/error states.
- **Optimistic updates are MANDATORY** for all `useMutation` hooks — the CQRS/ES projection delay makes this essential.

**Optimistic Update Pattern (established in Story 2.1):**
Every mutation hook follows the `onMutate` / `onError` / `onSettled` pattern:
- `onMutate`: cancel in-flight queries, snapshot previous cache, construct optimistic data, update cache immediately.
- `onError`: rollback cache to snapshot from context.
- `onSettled`: **no `invalidateQueries`** — CQRS/ES projections may not have caught up yet, so an immediate refetch would overwrite optimistic data with stale server state. Instead, rely on `staleTime` (default 30s in `QueryProvider`) for eventual reconciliation.

```typescript
// Create: append optimistic entry to list cache
onMutate: async (payload) => {
  await queryClient.cancelQueries({ queryKey: ["resources"] });
  const previous = queryClient.getQueryData<Data[]>(["resources"]);
  const optimistic: Data = { id: payload.id, ...payload, /* defaults */ };
  queryClient.setQueryData<Data[]>(["resources"], (old) => [...(old ?? []), optimistic]);
  return { previous };
},

// Update: apply partial update to BOTH list AND detail caches
onMutate: async ({ id, payload }) => {
  await queryClient.cancelQueries({ queryKey: ["resources"] });
  await queryClient.cancelQueries({ queryKey: ["resources", id] });
  const previousList = queryClient.getQueryData<Data[]>(["resources"]);
  const previousDetail = queryClient.getQueryData<Data>(["resources", id]);
  queryClient.setQueryData<Data[]>(["resources"], (old) =>
    old?.map((e) => (e.id === id ? { ...e, ...payload } : e)),
  );
  if (previousDetail) {
    queryClient.setQueryData<Data>(["resources", id], { ...previousDetail, ...payload });
  }
  return { previousList, previousDetail };
},
```

**Anti-Patterns:**
- Never use `setTimeout` or `waitForProjection` delays — always use optimistic updates.
- Never call `invalidateQueries` in `onSettled` — projection lag will overwrite optimistic data. Let `staleTime` handle reconciliation.

**State Management:**
No global store (no Redux, no Zustand). TanStack Query manages server state. Only global client state: active management entity (SCI / personal name) via React Context.

**Component Library: shadcn/ui**
- Components copied into project (not an npm dependency).
- Based on Radix UI (accessible, headless primitives).
- Tailwind 4 compatible.
- Full control over component code.

**Forms: React Hook Form + Zod**
- React Hook Form for form state management (performant, minimal re-renders).
- Zod schemas for validation with TypeScript inference.
- Connected via `zodResolver`.

**Routing: Next.js App Router**
File-based routing with route groups:
```
src/app/
├── (auth)/              # Routes protected by Clerk
│   ├── dashboard/
│   ├── tenants/
│   ├── leases/
│   ├── rent-calls/
│   ├── payments/
│   ├── accounting/
│   └── settings/
├── sign-in/
├── sign-up/
└── layout.tsx
```

### Infrastructure & Deployment

**Production Architecture:**
- Frontend (Next.js): Railway service, port 3000
- Backend (NestJS): Railway service, port 3001
- PostgreSQL: Railway managed database (read models)
- KurrentDB: Kurrent Cloud managed (free tier, event store)
- Two Railway services with independent environment variables. Frontend knows backend URL only.

**Local Development:**
Docker Compose at repo root for external services only (PostgreSQL + KurrentDB). Frontend and backend run natively for faster development.

**Environments:**
- **Local**: `next dev` + `nest start --watch` + Docker Compose (PostgreSQL + KurrentDB)
- **Production**: Railway (frontend + backend + PostgreSQL) + Kurrent Cloud (KurrentDB)
- No staging environment initially — single user dogfooding. Add later if needed.

**CI/CD: GitHub Actions**
- On PR: lint + typecheck + tests (frontend and backend in parallel)
- On merge to main: auto-deploy via Railway GitHub integration
- No complex orchestration — Railway detects pushes and deploys automatically.

**Configuration:**
Environment variables only (`.env` local, Railway dashboard in prod):
- `DATABASE_URL`, `KURRENTDB_CONNECTION_STRING`
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `BACKEND_URL` (frontend → backend)

**Monitoring & Logging:**
- Railway: application logs (stdout/stderr)
- Kurrent Cloud: event store monitoring dashboard
- NestJS Logger with levels (debug/info/warn/error)
- No external observability platform initially — evaluate when scaling to multi-user.

### Decision Impact Analysis

**Implementation Sequence:**
1. Repository setup + Docker Compose (PostgreSQL + KurrentDB)
2. Backend scaffolding (NestJS + Clerk AuthGuard + KurrentDB connection)
3. First aggregate with event store (e.g., Property or Tenant)
4. Projection infrastructure (catch-up subscription → Prisma)
5. Frontend scaffolding (Next.js + Clerk + TanStack Query)
6. First end-to-end flow (command → event → projection → query → UI)
7. Remaining bounded contexts following established patterns

**Cross-Component Dependencies:**
- Clerk configuration must be done first (shared between frontend auth and backend JWT verification).
- KurrentDB connection and subscription infrastructure must be established before any aggregate can be implemented.
- Prisma schema evolves as new projections are added per bounded context.
- Frontend API client layer depends on backend endpoint contracts being defined.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Prisma):**
- Tables: `snake_case` plural → `tenants`, `leases`, `rent_calls`, `account_entries`
- Columns: `snake_case` → `entity_id`, `created_at`, `lease_start_date`
- Prisma auto-maps to `camelCase` in TypeScript via `@map` / `@@map`

**API Endpoints:**
- Endpoints: `kebab-case` plural → `/api/tenants`, `/api/rent-calls`, `/api/account-entries`
- Route parameters: `:id` → `/api/tenants/:id`
- Query params: `camelCase` → `?entityId=xxx&month=2026-03`

**Backend TypeScript:**
- Files: `kebab-case` → `create-a-tenant.command.ts`, `tenant-created.event.ts`, `create-a-tenant.controller.ts`, `entity-name.ts`, `invalid-siret.exception.ts`
- Classes: `PascalCase` → `CreateATenantCommand`, `CreateATenantController`, `TenantProjection`, `EntityName`, `InvalidSiretException`
- Functions/variables: `camelCase` → `getActiveLease`, `monthlyRentCents`
- Mandatory suffixes: `.command.ts`, `.query.ts`, `.event.ts`, `.handler.ts`, `.projection.ts`, `.controller.ts`, `.module.ts`, `.guard.ts`, `.exception.ts`, `.dto.ts`
- VOs: no suffix — just `entity-name.ts`, `siret.ts`, `address.ts` (co-located flat in module)

**Frontend TypeScript:**
- Components: `kebab-case` file, `PascalCase` export → `tenant-card.tsx` exports `TenantCard`
- Hooks: `use-` prefix → `use-tenants.ts` exports `useTenants`
- API client: `kebab-case` → `tenants-api.ts`

### Structure Patterns

**Backend — bounded contexts (domain) + presentation gateway (hexagonal CQRS):**
```
backend/src/
│
│ ── Bounded Contexts (domain only) ──
│
├── portfolio/                   # BC: Real estate ownership
│   ├── entity/                  # Aggregate: SCI, nom propre
│   │   ├── entity.aggregate.ts
│   │   ├── entity.module.ts
│   │   ├── entity-name.ts       # VO — flat in module
│   │   ├── commands/
│   │   ├── events/
│   │   ├── exceptions/
│   │   └── __tests__/
│   ├── property/                # Aggregate: Properties & units
│   └── portfolio.module.ts
│
├── tenancy/                     # BC: Tenant lifecycle & leases
│   ├── tenant/
│   ├── lease/
│   └── tenancy.module.ts
│
├── billing/                     # BC: Revenue collection
│   ├── rent-call/
│   ├── payment/
│   └── billing.module.ts
│
├── recovery/                    # BC: Unpaid management
│   ├── reminder/
│   └── recovery.module.ts
│
├── indexation/                  # BC: Annual adjustments
│   ├── revision/
│   ├── charge/
│   └── indexation.module.ts
│
│ ── Presentation Gateway (API layer) ──
│
├── presentation/                # Outside BCs — REST gateway
│   ├── entity/
│   │   ├── controllers/         # One controller per action
│   │   ├── dto/
│   │   ├── queries/
│   │   ├── projections/
│   │   ├── finders/
│   │   └── __tests__/
│   ├── property/
│   ├── tenant/
│   ├── lease/
│   ├── rent-call/
│   ├── payment/
│   ├── reminder/
│   ├── revision/
│   ├── charge/
│   └── accounting/              # Read-only — no BC counterpart
│       ├── controllers/
│       ├── queries/
│       ├── projections/
│       ├── finders/
│       └── __tests__/
│
│ ── Cross-cutting ──
│
├── infrastructure/
│   ├── auth/                    # Clerk AuthGuard
│   ├── database/                # Prisma service
│   ├── eventstore/              # KurrentDB connection, upcasters
│   ├── tenant-context/          # EntityId middleware
│   ├── document/                # PDF generation service
│   ├── email/                   # SMTP service
│   ├── scheduling/              # Cron jobs
│   ├── gdpr/                    # Crypto-shredding
│   └── integrations/            # External APIs (INSEE, banking, AR24)
│
├── shared/                      # Shared kernel
│   ├── user-id.ts
│   ├── money.ts
│   └── exceptions/
│
├── app.module.ts
└── main.ts
```

**Frontend — feature-based organization:**
```
frontend/src/
├── app/                # Next.js App Router
│   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── tenants/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── leases/
│   │   ├── rent-calls/
│   │   ├── payments/
│   │   └── accounting/
│   ├── sign-in/
│   └── layout.tsx
├── components/
│   ├── ui/             # shadcn/ui components
│   └── features/
│       ├── tenants/
│       │   ├── tenant-card.tsx
│       │   ├── tenant-form.tsx
│       │   └── tenant-list.tsx
│       ├── leases/
│       └── payments/
├── hooks/
│   ├── use-tenants.ts
│   └── use-entity-context.ts
├── lib/
│   ├── api/            # API client functions
│   │   ├── tenants-api.ts
│   │   └── client.ts   # fetch wrapper with auth
│   └── utils/
└── types/
    └── api.ts          # API response types
```

**Tests:** co-located in `__tests__/` folder within each module/feature.

### Format Patterns

**API Responses:**
- Command accepted: `202 Accepted` — no body. Frontend already has the resource ID (generated client-side via `crypto.randomUUID()`).
- Query success: `200 OK` → `{ data: T }`
- Error: `{ statusCode: number, error: string, message: string, details?: any }`
- HTTP status code conveys success/failure — no `{ success: true }` wrapper.

**Command Payload Convention:**
Frontend generates the resource ID and includes it in the command payload:
```json
POST /api/tenants
{ "id": "uuid-generated-by-frontend", "entityId": "sci-xxx", "firstName": "Dupont", ... }
```

**Data Exchange Formats:**
- JSON fields: `camelCase` → `{ entityId, leaseStartDate, monthlyRentCents }`
- Dates: ISO 8601 strings → `"2026-03-01"` (date), `"2026-03-01T10:30:00Z"` (datetime)
- Money: always in **cents** (integer) → `{ monthlyRentCents: 75000 }`
- Booleans: native JSON `true`/`false`
- Null: explicit `null` in API JSON responses (never omit field). In domain aggregates, Null Object VOs (`VO.empty()`) replace nullable primitives — no `null` in aggregate state

### Communication Patterns

**Events (recap from step 4):**
- Naming: `PascalCase` past tense → `TenantCreated`, `PaymentReceived`
- Payload: `{ data: {...}, metadata: { userId, entityId, timestamp, correlationId } }`
- Versioning: `_v2` suffix for breaking changes

**Logging:**
- NestJS Logger injected per class → `private readonly logger = new Logger(CreateATenantController.name)`
- Levels: `error` (failure), `warn` (abnormal), `log` (business event), `debug` (dev only)
- Never log sensitive data
- Always include `correlationId` when available

### Process Patterns

**Error Handling:**
- Backend: custom domain exceptions → `TenantNotFoundException`, `InvalidRentAmountException`
- All inherit from a base `DomainException`
- Global `ExceptionFilter` translates to normalized HTTP response
- Frontend: TanStack Query `onError` → toast/notification display

**Loading States:**
- TanStack Query manages `isLoading`, `isError`, `data` natively
- Standardized `<LoadingSpinner />` component (shadcn/ui)
- Skeleton loaders for lists and tables
- No global loading state

**Validation:**
- Frontend: Zod schemas in forms (instant validation)
- Backend: `class-validator` decorators on DTOs (validation at controller entry)
- Double validation — backend never trusts frontend

### Enforcement Guidelines

**All AI Agents MUST:**
- **Zero logic in command handlers** — handler loads aggregate, calls method, saves. Period.
- **All business logic in aggregates** — validation, rules, event emission all happen in aggregate methods
- **Use Value Objects for ALL domain concepts** — aggregates never hold raw primitives (`string`, `number`). Every field is a VO. Optional fields use `VO.empty()` (Null Object), never `null`
- **Private constructors + static factories on VOs** — `EntityName.fromString(value)`, `Siret.create(value)`, `Address.fromPrimitives(data)`. Never `new EntityName(value)`
- **Named domain exceptions** — never throw raw `DomainException`. Use specific subclasses with static factory: `InvalidEntityNameException.required()`, `EntityAlreadyExistsException.create()`
- **VOs flat in module** — no `value-objects/` subdirectory. `entity-name.ts`, `siret.ts` co-located next to `entity.aggregate.ts`
- **One controller per action** — each controller class handles exactly one route with a single `handle()` method. No fat controllers with multiple endpoints
- **Use interfaces (ports) everywhere** — domain defines interfaces, infrastructure implements them
- **Pass services as parameters to aggregate methods** — never inject services into aggregates directly
- Respect domain/presentation separation: domain/ talks to event store only, presentation/ talks to PostgreSQL only
- Follow VerbANoun naming for commands/queries, PastTense for events
- Use `kebab-case` for all file names, `PascalCase` for classes, `camelCase` for variables
- Generate resource UUIDs on the frontend — commands never return IDs
- Store all monetary values as integer cents — no floating-point
- Include `entityId` in all event metadata and all Prisma queries
- Co-locate tests in `__tests__/` within each domain or presentation module
- Use NestJS Logger (not console.log) with proper log levels

**Anti-Patterns (Forbidden):**
- **Putting business logic in command handlers** (handlers are pure orchestration — load, call, save)
- **Using raw primitives in aggregates** (always use Value Objects — `EntityName` not `string`, `Siret` not `string | null`)
- **Public constructors on VOs** (always private constructor + static factory: `fromString`, `create`, `fromPrimitives`)
- **Throwing raw `DomainException`** (always use named subclass: `InvalidSiretException.invalidFormat()`, not `new DomainException('SIRET must be 14 digits', ...)`)
- **`value-objects/` subdirectory in domain modules** (VOs live flat in module root — vertical slice)
- **Putting multiple routes in one controller** (one controller = one HTTP action = one `handle()` method)
- **Importing concrete classes in domain/** (domain only imports its own interfaces/ports)
- **Injecting services into aggregates via constructor** (pass them as method parameters instead)
- Importing Prisma or PostgreSQL in domain/ (domain only knows the event store)
- Importing KurrentDB client in presentation/ (presentation only knows PostgreSQL, except projections consuming events via subscription)
- Returning resource data from command endpoints (commands return `202` only)
- Using `float` or `number` for money (must be integer cents)
- Querying without `entityId` filter (breaks multi-tenant isolation)
- Creating shared packages between frontend and backend
- Using global state stores (Redux/Zustand) instead of TanStack Query
- Using `setTimeout` / `waitForProjection` delays instead of TanStack Query optimistic updates (`onMutate` / `onError` / `onSettled`)
- Writing `useMutation` hooks without optimistic update pattern (all mutations MUST handle eventual consistency)
- Hardcoding IDs server-side in command handlers
- **Importing between bounded contexts** (e.g., `tenancy/` importing from `portfolio/`) — use events and IDs only
- **Calling `invalidateQueries` in `onSettled`** — projection lag overwrites optimistic data with stale server state

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Domain | Bounded Context | Domain Path | Presentation Path | Frontend Feature |
|-----------|----------------|-------------|-------------------|-----------------|
| FR57-60: Management Entities | Portfolio | `portfolio/entity/` | `presentation/entity/` | `entities/` |
| FR1-5: Property Management | Portfolio | `portfolio/property/` | `presentation/property/` | `properties/` |
| FR6-10: Tenant Management | Tenancy | `tenancy/tenant/` | `presentation/tenant/` | `tenants/` |
| FR11-17: Lease Management | Tenancy | `tenancy/lease/` | `presentation/lease/` | `leases/` |
| FR18-22: Rent Call Generation | Billing | `billing/rent-call/` | `presentation/rent-call/` | `rent-calls/` |
| FR28-34: Bank Import & Matching | Billing | `billing/payment/` | `presentation/payment/` | `payments/` |
| FR35-41: Reminder Escalation | Recovery | `recovery/reminder/` | `presentation/reminder/` | `reminders/` |
| FR42-47: INSEE Index Revision | Indexation | `indexation/revision/` | `presentation/revision/` | `revisions/` |
| FR48-52: Charge Management | Indexation | `indexation/charge/` | `presentation/charge/` | `charges/` |
| FR53-56: Accounting | — (read-only) | — | `presentation/accounting/` | `accounting/` |
| FR23-27: Documents & Emails | — (infra) | `infrastructure/document/` + `infrastructure/email/` | — | (integrated) |
| FR61-64: Settings | — (infra) | `infrastructure/` | — | `settings/` |

### Complete Project Directory Structure

```
baillr/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── docker-compose.yml
├── README.md
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.ts
│   ├── .env.local
│   ├── .env.example
│   │
│   └── src/
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   ├── sign-in/
│       │   │   └── [[...sign-in]]/
│       │   │       └── page.tsx
│       │   ├── sign-up/
│       │   │   └── [[...sign-up]]/
│       │   │       └── page.tsx
│       │   └── (auth)/
│       │       ├── layout.tsx
│       │       ├── dashboard/
│       │       │   └── page.tsx
│       │       ├── entities/
│       │       │   ├── page.tsx
│       │       │   └── new/
│       │       │       └── page.tsx
│       │       ├── properties/
│       │       │   ├── page.tsx
│       │       │   ├── [id]/
│       │       │   │   └── page.tsx
│       │       │   └── new/
│       │       │       └── page.tsx
│       │       ├── tenants/
│       │       │   ├── page.tsx
│       │       │   ├── [id]/
│       │       │   │   └── page.tsx
│       │       │   └── new/
│       │       │       └── page.tsx
│       │       ├── leases/
│       │       │   ├── page.tsx
│       │       │   ├── [id]/
│       │       │   │   └── page.tsx
│       │       │   └── new/
│       │       │       └── page.tsx
│       │       ├── rent-calls/
│       │       │   ├── page.tsx
│       │       │   └── [id]/
│       │       │       └── page.tsx
│       │       ├── payments/
│       │       │   ├── page.tsx
│       │       │   └── [id]/
│       │       │       └── page.tsx
│       │       ├── reminders/
│       │       │   └── page.tsx
│       │       ├── revisions/
│       │       │   ├── page.tsx
│       │       │   └── new/
│       │       │       └── page.tsx
│       │       ├── charges/
│       │       │   ├── page.tsx
│       │       │   └── [id]/
│       │       │       └── page.tsx
│       │       ├── accounting/
│       │       │   └── page.tsx
│       │       └── settings/
│       │           └── page.tsx
│       │
│       ├── components/
│       │   ├── ui/                         # shadcn/ui
│       │   ├── layout/
│       │   │   ├── sidebar.tsx
│       │   │   ├── header.tsx
│       │   │   └── entity-switcher.tsx
│       │   └── features/
│       │       ├── properties/
│       │       │   ├── property-form.tsx
│       │       │   └── property-list.tsx
│       │       ├── tenants/
│       │       │   ├── tenant-form.tsx
│       │       │   └── tenant-list.tsx
│       │       ├── leases/
│       │       │   ├── lease-form.tsx
│       │       │   └── lease-list.tsx
│       │       ├── rent-calls/
│       │       │   ├── rent-call-list.tsx
│       │       │   └── batch-generate-dialog.tsx
│       │       ├── payments/
│       │       │   ├── bank-import-form.tsx
│       │       │   ├── matching-table.tsx
│       │       │   └── payment-list.tsx
│       │       ├── reminders/
│       │       │   └── reminder-list.tsx
│       │       ├── revisions/
│       │       │   ├── revision-form.tsx
│       │       │   └── revision-list.tsx
│       │       ├── charges/
│       │       │   ├── charge-form.tsx
│       │       │   └── charge-list.tsx
│       │       └── accounting/
│       │           ├── account-book.tsx
│       │           └── export-dialog.tsx
│       │
│       ├── hooks/
│       │   ├── use-entity-context.ts
│       │   ├── use-properties.ts
│       │   ├── use-tenants.ts
│       │   ├── use-leases.ts
│       │   ├── use-rent-calls.ts
│       │   ├── use-payments.ts
│       │   ├── use-reminders.ts
│       │   ├── use-revisions.ts
│       │   ├── use-charges.ts
│       │   └── use-accounting.ts
│       │
│       ├── lib/
│       │   ├── api/
│       │   │   ├── client.ts               # fetch wrapper with Clerk auth
│       │   │   ├── properties-api.ts
│       │   │   ├── tenants-api.ts
│       │   │   ├── leases-api.ts
│       │   │   ├── rent-calls-api.ts
│       │   │   ├── payments-api.ts
│       │   │   ├── reminders-api.ts
│       │   │   ├── revisions-api.ts
│       │   │   ├── charges-api.ts
│       │   │   └── accounting-api.ts
│       │   └── utils/
│       │       ├── format-money.ts
│       │       └── format-date.ts
│       │
│       ├── types/
│       │   └── api.ts
│       │
│       └── middleware.ts                    # Clerk auth middleware
│
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.build.json
    ├── nest-cli.json
    ├── .env
    ├── .env.example
    │
    ├── prisma/
    │   ├── schema.prisma                   # Read models only
    │   └── migrations/
    │
    └── src/
        ├── main.ts
        ├── app.module.ts
        │
        │   ┌─── Bounded Contexts (domain only) ───┐
        │
        ├── portfolio/                       # BC: Real estate ownership
        │   ├── entity/
        │   │   ├── entity.aggregate.ts
        │   │   ├── entity.module.ts
        │   │   ├── entity-name.ts                   # VO — flat in module
        │   │   ├── entity-type.ts                   # VO
        │   │   ├── siret.ts                         # VO (Null Object)
        │   │   ├── address.ts                       # VO (composite)
        │   │   ├── legal-information.ts             # VO (Null Object)
        │   │   ├── commands/
        │   │   │   ├── create-an-entity.command.ts
        │   │   │   ├── create-an-entity.handler.ts
        │   │   │   ├── update-an-entity.command.ts
        │   │   │   └── update-an-entity.handler.ts
        │   │   ├── events/
        │   │   │   ├── entity-created.event.ts
        │   │   │   └── entity-updated.event.ts
        │   │   ├── exceptions/
        │   │   │   ├── entity-already-exists.exception.ts
        │   │   │   ├── entity-not-found.exception.ts
        │   │   │   ├── siret-required-for-sci.exception.ts
        │   │   │   ├── invalid-entity-name.exception.ts
        │   │   │   ├── invalid-entity-type.exception.ts
        │   │   │   ├── invalid-siret.exception.ts
        │   │   │   ├── invalid-address.exception.ts
        │   │   │   └── invalid-legal-information.exception.ts
        │   │   └── __tests__/
        │   │       ├── entity.aggregate.spec.ts
        │   │       ├── create-an-entity.handler.spec.ts
        │   │       └── update-an-entity.handler.spec.ts
        │   │   # property/                  # Future: Story 2.4
        │   └── portfolio.module.ts
        │
        ├── tenancy/                         # BC: Tenant lifecycle & leases
        │   ├── tenant/
        │   │   ├── tenant.aggregate.ts
        │   │   ├── *.ts                             # VOs flat in module
        │   │   ├── commands/
        │   │   ├── events/
        │   │   ├── exceptions/
        │   │   └── __tests__/
        │   ├── lease/
        │   │   ├── lease.aggregate.ts
        │   │   ├── *.ts
        │   │   ├── commands/
        │   │   ├── events/
        │   │   ├── exceptions/
        │   │   └── __tests__/
        │   └── tenancy.module.ts
        │
        ├── billing/                         # BC: Revenue collection
        │   ├── rent-call/
        │   │   ├── rent-call.aggregate.ts
        │   │   ├── *.ts
        │   │   ├── commands/
        │   │   ├── events/
        │   │   ├── exceptions/
        │   │   └── __tests__/
        │   ├── payment/
        │   │   ├── payment.aggregate.ts
        │   │   ├── *.ts
        │   │   ├── commands/
        │   │   ├── events/
        │   │   ├── exceptions/
        │   │   ├── services/
        │   │   │   └── bank-statement-parser.service.ts
        │   │   └── __tests__/
        │   └── billing.module.ts
        │
        ├── recovery/                        # BC: Unpaid management
        │   ├── reminder/
        │   │   ├── reminder.aggregate.ts
        │   │   ├── *.ts
        │   │   ├── commands/
        │   │   ├── events/
        │   │   ├── exceptions/
        │   │   ├── sagas/
        │   │   │   └── reminder-escalation.saga.ts
        │   │   └── __tests__/
        │   └── recovery.module.ts
        │
        ├── indexation/                      # BC: Annual adjustments
        │   ├── revision/
        │   │   ├── revision.aggregate.ts
        │   │   ├── *.ts
        │   │   ├── commands/
        │   │   ├── events/
        │   │   ├── exceptions/
        │   │   ├── services/
        │   │   │   └── index-calculator.service.ts
        │   │   └── __tests__/
        │   ├── charge/
        │   │   ├── charge.aggregate.ts
        │   │   ├── *.ts
        │   │   ├── commands/
        │   │   ├── events/
        │   │   ├── exceptions/
        │   │   └── __tests__/
        │   └── indexation.module.ts
        │
        │   └─── Presentation Gateway (API layer) ───┘
        │
        ├── presentation/                    # Outside BCs — REST + read models
        │   ├── entity/
        │   │   ├── controllers/
        │   │   │   ├── create-an-entity.controller.ts
        │   │   │   ├── update-an-entity.controller.ts
        │   │   │   ├── get-entities.controller.ts
        │   │   │   └── get-an-entity.controller.ts
        │   │   ├── dto/
        │   │   │   ├── create-an-entity.dto.ts
        │   │   │   └── update-an-entity.dto.ts
        │   │   ├── queries/
        │   │   │   ├── get-entities.query.ts
        │   │   │   ├── get-entities.handler.ts
        │   │   │   ├── get-an-entity.query.ts
        │   │   │   └── get-an-entity.handler.ts
        │   │   ├── projections/
        │   │   │   └── entity.projection.ts
        │   │   ├── finders/
        │   │   │   └── entity.finder.ts
        │   │   ├── entity-presentation.module.ts
        │   │   └── __tests__/
        │   │
        │   ├── property/                    # Same pattern per resource
        │   │   ├── controllers/
        │   │   ├── dto/
        │   │   ├── queries/
        │   │   ├── projections/
        │   │   ├── finders/
        │   │   └── __tests__/
        │   │
        │   ├── tenant/
        │   ├── lease/
        │   ├── rent-call/
        │   ├── payment/
        │   ├── reminder/
        │   ├── revision/
        │   ├── charge/
        │   │
        │   └── accounting/                  # Read-only — no BC counterpart
        │       ├── controllers/
        │       ├── queries/
        │       ├── projections/
        │       │   └── account-entry.projection.ts
        │       ├── finders/
        │       └── __tests__/
        │
        ├── infrastructure/
        │   ├── auth/
        │   │   ├── clerk-auth.guard.ts
        │   │   └── auth.module.ts
        │   ├── database/
        │   │   ├── prisma.service.ts
        │   │   └── database.module.ts
        │   ├── eventstore/
        │   │   ├── kurrentdb.service.ts
        │   │   ├── eventstore.module.ts
        │   │   └── upcasters/
        │   │       └── index.ts
        │   ├── tenant-context/
        │   │   ├── entity-context.middleware.ts
        │   │   ├── entity-context.guard.ts
        │   │   └── tenant-context.module.ts
        │   ├── filters/
        │   │   └── domain-exception.filter.ts
        │   ├── document/                        # PDF generation service
        │   │   ├── pdf-generator.service.ts
        │   │   └── templates/
        │   │       ├── rent-call.template.ts
        │   │       ├── receipt.template.ts
        │   │       ├── revision-letter.template.ts
        │   │       ├── formal-notice.template.ts
        │   │       ├── charge-statement.template.ts
        │   │       └── stakeholder-letter.template.ts
        │   ├── email/                           # SMTP service
        │   │   └── smtp.service.ts
        │   ├── scheduling/
        │   │   └── alert-scheduler.service.ts
        │   ├── gdpr/
        │   │   └── crypto-shredding.service.ts
        │   └── integrations/
        │       ├── insee/
        │       ├── banking/
        │       └── registered-mail/
        │
        └── shared/
            ├── user-id.ts
            ├── money.ts
            └── exceptions/
                ├── domain.exception.ts
                └── invalid-user-id.exception.ts
```

### Architectural Boundaries

**Bounded Context Isolation (domain only):**
- Each BC (`portfolio/`, `tenancy/`, `billing/`, `recovery/`, `indexation/`) contains **only domain logic** (aggregates, commands, events, VOs, exceptions)
- **No direct imports between BC domain modules** — the only allowed cross-BC imports come from `shared/` (shared kernel)
- References between BCs are **by ID only** (e.g., a Lease stores `unitId: string`, never imports the Unit aggregate)
- Each BC has a root NestJS module (`portfolio.module.ts`, `tenancy.module.ts`, etc.) that registers its aggregate sub-modules

**Presentation as Gateway (outside BCs):**
- `presentation/` is a separate top-level layer — it does **not** belong to any BC
- `presentation/` dispatches commands to BC aggregates via CommandBus, and reads from its own PostgreSQL projections via QueryBus
- `presentation/*/projections/` consume events via KurrentDB catch-up subscriptions (read from event store, write to PostgreSQL)
- `presentation/accounting/` is a read-only module (no BC counterpart) that projects financial events from Billing, Recovery, and Indexation

**Domain / Presentation Separation (Hexagonal):**
- BC domain modules depend on: their own interfaces (ports), `shared/` — **never** concrete infrastructure classes, Prisma, or PostgreSQL
- Ports (interfaces) are defined within the domain module that needs them — implemented by `infrastructure/`
- `presentation/` depends on: PostgreSQL/Prisma (via infrastructure/database), `shared/` — **never** KurrentDB client directly (except projections)
- `infrastructure/` provides concrete adapters for domain ports and presentation needs (database, auth, document, email)
- NestJS module registration wires interface → implementation via dependency injection

**Inter-BC Communication:**
- BCs communicate **only via domain events** (KurrentDB catch-up subscriptions), never by direct import
- `document/` and `email/` are infrastructure services consumed via command bus from any BC
- Presentation projections can consume events from **any BC** to build denormalized read models
- No Prisma JOINs across presentation module tables — each presentation module owns its projections

**Frontend / Backend Boundary:**
- Single integration point: HTTP/REST API
- No shared TypeScript packages, no shared types
- API contract is the only dependency

### Data Flow

```
1. Frontend generates UUID + sends POST command
2. presentation/*/controllers/* receives request, dispatches to CommandBus
3. {bc}/*/commands/handler loads aggregate (events from KurrentDB)
4. Aggregate applies business logic, emits event(s)
5. Event(s) persisted to KurrentDB
6. Catch-up subscription captures event
7. presentation/*/projections/ updates PostgreSQL via Prisma
8. (Optional) Other presentation modules also consume the event for denormalized read models
9. Frontend sends GET query
10. presentation/*/controllers/* dispatches to QueryBus
11. presentation/*/queries/handler reads from finder (PostgreSQL)
12. Returns 200 OK { data: T }
```

### Cross-Cutting Concerns Mapping

| Concern | Location | Scope |
|---------|----------|-------|
| Authentication | `infrastructure/auth/` | All controllers |
| Multi-tenant isolation | `infrastructure/tenant-context/` | All domain handlers + all finders |
| Error normalization | `infrastructure/filters/` | All controllers |
| Event store connection | `infrastructure/eventstore/` | All domain modules |
| Database connection | `infrastructure/database/` | All presentation modules |
| Financial precision | `shared/money.ts` | Domain + presentation |
| Event upcasting | `infrastructure/eventstore/upcasters/` | All event deserialization |
| Proactive alerts | `infrastructure/scheduling/` | Insurance expiry, unpaid detection, escalation thresholds |
| GDPR compliance | `infrastructure/gdpr/` | Tenant personal data encryption/shredding |
| External integrations | `infrastructure/integrations/` | INSEE, Open Banking, AR24/Maileva |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible: Next.js 15 + NestJS 11 + KurrentDB 25 + PostgreSQL 16 + Prisma 6 + Clerk + Tailwind 4. No version conflicts detected. nestjs-cqrx 5.x bridges @nestjs/cqrs with KurrentDB cleanly.

**Pattern Consistency:**
VerbANoun commands, PastTense events, kebab-case files, camelCase variables — all consistently applied across domain and presentation layers. Domain/presentation separation aligns perfectly with the CQRS write/read split.

**Structure Alignment:**
Project structure directly supports all architectural decisions. Each bounded context maps cleanly to a domain module (write) and a presentation module (read). Infrastructure layer properly adapts external services for both sides.

### Requirements Coverage Validation

**64 Functional Requirements Coverage:**

| FR Range | Domain | BC | Status | Notes |
|----------|--------|----|--------|-------|
| FR1-4 | Entity Management | Portfolio | ✅ | `portfolio/entity/` + `presentation/entity/` |
| FR5-8 | Property & Units | Portfolio | ✅ | `portfolio/property/` + `presentation/property/` |
| FR9-11 | Tenant Management | Tenancy | ✅ | FR11 alerts via `infrastructure/scheduling/` |
| FR12-17 | Lease Management | Tenancy | ✅ | Pro-rata in lease aggregate |
| FR18-22 | Rent Call Generation | Billing | ✅ | `billing/rent-call/` + `presentation/rent-call/` |
| FR23-27 | Documents & Email | — (infra) | ✅ | `infrastructure/document/` + `infrastructure/email/` |
| FR28-34 | Payment & Bank | Billing | ✅ | FR34 Open Banking via `infrastructure/integrations/banking/` |
| FR35-41 | Reminders | Recovery | ✅ | Saga + FR40 AR24 via `infrastructure/integrations/registered-mail/` |
| FR42-47 | Index Revision | Indexation | ✅ | FR47 auto-retrieval via `infrastructure/integrations/insee/` |
| FR48-52 | Charges | Indexation | ✅ | `indexation/charge/` + `presentation/charge/` |
| FR53-56 | Accounting | — (read-only) | ✅ | `presentation/accounting/` — no domain (event store IS the ledger) |
| FR57-61 | Dashboard & Alerts | — (cross) | ✅ | FR61 email alerts via `infrastructure/scheduling/` |
| FR62-64 | User & Access | — (infra) | ✅ | FR63 accountant read-only via role-based guard |

**21 Non-Functional Requirements Coverage:**

| NFR | Concern | Status | Architectural Support |
|-----|---------|--------|----------------------|
| NFR1-6 | Performance | ✅ | KurrentDB + PostgreSQL sufficient at current scale |
| NFR7 | Encryption | ✅ | Railway TLS + managed DB encryption at rest |
| NFR8 | Authentication | ✅ | Clerk handles all auth (no password management by us) |
| NFR9 | Tenant isolation | ✅ | entityId in events + all queries |
| NFR10 | GDPR | ✅ | Crypto-shredding strategy for right-to-erasure |
| NFR11 | No sensitive logs | ✅ | Logging patterns defined |
| NFR12 | Accountant read-only | ✅ | Role-based guard (owner/accountant) |
| NFR13-14 | Event immutability | ✅ | KurrentDB native guarantee |
| NFR15 | Deterministic projections | ✅ | Integer cents, no floating-point |
| NFR16 | Crash recovery | ✅ | Event store = source of truth, cursor persistence |
| NFR17 | Daily backups | ✅ | Kurrent Cloud + Railway managed backups |
| NFR18 | 2-decimal precision | ✅ | Integer cents throughout |
| NFR19 | Consistent patterns | ✅ | Step 5 enforcement guidelines |
| NFR20 | Event schema versioning | ✅ | Upcasting pipeline defined |
| NFR21 | Test coverage >95% | ✅ | Jest co-located, structure supports testing |

### Gaps Addressed

| Gap | Resolution | Location |
|-----|-----------|----------|
| Accountant read-only (FR63/NFR12) | Added `owner`/`accountant` role in entity-user relation, guard blocks writes for accountants | `infrastructure/auth/` |
| Proactive alerts (FR11/FR61) | Added `@nestjs/schedule` cron infrastructure for insurance expiry, unpaid detection | `infrastructure/scheduling/` |
| GDPR right-to-erasure (NFR10) | Crypto-shredding: personal data in events encrypted per-tenant, delete key = erase data | `infrastructure/gdpr/` |
| External integrations (FR34/40/47) | Infrastructure adapter stubs for Open Banking, AR24/Maileva, INSEE | `infrastructure/integrations/` |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (64 FRs, 21 NFRs)
- [x] Scale and complexity assessed (high)
- [x] Technical constraints identified (event sourcing, financial precision, French law)
- [x] Cross-cutting concerns mapped (7 concerns + 3 added during validation)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Dual-store CQRS/ES pattern fully specified (KurrentDB + PostgreSQL)
- [x] Domain/presentation separation defined (hexagonal CQRS)
- [x] Authentication + authorization with accountant role
- [x] Event versioning and upcasting strategy

**✅ Implementation Patterns**
- [x] Naming conventions established (VerbANoun, PastTense, kebab-case)
- [x] Structure patterns defined (domain/ vs presentation/)
- [x] Communication patterns specified (events, API, logging)
- [x] Process patterns documented (error handling, validation, loading)
- [x] Enforcement guidelines and anti-patterns listed

**✅ Project Structure**
- [x] Complete directory structure defined (frontend + backend)
- [x] Component boundaries established (domain ↔ presentation ↔ infrastructure)
- [x] All 12 FR domains mapped to specific modules
- [x] Cross-cutting concerns mapped to infrastructure

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all 64 FRs and 21 NFRs have explicit architectural support.

**Key Strengths:**
- Clean CQRS/ES separation with dedicated event store (KurrentDB)
- Domain/presentation boundary prevents accidental coupling
- Event store as source of truth provides native auditability and rebuildable read models
- Simple authorization model covers all access patterns (owner + accountant)
- Modular structure allows bounded contexts to be built independently

**Areas for Future Enhancement:**
- Staging environment when moving beyond single-user
- Advanced observability (OpenTelemetry) when scaling
- External integrations (Open Banking, AR24, INSEE) as infrastructure adapters
- Performance caching layer if query load increases
