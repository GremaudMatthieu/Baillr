# Story 3.1: Register Tenants with Contact Information

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to register tenants (individuals or companies) with their contact details,
so that I can manage my tenant directory and associate them with leases (FR9).

## Acceptance Criteria

1. **Given** I have an entity selected, **When** I create a new tenant, **Then** I can enter: type (individual/company), first name, last name (or company name + SIRET for companies), email, phone, postal address. **And** the event `TenantRegistered` is stored in KurrentDB with `entityId` in metadata. **And** the tenant appears in the tenant list for this entity.
2. **Given** I have registered tenants, **When** I view the tenant list, **Then** I see all tenants for the selected entity with their name, type, email, and phone.
3. **Given** I have a registered tenant, **When** I edit their contact information, **Then** I can update: first name, last name, company name, SIRET, email, phone, postal address. **And** the event `TenantUpdated` is stored in KurrentDB. **And** the tenant list reflects the updated information.
4. **Given** I have no tenants, **When** I view the dashboard ActionFeed, **Then** I see the onboarding action "Enregistrez vos locataires" after entities and properties are configured.
5. **Given** I am on the tenant list or creation page, **When** I interact with the page, **Then** WCAG 2.1 AA compliance is maintained (4.5:1 contrast, keyboard navigation, screen reader support).

## Tasks / Subtasks

- [x] Task 1 — Backend: Create Tenancy bounded context with TenantAggregate (AC: #1)
  - [x] 1.1 Create `backend/src/tenancy/` directory structure (domain + module)
  - [x] 1.2 Implement Value Objects: `TenantType` (individual/company enum), `FirstName`, `LastName`, `CompanyName` (Null Object), `TenantSiret` (Null Object), `TenantEmail`, `PhoneNumber` (Null Object), `PostalAddress` (composite, Null Object)
  - [x] 1.3 Implement named domain exceptions: `InvalidTenantTypeException`, `InvalidFirstNameException`, `InvalidLastNameException`, `InvalidTenantEmailException`, `InvalidPhoneNumberException`, `InvalidPostalAddressException`, `CompanyNameRequiredForCompanyException`, `TenantAlreadyExistsException`
  - [x] 1.4 Implement `TenantAggregate` with `create()` and `update()` methods, stream name `'tenant'`
  - [x] 1.5 Implement events: `TenantRegistered`, `TenantUpdated`
  - [x] 1.6 Implement command handlers: `RegisterATenantHandler`, `UpdateATenantHandler` (pure orchestration)
  - [x] 1.7 Register `TenancyModule` + `TenantModule` in `AppModule`
  - [x] 1.8 Write unit tests for TenantAggregate (create, update, validation, no-op guard)

- [x] Task 2 — Backend: Add Tenant Prisma model and migration (AC: #1, #2)
  - [x] 2.1 Add `Tenant` model to `prisma/schema.prisma` with all fields (type, firstName, lastName, companyName, siret, email, phoneNumber, postal address fields) + `entityId`/`userId` indexes
  - [x] 2.2 Add relation from `OwnershipEntity` to `Tenant[]`
  - [x] 2.3 Run `prisma migrate dev` + `prisma generate` (address AI-2 carry-over)
  - [x] 2.4 Verify lint + typecheck pass after migration

- [x] Task 3 — Backend: Implement Tenant presentation layer (AC: #1, #2, #3)
  - [x] 3.1 Implement `TenantProjection` (subscribe to `tenant_` stream, handle `TenantRegistered` + `TenantUpdated` with upsert + existence check)
  - [x] 3.2 Implement `TenantFinder` (findAllByEntityAndUser, findByIdAndUserId)
  - [x] 3.3 Implement `RegisterATenantController` (`POST /api/entities/:entityId/tenants`) with EntityFinder authorization check
  - [x] 3.4 Implement `UpdateATenantController` (`PUT /api/tenants/:id`) with TenantFinder + userId check
  - [x] 3.5 Implement `GetTenantsController` (`GET /api/entities/:entityId/tenants`) with EntityFinder authorization
  - [x] 3.6 Implement `GetATenantController` (`GET /api/tenants/:id`) with userId check
  - [x] 3.7 Implement DTOs: `RegisterATenantDto`, `UpdateATenantDto` (full DTO checklist compliance)
  - [x] 3.8 Implement query handlers: `GetTenantsHandler`, `GetATenantHandler`
  - [x] 3.9 Register `TenantPresentationModule` in `AppModule`, export `TenantFinder`
  - [x] 3.10 Write unit tests for controllers, handlers, projection

- [x] Task 4 — Frontend: Implement tenant API client and hooks (AC: #1, #2, #3)
  - [x] 4.1 Create `lib/api/tenants.ts` with `useTenantsApi()` (getAll, getOne, create, update)
  - [x] 4.2 Create `hooks/use-tenants.ts` with `useTenants(entityId)`, `useTenant(id)`, `useRegisterTenant(entityId)`, `useUpdateTenant(id, entityId)`
  - [x] 4.3 Implement optimistic updates with 1500ms delayed invalidation pattern
  - [x] 4.4 Cross-query cache invalidation: register tenant invalidates `["entities", entityId, "tenants"]`

- [x] Task 5 — Frontend: Create tenant pages and form components (AC: #1, #2, #3, #5)
  - [x] 5.1 Create `app/(auth)/tenants/page.tsx` (Client Component with entity-scoped list, loading/error/empty states)
  - [x] 5.2 Create `app/(auth)/tenants/new/page.tsx` (tenant creation page)
  - [x] 5.3 Create `app/(auth)/tenants/[id]/page.tsx` (tenant detail page with inline edit)
  - [x] 5.4 Inline edit mode used instead of separate edit page (follows property pattern)
  - [x] 5.5 Create `components/features/tenants/tenant-form.tsx` (shared create/edit form with Zod schema + zodResolver)
  - [x] 5.6 Tenant list integrated in page.tsx with TenantCard component (follows property list pattern)
  - [x] 5.7 Implement Zod schema for tenant: type (individual/company), firstName, lastName, companyName (conditional), siret (conditional), email, phoneNumber, postal address
  - [x] 5.8 Implement AddressAutocomplete integration (lock/unlock pattern) for tenant postal address
  - [x] 5.9 Implement conditional fields: show companyName + SIRET when type = "company", hide when type = "individual"

- [x] Task 6 — Frontend: Update ActionFeed for tenant onboarding (AC: #4)
  - [x] 6.1 Add `useTenants(entityId)` query to `useOnboardingActions()` hook
  - [x] 6.2 Add onboarding action: "Enregistrez vos locataires" with href `/tenants/new`, displayed after properties + units exist but no tenants
  - [x] 6.3 Verify action feed progression: entities → bank accounts → properties → units → **tenants** → leases

- [x] Task 7 — Frontend: Write vitest unit tests for tenant components (AC: #5)
  - [x] 7.1 Test `TenantForm` component (individual vs company mode, validation, address autocomplete)
  - [x] 7.2 Test `TenantList` component (loading, error, empty state, populated state)
  - [x] 7.3 Test `useRegisterTenant` and `useUpdateTenant` hooks (optimistic updates)

- [x] Task 8 — Frontend: Write Playwright E2E tests for tenant flow (AC: #1, #2, #3)
  - [x] 8.1 Test tenant registration flow (navigate → fill form → submit → verify in list)
  - [x] 8.2 Test tenant editing flow (navigate → edit → verify changes)
  - [x] 8.3 Test company tenant with SIRET (conditional fields validation)

## Dev Notes

### Architecture Decisions

- **New Bounded Context**: Story 3.1 introduces the **Tenancy BC** (`backend/src/tenancy/`). This is the first new BC since Portfolio (Epic 2). The Tenancy BC will later hold Lease aggregate (Story 3.3).
- **Separate Aggregate**: `TenantAggregate` has its own event stream (`tenant-{id}`), following the Property/Unit pattern. Tenants are NOT child entities of Entity — they are top-level aggregates referenced by `entityId`.
- **Tenant Type**: Two types: `individual` (physique) and `company` (morale). Company type requires `companyName` and optionally `SIRET`. Individual type requires `firstName` + `lastName`. Both types share `email`, `phoneNumber`, `postalAddress`.
- **Postal Address**: Composite VO with `fromPrimitives()` / `toPrimitives()` / `empty()` pattern (same as PropertyAddress). Stored as flattened columns in Prisma (not JSON).
- **No insurance yet**: Insurance tracking (FR10, FR11) is Story 3.2. Do NOT implement insurance fields in this story.
- **No delete operation**: Tenants cannot be deleted (they will be referenced by leases). Only create and update.

### Cross-BC Communication

- **EntityFinder** (from `EntityPresentationModule`) is imported by `TenantPresentationModule` for ownership authorization on tenant creation and listing.
- `TenantAggregate` stores `entityId` as a primitive string — NO import of Entity or Portfolio modules in domain.
- `TenantFinder` is exported from `TenantPresentationModule` for future use by LeasePresentationModule (Story 3.3).

### URL Patterns

| Method | URL | Controller | Purpose |
|--------|-----|------------|---------|
| POST | `/api/entities/:entityId/tenants` | RegisterATenantController | Create tenant under entity |
| GET | `/api/entities/:entityId/tenants` | GetTenantsController | List tenants for entity |
| GET | `/api/tenants/:id` | GetATenantController | Get tenant detail |
| PUT | `/api/tenants/:id` | UpdateATenantController | Update tenant |

This follows the established **dual URL pattern**: sub-resource for create/list (scoped to entity), direct for get/update.

### Value Object Inventory

| VO | Type | Validation | Null Object? |
|----|------|-----------|--------------|
| TenantType | Enum | `individual` \| `company` guard clause | No |
| FirstName | String | `.trim()`, min 1, max 100 | No |
| LastName | String | `.trim()`, min 1, max 100 | No |
| CompanyName | String \| null | `.trim()`, max 255 | Yes (`.empty()`) |
| TenantSiret | String \| null | `/^\d{14}$/` regex | Yes (`.empty()`) |
| TenantEmail | String | Email regex, `.trim().toLowerCase()` | No |
| PhoneNumber | String \| null | FR format `/^(\+33\|0)[1-9]\d{8}$/` | Yes (`.empty()`) |
| PostalAddress | Composite | street, postalCode, city, complement | Yes (`.empty()`, `.isEmpty`) |

### Prisma Model

```prisma
model Tenant {
  id              String   @id @default(uuid())
  entityId        String   @map("entity_id")
  userId          String   @map("user_id")
  type            String   // 'individual' | 'company'
  firstName       String   @map("first_name")
  lastName        String   @map("last_name")
  companyName     String?  @map("company_name")
  siret           String?
  email           String
  phoneNumber     String?  @map("phone_number")
  addressStreet   String?  @map("address_street")
  addressPostalCode String? @map("address_postal_code")
  addressCity     String?  @map("address_city")
  addressComplement String? @map("address_complement")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  entity          OwnershipEntity @relation(fields: [entityId], references: [id])

  @@map("tenants")
  @@index([entityId])
  @@index([userId])
}
```

### Frontend Zod Schema

```typescript
const tenantSchema = z.object({
  type: z.enum(["individual", "company"]),
  firstName: z.string().min(1, { error: "Prénom requis" }).max(100),
  lastName: z.string().min(1, { error: "Nom requis" }).max(100),
  companyName: z.string().max(255).optional().or(z.literal("")),
  siret: z.string().regex(/^\d{14}$/, { error: "SIRET invalide (14 chiffres)" }).optional().or(z.literal("")),
  email: z.string().email({ error: "Email invalide" }),
  phoneNumber: z.string().regex(/^(\+33|0)[1-9]\d{8}$/, { error: "Numéro invalide" }).optional().or(z.literal("")),
  address: z.object({
    street: z.string().max(255).optional().or(z.literal("")),
    postalCode: z.string().regex(/^\d{5}$/, { error: "Code postal invalide" }).optional().or(z.literal("")),
    city: z.string().max(100).optional().or(z.literal("")),
    complement: z.string().max(255).optional().or(z.literal("")),
  }),
});
```

**Critical rules:**
- NO `.default()` on schema — use `defaultValues` in `useForm()`
- NO `.refine()` on schema — validate cross-field rules (company requires companyName) in `onSubmit`
- Use `{ error: "..." }` parameter (Zod v4 API)
- Conditional fields (companyName, SIRET) handled via form UI visibility, validated in `onSubmit`

### ActionFeed Onboarding Progression

After Story 3.1, the complete onboarding sequence becomes:

| Step | Condition | Message | Priority |
|------|-----------|---------|----------|
| 1 | No entity | "Créez votre première entité propriétaire" | high |
| 2 | Entity, no bank accounts | "Ajoutez un compte bancaire" | medium |
| 3 | Entity, no properties | "Ajoutez un bien immobilier" | medium |
| 4 | Properties, no units | "Créez les lots de ce bien" | medium |
| 5 | **Units, no tenants** | **"Enregistrez vos locataires"** | **medium** |
| 6 | Tenants, no leases (Story 3.3) | "Créez vos baux" | medium |

### Testing Standards

**Backend (Jest):**
- TenantAggregate: create individual, create company, update, no-op guard, validation errors (10+ tests)
- Command handlers: pure orchestration verification (4+ tests)
- Controllers: authorization check, DTO validation, command dispatch (8+ tests)
- Projection: upsert on create, existence check on update, error resilience (4+ tests)

**Frontend (Vitest):**
- TenantForm: individual mode, company mode, conditional fields, address autocomplete, validation (8+ tests)
- TenantList: loading, error, empty, populated states (4+ tests)
- Hooks: optimistic update, delayed invalidation, error rollback (4+ tests)

**E2E (Playwright):**
- Full tenant creation flow: navigate → fill → submit → verify in list (1 test)
- Tenant editing flow: navigate → edit → verify changes (1 test)
- Company tenant with conditional fields (1 test)

### Project Structure Notes

- **Backend new directories** follow exact pattern from `portfolio/property/`:
  ```
  backend/src/tenancy/
  ├── tenancy.module.ts
  └── tenant/
      ├── tenant.module.ts
      ├── tenant.aggregate.ts
      ├── tenant-type.ts
      ├── first-name.ts
      ├── last-name.ts
      ├── company-name.ts
      ├── tenant-siret.ts
      ├── tenant-email.ts
      ├── phone-number.ts
      ├── postal-address.ts
      ├── commands/
      │   ├── register-a-tenant.command.ts
      │   ├── register-a-tenant.handler.ts
      │   ├── update-a-tenant.command.ts
      │   └── update-a-tenant.handler.ts
      ├── events/
      │   ├── tenant-registered.event.ts
      │   └── tenant-updated.event.ts
      ├── exceptions/
      │   ├── invalid-tenant-type.exception.ts
      │   ├── invalid-first-name.exception.ts
      │   ├── invalid-last-name.exception.ts
      │   ├── invalid-tenant-email.exception.ts
      │   ├── invalid-phone-number.exception.ts
      │   ├── invalid-postal-address.exception.ts
      │   ├── invalid-company-name.exception.ts
      │   ├── invalid-tenant-siret.exception.ts
      │   ├── company-name-required.exception.ts
      │   ├── tenant-already-exists.exception.ts
      │   ├── tenant-not-found.exception.ts
      │   └── tenant-unauthorized.exception.ts
      └── __tests__/
          ├── mock-cqrx.ts
          ├── tenant.aggregate.spec.ts
          ├── register-a-tenant.handler.spec.ts
          └── update-a-tenant.handler.spec.ts
  ```

- **Presentation new directories:**
  ```
  backend/src/presentation/tenant/
  ├── tenant-presentation.module.ts
  ├── controllers/
  │   ├── register-a-tenant.controller.ts
  │   ├── update-a-tenant.controller.ts
  │   ├── get-tenants.controller.ts
  │   └── get-a-tenant.controller.ts
  ├── dto/
  │   ├── register-a-tenant.dto.ts
  │   ├── update-a-tenant.dto.ts
  │   └── postal-address.dto.ts
  ├── queries/
  │   ├── get-tenants.query.ts
  │   ├── get-tenants.handler.ts
  │   ├── get-a-tenant.query.ts
  │   └── get-a-tenant.handler.ts
  ├── projections/
  │   └── tenant.projection.ts
  ├── finders/
  │   └── tenant.finder.ts
  └── __tests__/
      ├── register-a-tenant.controller.spec.ts
      ├── update-a-tenant.controller.spec.ts
      ├── get-tenants.controller.spec.ts
      ├── get-a-tenant.controller.spec.ts
      ├── get-tenants.handler.spec.ts
      ├── get-a-tenant.handler.spec.ts
      └── tenant.projection.spec.ts
  ```

- **Frontend new files:**
  ```
  frontend/src/
  ├── app/(auth)/tenants/
  │   ├── page.tsx
  │   ├── new/page.tsx
  │   ├── [id]/page.tsx
  │   └── __tests__/tenants-page.test.tsx
  ├── components/features/tenants/
  │   ├── tenant-form.tsx
  │   ├── tenant-schema.ts
  │   └── __tests__/tenant-form.test.tsx
  ├── hooks/use-tenants.ts
  ├── lib/api/tenants-api.ts
  └── lib/constants/tenant-types.ts
  ```

- **Alignment with unified project structure**: exact match with architecture.md patterns for new BC + presentation layer + frontend feature
- **No variances**: all naming conventions (kebab-case files, PascalCase classes, VerbANoun commands) aligned

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — FR9 acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Bounded Contexts] — Tenancy BC structure, TenantAggregate
- [Source: _bmad-output/planning-artifacts/architecture.md#Value Objects] — VO pattern (private constructor, static factory, Null Object)
- [Source: _bmad-output/planning-artifacts/architecture.md#Controller-per-Action] — SRP controller pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Conventions] — VerbANoun commands, PastTense events
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Optimistic update pattern, TanStack Query
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 1: Onboarding] — ActionFeed progression step 5 "Enregistrez vos locataires"
- [Source: docs/project-context.md#2. CQRS / Event Sourcing Patterns] — Aggregate patterns, URL patterns, projection resilience
- [Source: docs/project-context.md#6. Form Patterns] — Zod + zodResolver, euros/cents, AddressAutocomplete
- [Source: docs/anti-patterns.md] — 40 entries across 8 categories, all applicable
- [Source: docs/dto-checklist.md] — DTO validation rules for all field types
- [Source: backend/src/portfolio/entity/domain/entity.aggregate.ts] — Reference aggregate implementation
- [Source: backend/src/portfolio/property/domain/property.aggregate.ts] — Separate aggregate pattern
- [Source: backend/src/presentation/property/controllers/create-a-property.controller.ts] — Cross-BC authorization pattern
- [Source: frontend/src/hooks/use-entities.ts] — Optimistic update + delayed invalidation hook pattern
- [Source: frontend/src/components/features/entities/entity-form.tsx] — Form pattern with Zod + AddressAutocomplete

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Radix Select placeholder test: `getByPlaceholderText` doesn't work for Radix Select (renders `<span data-placeholder>` not HTML `placeholder` attribute) — fixed with `getByText()` instead

### Completion Notes List

- 8/8 tasks completed
- New Bounded Context: Tenancy (`backend/src/tenancy/`) — first BC outside Portfolio
- Path alias `@tenancy/*` added to tsconfig.json, Jest (package.json), webpack.config.js
- Prisma migration `20260212010054_add_tenant_model` created and applied
- Backend: 305 tests (49 suites), 0 TypeScript errors
- Frontend: 216 tests (25 suites), 0 TypeScript errors
- E2E: 5 tests in `tenants.spec.ts` (serial: seed → register individual → register company → edit → verify onboarding)
- ApiHelper extended with `registerTenant`, `getTenants`, `waitForTenantCount`
- ActionFeed progression: entities → bank accounts → properties → units → **tenants** → leases (complete)

### File List

**New files (backend domain — Task 1):**
- `backend/src/tenancy/tenancy.module.ts`
- `backend/src/tenancy/tenant/tenant.module.ts`
- `backend/src/tenancy/tenant/tenant.aggregate.ts`
- `backend/src/tenancy/tenant/tenant-type.ts`
- `backend/src/tenancy/tenant/first-name.ts`
- `backend/src/tenancy/tenant/last-name.ts`
- `backend/src/tenancy/tenant/company-name.ts`
- `backend/src/tenancy/tenant/tenant-siret.ts`
- `backend/src/tenancy/tenant/tenant-email.ts`
- `backend/src/tenancy/tenant/phone-number.ts`
- `backend/src/tenancy/tenant/postal-address.ts`
- `backend/src/tenancy/tenant/commands/register-a-tenant.command.ts`
- `backend/src/tenancy/tenant/commands/register-a-tenant.handler.ts`
- `backend/src/tenancy/tenant/commands/update-a-tenant.command.ts`
- `backend/src/tenancy/tenant/commands/update-a-tenant.handler.ts`
- `backend/src/tenancy/tenant/events/tenant-registered.event.ts`
- `backend/src/tenancy/tenant/events/tenant-updated.event.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-tenant-type.exception.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-first-name.exception.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-last-name.exception.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-tenant-email.exception.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-phone-number.exception.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-postal-address.exception.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-company-name.exception.ts`
- `backend/src/tenancy/tenant/exceptions/invalid-tenant-siret.exception.ts`
- `backend/src/tenancy/tenant/exceptions/company-name-required.exception.ts`
- `backend/src/tenancy/tenant/exceptions/tenant-already-exists.exception.ts`
- `backend/src/tenancy/tenant/exceptions/tenant-not-found.exception.ts`
- `backend/src/tenancy/tenant/exceptions/tenant-unauthorized.exception.ts`
- `backend/src/tenancy/tenant/__tests__/mock-cqrx.ts`
- `backend/src/tenancy/tenant/__tests__/tenant.aggregate.spec.ts`
- `backend/src/tenancy/tenant/__tests__/register-a-tenant.handler.spec.ts`
- `backend/src/tenancy/tenant/__tests__/update-a-tenant.handler.spec.ts`

**New files (backend Prisma — Task 2):**
- `backend/prisma/migrations/20260212010054_add_tenant_model/migration.sql`

**New files (backend presentation — Task 3):**
- `backend/src/presentation/tenant/tenant-presentation.module.ts`
- `backend/src/presentation/tenant/finders/tenant.finder.ts`
- `backend/src/presentation/tenant/projections/tenant.projection.ts`
- `backend/src/presentation/tenant/dto/register-a-tenant.dto.ts`
- `backend/src/presentation/tenant/dto/update-a-tenant.dto.ts`
- `backend/src/presentation/tenant/dto/postal-address.dto.ts`
- `backend/src/presentation/tenant/controllers/register-a-tenant.controller.ts`
- `backend/src/presentation/tenant/controllers/update-a-tenant.controller.ts`
- `backend/src/presentation/tenant/controllers/get-tenants.controller.ts`
- `backend/src/presentation/tenant/controllers/get-a-tenant.controller.ts`
- `backend/src/presentation/tenant/queries/get-tenants.query.ts`
- `backend/src/presentation/tenant/queries/get-tenants.handler.ts`
- `backend/src/presentation/tenant/queries/get-a-tenant.query.ts`
- `backend/src/presentation/tenant/queries/get-a-tenant.handler.ts`
- `backend/src/presentation/tenant/__tests__/register-a-tenant.controller.spec.ts`
- `backend/src/presentation/tenant/__tests__/update-a-tenant.controller.spec.ts`
- `backend/src/presentation/tenant/__tests__/get-tenants.controller.spec.ts`
- `backend/src/presentation/tenant/__tests__/get-a-tenant.controller.spec.ts`
- `backend/src/presentation/tenant/__tests__/get-tenants.handler.spec.ts`
- `backend/src/presentation/tenant/__tests__/get-a-tenant.handler.spec.ts`
- `backend/src/presentation/tenant/__tests__/tenant.projection.spec.ts`

**New files (frontend — Tasks 4-7):**
- `frontend/src/lib/api/tenants-api.ts`
- `frontend/src/hooks/use-tenants.ts`
- `frontend/src/lib/constants/tenant-types.ts`
- `frontend/src/components/features/tenants/tenant-schema.ts`
- `frontend/src/components/features/tenants/tenant-form.tsx`
- `frontend/src/components/features/tenants/__tests__/tenant-form.test.tsx`
- `frontend/src/app/(auth)/tenants/page.tsx`
- `frontend/src/app/(auth)/tenants/new/page.tsx`
- `frontend/src/app/(auth)/tenants/[id]/page.tsx`
- `frontend/src/app/(auth)/tenants/__tests__/tenants-page.test.tsx`

**New files (E2E — Task 8):**
- `frontend/e2e/tenants.spec.ts`

**Modified files:**
- `backend/src/app.module.ts` — added TenancyModule + TenantPresentationModule imports
- `backend/tsconfig.json` — added `@tenancy/*` path alias
- `backend/package.json` — added `@tenancy/*` Jest moduleNameMapper entries
- `backend/webpack.config.js` — added `@tenancy` webpack alias
- `backend/prisma/schema.prisma` — added Tenant model + OwnershipEntity relation
- `frontend/src/components/features/dashboard/action-feed.tsx` — added Users icon, useTenants import, tenant onboarding action
- `frontend/src/components/features/dashboard/__tests__/action-feed.test.tsx` — added useTenants mock
- `frontend/e2e/fixtures/api.fixture.ts` — added RegisterTenantParams, registerTenant, getTenants, waitForTenantCount
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story 3.1 status → review
