# Anti-Patterns Reference

> Centralized catalog of anti-patterns discovered during Epic 2 and the Consolidation Sprint.
> Each entry includes the wrong pattern, the correct pattern, rationale, and story reference.
>
> **Related docs:** [DTO Checklist](./dto-checklist.md) | [Project Context](./project-context.md)

---

## Table of Contents

1. [CQRS / Event Sourcing](#1-cqrs--event-sourcing)
2. [React / Frontend](#2-react--frontend)
3. [Zod + react-hook-form](#3-zod--react-hook-form)
4. [DTO Validation](#4-dto-validation)
5. [Domain Modeling](#5-domain-modeling)
6. [Testing — Unit (Vitest)](#6-testing--unit-vitest)
7. [Testing — E2E (Playwright)](#7-testing--e2e-playwright)
8. [Prisma / Infrastructure](#8-prisma--infrastructure)

---

## 1. CQRS / Event Sourcing

### 1.1 Always delay `invalidateQueries` in `onSettled`

**Wrong:**
```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ["entities"] }); // ❌ Immediate invalidation
}
```

**Right:**
```typescript
// Optimistic update via onMutate is the source of truth for UX.
// Delayed invalidation gives the projection time to process the event.
onSettled: () => {
  setTimeout(() => {
    void queryClient.invalidateQueries({ queryKey: ["entities", entityId, "units"] });
  }, 1500); // 1500ms: average projection lag observed during Epic 2 development
}
```

**Rationale:** Immediate invalidation after mutation causes a flash — the server read model may not yet reflect the event (eventual consistency). The optimistic update already shows the correct UI. Delay invalidation by ~1500ms to allow projection processing, then reconcile. See also [2.10 Cross-query cache invalidation](#210-cross-query-cache-invalidation-on-mutations) for multi-key invalidation.

**Story reference:** 2.1, 2.6

---

### 1.2 No business logic in command handlers

**Wrong:**
```typescript
// In CreateEntityHandler
async execute(command: CreateAnEntityCommand) {
  if (command.name.length > 255) throw new Error("Name too long"); // ❌
  const entity = new EntityAggregate();
  entity.create(command);
  await this.repository.save(entity);
}
```

**Right:**
```typescript
// Handler is pure orchestration: load → call → save
async execute(command: CreateAnEntityCommand) {
  const entity = new EntityAggregate();
  entity.create(command); // All validation inside aggregate
  await this.repository.save(entity);
}
```

**Rationale:** Command handlers are orchestration glue. Domain rules live in the aggregate where they can be tested in isolation and remain consistent across all entry points.

**Story reference:** Architecture

---

### 1.3 No raw `new Error()` in aggregates

**Wrong:**
```typescript
if (!name) throw new Error("Name is required");
```

**Right:**
```typescript
if (!name) throw EntityNameRequiredException.create();
```

**Rationale:** Named domain exceptions extend `DomainException` and carry semantic meaning. They enable consistent error handling in controllers (exception filters) and provide actionable error messages.

**Story reference:** 2.4

---

### 1.4 No cross-bounded-context imports in domain layer

**Wrong:**
```typescript
// In PropertyAggregate
import { EntityAggregate } from '../../entity/domain/entity.aggregate';
```

**Right:**
```typescript
// Cross-aggregate authorization at controller level via presentation-layer finders
const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
if (!entity) throw new UnauthorizedException();
// Then dispatch command — aggregate has no knowledge of Entity
```

**Rationale:** Bounded contexts must remain independent. Cross-aggregate authorization belongs in the presentation layer (controllers), not in domain aggregates.

**Story reference:** 2.4, 2.5

---

### 1.5 Projection must check existence before update

**Wrong:**
```typescript
async onPropertyUpdated(event: PropertyUpdated) {
  await this.prisma.property.update({
    where: { id: event.propertyId },
    data: { name: event.name },
  });
}
```

**Right:**
```typescript
async onPropertyUpdated(event: PropertyUpdated) {
  const existing = await this.prisma.property.findUnique({
    where: { id: event.propertyId },
  });
  if (!existing) {
    this.logger.warn(`Property ${event.propertyId} not found in read model — skipping`);
    return;
  }
  await this.prisma.property.update({
    where: { id: event.propertyId },
    data: { name: event.name },
  });
}
```

**Rationale:** In CQRS/ES with eventual consistency, events may arrive before the read model has the initial creation projected. Warn and return (don't throw) to avoid crashing the projection subscription.

**Story reference:** 2.1, 2.2, 2.4, 2.5

---

## 2. React / Frontend

### 2.1 No `setState` in `useEffect`

**Wrong:**
```typescript
const [resolvedId, setResolvedId] = useState<string | null>(null);
useEffect(() => {
  const id = entities.find(e => e.id === storedId)?.id ?? entities[0]?.id ?? null;
  setResolvedId(id); // ❌ React Compiler violation
}, [entities, storedId]);
```

**Right:**
```typescript
const [storedId, setStoredId] = useState<string | null>(null);
// "Sync state during render" pattern (React 19+)
const resolvedId = entities.find(e => e.id === storedId)?.id ?? entities[0]?.id ?? null;
if (storedId !== resolvedId) {
  setStoredId(resolvedId); // ✅ Conditional set during render
}
```

**Rationale:** React Compiler flags `setState` inside `useEffect` as an anti-pattern. The "sync state during render" pattern is explicitly recommended in the React docs for derived state.

**Story reference:** 2.3

---

### 2.2 No `useRef.current` access during render

**Wrong:**
```typescript
function Component() {
  const ref = useRef<HTMLDivElement>(null);
  const width = ref.current?.offsetWidth ?? 0; // ❌ Reading ref during render
  return <div ref={ref}>{width}px</div>;
}
```

**Right:**
```typescript
// Access ref only in event handlers, effects, or callbacks
const handleResize = () => {
  const width = ref.current?.offsetWidth ?? 0; // ✅ In callback
};
```

**Rationale:** React Compiler considers ref access during render unsafe — the ref value is not tracked by the render cycle and may be stale or null.

**Story reference:** 2.3, 2.6

---

### 2.3 No hardcoded parent links for back navigation

**Wrong:**
```typescript
<Link href={`/entities/${entityId}/properties`}>Back</Link>
```

**Right:**
```typescript
const router = useRouter();
<Button variant="ghost" onClick={() => router.back()}>Back</Button>
```

**Rationale:** Users may arrive from the dashboard, entity list, search, or a deep link. History-based navigation (`router.back()`) returns them to the correct origin.

**Story reference:** 2.3, 2.4

---

### 2.4 No nested Tooltip + DropdownMenu on the same trigger

**Wrong:**
```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <DropdownMenuTrigger asChild>
      <Button>Click me</Button>
    </DropdownMenuTrigger>
  </TooltipTrigger>
</Tooltip>
```

**Right:**
```typescript
// DropdownMenu alone is sufficient for clickable elements
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Click me</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>...</DropdownMenuContent>
</DropdownMenu>
```

**Rationale:** Radix Tooltip and DropdownMenu register conflicting pointer event handlers on the same trigger element. The Tooltip captures the click before the DropdownMenu can process it.

**Story reference:** 2.3

---

### 2.5 Always guard `localStorage`/`window` in `"use client"` components

**Wrong:**
```typescript
"use client";
const stored = localStorage.getItem("entityId"); // ❌ Crashes during SSR
```

**Right:**
```typescript
"use client";
const stored = typeof window !== "undefined"
  ? localStorage.getItem("entityId")
  : null;
```

**Rationale:** Next.js may pre-render `"use client"` components on the server. `localStorage` and `window` are undefined during SSR.

**Story reference:** 2.3

---

### 2.6 Always `.filter(Boolean)` after `.split()`

**Wrong:**
```typescript
const parts = pathname.split("/"); // ["", "entities", "123", "properties"]
```

**Right:**
```typescript
const parts = pathname.split("/").filter(Boolean); // ["entities", "123", "properties"]
```

**Rationale:** Leading/trailing slashes produce empty strings. Without filtering, array indexing gives wrong results.

**Story reference:** 2.3

---

### 2.7 Always handle `isError` state in `useQuery` consumers

**Wrong:**
```typescript
if (isLoading) return <Skeleton />;
if (!data?.length) return <EmptyState />; // ❌ Also triggered on error
return <DataGrid data={data} />;
```

**Right:**
```typescript
if (isLoading) return <Skeleton />;
if (isError) return <div role="alert">Erreur lors du chargement</div>;
if (!data?.length) return <EmptyState />;
return <DataGrid data={data} />;
```

**Rationale:** Showing an empty state when the API actually errored is misleading. Users need to know something went wrong.

**Story reference:** 2.6

---

### 2.8 Guard `surfaceArea > 0` before rendering dimensions

**Wrong:**
```typescript
<span>{unit.surfaceArea} m²</span> // Shows "0 m²" for parkings
```

**Right:**
```typescript
{unit.surfaceArea > 0 && <span>{unit.surfaceArea} m²</span>}
```

**Rationale:** Parking spaces typically have no surface area configured. Displaying "0 m²" is confusing; display nothing instead.

**Story reference:** 2.6

---

### 2.9 Server Component / Client Component boundary

**Wrong:**
```typescript
// page.tsx (Server Component by default in App Router)
export default function Dashboard() {
  const { entityId } = useCurrentEntity(); // ❌ Hook in Server Component
  return <UnitMosaic entityId={entityId} />;
}
```

**Right:**
```typescript
// page.tsx (Server Component)
export const metadata = { title: "Dashboard" };
export default function DashboardPage() {
  return <DashboardContent />; // Delegate to Client Component
}

// dashboard-content.tsx
"use client";
export function DashboardContent() {
  const { entityId } = useCurrentEntity(); // ✅ In Client Component
  return <UnitMosaic entityId={entityId} />;
}
```

**Rationale:** Server Components cannot use hooks, context, or browser APIs. Extract interactive logic into dedicated `"use client"` components.

**Story reference:** 2.6

---

### 2.10 Cross-query cache invalidation on mutations

**Wrong:**
```typescript
// useCreateUnit mutation
onSettled: () => {
  void queryClient.invalidateQueries({ queryKey: ["properties", propertyId, "units"] });
  // ❌ Forgets to invalidate entity-level units query used by dashboard
}
```

**Right:**
```typescript
onSettled: () => {
  setTimeout(() => {
    void queryClient.invalidateQueries({ queryKey: ["properties", propertyId, "units"] });
    void queryClient.invalidateQueries({ queryKey: ["entities", entityId, "units"] });
  }, 1500);
}
```

**Rationale:** Multiple queries may depend on the same underlying data. A unit mutation must invalidate both the property-level and entity-level unit queries. See also [1.1 Always delay invalidateQueries](#11-always-delay-invalidatequeries-in-onsettled) for the delayed invalidation pattern.

**Story reference:** 2.6

---

## 3. Zod + react-hook-form

### 3.1 Never use `.default()` on schema with `zodResolver`

**Wrong:**
```typescript
const schema = z.object({
  type: z.enum(["bank_account", "cash_register"]).default("bank_account"),
});
const form = useForm({ resolver: zodResolver(schema) });
// form.getValues().type is string | undefined ❌ type inference broken
```

**Right:**
```typescript
const schema = z.object({
  type: z.enum(["bank_account", "cash_register"]),
});
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { type: "bank_account" }, // Default here, not in schema
});
```

**Rationale:** `zodResolver` infers form types from the schema. `.default()` changes the Zod output type but react-hook-form still sees the input type, causing a mismatch.

**Story reference:** 2.1, 2.2

---

### 3.2 Never use `.refine()` on schema with `zodResolver`

**Wrong:**
```typescript
const schema = z.object({
  iban: z.string(),
  type: z.enum(["bank_account", "cash_register"]),
}).refine((data) => data.type !== "bank_account" || data.iban.length > 0, {
  message: "IBAN required for bank accounts",
});
```

**Right:**
```typescript
// Use form-level validation or conditional field validation instead
const schema = z.object({
  iban: z.string(),
  type: z.enum(["bank_account", "cash_register"]),
});
// Validate cross-field rules in onSubmit or via conditional rendering
```

**Rationale:** `.refine()` transforms the schema into a `ZodEffects` type which breaks `zodResolver` type inference. Cross-field validation should be handled at form level.

**Story reference:** 2.2

---

### 3.3 Zod v4: use `error` parameter

**Wrong:**
```typescript
z.string({ invalid_type_error: "Must be a string" }) // ❌ Zod v3 API
z.string({ required_error: "Required" })              // ❌ Zod v3 API
```

**Right:**
```typescript
z.string({ error: "Must be a string" }) // ✅ Zod v4 API
```

**Rationale:** Zod v4 consolidated `invalid_type_error` and `required_error` into a single `error` parameter. The v3 parameters are silently ignored in v4.

**Story reference:** 2.5

---

### 3.4 Use `.regex()` only, not `.length()` + `.regex()`

**Wrong:**
```typescript
z.string().length(36).regex(/^[0-9a-f-]{36}$/i) // ❌ Redundant .length()
```

**Right:**
```typescript
z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
```

**Rationale:** When the regex already constrains the format (and implicitly the length), a separate `.length()` check is redundant and causes confusing dual error messages.

**Story reference:** 2.1

---

## 4. DTO Validation

### 4.1 Every string field needs `@MaxLength`

**Wrong:**
```typescript
@IsString()
@IsNotEmpty()
name: string; // ❌ No length constraint
```

**Right:**
```typescript
@IsString()
@IsNotEmpty()
@MaxLength(255)
name: string;
```

**Rationale:** Without `@MaxLength`, a malicious client can send megabytes of data in a single field, causing memory issues and database errors.

**Story reference:** 2.1, 2.4, 2.5

---

### 4.2 Every numeric field needs `@Max`

**Wrong:**
```typescript
@IsNumber()
surfaceArea: number; // ❌ No upper bound
```

**Right:**
```typescript
@IsNumber()
@Min(0)
@Max(99999)
surfaceArea: number;
```

**Rationale:** Unbounded numeric fields can cause overflow issues and downstream calculation errors.

**Story reference:** 2.4, 2.5

---

### 4.3 Every array field needs `@ArrayMaxSize`

**Wrong:**
```typescript
@IsArray()
@ValidateNested({ each: true })
@Type(() => BillableOptionDto)
billableOptions: BillableOptionDto[]; // ❌ No size limit
```

**Right:**
```typescript
@IsArray()
@ArrayMaxSize(50)
@ValidateNested({ each: true })
@Type(() => BillableOptionDto)
billableOptions: BillableOptionDto[];
```

**Rationale:** Without size limits, a client can submit thousands of array entries, causing memory exhaustion and database bloat.

**Story reference:** 2.5

---

### 4.4 Use `@ValidateIf` for conditionally nullable fields

**Wrong:**
```typescript
@IsOptional()
@IsNumber()
floor?: number; // ❌ Always optional — but parking has no floor
```

**Right:**
```typescript
@ValidateIf((o) => o.unitType !== 'parking')
@IsNumber()
@Min(-5)
@Max(200)
floor?: number;
```

**Rationale:** Some fields are only meaningful for certain types. `@ValidateIf` makes the validation intent explicit and documents the business rule.

**Story reference:** 2.5

---

### 4.5 Never use `as` type cast without guard clause for enums

**Wrong:**
```typescript
const type = dto.type as BankAccountType; // ❌ Silently accepts invalid values
```

**Right:**
```typescript
const ALLOWED_TYPES = ['bank_account', 'cash_register'] as const;
if (!ALLOWED_TYPES.includes(dto.type)) {
  throw InvalidBankAccountTypeException.create(dto.type);
}
```

**Rationale:** TypeScript `as` casts are compile-time only — they don't validate at runtime. An invalid string passes through silently.

**Story reference:** 2.2

---

### 4.6 VO double-validation (defense in depth)

**Wrong:**
```typescript
// DTO has @MaxLength(255) but VO trusts input blindly
class EntityName {
  static create(value: string) {
    return new EntityName(value); // ❌ No VO-level check
  }
}
```

**Right:**
```typescript
// DTO: @MaxLength(255)
// VO: redundant check for defense in depth
class EntityName {
  static create(value: string) {
    if (value.length > 255) {
      throw EntityNameTooLongException.create();
    }
    return new EntityName(value);
  }
}
```

**Rationale:** The aggregate is the last line of defense. If a code path bypasses the DTO (e.g., event replay, migration), the VO must still enforce constraints.

**Story reference:** 2.4, 2.5

---

## 5. Domain Modeling

### 5.1 No raw primitives in aggregates

**Wrong:**
```typescript
class PropertyAggregate {
  private name: string;       // ❌ Raw primitive
  private entityId: string;   // ❌ Raw primitive
}
```

**Right:**
```typescript
class PropertyAggregate {
  private name: PropertyName;    // ✅ Value Object
  private entityId: EntityId;    // ✅ Value Object
}
```

**Rationale:** Value Objects encapsulate validation, formatting, and equality logic. Raw primitives scatter these concerns across the codebase.

**Story reference:** Architecture

---

### 5.2 No public constructors on Value Objects

**Wrong:**
```typescript
class PropertyName {
  constructor(public readonly value: string) {} // ❌ Public constructor
}
new PropertyName(""); // Can create invalid VOs
```

**Right:**
```typescript
class PropertyName {
  private constructor(private readonly value: string) {}
  static create(value: string): PropertyName {
    if (!value || value.length > 255) {
      throw PropertyNameInvalidException.create();
    }
    return new PropertyName(value);
  }
}
```

**Rationale:** Private constructor + static factory ensures all VOs pass through validation. No invalid instances can exist.

**Story reference:** Architecture

---

### 5.3 One controller per action (SRP)

**Wrong:**
```typescript
@Controller('entities')
class EntityController {
  @Post() create() { ... }
  @Get() findAll() { ... }    // ❌ Multiple routes
  @Get(':id') findOne() { ... }
  @Put(':id') update() { ... }
}
```

**Right:**
```typescript
@Controller('entities')
class CreateAnEntityController {
  @Post()
  async handle(@Body() dto: CreateAnEntityDto) { ... }
}

@Controller('entities')
class GetAllEntitiesController {
  @Get()
  async handle() { ... }
}
```

**Rationale:** Single Responsibility Principle — each controller has one reason to change. This makes testing, authorization, and dependency injection cleaner.

**Story reference:** Architecture

---

### 5.4 No-op guard on aggregate update

**Wrong:**
```typescript
update(data: Partial<PropertyData>) {
  this.apply(new PropertyUpdated({ propertyId: this.id, ...data }));
  // ❌ Emits event even if no fields actually changed
}
```

**Right:**
```typescript
update(data: Partial<PropertyData>) {
  const eventData = { propertyId: this.id, ...data };
  if (Object.keys(eventData).length <= 1) return; // Only propertyId — no-op
  this.apply(new PropertyUpdated(eventData));
}
```

**Rationale:** Emitting events with no actual changes pollutes the event store and triggers unnecessary projections.

**Story reference:** 2.4

---

## 6. Testing — Unit (Vitest)

### 6.1 Radix Select: use `getByPlaceholderText`, not `getByLabelText`

**Wrong:**
```typescript
screen.getByLabelText("Type"); // ❌ Radix Select renders combobox, not native select
```

**Right:**
```typescript
screen.getByPlaceholderText("Sélectionner..."); // ✅ Matches Radix trigger text
```

**Rationale:** Radix Select renders a combobox button, not a native `<select>`. The label association is different from native form controls.

**Story reference:** C.1

---

### 6.2 Radix Select + `zodResolver`: form submission unreliable in jsdom

**Wrong:**
```typescript
// Full form submission test with Radix Select
await user.click(submitButton);
expect(mockOnSubmit).toHaveBeenCalledWith(expectedData); // ❌ Flaky in jsdom
```

**Right:**
```typescript
// Test field-level validation instead
const input = screen.getByPlaceholderText("Nom");
await user.clear(input);
await user.click(submitButton);
expect(screen.getByText("Le nom est requis")).toBeInTheDocument(); // ✅ Reliable
```

**Rationale:** Radix Select + zodResolver interaction in jsdom has timing issues that make form submission tests unreliable. Test field validation and component behavior separately.

**Story reference:** C.1

---

### 6.3 Fresh `QueryClient` per test with `gcTime: 0`

**Wrong:**
```typescript
const queryClient = new QueryClient(); // ❌ Shared across tests
```

**Right:**
```typescript
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}
// Use in each test's wrapper
```

**Rationale:** Shared QueryClient retains cache between tests, causing false positives/negatives. `gcTime: 0` ensures garbage collection is immediate.

**Story reference:** C.1

---

### 6.4 Global `vi.mock()` files must be imported in `setup.ts`

**Wrong:**
```typescript
// src/test/mocks/next-navigation.ts
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));
// ❌ File exists but never imported — mock doesn't apply
```

**Right:**
```typescript
// src/test/setup.ts
import "./mocks/next-navigation"; // ✅ Explicitly import mock files
import "./mocks/clerk";
```

**Rationale:** `vi.mock()` hoisting only works within files that are actually loaded by the test runner. Standalone mock files must be explicitly imported.

**Story reference:** C.1

---

### 6.5 Radix UI polyfills required in jsdom

Vitest `setup.ts` must include these polyfills for Radix UI components to work:

```typescript
// ResizeObserver
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
// hasPointerCapture
Element.prototype.hasPointerCapture = () => false;
// scrollIntoView
Element.prototype.scrollIntoView = () => {};
```

**Rationale:** jsdom does not implement these browser APIs. Radix UI components crash without them.

**Story reference:** C.1

---

### 6.6 Prefer semantic queries over `getByTestId`

**Wrong:**
```typescript
screen.getByTestId("submit-button"); // ❌ Tests implementation detail
```

**Right:**
```typescript
screen.getByRole("button", { name: /créer/i }); // ✅ Tests user-visible behavior
```

**Rationale:** Testing Library's guiding principle: tests should resemble how users interact with the app. Semantic queries are more resilient to refactoring.

**Story reference:** C.1 (convention)

---

## 7. Testing — E2E (Playwright)

### 7.1 No `page.waitForTimeout()` — use auto-waiting

**Wrong:**
```typescript
await page.waitForTimeout(2000); // ❌ Arbitrary delay, flaky
await page.click('[data-testid="submit"]');
```

**Right:**
```typescript
await page.getByRole("button", { name: "Créer" }).click(); // ✅ Auto-waits
await expect(page.getByText("Entité créée")).toBeVisible();  // ✅ Smart assertion
```

**Rationale:** Playwright has built-in auto-waiting and retry logic. Explicit timeouts make tests slow and flaky.

**Story reference:** C.2

---

### 7.2 No state dependencies between test files

**Wrong:**
```typescript
// onboarding.spec.ts — creates entity
// editing.spec.ts — expects entity from onboarding.spec.ts ❌
```

**Right:**
```typescript
// Each .spec.ts file is independently runnable:
//   npx playwright test onboarding.spec.ts  ✅
//   npx playwright test editing.spec.ts     ✅ (seeds its own data)

// WITHIN a file, serial mode is acceptable for CQRS systems without DELETE endpoints:
test.describe.configure({ mode: 'serial' });
test("seed entity via UI", ...);
test("edit entity", ...);  // ✅ Depends on previous test within same file
```

**Rationale:** Test **files** must be independently runnable (`npx playwright test <file>`). Within a file, `test.describe.configure({ mode: 'serial' })` is acceptable when no DELETE/cleanup endpoints exist — each file seeds its own data via UI or API, and timestamp-based naming prevents cross-file collisions.

**Story reference:** C.2

---

### 7.3 CQRS timing: assert on optimistic UI

**Wrong:**
```typescript
await page.click('[data-testid="create"]');
await page.waitForResponse("**/api/entities"); // ❌ Waits for server
expect(await page.textContent(".entity-name")).toBe("Test");
```

**Right:**
```typescript
await page.getByRole("button", { name: "Créer" }).click();
// Assert on optimistic UI — appears immediately before server response
await expect(page.getByText("Test Entity")).toBeVisible();
```

**Rationale:** In a CQRS system with optimistic updates, the UI updates before the server confirms. Assert on what the user sees, not on API responses.

**Story reference:** C.2

---

## 8. Prisma / Infrastructure

### 8.1 Always run `prisma generate` after schema changes

**Wrong:**
```bash
npx prisma migrate dev --name add_property_model
# ❌ Forgets prisma generate — lint shows type errors
```

**Right:**
```bash
npx prisma migrate dev --name add_property_model
npx prisma generate  # Regenerate client types
```

**Rationale:** `migrate dev` applies the SQL migration but may not regenerate the Prisma Client types. Without `generate`, TypeScript sees the old schema.

**Story reference:** 2.1, 2.2, 2.5

---

### 8.2 Cross-query cache invalidation on mutations

> See [2.10](#210-cross-query-cache-invalidation-on-mutations) for the full pattern with code examples.

Mutations must invalidate ALL related query keys, not just the direct parent.

**Example:** Creating a unit must invalidate:
- `["properties", propertyId, "units"]` — property-level unit list
- `["entities", entityId, "units"]` — entity-level unit list (dashboard mosaic)

**Rationale:** Multiple components may query the same underlying data through different endpoints. Missing a query key causes stale data in other views.

**Story reference:** 2.6

---

## Review Checklist (Quick Reference)

Use this checklist during code reviews:

- [ ] Delayed `invalidateQueries` in `onSettled` (setTimeout, not immediate)
- [ ] No business logic in command handlers
- [ ] No raw `new Error()` in aggregates (use named exceptions)
- [ ] No cross-BC imports in domain layer
- [ ] Projection checks existence before update
- [ ] No `setState` in `useEffect`
- [ ] No `useRef.current` during render
- [ ] `router.back()` for back navigation
- [ ] No nested Tooltip + DropdownMenu
- [ ] SSR guard on `localStorage`/`window`
- [ ] `.filter(Boolean)` after `.split()`
- [ ] `isError` state handled in `useQuery` consumers
- [ ] `surfaceArea > 0` guard on display
- [ ] Server/Client Component boundary respected
- [ ] Cross-query cache invalidation complete
- [ ] No `.default()` or `.refine()` with `zodResolver`
- [ ] Zod v4 `error` parameter (not `invalid_type_error`)
- [ ] `@MaxLength` on every string DTO field
- [ ] `@Max` on every numeric DTO field
- [ ] `@ArrayMaxSize` on every array DTO field
- [ ] `@ValidateIf` for conditional fields
- [ ] No `as` cast without guard clause
- [ ] VO double-validation (DTO + VO)
- [ ] Value Objects (no raw primitives in aggregates)
- [ ] Private VO constructors with static factory
- [ ] One controller per action
- [ ] No-op guard on aggregate update
- [ ] Fresh `QueryClient` per test (`gcTime: 0`)
- [ ] `vi.mock()` files imported in `setup.ts`
- [ ] No `page.waitForTimeout()` in E2E
- [ ] `prisma generate` after schema changes
