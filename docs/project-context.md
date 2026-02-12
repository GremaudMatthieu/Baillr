# Project Context

> Single-source-of-truth reference for Baillr's architectural decisions, established patterns, and cross-story conventions.
> This document consolidates learnings from Epics 1-2 and the Consolidation Sprint.
>
> **Related docs:** [Anti-Patterns](./anti-patterns.md) | [DTO Checklist](./dto-checklist.md)

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [CQRS / Event Sourcing Patterns](#2-cqrs--event-sourcing-patterns)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Authentication Pattern](#5-authentication-pattern)
6. [Form Patterns](#6-form-patterns)
7. [Testing Infrastructure](#7-testing-infrastructure)
8. [File Structure Conventions](#8-file-structure-conventions)

---

## 1. Tech Stack

### Backend

| Component | Package | Version |
|-----------|---------|---------|
| Runtime | Node.js | 22.x |
| Framework | NestJS (`@nestjs/core`) | 11.x |
| CQRS | `@nestjs/cqrs` | 11.x |
| Event Store | KurrentDB (`@kurrent/kurrentdb-client`) | 1.x |
| ORM (Read Models) | Prisma (`@prisma/client`) | 7.x |
| Database | PostgreSQL | 18.x |
| Auth | Clerk (`@clerk/backend`) | 2.x |
| Validation | `class-validator` + `class-transformer` | 0.14.x / 0.5.x |
| Event Sourcing Bridge | `nestjs-cqrx` | 5.x |
| Testing | Jest + ts-jest | 30.x / 29.x |
| Language | TypeScript | 5.7.x |
| Linting | ESLint 9 + Prettier | 9.x / 3.x |

### Frontend

| Component | Package | Version |
|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Component Library | Radix UI (`radix-ui`) | 1.x |
| Design System | shadcn/ui (`shadcn`) | 3.x |
| Auth | Clerk (`@clerk/nextjs`) | 6.x |
| State (Server) | TanStack React Query (`@tanstack/react-query`) | 5.x |
| Forms | react-hook-form + `@hookform/resolvers` | 7.x / 5.x |
| Validation | Zod | 4.x |
| Icons | Lucide React | 0.563.x |
| Unit Testing | Vitest + @testing-library/react | 4.x / 16.x |
| E2E Testing | Playwright (`@playwright/test`) | 1.58.x |
| Language | TypeScript | 5.x |

---

## 2. CQRS / Event Sourcing Patterns

### Command Flow

```
HTTP Request
  → Controller (single action, @UseGuards)
    → Command (data carrier)
      → Command Handler (pure orchestration: load → call → save)
        → Aggregate (business logic + event emission)
          → Event (immutable fact)
            → KurrentDB (event store)
              → Projection (event → read model)
                → PostgreSQL (via Prisma)
```

### Key Decisions

**Command handlers are pure orchestration.** They load the aggregate from the event store, call a method on it, and save. No business logic, no validation, no side effects.

**Business rules live in aggregates.** The aggregate is the guardian of invariants. It validates, applies domain rules, and emits events.

**Events are immutable facts.** Once stored in KurrentDB, events cannot be modified. The event stream is the source of truth.

**Read models are disposable.** PostgreSQL projections can be rebuilt from the event stream at any time.

### Optimistic UI Pattern

```
Frontend generates UUID
  → POST /api/... (returns 202 Accepted)
    → onMutate: add to React Query cache (optimistic)
    → Server: Command → Aggregate → Event → Projection
    → onSettled: delayed invalidation via setTimeout (1500ms)
    → staleTime (30s): background reconciliation
```

**Critical rules:**
- Frontend generates the aggregate ID (UUID) before the POST
- POST returns `202 Accepted` (not 201) — the command is accepted, not confirmed
- `onMutate` adds the new entity to the React Query cache immediately
- `onSettled` does NOT call `invalidateQueries` directly — it uses `setTimeout` with 1500ms delay
- `staleTime` (30s) handles eventual consistency reconciliation in the background

### Aggregate Patterns

**Separate aggregate** (own event stream): Entity, Property, Unit
- Each has its own stream: `entity-{id}`, `property-{id}`, `unit-{id}`
- Cross-aggregate references by ID only

**Child entity in aggregate** (stored in parent's stream): BankAccount (in EntityAggregate)
- Stored as `Map<string, BankAccountState>` inside the parent aggregate
- Commands target the parent: `AddABankAccountCommand`, `UpdateABankAccountCommand`
- Events stored in the parent's stream: `entity-{id}`

**Decision criteria:** If the child will have its own children or grow complex, make it a separate aggregate. If it's simple and always managed through the parent, keep it as a child entity.

### URL Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| Sub-resource | Create & List | `POST/GET /api/entities/:entityId/properties` |
| Direct | Get & Update | `GET/PUT /api/properties/:id` |
| Sub-resource (child) | Create, List, Update, Delete | `POST/GET/PUT/DELETE /api/entities/:entityId/bank-accounts/:accountId` |
| Cross-aggregate read | Entity-level query | `GET /api/entities/:entityId/units` |

### Projection Resilience

- Check existence before update (warn + return if missing, don't throw)
- Exponential backoff on reconnect to KurrentDB
- Projection can be rebuilt from event stream if data becomes inconsistent

---

## 3. Backend Architecture

### Bounded Contexts

All domain code lives under `backend/src/portfolio/`:

```
backend/src/
├── portfolio/              # Bounded context: Portfolio
│   ├── entity/             # Entity aggregate
│   │   ├── domain/         # Aggregate, events, value objects, exceptions
│   │   └── entity.module.ts
│   ├── property/           # Property aggregate
│   │   ├── domain/         # Aggregate, events, value objects, exceptions
│   │   ├── unit/           # Unit aggregate (nested under property)
│   │   │   └── domain/
│   │   └── property.module.ts
│   └── portfolio.module.ts # Root module for the bounded context
├── presentation/           # Controllers + DTOs (presentation layer)
│   ├── entity/
│   │   ├── controllers/    # One controller per action
│   │   └── dto/            # Create/Update DTOs
│   └── property/
│       ├── controllers/    # Property + Unit controllers
│       └── dto/            # Property + Unit DTOs
├── infrastructure/         # Technical infrastructure
│   ├── auth/               # Clerk auth guard
│   ├── database/           # Prisma service, projections
│   ├── eventstore/         # KurrentDB connection
│   └── filters/            # Exception filters
├── shared/                 # Shared value objects and utilities
│   ├── exceptions/         # Base DomainException
│   ├── user-id.ts          # UserId value object
│   └── money.ts            # Money value object
└── types/                  # TypeScript type definitions
```

### Domain Layer Rules

- **Value Objects:** Private constructor + static `create()` factory + Null Object pattern (`.empty()`, `.isEmpty`)
- **Named exceptions:** All domain exceptions extend `DomainException` with static `create()` factory
- **Aggregate updates:** No-op guard — check `Object.keys(eventData).length > 1` before emitting
- **Enum validation:** Guard clause + named exception (never `as` cast)
- **One controller per action:** SRP — single `handle()` method per controller

### Cross-Module Communication

- **EntityFinder:** Exported from `EntityPresentationModule`, imported by `PropertyPresentationModule` for ownership checks
- **PropertyFinder:** Exported from `PropertyPresentationModule`, imported by Unit controllers for ownership checks
- Controllers perform cross-aggregate authorization before dispatching commands

---

## 4. Frontend Architecture

### Component Hierarchy

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Authenticated route group
│   │   ├── layout.tsx      # Auth layout (sidebar + header + main)
│   │   ├── dashboard/      # Dashboard page
│   │   ├── entities/       # Entity management pages
│   │   └── properties/     # Property management pages
│   ├── sign-in/            # Public auth pages
│   └── sign-up/
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── entities/       # Entity forms, lists, action-feed
│   │   ├── properties/     # Property forms, lists
│   │   ├── units/          # Unit forms, mosaic
│   │   └── bank-accounts/  # Bank account forms, lists
│   ├── layout/             # Layout components (sidebar, header, breadcrumb)
│   ├── providers/          # QueryProvider, theme provider
│   └── ui/                 # shadcn/ui primitives
├── contexts/               # React Contexts (EntityContext)
├── hooks/                  # Custom hooks (useEntities, useProperties, useUnits, etc.)
├── lib/
│   ├── api/                # fetchWithAuth, API client modules
│   ├── constants/          # Shared constants (UNIT_TYPE_LABELS)
│   └── utils/              # Utility functions
└── test/                   # Test setup and global mocks
```

### Key Patterns

**Server Component / Client Component boundary:**
- `page.tsx` exports `metadata` (Server Component), delegates interactive content to a `"use client"` wrapper
- Example: `DashboardPage` → `DashboardContent` (Client Component)

**Entity Context:**
- React Context + localStorage for entity selection persistence
- Pure derivation during render for validation (no `setState` in `useEffect`)
- Exposes full `entities[]` collection from context (not just `currentEntity`)

**EntitySwitcher:**
- 4 states (loading/empty/single/multiple) × 2 variants (full/collapsed)
- In sidebar Sheet variant: accepts `onNavigate?: () => void` to close Sheet on navigation

**Shared API utility:**
- `fetchWithAuth` in `lib/api/fetch-with-auth.ts` — all API modules import from there
- Handles Clerk token injection and JSON parsing

**ARIA patterns:**
- Grid pattern with roving tabindex for UnitMosaic
- Keyboard navigation: Arrow keys, Home/End, `onKeyDown` handler, `onFocus` sync, `useRef` for programmatic focus

**React Query conventions:**
- `staleTime: 30_000` (30s) for CQRS eventual consistency reconciliation
- Fresh `QueryClient` per test with `gcTime: 0`
- Mutations use `onMutate` for optimistic cache updates
- `onSettled` uses `setTimeout(1500ms)` for delayed invalidation
- Cross-query cache invalidation: mutations must invalidate ALL related query keys

**Navigation patterns:**
- `router.back()` for back navigation (never hardcoded parent links)
- Entity switch redirects to `/dashboard` from entity-scoped pages
- Entity-agnostic pages (`/entities`, `/dashboard`) excluded from redirect
- Mobile Sheet close: sidebar navigation components accept `onNavigate?: () => void` prop; sidebar passes `onMobileClose` in Sheet variant to close the drawer on navigation

---

## 5. Authentication Pattern

### Flow

```
Browser → Clerk.js (login UI)
  → Clerk Session Token (JWT)
    → Frontend: @clerk/nextjs middleware (route protection)
    → API calls: fetchWithAuth adds Bearer token
      → Backend: ClerkAuthGuard (@UseGuards)
        → JWT verification via @clerk/backend
          → UserId extraction (user_ prefix validation)
            → Controller: entity ownership check via Finder
```

### Backend Guards

```typescript
@Controller('entities')
@UseGuards(ClerkAuthGuard)
export class CreateAnEntityController {
  async handle(@CurrentUserId() userId: UserId, @Body() dto: CreateAnEntityDto) {
    // userId is already validated and extracted by the guard
  }
}
```

### Cross-Aggregate Authorization

```typescript
// In PropertyController — checks entity ownership before dispatching property command
const entity = await this.entityFinder.findByIdAndUserId(entityId, userId.value);
if (!entity) throw new UnauthorizedException();
// Then dispatch CreateAPropertyCommand
```

---

## 6. Form Patterns

### Standard Form Architecture

```typescript
// 1. Zod schema (NO .default(), NO .refine())
const schema = z.object({
  name: z.string().min(1, { error: "Required" }).max(255),
  type: z.enum(["apartment", "parking"]),
});
type FormData = z.infer<typeof schema>;

// 2. react-hook-form with zodResolver
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { name: "", type: "apartment" }, // Defaults HERE
});

// 3. Dynamic field arrays (for billable options, etc.)
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "billableOptions",
});

// 4. Form submission with mutation
const mutation = useCreateUnit(propertyId);
const onSubmit = (data: FormData) => mutation.mutate(data);
```

### Euros/Cents Conversion

Store as `amountCents` (integer) in domain, display as euros in UI:

```typescript
// Form → API: convert euros to cents
const amountCents = Math.round(formData.amount * 100);

// API → Form: convert cents to euros
const displayAmount = data.amountCents / 100;
```

### Form Cancel Pattern

```typescript
interface FormProps {
  onCancel?: () => void; // Enables edit-mode cancel without navigation
}

function MyForm({ onCancel }: FormProps) {
  const router = useRouter();
  const handleCancel = onCancel ?? (() => router.back());
  // ...
}
```

### AddressAutocomplete Pattern

Lock/unlock pattern with `addressLocked` state:
- `handleAddressSelect`: fills form fields from autocomplete, sets `addressLocked = true`
- `handleAddressReset`: clears address fields, sets `addressLocked = false`
- When locked: address fields are read-only, show "Change" button
- When unlocked: address fields are editable, show autocomplete input

---

## 7. Testing Infrastructure

### Backend — Jest

- **Framework:** Jest 30 + ts-jest
- **Test files:** `*.spec.ts` co-located with source (same directory)
- **Test types:** Unit tests for aggregates, VOs, command handlers; integration tests for projections
- **Path aliases:** `@shared/`, `@infrastructure/`, `@portfolio/`
- **Run:** `cd backend && npm test`

### Frontend — Vitest (Unit/Component)

- **Framework:** Vitest 4.x + @testing-library/react 16.x + jsdom
- **Test files:** `__tests__/` directory co-located with source
- **Setup file:** `frontend/src/test/setup.ts`
- **Run:** `cd frontend && npm test`

**Required polyfills (in setup.ts):**
```typescript
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
Element.prototype.hasPointerCapture = () => false;
Element.prototype.scrollIntoView = () => {};
```

**Global mock wiring:**
- Standalone mock files under `src/test/mocks/` (e.g., `next-navigation.ts`, `clerk.ts`)
- Must be explicitly imported in `setup.ts` to apply
- `vi.mock()` hoisting only works within files that are loaded

**Test wrapper pattern:**
```typescript
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}
```

### Frontend — Playwright (E2E)

- **Framework:** Playwright 1.58.x
- **Config:** `frontend/playwright.config.ts`
- **Test files:** `frontend/e2e/`
- **Auth:** `@clerk/testing` for auth bypass
- **Run:** `cd frontend && npm run test:e2e`

**Key conventions:**
- No `page.waitForTimeout()` — use Playwright auto-waiting
- Assert on optimistic UI, not API responses (CQRS timing)
- No state dependencies between tests — each test is self-contained
- Timestamp-based unique naming for test data isolation (no DELETE endpoints)

---

## 8. File Structure Conventions

### Backend — New Aggregate Checklist

When creating a new aggregate (e.g., `Lease`):

```
backend/src/
├── portfolio/
│   └── lease/
│       ├── domain/
│       │   ├── lease.aggregate.ts          # Aggregate root
│       │   ├── events/                     # Domain events
│       │   │   ├── lease-created.event.ts
│       │   │   └── lease-updated.event.ts
│       │   ├── value-objects/              # Value objects
│       │   │   └── lease-start-date.vo.ts
│       │   └── exceptions/                 # Named domain exceptions
│       │       └── lease-not-found.exception.ts
│       └── lease.module.ts
├── presentation/
│   └── lease/
│       ├── controllers/
│       │   ├── create-a-lease.controller.ts
│       │   ├── get-a-lease.controller.ts
│       │   └── update-a-lease.controller.ts
│       ├── dto/
│       │   ├── create-a-lease.dto.ts
│       │   └── update-a-lease.dto.ts
│       ├── projections/
│       │   └── lease.projection.ts
│       ├── finders/
│       │   └── lease.finder.ts
│       └── lease-presentation.module.ts
└── infrastructure/
    └── database/
        └── prisma/schema.prisma           # Add Lease model
```

### Frontend — New Feature Checklist

When creating frontend for a new feature (e.g., `leases`):

```
frontend/src/
├── app/(auth)/
│   └── leases/
│       ├── page.tsx                       # Server Component (metadata)
│       ├── new/page.tsx                   # Create form page
│       └── [id]/
│           ├── page.tsx                   # Detail page
│           └── edit/page.tsx              # Edit form page
├── components/features/
│   └── leases/
│       ├── lease-form.tsx                 # Shared create/edit form
│       ├── lease-list.tsx                 # List component
│       └── __tests__/
│           ├── lease-form.test.tsx
│           └── lease-list.test.tsx
├── hooks/
│   └── use-leases.ts                     # useLeases, useCreateLease, useUpdateLease
└── lib/api/
    └── leases.ts                          # API client (fetchWithAuth)
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Aggregate | PascalCase + "Aggregate" | `LeaseAggregate` |
| Event | PascalCase + past tense | `LeaseCreated` |
| Command | PascalCase + imperative | `CreateALeaseCommand` |
| Controller | PascalCase + action | `CreateALeaseController` |
| DTO | PascalCase + action + "Dto" | `CreateALeaseDto` |
| Value Object | PascalCase + ".vo.ts" | `LeaseStartDate` |
| Exception | PascalCase + "Exception" | `LeaseNotFoundException` |
| Hook | camelCase + "use" prefix | `useLeases`, `useCreateLease` |
| API module | kebab-case | `leases.ts` |
| Test file | kebab-case + ".test.tsx" | `lease-form.test.tsx` |
| Backend test | kebab-case + ".spec.ts" | `lease.aggregate.spec.ts` |

### Import Conventions

**Backend path aliases:**
```typescript
import { UserId } from '@shared/user-id.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import { EntityAggregate } from '@portfolio/entity/domain/entity.aggregate.js';
```

**Frontend relative imports:**
```typescript
import { fetchWithAuth } from '@/lib/api/fetch-with-auth';
import { useCurrentEntity } from '@/contexts/entity-context';
import { UNIT_TYPE_LABELS } from '@/lib/constants/unit-types';
```
