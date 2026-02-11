# Story 2.4: Create Properties Under an Entity

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to create properties (buildings/addresses) under my ownership entity,
so that I can organize my real estate portfolio geographically (FR5).

## Acceptance Criteria

1. **Given** I have selected an entity, **When** I navigate to the properties page, **Then** I see a list of all properties belonging to the current entity with their name, address, and type
2. **Given** I have selected an entity, **When** I create a new property, **Then** I can enter: property name, full address (street, postal code, city, country, complement), type/description, **And** the property is linked to the current entity via entityId
3. **Given** I submit a valid property creation form, **When** the command is processed, **Then** the event `PropertyCreated` is stored in KurrentDB with entityId in metadata, **And** the command returns 202 Accepted, **And** the property appears in the property list optimistically
4. **Given** I have created a property, **When** I view the property detail, **Then** I can edit property details (name, address, type/description) via an `UpdateAProperty` command
5. **Given** I am on the dashboard, **When** no properties exist for the current entity, **Then** the ActionFeed shows "Ajoutez un bien immobilier" with a link to `/properties/new`
6. **Given** I create or edit a property, **When** validation fails (empty name, missing address fields), **Then** I see inline validation errors via Zod schema

## Tasks / Subtasks

- [x] **Task 1: Create Property aggregate in Portfolio bounded context** (AC: 2, 3, 4)
  - [x] 1.1 Create `backend/src/portfolio/property/` directory structure: aggregate, commands/, events/, exceptions/, `__tests__/`
  - [x] 1.2 Create Value Objects (flat in module — NO `value-objects/` subdirectory):
    - `property-name.ts` — required, trimmed, max 255 chars. Private constructor + `static fromString(value: string)`. Throws `InvalidPropertyNameException`
    - `property-type.ts` — optional free-text description (e.g., "Immeuble", "Maison", "Local commercial"). Private constructor + `static fromString(value: string)` + `static empty()` (Null Object). Throws `InvalidPropertyTypeException`
    - `property-address.ts` — composite VO with street (required), postalCode (required), city (required), country (default "France"), complement (optional). Private constructor + `static fromPrimitives(data)` + `static empty()`. Throws `InvalidPropertyAddressException.streetRequired()`, `.postalCodeRequired()`, `.cityRequired()`
  - [x] 1.3 Create `property.aggregate.ts`:
    - Extends `AggregateRoot` (from nestjs-cqrx)
    - State fields: `name: PropertyName`, `entityId: string`, `userId: string`, `type: PropertyType`, `address: PropertyAddress`
    - Stream name: `property-{id}`
    - Method `create(userId, entityId, name, type, address)` — validates userId, emits `PropertyCreated`
    - Method `update(userId, name?, type?, address?)` — validates userId authorization, emits `PropertyUpdated` with only changed fields
    - `@EventHandler(PropertyCreated)` and `@EventHandler(PropertyUpdated)` to rebuild state
  - [x] 1.4 Create commands:
    - `create-a-property.command.ts` — `CreateAPropertyCommand(propertyId, userId, entityId, name, type, address)`
    - `create-a-property.handler.ts` — create new aggregate, call `aggregate.create(...)`, save
    - `update-a-property.command.ts` — `UpdateAPropertyCommand(propertyId, userId, name?, type?, address?)`
    - `update-a-property.handler.ts` — load aggregate, call `aggregate.update(...)`, save
  - [x] 1.5 Create events:
    - `property-created.event.ts` — `PropertyCreated` with `PropertyCreatedData { id, entityId, userId, name, type, address: { street, postalCode, city, country, complement } }`
    - `property-updated.event.ts` — `PropertyUpdated` with `PropertyUpdatedData { id, name?, type?, address?: { street, postalCode, city, country, complement } }`
  - [x] 1.6 Create exceptions:
    - `invalid-property-name.exception.ts` — `.required()`, `.tooLong()`
    - `invalid-property-type.exception.ts` — `.tooLong()`
    - `invalid-property-address.exception.ts` — `.streetRequired()`, `.postalCodeRequired()`, `.cityRequired()`
    - `unauthorized-property-access.exception.ts` — `.create()`
  - [x] 1.7 Create `property.module.ts` — register with `CqrxModule.forFeature([PropertyAggregate])`, provide handlers
  - [x] 1.8 Register `PropertyDomainModule` in `portfolio.module.ts` imports/exports
  - [x] 1.9 Write unit tests:
    - `property.aggregate.spec.ts` — test create, update, userId validation, VO validation, event emission
    - `create-a-property.handler.spec.ts` — test handler orchestration
    - `update-a-property.handler.spec.ts` — test handler orchestration

- [x] **Task 2: Create Property read model (Prisma + Projection)** (AC: 1, 3)
  - [x] 2.1 Add `Property` model to `backend/prisma/schema.prisma`:
    ```prisma
    model Property {
      id              String   @id @default(uuid())
      entityId        String   @map("entity_id")
      userId          String   @map("user_id")
      name            String
      type            String?
      addressStreet   String   @map("address_street")
      addressPostalCode String @map("address_postal_code")
      addressCity     String   @map("address_city")
      addressCountry  String   @map("address_country") @default("France")
      addressComplement String? @map("address_complement")
      createdAt       DateTime @default(now()) @map("created_at")
      updatedAt       DateTime @updatedAt @map("updated_at")

      entity OwnershipEntity @relation(fields: [entityId], references: [id])

      @@map("properties")
      @@index([entityId])
      @@index([userId])
    }
    ```
  - [x] 2.2 Add `properties Property[]` relation to `OwnershipEntity` model
  - [x] 2.3 Run `npx prisma migrate dev --name add-property-model`
  - [x] 2.4 Create `backend/src/presentation/property/projections/property.projection.ts`:
    - Subscribe to KurrentDB with filter `streamNameFilter({ prefixes: ['property-'] })`
    - Handle `PropertyCreated` → `prisma.property.upsert(...)` (idempotent)
    - Handle `PropertyUpdated` → check existence first (warn + return if missing), selective update of defined fields only
    - Exponential backoff reconnect (max 30s) — follow entity.projection.ts pattern exactly

- [x] **Task 3: Create Property presentation layer (controllers, DTOs, queries, finders)** (AC: 1, 2, 3, 4)
  - [x] 3.1 Create `backend/src/presentation/property/` directory structure: controllers/, dto/, queries/, projections/ (created in Task 2), finders/, `__tests__/`
  - [x] 3.2 Create DTOs:
    - `create-a-property.dto.ts` — `id: @IsUUID()`, `name: @IsString() @Length(1, 255)`, `address: @ValidateNested() @Type(() => PropertyAddressDto)` with nested DTO (street: required, postalCode: required, city: required, country: optional default "France", complement: optional), `type?: @IsOptional() @IsString() @MaxLength(255)`
    - `update-a-property.dto.ts` — all fields optional: `name?: @IsOptional() @IsString() @Length(1, 255)`, `address?: @IsOptional() @ValidateNested()`, `type?: @IsOptional() @IsString() @MaxLength(255)`
  - [x] 3.3 Create controllers (one per action — SRP):
    - `create-a-property.controller.ts` — `@Controller('entities/:entityId/properties')` `@Post()` `@HttpCode(ACCEPTED)`. Extract entityId from `@Param('entityId', ParseUUIDPipe)`, userId from `@CurrentUser()`. Dispatch `CreateAPropertyCommand`
    - `update-a-property.controller.ts` — `@Controller('properties')` `@Put(':id')` `@HttpCode(ACCEPTED)`. Dispatch `UpdateAPropertyCommand`
    - `get-properties.controller.ts` — `@Controller('entities/:entityId/properties')` `@Get()`. Dispatch `GetPropertiesQuery(entityId, userId)`
    - `get-a-property.controller.ts` — `@Controller('properties')` `@Get(':id')`. Dispatch `GetAPropertyQuery(propertyId, userId)`
  - [x] 3.4 Create queries + handlers:
    - `get-properties.query.ts` + `get-properties.handler.ts` — returns `Property[]` filtered by entityId + userId
    - `get-a-property.query.ts` + `get-a-property.handler.ts` — returns single `Property` by id, validates userId ownership
  - [x] 3.5 Create `property.finder.ts` — Prisma queries: `findAllByEntityAndUser(entityId, userId)`, `findByIdAndUser(id, userId)`
  - [x] 3.6 Create `property-presentation.module.ts` — register all controllers, handlers, projection, finder
  - [x] 3.7 Register `PropertyPresentationModule` in `app.module.ts` imports
  - [x] 3.8 Write presentation tests:
    - `create-a-property.controller.spec.ts`
    - `get-properties.controller.spec.ts`
    - `property.projection.spec.ts`

- [x] **Task 4: Create Properties API client and React Query hooks** (AC: 1, 2, 3, 4)
  - [x] 4.1 Create `frontend/src/lib/api/properties-api.ts`:
    - `PropertyData` interface: `{ id, entityId, userId, name, type, addressStreet, addressPostalCode, addressCity, addressCountry, addressComplement, createdAt, updatedAt }`
    - `CreatePropertyPayload`: `{ id, name, type?, address: { street, postalCode, city, country?, complement? } }`
    - `UpdatePropertyPayload`: `{ name?, type?, address?: { street, postalCode, city, country?, complement? } }`
    - `usePropertiesApi()` hook returning `{ getProperties(entityId), getProperty(id), createProperty(entityId, payload), updateProperty(id, payload) }`
    - All methods use `fetchWithAuth` from `lib/api/fetch-with-auth.ts`
  - [x] 4.2 Create `frontend/src/hooks/use-properties.ts`:
    - `useProperties(entityId)` — queryKey: `["entities", entityId, "properties"]`, enabled: `!!entityId`, staleTime: 30_000
    - `useProperty(propertyId)` — queryKey: `["properties", propertyId]`, enabled: `!!propertyId`
    - `useCreateProperty(entityId)` — full optimistic update pattern: onMutate (cancel queries, snapshot, append optimistic), onError (rollback), onSettled (delayed invalidate 1500ms)
    - `useUpdateProperty(propertyId, entityId)` — optimistic update for BOTH list (`["entities", entityId, "properties"]`) and detail (`["properties", propertyId]`) caches

- [x] **Task 5: Create Property form component with Zod validation** (AC: 2, 6)
  - [x] 5.1 Create Zod schema in `frontend/src/components/features/properties/property-schema.ts`:
    - `propertySchema`: name (required, min 1, max 255), type (optional, max 255), address.street (required), address.postalCode (required, regex `^\d{5}$` for French postal codes), address.city (required), address.country (optional, default "France"), address.complement (optional)
    - NEVER use `.default()` or `.refine()` with zodResolver — use `defaultValues` in react-hook-form instead
  - [x] 5.2 Create `frontend/src/components/features/properties/property-form.tsx`:
    - React Hook Form + zodResolver
    - Fields: name (Input), type (Input, optional), street (Input), postalCode (Input), city (Input), country (Input, defaultValue "France"), complement (Input, optional)
    - Submit generates UUID via `crypto.randomUUID()`, calls `createProperty` or `updateProperty` mutation
    - Loading state on submit button
    - On success: `router.back()` — ALWAYS use history-based back (never hardcode parent link)
    - Prop: `initialData?: PropertyData` for edit mode

- [x] **Task 6: Create Property pages (list + new + detail/edit)** (AC: 1, 2, 4)
  - [x] 6.1 Create `frontend/src/app/(auth)/properties/page.tsx` — property list page:
    - Uses `useProperties(entityId)` from `useCurrentEntity()`
    - Empty state: "Aucun bien immobilier. Ajoutez votre premier bien." with CTA button
    - List: Card per property showing name, address, type badge
    - "Nouveau bien" primary button
    - Loading: Skeleton cards
  - [x] 6.2 Create `frontend/src/app/(auth)/properties/new/page.tsx` — create property page:
    - Page title "Nouveau bien immobilier"
    - Back button with `router.back()`
    - Renders `PropertyForm` with no initialData
    - On submit: calls `useCreateProperty(entityId).mutateAsync(payload)`
  - [x] 6.3 Create `frontend/src/app/(auth)/properties/[id]/page.tsx` — property detail/edit page:
    - Uses `useProperty(id)` to load data
    - Displays property info with "Modifier" button
    - Edit mode: renders `PropertyForm` with `initialData`
    - On submit: calls `useUpdateProperty(id, entityId).mutateAsync(payload)`
    - Back button with `router.back()`

- [x] **Task 7: Update ActionFeed for property onboarding** (AC: 5)
  - [x] 7.1 Modify `frontend/src/components/features/dashboard/action-feed.tsx`:
    - Add property count check: use `useProperties(entityId)` to check if current entity has properties
    - If entity exists but no properties → show "Ajoutez un bien immobilier" action with `href="/properties/new"` (already exists as placeholder — wire it to actual data check)
    - If entity has properties but no units → show "Créez les lots de ce bien" (placeholder for story 2.5)
  - [x] 7.2 Update `frontend/src/components/layout/sidebar.tsx` — verify "Biens" nav item links to `/properties` (already exists in nav config)

- [x] **Task 8: Testing and validation** (AC: 1-6)
  - [x] 8.1 Run `npm run lint` in frontend — zero errors
  - [x] 8.2 Run `npx tsc --noEmit` in frontend — zero TypeScript errors
  - [x] 8.3 Run `npm run lint` in backend — zero errors
  - [x] 8.4 Run `npx tsc --noEmit` in backend — zero TypeScript errors
  - [x] 8.5 Run `npm test` in backend — all existing tests pass (109+) AND new property tests pass
  - [x] 8.6 Manual verification: create property flow end-to-end (form → command → event → projection → query → UI list)

## Dev Notes

### CRITICAL: Property is a NEW Aggregate, NOT a Child Entity

Unlike bank accounts (Story 2.2) which are child entities stored inside the EntityAggregate, **properties are a separate aggregate** with their own event stream (`property-{id}`). This is because:
- Properties will have their own child entities (Units in Story 2.5)
- Properties need independent lifecycle management
- Properties have a complex enough structure to warrant their own aggregate

**Pattern:** Follows the **EntityAggregate** pattern (separate aggregate), NOT the bank account pattern (child entity in Map).

### Architecture Compliance

**CQRS/ES Pattern (MANDATORY):**
- **Domain** (`portfolio/property/`): aggregate + commands + events + VOs + exceptions. Zero infrastructure deps
- **Presentation** (`presentation/property/`): controllers + DTOs + queries + projections + finders. Reads from PostgreSQL
- **Separation**: Domain only writes events to KurrentDB. Presentation only reads from PostgreSQL via Prisma
- **Commands return 202 Accepted** — no body. Frontend already has the UUID
- **Frontend generates UUIDs** via `crypto.randomUUID()` — included in command payload

**Value Object Rules:**
- Private constructor + static factory methods (`.fromString()`, `.fromPrimitives()`, `.create()`, `.empty()`)
- Named domain exceptions with private constructor + static factories
- VOs flat in module root — NO `value-objects/` subdirectory
- Optional fields use Null Object pattern (`.empty()` + `.isEmpty` getter)

**Controller Rules:**
- One controller per action (SRP) — NEVER multiple routes in one controller
- All controllers use `@CurrentUser()` decorator — throw `UnauthorizedException` if missing
- Sub-resource creation: `POST /api/entities/:entityId/properties` → `CreateAPropertyCommand`
- Direct resource access: `GET/PUT /api/properties/:id` → `GetAPropertyQuery` / `UpdateAPropertyCommand`
- `ParseUUIDPipe` on all UUID params

**URL Pattern:**
- Create: `POST /api/entities/:entityId/properties` (sub-resource of entity)
- List: `GET /api/entities/:entityId/properties` (scoped to entity)
- Get: `GET /api/properties/:id` (direct access)
- Update: `PUT /api/properties/:id` (direct access)

### Frontend Patterns

**Optimistic Updates (MANDATORY for all mutations):**
```typescript
onMutate: async (payload) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  // Append optimistic entry to cache
  queryClient.setQueryData(queryKey, (old) => [...(old ?? []), optimistic]);
  return { previous };
},
onError: (_err, _payload, context) => {
  if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
},
onSettled: () => {
  setTimeout(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, 1500);
},
```

**Anti-Patterns (FORBIDDEN):**
- NEVER call `invalidateQueries` immediately in onSettled — use 1500ms delay
- NEVER skip optimistic updates — CQRS/ES projection delay requires them
- NEVER use `.default()` or `.refine()` on Zod schema with zodResolver — use `defaultValues` instead
- NEVER hardcode parent link in back button — use `router.back()` (user may arrive from dashboard, entity detail, or deep link)
- NEVER add `.js` extensions in frontend imports — frontend uses default module resolution
- NEVER use `setState` in `useEffect` — use "sync state during render" pattern
- NEVER use `as` cast alone for string enums in aggregate — always validate with guard clause

**React Query Key Convention:**
- Properties list: `["entities", entityId, "properties"]`
- Property detail: `["properties", propertyId]`

### Previous Story Intelligence

**From Story 2.3 (Entity Switcher):**
- `useCurrentEntity()` hook at `frontend/src/hooks/use-current-entity.ts` returns `{ entityId, entity, entities, setEntityId, isLoading }`
- EntityContext wraps the auth layout — all child components can access `entityId`
- Properties pages MUST use `entityId` from `useCurrentEntity()` for all queries
- Entity-scoped pages redirect to `/dashboard` on entity switch (Slack/Linear/Notion pattern)
- Mobile Sheet close pattern: navigation in sidebar must accept `onNavigate?: () => void`

**From Story 2.2 (Bank Accounts — sub-resource pattern):**
- Sub-resource URL: `/api/entities/:entityId/bank-accounts` → follow same for `/api/entities/:entityId/properties`
- `fetchWithAuth` at `frontend/src/lib/api/fetch-with-auth.ts` — ALL API modules import from there
- Projection resilience: existence check before update, warn+return if missing
- Exponential backoff reconnect for subscription errors
- AlertDialog for delete confirmations (not needed for 2.4 — no delete operation)

**From Story 2.1 (Entity — aggregate pattern):**
- Aggregate loads via `@InjectAggregateRepository` + `repository.load(id)` / `repository.save(aggregate)`
- New aggregate creation: instantiate with `new PropertyAggregate(id)` — check nestjs-cqrx API for correct pattern
- VOs constructed from primitives in command handler, passed to aggregate method
- Finder pattern: thin Prisma wrapper with specific query methods

### Testing Patterns

**Backend unit tests (Jest — already configured):**
- Handler tests: mock `AggregateRepository`, verify `load()` and `save()` calls
- Aggregate tests: create aggregate, call methods, verify emitted events via `getUncommittedEvents()`
- Projection tests: mock Prisma client, verify `upsert()` / `update()` calls
- Follow patterns in `backend/src/portfolio/entity/__tests__/`

**Frontend: NO test framework installed yet** — vitest + @testing-library setup is a tracked deferred item. Do NOT attempt to write frontend tests.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Aggregate | PascalCase | `PropertyAggregate` |
| Command | VerbANoun | `CreateAPropertyCommand` |
| Handler | VerbANounHandler | `CreateAPropertyHandler` |
| Event | PastTense | `PropertyCreated` |
| Controller | VerbANounController | `CreateAPropertyController` |
| VO | PascalCase (no suffix) | `PropertyName`, `PropertyAddress` |
| Exception | PascalCase + Exception | `InvalidPropertyNameException` |
| File | kebab-case | `create-a-property.command.ts`, `property-name.ts` |
| Prisma table | snake_case plural | `properties` |
| Prisma columns | snake_case with @map | `entity_id`, `address_street` |

### Project Structure Notes

```
backend/src/
├── portfolio/
│   ├── entity/                     # EXISTING (Story 2.1, 2.2)
│   ├── property/                   # NEW (Story 2.4)
│   │   ├── property.aggregate.ts
│   │   ├── property.module.ts
│   │   ├── property-name.ts        # VO — flat in module
│   │   ├── property-type.ts        # VO — flat in module (Null Object)
│   │   ├── property-address.ts     # VO — flat in module (composite)
│   │   ├── commands/
│   │   │   ├── create-a-property.command.ts
│   │   │   ├── create-a-property.handler.ts
│   │   │   ├── update-a-property.command.ts
│   │   │   └── update-a-property.handler.ts
│   │   ├── events/
│   │   │   ├── property-created.event.ts
│   │   │   └── property-updated.event.ts
│   │   ├── exceptions/
│   │   │   ├── invalid-property-name.exception.ts
│   │   │   ├── invalid-property-type.exception.ts
│   │   │   ├── invalid-property-address.exception.ts
│   │   │   └── unauthorized-property-access.exception.ts
│   │   └── __tests__/
│   │       ├── property.aggregate.spec.ts
│   │       ├── create-a-property.handler.spec.ts
│   │       └── update-a-property.handler.spec.ts
│   └── portfolio.module.ts          # MODIFY: add PropertyDomainModule

├── presentation/
│   ├── entity/                      # EXISTING
│   └── property/                    # NEW (Story 2.4)
│       ├── controllers/
│       │   ├── create-a-property.controller.ts
│       │   ├── update-a-property.controller.ts
│       │   ├── get-properties.controller.ts
│       │   └── get-a-property.controller.ts
│       ├── dto/
│       │   ├── create-a-property.dto.ts
│       │   └── update-a-property.dto.ts
│       ├── queries/
│       │   ├── get-properties.query.ts
│       │   ├── get-properties.handler.ts
│       │   ├── get-a-property.query.ts
│       │   └── get-a-property.handler.ts
│       ├── projections/
│       │   └── property.projection.ts
│       ├── finders/
│       │   └── property.finder.ts
│       ├── property-presentation.module.ts
│       └── __tests__/
│           ├── create-a-property.controller.spec.ts
│           ├── update-a-property.controller.spec.ts
│           ├── get-properties.controller.spec.ts
│           └── property.projection.spec.ts

frontend/src/
├── lib/api/
│   └── properties-api.ts            # NEW
├── hooks/
│   └── use-properties.ts            # NEW
├── components/features/
│   └── properties/
│       ├── property-form.tsx         # NEW
│       └── property-schema.ts       # NEW (Zod schema)
├── app/(auth)/
│   └── properties/
│       ├── page.tsx                  # NEW (list)
│       ├── new/
│       │   └── page.tsx             # NEW (create)
│       └── [id]/
│           └── page.tsx             # NEW (detail/edit)
```

### What NOT to Build

- **No delete operation** — property deletion is not in the AC for Story 2.4
- **No units within properties** — that's Story 2.5
- **No property-scoped dashboard** — UnitMosaic integration is Story 2.6
- **No search/filtering** — simple list is sufficient for initial implementation
- **No pagination** — portfolio size (<50 properties) doesn't require it
- **No image upload** — property images are not in scope
- **No map integration** — address is text-only for now

### Technology Versions (Already Installed)

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.1.6 | App Router, `"use client"` for interactive pages |
| React | 19 | Hooks, Context, createContext |
| NestJS | 11 | CQRS, class-validator |
| @nestjs/cqrs | 11 | CommandBus, QueryBus |
| nestjs-cqrx | 5 | KurrentDB integration, AggregateRepository |
| Prisma | 7 | Read models, migrations |
| @tanstack/react-query | installed | useQuery, useMutation |
| react-hook-form | installed | Form state management |
| zod | installed | Schema validation |
| @hookform/resolvers | installed | zodResolver |
| shadcn/ui | initialized | Card, Button, Input, Badge, Skeleton, etc. |
| lucide-react | installed | Building2, Plus, ArrowLeft icons |
| Tailwind CSS | 4 | CSS variable tokens |

### TypeScript Module Resolution

- **Backend**: `moduleResolution: "nodenext"` — `.js` extensions required on imports
- **Frontend**: default resolution — NO `.js` extensions on imports
- **Path alias**: Frontend uses `@/` → `./src/`, Backend uses relative paths

### References

- [Source: epics.md#Story 2.4] — "create properties (buildings/addresses) under my ownership entity"
- [Source: epics.md#FR5] — "Bailleur can create properties under an ownership entity with address and details"
- [Source: architecture.md#Bounded Contexts] — Portfolio BC: `portfolio/property/` for domain, `presentation/property/` for gateway
- [Source: architecture.md#Structure Patterns] — Complete directory structure for property aggregate + presentation
- [Source: architecture.md#Naming Patterns] — VerbANoun commands, PastTense events, kebab-case files
- [Source: architecture.md#Value Objects] — Private constructor, static factory, Null Object pattern
- [Source: architecture.md#Controller-per-Action] — One controller = one route = one handle() method
- [Source: architecture.md#Frontend Architecture] — TanStack Query optimistic updates pattern
- [Source: ux-design-specification.md#Journey 1] — Onboarding: "Ajoutez votre premier bien immobilier" after entity creation
- [Source: ux-design-specification.md#Form Patterns] — Zod validation, progressive disclosure, save/cancel at bottom-right
- [Source: ux-design-specification.md#Navigation Patterns] — Back button uses router.back(), breadcrumb for hierarchy
- [Source: 2-3-implement-entity-switcher-component.md] — EntityContext, useCurrentEntity(), entity switch redirect pattern
- [Source: 2-2-associate-bank-accounts-to-an-entity.md] — Sub-resource pattern, fetchWithAuth, projection resilience, optimistic updates

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- TypeScript compilation errors fixed: `entityId` is `string | null` from `useCurrentEntity()` — resolved with `?? ""` fallback (hooks already have `enabled: !!entityId` guard)
- Prisma client regeneration required after schema migration (`npx prisma generate`)
- Jest `--testPathPattern` replaced by `--testPathPatterns` in current version

### Completion Notes List

- 8 tasks completed, all 6 ACs satisfied
- 48 new backend tests (22 aggregate + 3 create handler + 5 update handler + 6 projection + 3 create controller + 6 update controller + 5 get controller = 50 total... 160 total pass)
- Property is a separate aggregate (`property-{id}` stream), NOT a child entity
- Dual URL pattern: sub-resource for create/list, direct for get/update
- ActionFeed wired to real property data — hides "Ajoutez un bien" when properties exist
- No frontend tests (vitest not installed — tracked deferred item)

### Change Log

- **Task 1**: Created Property aggregate in Portfolio BC — 4 exceptions, 3 VOs, 2 events, 2 commands + handlers, aggregate, module. 30 unit tests passing
- **Task 2**: Added Property model to Prisma schema, ran migration, created PropertyProjection with KurrentDB subscription
- **Task 3**: Created presentation layer — 4 controllers (SRP), 2 DTOs, 2 queries + handlers, finder, module. 11 presentation tests passing
- **Task 4**: Created properties API client (`fetchWithAuth`) and 4 React Query hooks with full optimistic update pattern
- **Task 5**: Created Zod schema and PropertyForm with react-hook-form, AddressAutocomplete, create/edit modes
- **Task 6**: Created 3 property pages (list, new, detail/edit) with loading/error/empty states
- **Task 7**: Wired ActionFeed to real property data — conditionally shows onboarding action
- **Task 8**: All validations pass — frontend lint 0 errors, frontend tsc 0 errors, backend lint 0 errors, backend tsc 0 errors, 149 backend tests passing

### Code Review Fixes (2026-02-11)

**Review agent**: Claude Opus 4.6 (adversarial code review workflow)
**Findings**: 2 Critical, 7 High, 6 Medium, 5 Low — all fixed except M3 (excluded by user: address fields stay readOnly)

**Critical:**
- C1: Replaced `new Error()` with named domain exceptions (`PropertyAlreadyExistsException`, `PropertyNotFoundException`) in aggregate
- C2: Added entity ownership verification in `CreateAPropertyController` — injected `EntityFinder`, checks `findByIdAndUserId` before dispatching command; exported `EntityFinder` from `EntityPresentationModule`, imported in `PropertyPresentationModule`

**High:**
- H1: Added no-op guard in `PropertyAggregate.update()` — prevents empty events when no fields change
- H2: Fixed `PropertyAddress.isEmpty` to check all 4 fields (street, postalCode, city, country)
- H4: Added `@ValidateIf((_o, value) => value !== null)` on `UpdateAPropertyDto.type` — enables clearing type via API
- H5: Added `staleTime: 30_000` to `useProperty` hook (CQRS/ES eventual consistency pattern)
- H6: Added `entityId` null guard in `PropertyForm.onSubmit`
- H7: Added `@MaxLength` decorators on `PropertyAddressDto` fields (street 500, city 255, country 100, complement 500) + max-length validation in `PropertyAddress` VO

**Medium:**
- M2: `PropertyType.fromString()` now routes whitespace-only strings through `.empty()`
- M4: Added `onCancel` prop to `PropertyForm` — edit mode page passes `setIsEditing(false)`
- M5: Added "Aucune entité sélectionnée" distinct state to properties list page
- M6: Bank account onboarding action now conditional on `entityId` existence in `ActionFeed`

**Low:**
- L1: Combined double handler execution into single try/catch in `update-a-property.handler.spec.ts`
- L3: Removed redundant `@Length(5, 5)` from `PropertyAddressDto.postalCode` (regex already validates)
- L4: Added `{ shouldValidate: true }` to all `handleAddressReset` calls
- L5: Added `aria-hidden="true"` to `ArrowLeft` icons in `new/page.tsx` and `[id]/page.tsx`

**Test updates:**
- Fixed assertion messages: "modify this property" → "access this property" (exception message alignment)
- Added entity ownership test in `create-a-property.controller.spec.ts`
- 151 tests passing (2 new tests added)

### Code Review Pass 2 (2026-02-11)

**Review agent**: Claude Opus 4.6 (adversarial code review workflow)
**Findings**: 3 High, 3 Medium — all fixed

**High:**
- H1: Added defense-in-depth ownership check in `UpdateAPropertyController` — injected `PropertyFinder`, checks `findByIdAndUser(id, userId)` before dispatching command
- H2: Added `entityId` guard in `ActionFeed` property onboarding action — now only shows "Ajoutez un bien" when entity IS selected (AC 5 compliance)
- H3: Enriched `get-properties.controller.spec.ts` from 2→5 tests (userId propagation, entityId variation), created `update-a-property.controller.spec.ts` with 6 tests (ownership check, UnauthorizedException, full command mapping, defaults, void response)

**Medium:**
- M1: Added 2 missing files to story File List: `entity.aggregate.ts` (Story 2.2 cleanup), `add-a-bank-account.dto.ts` (formatting)
- M2: `PropertyForm.onSubmit` now sets `submitError` with user-facing message instead of silent return when `entityId` is null
- M3: Replaced plain "Chargement..." text with Skeleton card layouts in `properties/page.tsx` (3 skeleton cards) and `[id]/page.tsx` (structured skeleton matching detail layout)

**Test updates:**
- New file: `update-a-property.controller.spec.ts` (6 tests)
- Enhanced: `get-properties.controller.spec.ts` (2→5 tests)
- 160 tests passing (+9 new tests)

### File List

**New Files (Backend Domain — 17 files):**
- `backend/src/portfolio/property/exceptions/invalid-property-name.exception.ts`
- `backend/src/portfolio/property/exceptions/invalid-property-type.exception.ts`
- `backend/src/portfolio/property/exceptions/invalid-property-address.exception.ts`
- `backend/src/portfolio/property/exceptions/unauthorized-property-access.exception.ts`
- `backend/src/portfolio/property/exceptions/property-already-exists.exception.ts`
- `backend/src/portfolio/property/exceptions/property-not-found.exception.ts`
- `backend/src/portfolio/property/property-name.ts`
- `backend/src/portfolio/property/property-type.ts`
- `backend/src/portfolio/property/property-address.ts`
- `backend/src/portfolio/property/events/property-created.event.ts`
- `backend/src/portfolio/property/events/property-updated.event.ts`
- `backend/src/portfolio/property/commands/create-a-property.command.ts`
- `backend/src/portfolio/property/commands/create-a-property.handler.ts`
- `backend/src/portfolio/property/commands/update-a-property.command.ts`
- `backend/src/portfolio/property/commands/update-a-property.handler.ts`
- `backend/src/portfolio/property/property.aggregate.ts`
- `backend/src/portfolio/property/property.module.ts`
- `backend/src/portfolio/property/__tests__/mock-cqrx.ts`
- `backend/src/portfolio/property/__tests__/property.aggregate.spec.ts`
- `backend/src/portfolio/property/__tests__/create-a-property.handler.spec.ts`
- `backend/src/portfolio/property/__tests__/update-a-property.handler.spec.ts`

**New Files (Backend Presentation — 17 files):**
- `backend/src/presentation/property/dto/property-address.dto.ts`
- `backend/src/presentation/property/dto/create-a-property.dto.ts`
- `backend/src/presentation/property/dto/update-a-property.dto.ts`
- `backend/src/presentation/property/controllers/create-a-property.controller.ts`
- `backend/src/presentation/property/controllers/update-a-property.controller.ts`
- `backend/src/presentation/property/controllers/get-properties.controller.ts`
- `backend/src/presentation/property/controllers/get-a-property.controller.ts`
- `backend/src/presentation/property/queries/get-properties.query.ts`
- `backend/src/presentation/property/queries/get-properties.handler.ts`
- `backend/src/presentation/property/queries/get-a-property.query.ts`
- `backend/src/presentation/property/queries/get-a-property.handler.ts`
- `backend/src/presentation/property/projections/property.projection.ts`
- `backend/src/presentation/property/finders/property.finder.ts`
- `backend/src/presentation/property/property-presentation.module.ts`
- `backend/src/presentation/property/__tests__/create-a-property.controller.spec.ts`
- `backend/src/presentation/property/__tests__/get-properties.controller.spec.ts`
- `backend/src/presentation/property/__tests__/property.projection.spec.ts`

**New Files (Backend Migration — 1 file):**
- `backend/prisma/migrations/20260211002809_add_property_model/migration.sql`

**New Files (Frontend — 7 files):**
- `frontend/src/lib/api/properties-api.ts`
- `frontend/src/hooks/use-properties.ts`
- `frontend/src/components/features/properties/property-schema.ts`
- `frontend/src/components/features/properties/property-form.tsx`
- `frontend/src/app/(auth)/properties/page.tsx`
- `frontend/src/app/(auth)/properties/new/page.tsx`
- `frontend/src/app/(auth)/properties/[id]/page.tsx`

**Modified Files (8 files):**
- `backend/src/portfolio/portfolio.module.ts` — Added PropertyDomainModule import/export
- `backend/src/app.module.ts` — Added PropertyPresentationModule import
- `backend/prisma/schema.prisma` — Added Property model + relation on OwnershipEntity
- `frontend/src/components/features/dashboard/action-feed.tsx` — Wired property onboarding to real data, conditional bank account action
- `backend/src/presentation/entity/entity-presentation.module.ts` — Exported EntityFinder for cross-module use (C2 fix)
- `backend/src/presentation/property/property-presentation.module.ts` — Imported EntityPresentationModule (C2 fix)
- `backend/src/portfolio/entity/entity.aggregate.ts` — Removed `as` type cast on bank account type (Story 2.2 cleanup)
- `backend/src/presentation/entity/dto/add-a-bank-account.dto.ts` — Import formatting (Story 2.2 cleanup)
