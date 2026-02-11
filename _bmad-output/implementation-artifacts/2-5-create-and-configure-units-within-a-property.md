# Story 2.5: Create and Configure Units Within a Property

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to create units (apartments, parking, commercial spaces) within a property and configure their options,
so that I can track each rentable space individually (FR6, FR7).

## Acceptance Criteria

1. **Given** I have a property, **When** I navigate to the property detail page, **Then** I see a list of all units belonging to this property with their identifier, type, floor, and surface area
2. **Given** I have a property, **When** I create a unit, **Then** I can enter: unit identifier (e.g., "Apt 3B"), type (apartment/parking/commercial/storage), floor, surface area, **And** I can configure unit-level billable options: boiler maintenance, parking fee, custom options with label and amount (in cents)
3. **Given** I submit a valid unit creation form, **When** the command is processed, **Then** the event `UnitCreated` is stored in KurrentDB with propertyId in metadata, **And** the command returns 202 Accepted, **And** the unit appears in the unit list optimistically
4. **Given** I have created a unit, **When** I view the unit detail, **Then** I can edit unit details (identifier, type, floor, surface area, billable options) via an `UpdateAUnit` command
5. **Given** I am on the property detail page, **When** no units exist for this property, **Then** I see an empty state "Aucun lot. Ajoutez votre premier lot." with a CTA button
6. **Given** I am on the dashboard, **When** a property exists but has no units, **Then** the ActionFeed shows "Créez les lots de ce bien" with a link to the property's unit creation page
7. **Given** I create or edit a unit, **When** validation fails (empty identifier, missing type, negative surface area, negative option amount), **Then** I see inline validation errors via Zod schema

## Tasks / Subtasks

- [x] **Task 1: Create Unit aggregate in Portfolio bounded context** (AC: 2, 3, 4)
  - [x]1.1 Create `backend/src/portfolio/property/unit/` directory structure: aggregate, commands/, events/, exceptions/, `__tests__/`
  - [x]1.2 Create Value Objects (flat in unit module — NO `value-objects/` subdirectory):
    - `unit-identifier.ts` — required, trimmed, max 100 chars. Private constructor + `static fromString(value: string)`. Throws `InvalidUnitIdentifierException`
    - `unit-type.ts` — required enum-like string: "apartment", "parking", "commercial", "storage". Private constructor + `static fromString(value: string)`. Throws `InvalidUnitTypeException`. MUST validate against allowed values with guard clause (never use `as` cast)
    - `floor.ts` — optional integer (nullable). Private constructor + `static fromNumber(value: number)` + `static empty()` (Null Object). `.isEmpty` getter. Throws `InvalidFloorException` for non-integer values
    - `surface-area.ts` — required, positive number (m²), max 2 decimals. Private constructor + `static fromNumber(value: number)`. Throws `InvalidSurfaceAreaException` for zero/negative/NaN
    - `billable-option.ts` — composite VO with `label: string` (required, max 100 chars) and `amountCents: number` (required, non-negative integer). Private constructor + `static fromPrimitives({ label, amountCents })` + `static empty()`. `.toPrimitives()` method. Throws `InvalidBillableOptionException`
  - [x]1.3 Create `unit.aggregate.ts`:
    - Extends `AggregateRoot` (from nestjs-cqrx)
    - State fields: `identifier: UnitIdentifier`, `propertyId: string`, `userId: string`, `type: UnitType`, `floor: Floor`, `surfaceArea: SurfaceArea`, `billableOptions: Map<string, BillableOptionState>`
    - Stream name: `unit-{id}`
    - Method `create(userId, propertyId, identifier, type, floor, surfaceArea, billableOptions)` — validates all VOs, emits `UnitCreated`
    - Method `update(userId, identifier?, type?, floor?, surfaceArea?, billableOptions?)` — validates userId authorization, emits `UnitUpdated` with only changed fields
    - No-op guard in update: check `Object.keys(eventData).length > 1` before emitting
    - `@EventHandler(UnitCreated)` and `@EventHandler(UnitUpdated)` to rebuild state
  - [x]1.4 Create commands:
    - `create-a-unit.command.ts` — `CreateAUnitCommand(unitId, userId, propertyId, identifier, type, floor, surfaceArea, billableOptions)`
    - `create-a-unit.handler.ts` — create new aggregate, call `aggregate.create(...)`, save
    - `update-a-unit.command.ts` — `UpdateAUnitCommand(unitId, userId, identifier?, type?, floor?, surfaceArea?, billableOptions?)`
    - `update-a-unit.handler.ts` — load aggregate, call `aggregate.update(...)`, save
  - [x]1.5 Create events:
    - `unit-created.event.ts` — `UnitCreated` with `UnitCreatedData { id, propertyId, userId, identifier, type, floor: number | null, surfaceArea: number, billableOptions: Array<{ label: string, amountCents: number }> }`
    - `unit-updated.event.ts` — `UnitUpdated` with `UnitUpdatedData { id, identifier?, type?, floor?: number | null, surfaceArea?, billableOptions?: Array<{ label: string, amountCents: number }> }`
  - [x]1.6 Create exceptions:
    - `invalid-unit-identifier.exception.ts` — `.required()`, `.tooLong()`
    - `invalid-unit-type.exception.ts` — `.invalidType(value: string)` (lists allowed types)
    - `invalid-floor.exception.ts` — `.notAnInteger()`
    - `invalid-surface-area.exception.ts` — `.required()`, `.mustBePositive()`
    - `invalid-billable-option.exception.ts` — `.labelRequired()`, `.labelTooLong()`, `.amountMustBeNonNegative()`
    - `unit-already-exists.exception.ts` — `.create()`
    - `unit-not-found.exception.ts` — `.create()`
    - `unauthorized-unit-access.exception.ts` — `.create()`
  - [x]1.7 Create `unit.module.ts` — register with `CqrxModule.forFeature([UnitAggregate])`, provide handlers
  - [x]1.8 Register `UnitDomainModule` in `property.module.ts` imports/exports (or `portfolio.module.ts`)
  - [x]1.9 Write unit tests:
    - `unit.aggregate.spec.ts` — test create, update, userId validation, VO validation, event emission, no-op guard, billable options handling
    - `create-a-unit.handler.spec.ts` — test handler orchestration
    - `update-a-unit.handler.spec.ts` — test handler orchestration

- [x] **Task 2: Create Unit read model (Prisma + Projection)** (AC: 1, 3)
  - [x]2.1 Add `Unit` model to `backend/prisma/schema.prisma`:
    ```prisma
    model Unit {
      id              String   @id @default(uuid())
      propertyId      String   @map("property_id")
      userId          String   @map("user_id")
      identifier      String
      type            String
      floor           Int?
      surfaceArea     Float    @map("surface_area")
      billableOptions Json     @default("[]") @map("billable_options")
      createdAt       DateTime @default(now()) @map("created_at")
      updatedAt       DateTime @updatedAt @map("updated_at")

      property Property @relation(fields: [propertyId], references: [id])

      @@map("units")
      @@unique([propertyId, identifier])
      @@index([propertyId])
      @@index([userId])
    }
    ```
  - [x]2.2 Add `units Unit[]` relation to `Property` model
  - [x]2.3 Run `npx prisma migrate dev --name add-unit-model`
  - [x]2.4 Create `backend/src/presentation/property/projections/unit.projection.ts`:
    - Subscribe to KurrentDB with filter `streamNameFilter({ prefixes: ['unit-'] })`
    - Handle `UnitCreated` → `prisma.unit.upsert(...)` (idempotent)
    - Handle `UnitUpdated` → check existence first (warn + return if missing), selective update of defined fields only
    - Exponential backoff reconnect (max 30s) — follow property.projection.ts pattern exactly

- [x] **Task 3: Create Unit presentation layer (controllers, DTOs, queries, finders)** (AC: 1, 2, 3, 4)
  - [x]3.1 Create directory structure under `backend/src/presentation/property/`: unit controllers, dto, queries, finders will live alongside property presentation (same module)
  - [x]3.2 Create DTOs:
    - `create-a-unit.dto.ts` — `id: @IsUUID()`, `identifier: @IsString() @Length(1, 100)`, `type: @IsString() @IsIn(['apartment', 'parking', 'commercial', 'storage'])`, `floor?: @IsOptional() @IsInt()`, `surfaceArea: @IsNumber() @Min(0.01)`, `billableOptions?: @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => BillableOptionDto)` with nested DTO (`label: @IsString() @Length(1, 100)`, `amountCents: @IsInt() @Min(0)`)
    - `update-a-unit.dto.ts` — all fields optional: `identifier?, type?, floor?, surfaceArea?, billableOptions?`
  - [x]3.3 Create controllers (one per action — SRP):
    - `create-a-unit.controller.ts` — `@Controller('properties/:propertyId/units')` `@Post()` `@HttpCode(ACCEPTED)`. Extract propertyId from `@Param('propertyId', ParseUUIDPipe)`, userId from `@CurrentUser()`. **Cross-aggregate authorization**: inject PropertyFinder, check `findByIdAndUser(propertyId, userId)` before dispatching. Dispatch `CreateAUnitCommand`
    - `update-a-unit.controller.ts` — `@Controller('units')` `@Put(':id')` `@HttpCode(ACCEPTED)`. Inject UnitFinder, check `findByIdAndUser(id, userId)` before dispatching. Dispatch `UpdateAUnitCommand`
    - `get-units.controller.ts` — `@Controller('properties/:propertyId/units')` `@Get()`. Dispatch `GetUnitsQuery(propertyId, userId)`
    - `get-a-unit.controller.ts` — `@Controller('units')` `@Get(':id')`. Dispatch `GetAUnitQuery(unitId, userId)`
  - [x]3.4 Create queries + handlers:
    - `get-units.query.ts` + `get-units.handler.ts` — returns `Unit[]` filtered by propertyId + userId
    - `get-a-unit.query.ts` + `get-a-unit.handler.ts` — returns single `Unit` by id, validates userId ownership
  - [x]3.5 Create `unit.finder.ts` — Prisma queries: `findAllByPropertyAndUser(propertyId, userId)`, `findByIdAndUser(id, userId)`
  - [x]3.6 Register all unit controllers, handlers, projection, finder in existing `property-presentation.module.ts` (extend, do NOT create a separate module)
  - [x]3.7 Write presentation tests:
    - `create-a-unit.controller.spec.ts` — include ownership check test
    - `get-units.controller.spec.ts`
    - `update-a-unit.controller.spec.ts` — include ownership check test
    - `unit.projection.spec.ts`

- [x] **Task 4: Create Units API client and React Query hooks** (AC: 1, 2, 3, 4)
  - [x]4.1 Create `frontend/src/lib/api/units-api.ts`:
    - `UnitData` interface: `{ id, propertyId, userId, identifier, type, floor, surfaceArea, billableOptions: Array<{ label: string, amountCents: number }>, createdAt, updatedAt }`
    - `CreateUnitPayload`: `{ id, identifier, type, floor?, surfaceArea, billableOptions?: Array<{ label: string, amountCents: number }> }`
    - `UpdateUnitPayload`: `{ identifier?, type?, floor?, surfaceArea?, billableOptions?: Array<{ label: string, amountCents: number }> }`
    - `useUnitsApi()` hook returning `{ getUnits(propertyId), getUnit(id), createUnit(propertyId, payload), updateUnit(id, payload) }`
    - All methods use `fetchWithAuth` from `lib/api/fetch-with-auth.ts`
  - [x]4.2 Create `frontend/src/hooks/use-units.ts`:
    - `useUnits(propertyId)` — queryKey: `["properties", propertyId, "units"]`, enabled: `!!propertyId`, staleTime: 30_000
    - `useUnit(unitId)` — queryKey: `["units", unitId]`, enabled: `!!unitId`, staleTime: 30_000
    - `useCreateUnit(propertyId)` — full optimistic update pattern: onMutate (cancel queries, snapshot, append optimistic), onError (rollback), onSettled (delayed invalidate 1500ms)
    - `useUpdateUnit(unitId, propertyId)` — optimistic update for BOTH list (`["properties", propertyId, "units"]`) and detail (`["units", unitId]`) caches

- [x] **Task 5: Create Unit form component with Zod validation** (AC: 2, 7)
  - [x]5.1 Create Zod schema in `frontend/src/components/features/units/unit-schema.ts`:
    - `unitSchema`: identifier (required, min 1, max 100), type (required, one of "apartment"|"parking"|"commercial"|"storage"), floor (optional, integer), surfaceArea (required, positive number), billableOptions (optional array of `{ label: string min 1 max 100, amountCents: number min 0 integer }`)
    - NEVER use `.default()` or `.refine()` with zodResolver — use `defaultValues` in react-hook-form instead
  - [x]5.2 Create `frontend/src/components/features/units/unit-form.tsx`:
    - React Hook Form + zodResolver
    - Fields: identifier (Input), type (Select with apartment/parking/commercial/storage), floor (Input type number, optional), surfaceArea (Input type number)
    - Billable Options section: dynamic field array with Add/Remove buttons. Each row: label (Input) + amountCents (Input type number, display as euros with /100 conversion in UI)
    - Submit generates UUID via `crypto.randomUUID()`, calls `createUnit` or `updateUnit` mutation
    - Loading state on submit button
    - On success: `router.back()` — ALWAYS use history-based back
    - Prop: `initialData?: UnitData` for edit mode
    - Prop: `onCancel?: () => void` with fallback to `router.back()`

- [x] **Task 6: Create Unit pages (list on property detail + new + detail/edit)** (AC: 1, 2, 4, 5)
  - [x]6.1 Modify `frontend/src/app/(auth)/properties/[id]/page.tsx` — add units list section to property detail:
    - Uses `useUnits(propertyId)` to list units under this property
    - Empty state: "Aucun lot. Ajoutez votre premier lot." with CTA button linking to `/properties/${id}/units/new`
    - List: Card per unit showing identifier, type badge, floor, surface area, billable option count
    - "Nouveau lot" primary button
    - Loading: Skeleton cards
  - [x]6.2 Create `frontend/src/app/(auth)/properties/[id]/units/new/page.tsx` — create unit page:
    - Page title "Nouveau lot"
    - Back button with `router.back()`
    - Renders `UnitForm` with no initialData
    - On submit: calls `useCreateUnit(propertyId).mutateAsync(payload)`
  - [x]6.3 Create `frontend/src/app/(auth)/properties/[id]/units/[unitId]/page.tsx` — unit detail/edit page:
    - Uses `useUnit(unitId)` to load data
    - Displays unit info with "Modifier" button
    - Edit mode: renders `UnitForm` with `initialData`
    - On submit: calls `useUpdateUnit(unitId, propertyId).mutateAsync(payload)`
    - Back button with `router.back()`
    - Prop `onCancel={() => setIsEditing(false)}` for edit mode cancel without navigation

- [x] **Task 7: Update ActionFeed for unit onboarding** (AC: 6)
  - [x]7.1 Modify `frontend/src/components/features/dashboard/action-feed.tsx`:
    - Import `useUnits` hook
    - For each property with entityId: check if property has units
    - If entity has properties but first property has no units → show "Créez les lots de ce bien" action with `href="/properties/${firstPropertyId}/units/new"` and icon `ClipboardList`
    - This replaces step 3 in the onboarding empty state progression
    - Keep existing entity and bank account and property actions unchanged
    - Action feed shows ONE next step only — most granular unfulfilled onboarding action

- [x] **Task 8: Testing and validation** (AC: 1-7)
  - [x]8.1 Run `npm run lint` in frontend — zero errors
  - [x]8.2 Run `npx tsc --noEmit` in frontend — zero TypeScript errors
  - [x]8.3 Run `npm run lint` in backend — zero errors
  - [x]8.4 Run `npx tsc --noEmit` in backend — zero TypeScript errors
  - [x]8.5 Run `npm test` in backend — all existing tests pass (160+) AND new unit tests pass
  - [x]8.6 Manual verification: create unit flow end-to-end (form → command → event → projection → query → UI list)

## Dev Notes

### CRITICAL: Unit is a SEPARATE Aggregate, NOT a Child Entity

Like properties (Story 2.4), **units are a separate aggregate** with their own event stream (`unit-{id}`). This is because:
- Units will be referenced by other bounded contexts (Tenancy → Lease stores `unitId: string`)
- The architecture context map shows `Portfolio ──(UnitCreated)──► Tenancy` — other BCs subscribe to unit events
- Units have billable options that are child data (stored inside the aggregate), but the unit itself is NOT a child of Property
- Units have enough lifecycle complexity (create, update, configure options, link to lease) to warrant their own aggregate

**Pattern:** Same as PropertyAggregate (Story 2.4) — separate aggregate with own stream. NOT the bank account pattern (child entity in Map).

**Billable Options ARE child data** inside the Unit aggregate — stored as `Map<string, BillableOptionState>` (similar to bank accounts in EntityAggregate from Story 2.2). The key difference: the unit itself is a separate aggregate, but its billable options are internal state.

### Architecture Compliance

**CQRS/ES Pattern (MANDATORY):**
- **Domain** (`portfolio/property/unit/`): aggregate + commands + events + VOs + exceptions. Zero infrastructure deps
- **Presentation** (`presentation/property/`): controllers + DTOs + queries + projections + finders. Reads from PostgreSQL
- **Separation**: Domain only writes events to KurrentDB. Presentation only reads from PostgreSQL via Prisma
- **Commands return 202 Accepted** — no body. Frontend already has the UUID
- **Frontend generates UUIDs** via `crypto.randomUUID()` — included in command payload

**Value Object Rules:**
- Private constructor + static factory methods (`.fromString()`, `.fromNumber()`, `.fromPrimitives()`, `.empty()`)
- Named domain exceptions with private constructor + static factories
- VOs flat in module root — NO `value-objects/` subdirectory
- Optional fields use Null Object pattern (`.empty()` + `.isEmpty` getter) — applies to `Floor`
- UnitType MUST validate against allowed values with guard clause — never use `as` cast alone

**Controller Rules:**
- One controller per action (SRP) — NEVER multiple routes in one controller
- All controllers use `@CurrentUser()` decorator — throw `UnauthorizedException` if missing
- Sub-resource creation: `POST /api/properties/:propertyId/units` → `CreateAUnitCommand`
- Direct resource access: `GET/PUT /api/units/:id` → `GetAUnitQuery` / `UpdateAUnitCommand`
- `ParseUUIDPipe` on all UUID params
- **Cross-aggregate authorization**: inject PropertyFinder, check `findByIdAndUser(propertyId, userId)` before dispatching create command (CQRS separation — NOT in command handler)

**URL Pattern:**
- Create: `POST /api/properties/:propertyId/units` (sub-resource of property)
- List: `GET /api/properties/:propertyId/units` (scoped to property)
- Get: `GET /api/units/:id` (direct access)
- Update: `PUT /api/units/:id` (direct access)

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
- NEVER hardcode parent link in back button — use `router.back()`
- NEVER add `.js` extensions in frontend imports — frontend uses default module resolution
- NEVER use `setState` in `useEffect` — use "sync state during render" pattern
- NEVER use `as` cast alone for string enums in aggregate — always validate with guard clause

**React Query Key Convention:**
- Units list: `["properties", propertyId, "units"]`
- Unit detail: `["units", unitId]`

**Billable Options UI Pattern:**
- Dynamic field array (react-hook-form `useFieldArray`)
- Each row: label (text input) + amount (number input displayed in euros — store as cents internally)
- "Ajouter une option" button to add row, trash icon to remove
- Default empty array, progressive disclosure (section can be collapsed/expanded)

### Unit Type Values

The following unit types are valid:
- `apartment` — Residential apartment (Appartement)
- `parking` — Parking space (Parking)
- `commercial` — Commercial space (Local commercial)
- `storage` — Storage unit (Cave/Garde-meuble)

These are validated in the `UnitType` VO as an exhaustive check. The frontend Select component should display French labels but send English values.

### Previous Story Intelligence

**From Story 2.4 (Properties — separate aggregate pattern):**
- PropertyAggregate pattern at `backend/src/portfolio/property/property.aggregate.ts` — follow exactly for UnitAggregate
- Dual URL pattern established: sub-resource for create/list, direct for get/update
- Cross-aggregate authorization: controller-level check via PropertyFinder/EntityFinder before dispatching command
- Named domain exceptions pattern: `PropertyAlreadyExistsException`, `PropertyNotFoundException`, `UnauthorizedPropertyAccessException`
- No-op guard: `Object.keys(eventData).length > 1` before emitting update event
- PropertyForm with `onCancel` prop — follow same pattern for UnitForm
- Property detail page at `frontend/src/app/(auth)/properties/[id]/page.tsx` — MODIFY this to add units list section

**From Story 2.3 (Entity Switcher):**
- `useCurrentEntity()` hook at `frontend/src/hooks/use-current-entity.ts` returns `{ entityId, entity, entities, setEntityId, isLoading }`
- EntityContext wraps the auth layout — all child components can access `entityId`
- `entityId` is `string | null` — always use `?? ""` when passing to hooks that expect `string`

**From Story 2.2 (Bank Accounts — child entity in aggregate pattern):**
- Bank accounts stored as `Map<string, BankAccountState>` in EntityAggregate — follow for billable options in UnitAggregate
- `fetchWithAuth` at `frontend/src/lib/api/fetch-with-auth.ts` — ALL API modules import from there
- Projection resilience: existence check before update, warn+return if missing
- Exponential backoff reconnect for subscription errors

**From Story 2.1 (Entity — aggregate pattern):**
- Aggregate loads via `@InjectAggregateRepository` + `repository.load(id)` / `repository.save(aggregate)`
- VOs constructed from primitives in command handler, passed to aggregate method
- Finder pattern: thin Prisma wrapper with specific query methods

### Testing Patterns

**Backend unit tests (Jest — already configured):**
- Handler tests: mock `AggregateRepository`, verify `load()` and `save()` calls
- Aggregate tests: create aggregate, call methods, verify emitted events via `getUncommittedEvents()`
- Projection tests: mock Prisma client, verify `upsert()` / `update()` calls
- Controller tests: mock CommandBus/QueryBus, verify dispatch calls with correct parameters
- Follow patterns in `backend/src/portfolio/property/__tests__/` and `backend/src/presentation/property/__tests__/`

**Frontend: NO test framework installed yet** — vitest + @testing-library setup is a tracked deferred item. Do NOT attempt to write frontend tests.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Aggregate | PascalCase | `UnitAggregate` |
| Command | VerbANoun | `CreateAUnitCommand` |
| Handler | VerbANounHandler | `CreateAUnitHandler` |
| Event | PastTense | `UnitCreated` |
| Controller | VerbANounController | `CreateAUnitController` |
| VO | PascalCase (no suffix) | `UnitIdentifier`, `UnitType`, `Floor`, `SurfaceArea`, `BillableOption` |
| Exception | PascalCase + Exception | `InvalidUnitIdentifierException` |
| File | kebab-case | `create-a-unit.command.ts`, `unit-identifier.ts` |
| Prisma table | snake_case plural | `units` |
| Prisma columns | snake_case with @map | `property_id`, `surface_area`, `billable_options` |

### Project Structure Notes

```
backend/src/
├── portfolio/
│   ├── entity/                     # EXISTING (Story 2.1, 2.2)
│   ├── property/                   # EXISTING (Story 2.4)
│   │   ├── property.aggregate.ts   # EXISTING
│   │   ├── property.module.ts      # MODIFY: add UnitDomainModule
│   │   ├── property-name.ts        # EXISTING
│   │   ├── property-type.ts        # EXISTING
│   │   ├── property-address.ts     # EXISTING
│   │   ├── commands/               # EXISTING
│   │   ├── events/                 # EXISTING
│   │   ├── exceptions/             # EXISTING
│   │   ├── __tests__/              # EXISTING
│   │   └── unit/                   # NEW (Story 2.5)
│   │       ├── unit.aggregate.ts
│   │       ├── unit.module.ts
│   │       ├── unit-identifier.ts     # VO
│   │       ├── unit-type.ts           # VO (validated enum-like)
│   │       ├── floor.ts              # VO (optional, Null Object)
│   │       ├── surface-area.ts       # VO
│   │       ├── billable-option.ts    # VO (composite: label + amountCents)
│   │       ├── commands/
│   │       │   ├── create-a-unit.command.ts
│   │       │   ├── create-a-unit.handler.ts
│   │       │   ├── update-a-unit.command.ts
│   │       │   └── update-a-unit.handler.ts
│   │       ├── events/
│   │       │   ├── unit-created.event.ts
│   │       │   └── unit-updated.event.ts
│   │       ├── exceptions/
│   │       │   ├── invalid-unit-identifier.exception.ts
│   │       │   ├── invalid-unit-type.exception.ts
│   │       │   ├── invalid-floor.exception.ts
│   │       │   ├── invalid-surface-area.exception.ts
│   │       │   ├── invalid-billable-option.exception.ts
│   │       │   ├── unit-already-exists.exception.ts
│   │       │   ├── unit-not-found.exception.ts
│   │       │   └── unauthorized-unit-access.exception.ts
│   │       └── __tests__/
│   │           ├── unit.aggregate.spec.ts
│   │           ├── create-a-unit.handler.spec.ts
│   │           └── update-a-unit.handler.spec.ts
│   └── portfolio.module.ts          # EXISTING (may need update)

├── presentation/
│   ├── entity/                      # EXISTING
│   └── property/                    # EXISTING (Story 2.4) — EXTEND with unit resources
│       ├── controllers/
│       │   ├── create-a-property.controller.ts  # EXISTING
│       │   ├── update-a-property.controller.ts  # EXISTING
│       │   ├── get-properties.controller.ts     # EXISTING
│       │   ├── get-a-property.controller.ts     # EXISTING
│       │   ├── create-a-unit.controller.ts      # NEW
│       │   ├── update-a-unit.controller.ts      # NEW
│       │   ├── get-units.controller.ts          # NEW
│       │   └── get-a-unit.controller.ts         # NEW
│       ├── dto/
│       │   ├── create-a-property.dto.ts         # EXISTING
│       │   ├── update-a-property.dto.ts         # EXISTING
│       │   ├── create-a-unit.dto.ts             # NEW
│       │   ├── update-a-unit.dto.ts             # NEW
│       │   └── billable-option.dto.ts           # NEW (nested DTO)
│       ├── queries/
│       │   ├── get-properties.query.ts          # EXISTING
│       │   ├── get-properties.handler.ts        # EXISTING
│       │   ├── get-a-property.query.ts          # EXISTING
│       │   ├── get-a-property.handler.ts        # EXISTING
│       │   ├── get-units.query.ts               # NEW
│       │   ├── get-units.handler.ts             # NEW
│       │   ├── get-a-unit.query.ts              # NEW
│       │   └── get-a-unit.handler.ts            # NEW
│       ├── projections/
│       │   ├── property.projection.ts           # EXISTING
│       │   └── unit.projection.ts               # NEW
│       ├── finders/
│       │   ├── property.finder.ts               # EXISTING
│       │   └── unit.finder.ts                   # NEW
│       ├── property-presentation.module.ts      # MODIFY: add unit controllers, handlers, projection, finder
│       └── __tests__/
│           ├── create-a-property.controller.spec.ts  # EXISTING
│           ├── get-properties.controller.spec.ts     # EXISTING
│           ├── update-a-property.controller.spec.ts  # EXISTING
│           ├── property.projection.spec.ts           # EXISTING
│           ├── create-a-unit.controller.spec.ts      # NEW
│           ├── get-units.controller.spec.ts          # NEW
│           ├── update-a-unit.controller.spec.ts      # NEW
│           └── unit.projection.spec.ts               # NEW

frontend/src/
├── lib/api/
│   ├── properties-api.ts            # EXISTING
│   └── units-api.ts                 # NEW
├── hooks/
│   ├── use-properties.ts            # EXISTING
│   └── use-units.ts                 # NEW
├── components/features/
│   ├── properties/                  # EXISTING
│   └── units/
│       ├── unit-form.tsx            # NEW
│       └── unit-schema.ts           # NEW (Zod schema)
├── app/(auth)/
│   └── properties/
│       ├── page.tsx                  # EXISTING (list)
│       ├── new/
│       │   └── page.tsx             # EXISTING (create)
│       └── [id]/
│           ├── page.tsx             # MODIFY (add units list section)
│           └── units/
│               ├── new/
│               │   └── page.tsx     # NEW (create unit)
│               └── [unitId]/
│                   └── page.tsx     # NEW (unit detail/edit)
```

### What NOT to Build

- **No delete operation** — unit deletion is not in the AC for Story 2.5
- **No unit mosaic on dashboard** — that's Story 2.6
- **No lease linking** — Lease creation linking tenant to unit is Story 3.3
- **No search/filtering** — simple list is sufficient for initial implementation
- **No pagination** — portfolio size (<50 units per property) doesn't require it
- **No image upload** — unit images are not in scope
- **No rent amount on unit** — rent is configured on the Lease (Story 3.3)
- **No status colors on units** — status is driven by lease/payment state (Story 2.6+)
- **No drag-and-drop reordering** — not in requirements

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
| react-hook-form | installed | Form state management, `useFieldArray` for dynamic billable options |
| zod | installed | Schema validation |
| @hookform/resolvers | installed | zodResolver |
| shadcn/ui | initialized | Card, Button, Input, Select, Badge, Skeleton, etc. |
| lucide-react | installed | Building2, Plus, ArrowLeft, Trash2 icons |
| Tailwind CSS | 4 | CSS variable tokens |

### TypeScript Module Resolution

- **Backend**: `moduleResolution: "nodenext"` — `.js` extensions required on imports
- **Frontend**: default resolution — NO `.js` extensions on imports
- **Path alias**: Frontend uses `@/` → `./src/`, Backend uses relative paths

### References

- [Source: epics.md#Story 2.5] — "create units (apartments, parking, commercial spaces) within a property and configure their options"
- [Source: epics.md#FR6] — "Bailleur can create units within a property (apartments, parking, commercial spaces)"
- [Source: epics.md#FR7] — "Bailleur can configure unit-level options (boiler, parking, custom billable options)"
- [Source: prd.md#FR6-FR7] — Unit creation and billable option configuration requirements
- [Source: prd.md#Journey 1] — "Creates first property, then units: Apt 102, Apt 302, Parking Roosevelt. For each unit, configures available options"
- [Source: architecture.md#Bounded Contexts] — Portfolio BC: `portfolio/property/` for domain, `presentation/property/` for gateway. Unit listed as aggregate in Portfolio BC
- [Source: architecture.md#Context Map] — `Portfolio ──(UnitCreated)──► Tenancy` — Tenancy subscribes to UnitCreated events
- [Source: architecture.md#Inter-BC Communication] — "References between BCs are by ID only (a Lease stores unitId: string, never imports Unit aggregate)"
- [Source: architecture.md#Directory Structure] — `portfolio/property/` described as "Aggregate: Properties & units"
- [Source: ux-design-specification.md#Journey 1] — Onboarding step 3: "Créez les lots de ce bien" after property creation
- [Source: ux-design-specification.md#Empty State Progression] — Step 3: "Property exists, no units → Créez les lots de ce bien" / Step 4: "Units exist (gray tiles), no tenants"
- [Source: ux-design-specification.md#Form Patterns] — Progressive disclosure: essential fields first, advanced options expandable
- [Source: ux-design-specification.md#UnitMosaic] — Grid component with clickable tiles (Story 2.6 — NOT in scope for 2.5)
- [Source: 2-4-create-properties-under-an-entity.md] — Separate aggregate pattern, dual URL, cross-aggregate authorization, no-op guard, named exceptions
- [Source: 2-3-implement-entity-switcher-component.md] — EntityContext, useCurrentEntity(), entity switch redirect pattern
- [Source: 2-2-associate-bank-accounts-to-an-entity.md] — Child entities in Map pattern (for billable options), fetchWithAuth, projection resilience

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Prisma client regeneration required after migration to resolve `Unit` type lint errors (19 of 20 errors fixed by `npx prisma generate`)
- Zod v4 API: `invalid_type_error` / `required_error` replaced by `error` parameter
- Jest mock type: `jest.Mock<Promise<unknown>, [unknown]>` required for full type safety on `.mock.calls` access

### Completion Notes List

- 8 tasks completed, 218 backend tests (34 suites), 0 regressions
- All 7 ACs implemented: unit CRUD, billable options, empty state, ActionFeed onboarding, validation
- Separate aggregate pattern (own stream `unit-{id}`), NOT child entity
- Dual URL pattern: sub-resource for create/list, direct for get/update
- Cross-aggregate auth via PropertyFinder in create controller
- Optimistic updates with 1500ms delayed invalidation
- Billable options as dynamic field array with euros display / cents storage
- Zod v4 compatible schema with `error` parameter (not `invalid_type_error`)

### Change Log

- 2026-02-11: Story implemented — 8 tasks, 51 new files, 4 modified files

### File List

**New files (52):**

Backend domain (26):
- `backend/src/portfolio/property/unit/unit.aggregate.ts`
- `backend/src/portfolio/property/unit/unit.module.ts`
- `backend/src/portfolio/property/unit/unit-identifier.ts`
- `backend/src/portfolio/property/unit/unit-type.ts`
- `backend/src/portfolio/property/unit/floor.ts`
- `backend/src/portfolio/property/unit/surface-area.ts`
- `backend/src/portfolio/property/unit/billable-option.ts`
- `backend/src/portfolio/property/unit/commands/create-a-unit.command.ts`
- `backend/src/portfolio/property/unit/commands/create-a-unit.handler.ts`
- `backend/src/portfolio/property/unit/commands/update-a-unit.command.ts`
- `backend/src/portfolio/property/unit/commands/update-a-unit.handler.ts`
- `backend/src/portfolio/property/unit/events/unit-created.event.ts`
- `backend/src/portfolio/property/unit/events/unit-updated.event.ts`
- `backend/src/portfolio/property/unit/exceptions/invalid-unit-identifier.exception.ts`
- `backend/src/portfolio/property/unit/exceptions/invalid-unit-type.exception.ts`
- `backend/src/portfolio/property/unit/exceptions/invalid-floor.exception.ts`
- `backend/src/portfolio/property/unit/exceptions/invalid-surface-area.exception.ts`
- `backend/src/portfolio/property/unit/exceptions/invalid-billable-option.exception.ts`
- `backend/src/portfolio/property/unit/exceptions/unit-already-exists.exception.ts`
- `backend/src/portfolio/property/unit/exceptions/unit-not-found.exception.ts`
- `backend/src/portfolio/property/unit/exceptions/unauthorized-unit-access.exception.ts`
- `backend/src/portfolio/property/unit/__tests__/mock-cqrx.ts`
- `backend/src/portfolio/property/unit/__tests__/unit.aggregate.spec.ts`
- `backend/src/portfolio/property/unit/__tests__/create-a-unit.handler.spec.ts`
- `backend/src/portfolio/property/unit/__tests__/update-a-unit.handler.spec.ts`
- `backend/prisma/migrations/20260211193717_add_unit_model/migration.sql`

Backend presentation (20):
- `backend/src/presentation/property/dto/billable-option.dto.ts`
- `backend/src/presentation/property/dto/create-a-unit.dto.ts`
- `backend/src/presentation/property/dto/update-a-unit.dto.ts`
- `backend/src/presentation/property/finders/unit.finder.ts`
- `backend/src/presentation/property/queries/get-units.query.ts`
- `backend/src/presentation/property/queries/get-units.handler.ts`
- `backend/src/presentation/property/queries/get-a-unit.query.ts`
- `backend/src/presentation/property/queries/get-a-unit.handler.ts`
- `backend/src/presentation/property/controllers/create-a-unit.controller.ts`
- `backend/src/presentation/property/controllers/update-a-unit.controller.ts`
- `backend/src/presentation/property/controllers/get-units.controller.ts`
- `backend/src/presentation/property/controllers/get-a-unit.controller.ts`
- `backend/src/presentation/property/projections/unit.projection.ts`
- `backend/src/presentation/property/__tests__/create-a-unit.controller.spec.ts`
- `backend/src/presentation/property/__tests__/update-a-unit.controller.spec.ts`
- `backend/src/presentation/property/__tests__/get-units.controller.spec.ts`
- `backend/src/presentation/property/__tests__/unit.projection.spec.ts`
- `backend/src/presentation/property/__tests__/get-a-unit.controller.spec.ts`
- `backend/src/presentation/property/__tests__/get-a-unit.handler.spec.ts`
- `backend/src/presentation/property/__tests__/get-units.handler.spec.ts`

Frontend (6):
- `frontend/src/lib/api/units-api.ts`
- `frontend/src/hooks/use-units.ts`
- `frontend/src/components/features/units/unit-schema.ts`
- `frontend/src/components/features/units/unit-form.tsx`
- `frontend/src/app/(auth)/properties/[id]/units/new/page.tsx`
- `frontend/src/app/(auth)/properties/[id]/units/[unitId]/page.tsx`

**Modified files (5):**
- `backend/src/portfolio/property/property.module.ts` — Added UnitDomainModule import
- `backend/prisma/schema.prisma` — Added Unit model + Property relation
- `backend/src/presentation/property/property-presentation.module.ts` — Added unit controllers, handlers, projection, finder
- `frontend/src/app/(auth)/properties/[id]/page.tsx` — Added units list section
- `frontend/src/components/features/dashboard/action-feed.tsx` — Added unit onboarding action

### Code Review Fixes

**Pass 1 (12 findings, 9 fixed):**

- **H1**: `update-a-unit.dto.ts` — `@IsOptional()` + `@IsInt()` rejected `null` for floor. Fixed with `@ValidateIf` to allow clearing floor
- **H2**: Missing `get-a-unit.controller.spec.ts` — Created test file
- **H3**: Missing query handler tests — Created `get-a-unit.handler.spec.ts` and `get-units.handler.spec.ts`
- **H4**: `UnitFinder` not exported from `PropertyPresentationModule` — Added to exports
- **M1**: No `@Max()` on `amountCents` in `billable-option.dto.ts` — Added `@Max(99999999)`
- **M2**: No `@Max()` on `surfaceArea` in create/update DTOs — Added `@Max(99999)`
- **M3**: No `@ArrayMaxSize()` on `billableOptions` in create/update DTOs — Added `@ArrayMaxSize(50)`
- **M4**: Missing partial update tests — Added 3 test cases (floor-only, billableOptions-only, null-floor) to `update-a-unit.handler.spec.ts`
- **L1**: File List count mismatch — Fixed counts and added missing files

**Deferred (not fixed):**
- **M5**: Projection reconnect/error handling not tested — Would require complex timer mocking, low ROI
- **L2**: sprint-status.yaml not documented — Meta-file, not implementation
- **L3**: Double `expect().toThrow()` pattern in aggregate spec — Cosmetic, tests pass correctly
