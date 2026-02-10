# Story 2.2: Associate Bank Accounts to an Entity

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to associate bank accounts and a cash register to each entity,
so that generated documents display the correct IBAN for rent payments (FR3).

## Acceptance Criteria

1. **Given** I have an entity, **When** I navigate to the entity's bank account configuration, **Then** I can add multiple bank accounts with: label, IBAN, BIC, bank name, **And** I can designate one as the default for rent call documents, **And** I can add a cash register (caisse) for tracking cash payments, **And** bank account details are stored as part of the entity aggregate

## Tasks / Subtasks

- [x] **Task 1: Create BankAccount Value Objects and domain exceptions** (AC: 1)
  - [x] 1.1 Create `backend/src/portfolio/entity/iban.ts` — IBAN VO with private constructor + `fromString(value)` factory, validation (French IBAN: `FR` + 2 check digits + 23 alphanumeric = 27 chars), `empty()` Null Object, `value` getter
  - [x] 1.2 Create `backend/src/portfolio/entity/bic.ts` — BIC VO with private constructor + `fromString(value)` factory, validation (8 or 11 alphanumeric), `empty()` Null Object, `value` getter
  - [x] 1.3 Create `backend/src/portfolio/entity/bank-account-label.ts` — Label VO with private constructor + `fromString(value)` factory, validation (1-100 chars trimmed), `value` getter
  - [x] 1.4 Create `backend/src/portfolio/entity/bank-name.ts` — BankName VO with private constructor + `fromString(value)` factory, validation (1-100 chars trimmed), `empty()` Null Object, `value` getter
  - [x] 1.5 Create `backend/src/portfolio/entity/exceptions/invalid-iban.exception.ts` — Named exception with `invalidFormat()` static factory
  - [x] 1.6 Create `backend/src/portfolio/entity/exceptions/invalid-bic.exception.ts` — Named exception with `invalidFormat()` static factory
  - [x] 1.7 Create `backend/src/portfolio/entity/exceptions/invalid-bank-account-label.exception.ts` — Named exception with `required()`, `tooLong()` static factories
  - [x] 1.8 Create `backend/src/portfolio/entity/exceptions/invalid-bank-name.exception.ts` — Named exception with `required()` static factory
  - [x] 1.9 Create `backend/src/portfolio/entity/exceptions/bank-account-not-found.exception.ts` — Named exception with `create(accountId)` static factory
  - [x] 1.10 Create `backend/src/portfolio/entity/exceptions/cash-register-cannot-be-default.exception.ts` — Named exception for cash register default violation

- [x] **Task 2: Add bank account commands and events to Entity aggregate** (AC: 1)
  - [x] 2.1 Create `backend/src/portfolio/entity/events/bank-account-added.event.ts` — BankAccountAdded event with data: `{ id, entityId, accountId, type: 'bank_account' | 'cash_register', label, iban, bic, bankName, isDefault }`
  - [x] 2.2 Create `backend/src/portfolio/entity/events/bank-account-updated.event.ts` — BankAccountUpdated event with data: `{ id, entityId, accountId, label?, iban?, bic?, bankName?, isDefault? }`
  - [x] 2.3 Create `backend/src/portfolio/entity/events/bank-account-removed.event.ts` — BankAccountRemoved event with data: `{ id, entityId, accountId }`
  - [x] 2.4 Create `backend/src/portfolio/entity/commands/add-a-bank-account.command.ts` — Command DTO: `{ entityId, accountId, userId, type, label, iban?, bic?, bankName?, isDefault }`
  - [x] 2.5 Create `backend/src/portfolio/entity/commands/add-a-bank-account.handler.ts` — ZERO-logic handler: load entity aggregate by entityId, call `addBankAccount()`, save
  - [x] 2.6 Create `backend/src/portfolio/entity/commands/update-a-bank-account.command.ts` — Command DTO
  - [x] 2.7 Create `backend/src/portfolio/entity/commands/update-a-bank-account.handler.ts` — ZERO-logic handler
  - [x] 2.8 Create `backend/src/portfolio/entity/commands/remove-a-bank-account.command.ts` — Command DTO
  - [x] 2.9 Create `backend/src/portfolio/entity/commands/remove-a-bank-account.handler.ts` — ZERO-logic handler
  - [x] 2.10 Add `addBankAccount()`, `updateBankAccount()`, `removeBankAccount()` methods to `entity.aggregate.ts` — ALL business logic here: validate VOs, enforce one default max, validate ownership (userId check), emit events
  - [x] 2.11 Add `@EventHandler` methods: `onBankAccountAdded`, `onBankAccountUpdated`, `onBankAccountRemoved` to `entity.aggregate.ts` — mutate internal state (bank accounts collection)
  - [x] 2.12 Register new command handlers in `entity.module.ts`

- [x] **Task 3: Create BankAccount Prisma read model and update projection** (AC: 1)
  - [x] 3.1 Add `BankAccount` model to `backend/prisma/schema.prisma` — id, entityId (FK to OwnershipEntity), type ('bank_account' | 'cash_register'), label, iban (nullable for cash register), bic (nullable), bankName (nullable for cash register), isDefault (Boolean), createdAt, updatedAt. Add relation to OwnershipEntity. Add `@@map("bank_accounts")`, `@@index([entityId])`
  - [x] 3.2 Run `npx prisma migrate dev --name add-bank-accounts`
  - [x] 3.3 Update `backend/src/presentation/entity/projections/entity.projection.ts` — Add handlers for `BankAccountAdded`, `BankAccountUpdated`, `BankAccountRemoved` events. On add: create BankAccount row. On update: update BankAccount row (existence check + warn if missing). On remove: delete BankAccount row

- [x] **Task 4: Create bank account presentation layer (controllers + queries)** (AC: 1)
  - [x] 4.1 Create `backend/src/presentation/entity/controllers/add-a-bank-account.controller.ts` — POST `/api/entities/:entityId/bank-accounts` → 202 Accepted, extract userId from JWT, dispatch AddABankAccountCommand, UnauthorizedException guard
  - [x] 4.2 Create `backend/src/presentation/entity/controllers/update-a-bank-account.controller.ts` — PUT `/api/entities/:entityId/bank-accounts/:accountId` → 202 Accepted
  - [x] 4.3 Create `backend/src/presentation/entity/controllers/remove-a-bank-account.controller.ts` — DELETE `/api/entities/:entityId/bank-accounts/:accountId` → 202 Accepted
  - [x] 4.4 Create `backend/src/presentation/entity/controllers/get-bank-accounts.controller.ts` — GET `/api/entities/:entityId/bank-accounts` → 200 `{ data: BankAccount[] }`, scoped by userId
  - [x] 4.5 Create `backend/src/presentation/entity/dto/add-a-bank-account.dto.ts` — class-validator: @IsUUID accountId, @IsIn(['bank_account','cash_register']) type, @IsString @Length(1,100) label, @IsOptional @Matches IBAN regex iban, @IsOptional @Matches BIC regex bic, @IsOptional @IsString bankName, @IsBoolean isDefault
  - [x] 4.6 Create `backend/src/presentation/entity/dto/update-a-bank-account.dto.ts` — class-validator with all optional fields
  - [x] 4.7 Create `backend/src/presentation/entity/queries/get-bank-accounts.query.ts` and handler — query by entityId, verify entity ownership (userId), return bank accounts list
  - [x] 4.8 Register new controllers, query handlers in `entity-presentation.module.ts`

- [x] **Task 5: Create frontend bank account management UI** (AC: 1)
  - [x] 5.1 Create `frontend/src/app/(auth)/entities/[id]/bank-accounts/page.tsx` — Bank account management page for an entity, loads entity + bank accounts
  - [x] 5.2 Create `frontend/src/components/features/entities/bank-account-form.tsx` — React Hook Form + Zod: type (bank_account/cash_register select), label, IBAN (conditionally required for bank_account), BIC (optional), bank name (optional), isDefault checkbox. French labels. Conditionally hide IBAN/BIC/bankName fields when type is 'cash_register'
  - [x] 5.3 Create `frontend/src/components/features/entities/bank-account-list.tsx` — List bank accounts + cash registers for entity, shows default badge, edit/remove actions
  - [x] 5.4 Create `frontend/src/components/features/entities/bank-account-card.tsx` — Card showing: type icon (Landmark for bank, Banknote for cash), label, masked IBAN (show last 4), bank name, default badge
  - [x] 5.5 Add "Comptes bancaires" link/button on entity detail/edit page to navigate to `/entities/[id]/bank-accounts`
  - [x] 5.6 Install additional shadcn/ui components if needed: `badge`, `dialog` (for confirmation), `checkbox`

- [x] **Task 6: Create frontend API client and hooks for bank accounts** (AC: 1)
  - [x] 6.1 Create `frontend/src/lib/api/bank-accounts-api.ts` — API client: addBankAccount, updateBankAccount, removeBankAccount, getBankAccounts. Uses existing `fetchWithAuth` pattern from entities-api.ts (extract to shared utility or duplicate)
  - [x] 6.2 Create `frontend/src/hooks/use-bank-accounts.ts` — TanStack Query hooks: `useBankAccounts(entityId)`, `useAddBankAccount()`, `useUpdateBankAccount()`, `useRemoveBankAccount()`. Optimistic updates following exact same pattern as use-entities.ts (onMutate/onError/onSettled with delayed invalidation)

- [x] **Task 7: Update ActionFeed with bank account onboarding** (AC: 1)
  - [x] 7.1 After entity creation, if entity has no bank accounts, ActionFeed should show "Ajoutez un compte bancaire" action pointing to `/entities/[entityId]/bank-accounts`
  - [x] 7.2 ActionFeed already has onboarding actions array — add bank account CTA in sequence after entity creation (hardcoded for now)

- [x] **Task 8: Backend tests** (AC: 1)
  - [x] 8.1 Unit tests for entity aggregate bank account methods: addBankAccount (bank_account + cash_register), updateBankAccount, removeBankAccount, default enforcement (only one default), ownership validation (userId check), VO validation errors (invalid IBAN/BIC/label)
  - [x] 8.2 Unit tests for new command handlers (verify ZERO-logic delegation)
  - [x] 8.3 Controller tests for all 4 new controllers (add, update, remove, get), verify 202 responses for commands, 200 for query, UnauthorizedException guards
  - [x] 8.4 Verify ALL existing tests still pass (70 tests from Story 2.1 — MUST NOT regress)

- [x] **Task 9: Accessibility, validation, and verification** (AC: 1)
  - [x] 9.1 Form accessibility: labels linked to inputs, error messages via aria-describedby, keyboard navigation
  - [x] 9.2 French labels on all form fields and validation messages
  - [x] 9.3 Dark mode: all new components use CSS variable tokens (no hardcoded colors)
  - [x] 9.4 Run `npm run lint` in both frontend and backend — zero errors
  - [x] 9.5 Run `npx tsc --noEmit` in both frontend and backend — zero TypeScript errors
  - [x] 9.6 Run `npm test` in backend — all tests pass (existing + new, 0 failures)
  - [x] 9.7 IBAN masking in UI (show country + last 4 only: `FR** **** **** **** **76 32`)

## Dev Notes

### CRITICAL: Bank Accounts Live INSIDE the Entity Aggregate

Per AC: "bank account details are stored as part of the entity aggregate." This means:
- Bank accounts are **child entities** of the EntityAggregate (NOT a separate aggregate)
- All bank account events are emitted on the **same event stream** as the entity: `entity_{entityId}`
- The aggregate manages the bank accounts collection internally
- Commands target the entity aggregate (loaded by entityId), which delegates to its bank account methods
- The read model uses a **separate `bank_accounts` table** in PostgreSQL (with FK to `ownership_entities`) for efficient querying

### Architecture Compliance — CRITICAL RULES

**Hexagonal CQRS/ES Pattern (same as Story 2.1):**
- `portfolio/entity/` = Write side (KurrentDB only) — bank account logic lives here, inside the entity aggregate
- `presentation/entity/` = Read side (PostgreSQL only) — separate table for bank accounts
- Command handlers contain **ZERO business logic** — load aggregate, call method, save. Period.
- **ALL business logic in the aggregate** — validation, rules, event emission
- Frontend generates UUIDs for accountId (`crypto.randomUUID()`) — commands return `202 Accepted` with no body

**Naming Conventions (established in Story 2.1):**
- Commands: VerbANoun → `AddABankAccountCommand`, `UpdateABankAccountCommand`, `RemoveABankAccountCommand`
- Events: PastTense → `BankAccountAdded`, `BankAccountUpdated`, `BankAccountRemoved`
- Files: kebab-case → `add-a-bank-account.command.ts`, `bank-account-added.event.ts`
- Classes: PascalCase → `AddABankAccountCommand`, `BankAccountAdded`
- Stream: same entity stream `entity_{entityId}` (bank accounts are child entities)

**Anti-Patterns (FORBIDDEN — same as Story 2.1):**
- Putting business logic in command handlers
- Importing Prisma or PostgreSQL in `portfolio/`
- Importing KurrentDB client in `presentation/` (except projections)
- Returning data from command endpoints (commands return `202` only)
- Querying without userId filter (breaks user isolation)
- Creating a separate aggregate for bank accounts (they belong to Entity)
- Using `invalidateQueries` immediately in `onSettled` (use delayed invalidation: `setTimeout(() => invalidate(), 1500)`)
- Forgetting `.js` extensions in backend imports — moduleResolution: "nodenext" requires it
- Hardcoding colors — use CSS variable tokens
- Adding `"use client"` unless the component needs useState/useEffect/event handlers

### Backend File Structure

```
backend/src/
├── portfolio/
│   └── entity/                               # EXISTING MODULE — EXTEND
│       ├── entity.aggregate.ts               # MODIFY: add bank account methods + state
│       ├── entity.module.ts                  # MODIFY: register new command handlers
│       ├── iban.ts                           # NEW: IBAN Value Object
│       ├── bic.ts                            # NEW: BIC Value Object
│       ├── bank-account-label.ts             # NEW: Label Value Object
│       ├── bank-name.ts                      # NEW: BankName Value Object
│       ├── commands/
│       │   ├── add-a-bank-account.command.ts     # NEW
│       │   ├── add-a-bank-account.handler.ts     # NEW: ZERO-logic handler
│       │   ├── update-a-bank-account.command.ts  # NEW
│       │   ├── update-a-bank-account.handler.ts  # NEW
│       │   ├── remove-a-bank-account.command.ts  # NEW
│       │   └── remove-a-bank-account.handler.ts  # NEW
│       ├── events/
│       │   ├── bank-account-added.event.ts       # NEW
│       │   ├── bank-account-updated.event.ts     # NEW
│       │   └── bank-account-removed.event.ts     # NEW
│       ├── exceptions/
│       │   ├── invalid-iban.exception.ts          # NEW
│       │   ├── invalid-bic.exception.ts           # NEW
│       │   ├── invalid-bank-account-label.exception.ts  # NEW
│       │   ├── invalid-bank-name.exception.ts     # NEW
│       │   ├── bank-account-not-found.exception.ts # NEW
│       │   ├── cash-register-cannot-be-default.exception.ts # NEW
│       │   ├── cash-register-already-exists.exception.ts # NEW
│       │   └── invalid-bank-account-type.exception.ts # NEW
│       └── __tests__/
│           └── entity.aggregate.spec.ts      # MODIFY: add bank account tests
│
├── presentation/
│   └── entity/                               # EXISTING MODULE — EXTEND
│       ├── entity-presentation.module.ts     # MODIFY: register new controllers + queries
│       ├── controllers/
│       │   ├── add-a-bank-account.controller.ts      # NEW
│       │   ├── update-a-bank-account.controller.ts   # NEW
│       │   ├── remove-a-bank-account.controller.ts   # NEW
│       │   └── get-bank-accounts.controller.ts       # NEW
│       ├── dto/
│       │   ├── add-a-bank-account.dto.ts             # NEW
│       │   └── update-a-bank-account.dto.ts          # NEW
│       ├── queries/
│       │   ├── get-bank-accounts.query.ts            # NEW
│       │   └── get-bank-accounts.handler.ts          # NEW
│       ├── projections/
│       │   └── entity.projection.ts                  # MODIFY: add BankAccountAdded/Updated/Removed handlers
│       └── __tests__/
│           ├── add-a-bank-account.controller.spec.ts     # NEW
│           ├── update-a-bank-account.controller.spec.ts  # NEW
│           ├── remove-a-bank-account.controller.spec.ts  # NEW
│           └── get-bank-accounts.controller.spec.ts      # NEW
│
├── infrastructure/ (NO changes)
├── shared/ (NO changes)
└── app.module.ts (NO changes — entity modules already imported)
```

### Frontend File Structure

```
frontend/src/
├── app/
│   └── (auth)/
│       └── entities/
│           └── [id]/
│               ├── edit/
│               │   └── page.tsx              # MODIFY: add bank accounts link
│               └── bank-accounts/            # NEW ROUTE
│                   └── page.tsx              # Bank account management page
├── components/
│   └── features/
│       └── entities/
│           ├── bank-account-form.tsx         # NEW: React Hook Form + Zod
│           ├── bank-account-list.tsx         # NEW
│           └── bank-account-card.tsx         # NEW
├── hooks/
│   └── use-bank-accounts.ts                 # NEW: TanStack Query hooks
├── lib/
│   └── api/
│       └── bank-accounts-api.ts             # NEW: API client functions
└── types/
    └── api.ts                               # MODIFY: add BankAccount types (if exists, else add to bank-accounts-api.ts)
```

### Bank Account Data Model

**Internal aggregate state (added to EntityAggregate):**
```typescript
interface BankAccountState {
  accountId: string;           // UUID generated by frontend
  type: 'bank_account' | 'cash_register';
  label: string;               // e.g., "Compte courant LCL", "Caisse"
  iban: string | null;         // Required for bank_account, null for cash_register
  bic: string | null;          // Optional, null for cash_register
  bankName: string | null;     // e.g., "LCL", null for cash_register
  isDefault: boolean;          // Only one bank_account can be default
}
```

**Prisma read model:**
```prisma
model BankAccount {
  id        String   @id @default(uuid())
  entityId  String   @map("entity_id")
  type      String   // 'bank_account' | 'cash_register'
  label     String
  iban      String?
  bic       String?
  bankName  String?  @map("bank_name")
  isDefault Boolean  @default(false) @map("is_default")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  entity    OwnershipEntity @relation(fields: [entityId], references: [id])

  @@map("bank_accounts")
  @@index([entityId])
}
```

**IMPORTANT: Also update OwnershipEntity to add relation:**
```prisma
model OwnershipEntity {
  // ... existing fields ...
  bankAccounts BankAccount[]
  // ...
}
```

### API Endpoints

```
POST   /api/entities/:entityId/bank-accounts              → AddABankAccountCommand → 202 Accepted (no body)
PUT    /api/entities/:entityId/bank-accounts/:accountId    → UpdateABankAccountCommand → 202 Accepted (no body)
DELETE /api/entities/:entityId/bank-accounts/:accountId    → RemoveABankAccountCommand → 202 Accepted (no body)
GET    /api/entities/:entityId/bank-accounts               → GetBankAccountsQuery → 200 { data: BankAccount[] }
```

**Command payload (POST /api/entities/:entityId/bank-accounts):**
```json
{
  "accountId": "uuid-generated-by-frontend",
  "type": "bank_account",
  "label": "Compte courant LCL",
  "iban": "FR7630002005500000157845Z02",
  "bic": "CRLYFRPP",
  "bankName": "LCL",
  "isDefault": true
}
```

**Cash register payload:**
```json
{
  "accountId": "uuid-generated-by-frontend",
  "type": "cash_register",
  "label": "Caisse",
  "isDefault": false
}
```

### Domain Rules (Business Logic in Aggregate)

1. **Only one default bank account** — When adding/updating a bank account with `isDefault: true`, any existing default must be unset. Emit `BankAccountUpdated` event for the previous default to set `isDefault: false` before emitting the new event.
2. **Cash register cannot be default** — Only `bank_account` type can be `isDefault: true`. Cash registers are for manual cash payment tracking.
3. **IBAN required for bank accounts** — `type: 'bank_account'` requires a valid IBAN. Cash registers do not.
4. **BIC optional** — BIC is always optional (can be derived from IBAN prefix in many cases, but we don't auto-derive).
5. **Bank name optional for bank accounts** — Nice to have but not required.
6. **Ownership check** — The aggregate verifies `userId` matches before allowing bank account operations (same as entity update).
7. **Account removal** — If the removed account was default, no automatic reassignment. The user must explicitly set a new default.
8. **Cash register limit** — Only ONE cash register per entity (business rule: one caisse per SCI/entity).

### Entity Aggregate Extension Pattern

The entity aggregate already manages entity state. Bank accounts are added as a child collection:

```typescript
// In entity.aggregate.ts — add to existing class

private bankAccounts: Map<string, BankAccountState> = new Map();

addBankAccount(
  userId: string,
  accountId: string,
  type: string,
  label: string,
  iban: string | null,
  bic: string | null,
  bankName: string | null,
  isDefault: boolean,
): void {
  if (!this.created) throw EntityNotFoundException.create();
  if (this.userId.value !== userId) throw UnauthorizedEntityAccessException.create();

  // Validate VOs
  const voLabel = BankAccountLabel.fromString(label);
  if (type !== 'bank_account' && type !== 'cash_register') {
    throw InvalidBankAccountTypeException.create(type);
  }
  const voType = type as 'bank_account' | 'cash_register';
  const voIban = iban ? Iban.fromString(iban) : Iban.empty();
  const voBic = bic ? Bic.fromString(bic) : Bic.empty();
  const voBankName = bankName ? BankName.fromString(bankName) : BankName.empty();

  // Domain rules
  if (voType === 'bank_account' && voIban.isEmpty) {
    throw InvalidIbanException.requiredForBankAccount();
  }
  if (voType === 'cash_register' && isDefault) {
    throw CashRegisterCannotBeDefaultException.create();
  }
  // Enforce single cash register
  if (voType === 'cash_register') {
    const hasCashRegister = [...this.bankAccounts.values()].some(a => a.type === 'cash_register');
    if (hasCashRegister) throw CashRegisterAlreadyExistsException.create();
  }

  // Unset previous default if setting new default
  if (isDefault) {
    const currentDefault = [...this.bankAccounts.entries()].find(([, a]) => a.isDefault);
    if (currentDefault) {
      this.apply(new BankAccountUpdated({
        id: this.id,
        entityId: this.id,
        accountId: currentDefault[0],
        isDefault: false,
      }));
    }
  }

  this.apply(new BankAccountAdded({
    id: this.id,
    entityId: this.id,
    accountId,
    type: voType,
    label: voLabel.value,
    iban: voIban.value,
    bic: voBic.value,
    bankName: voBankName.value,
    isDefault,
  }));
}
```

### Frontend Form Pattern (Same as Story 2.1)

**Zod schema for bank account:**
```typescript
// IMPORTANT: NEVER use .default() or .refine() with zodResolver — breaks type inference
// Cross-field validation (IBAN required for bank_account) done in handleSubmit via form.setError()
const bankAccountSchema = z.object({
  type: z.enum(['bank_account', 'cash_register']),
  label: z.string().min(1, "Le libellé est requis").max(100),
  iban: z.string().regex(/^FR\d{2}[A-Z0-9]{23}$/, "Format IBAN français invalide").optional().or(z.literal('')),
  bic: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Format BIC invalide").optional().or(z.literal('')),
  bankName: z.string().max(100).optional().or(z.literal('')),
  isDefault: z.boolean(),
});
```

**UUID generation:**
```typescript
const handleSubmit = async (data: BankAccountFormData) => {
  const accountId = crypto.randomUUID();
  await addBankAccount({ entityId, accountId, ...data });
};
```

### Previous Story Intelligence

**From Story 2.1 (critical patterns to follow):**
- Entity aggregate at `backend/src/portfolio/entity/entity.aggregate.ts` — extend this file, do NOT create a new aggregate
- VOs flat in module root (no `value-objects/` subdirectory): `iban.ts`, `bic.ts`, `bank-account-label.ts`, `bank-name.ts`
- Named exceptions in `exceptions/` subdirectory with static factory methods
- Private constructor + static factory on all VOs: `Iban.fromString(value)`, `Bic.fromString(value)`
- Null Object pattern: `Iban.empty()`, `Bic.empty()`, `BankName.empty()` for nullable fields
- Projection uses existence check before update (warn+return if missing)
- Projection uses upsert for create events
- Per-action controllers (SRP): one controller per HTTP action, each with a single `handle()` method
- TanStack Query: `onMutate` → optimistic update, `onError` → rollback, `onSettled` → delayed invalidation (setTimeout 1500ms)
- `fetchWithAuth` in entities-api.ts wraps fetch with Clerk JWT token
- Zod: use `.regex()` only (not `.length()` + `.regex()` together — causes type inference issues)
- `@CurrentUser()` decorator extracts userId from JWT
- `UnauthorizedException` guard on all command/query endpoints (verify userId owns entity)

**Debug learnings from Story 2.1 (avoid these pitfalls):**
- Jest moduleNameMapper: `.js` extension stripping needs TWO entries each: `^@alias/(.*)\\.js$` and `^@alias/(.*)`
- nestjs-cqrx mock: per-instance event storage via Symbol to prevent test cross-contamination
- Webpack extensionAlias: `.js` → `['.ts', '.js']` already configured
- TanStack Query: NO `invalidateQueries` in onSettled without delay — projection lag overwrites optimistic data

### Git Intelligence

**Commit convention:** `feat(scope): description` — conventional commits
**Last commits for Story 2.1:**
1. `591e722` — `fix(frontend): add delayed cache reconciliation after mutations`
2. `e5d3af0` — `refactor(backend): reduce duplication and improve type safety`
3. `1096db6` — `refactor(backend): introduce bounded contexts and improve DDD alignment`
4. `2269ed1` — `feat(entity): implement ownership entity management with CQRS/Event Sourcing`

**NOTE:** The codebase was refactored to use bounded context structure: `portfolio/entity/` (not `domain/entity/`). Story file references `domain/entity/` but actual path is `portfolio/entity/`. This story uses the correct actual paths.

### Technology Versions (Same as Story 2.1 — Already Installed)

| Package | Version | Notes |
|---------|---------|-------|
| nestjs-cqrx | 5.0.0 | CQRS/ES framework — already configured |
| @prisma/client | 7.3.0 | PostgreSQL ORM — already configured |
| class-validator | 0.14.1 | DTO validation — already available |
| @tanstack/react-query | already installed | Frontend data fetching |
| react-hook-form | already installed | Form management |
| zod | already installed | Schema validation |
| @hookform/resolvers | already installed | Zod integration |
| shadcn/ui | already initialized | UI components |

### TypeScript Module Resolution

**Backend uses `moduleResolution: "nodenext"`** — ALL imports must include `.js` extension:
```typescript
import { Iban } from './iban.js';
import { BankAccountAdded } from './events/bank-account-added.event.js';
```
Only `node_modules` imports skip extension: `import { Module } from '@nestjs/common';`

### What NOT to Build

- **No Open Banking API integration** — that's Story 9.1
- **No bank statement import** — that's Epic 5 (Story 5.1)
- **No payment matching** — that's Epic 5 (Story 5.2)
- **No account book / accounting** — that's Epic 8
- **No EntitySwitcher** — that's Story 2.3
- **No entityId middleware** — not needed yet, entity IS the top-level resource, bank accounts are nested under entity
- **No accountant access** — that's Epic 9
- **No IBAN validation via external API** — basic format validation only (regex)
- **No IBAN auto-formatting** — user enters raw IBAN, display formats with spaces

### Project Structure Notes

- Extends existing `portfolio/entity/` module — no new modules in app.module.ts
- Bank accounts are child entities of the EntityAggregate, NOT a separate aggregate
- New Prisma table `bank_accounts` with FK to `ownership_entities`
- First sub-resource pattern — `/api/entities/:entityId/bank-accounts` establishes nested resource URL pattern
- First delete operation in the project — `RemoveABankAccountCommand` establishes the removal pattern

### References

- [Source: epics.md#Story 2.2] — Acceptance criteria: "associate bank accounts and a cash register to each entity"
- [Source: epics.md#Epic 2] — Epic goal: "user can create ownership entities (SCIs), properties, and units"
- [Source: epics.md#FR3] — "Bailleur can associate multiple bank accounts and a cash register to each entity"
- [Source: architecture.md#Enforcement Guidelines] — CQRS/ES rules, VO patterns, per-action controllers, anti-patterns
- [Source: architecture.md#Implementation Patterns] — VerbANoun commands, PastTense events, kebab-case files
- [Source: architecture.md#API & Communication Patterns] — REST with CQRS semantics, 202 Accepted, frontend UUID generation
- [Source: architecture.md#Frontend Architecture] — TanStack Query optimistic updates, React Hook Form + Zod
- [Source: ux-design-specification.md#Journey 1: Onboarding] — Entity creation flow includes bank accounts step
- [Source: ux-design-specification.md#Form Patterns] — Form structure, validation, progressive disclosure
- [Source: 2-1-create-and-manage-ownership-entities.md] — All established patterns, VOs, exceptions, controller structure, test patterns, debug learnings
- [Source: architecture.md#Bounded Contexts] — Portfolio BC owns Entity aggregate (FR1-8)
- [Source: prd.md#FR3] — Bank account association requirement

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Prisma client type error after schema change → fixed with `npx prisma generate`
- Zod `.refine()` + `.default(false)` type inference conflict with react-hook-form zodResolver → fixed by removing `.default()` and `.refine()` from schema, using defaultValues instead
- Frontend lint warnings (react-hooks/incompatible-library for `form.watch()`) are pre-existing React Compiler warnings, not errors

### Completion Notes List

- 9 tasks, 55+ subtasks — all completed
- 109 backend tests (20 suites), 0 failures — includes 39 new tests for bank accounts
- Backend lint: 0 errors, Frontend lint: 0 errors (2 pre-existing warnings)
- TypeScript: 0 errors in both frontend and backend
- First sub-resource pattern established: `/api/entities/:entityId/bank-accounts`
- First delete operation in the project: `RemoveABankAccountCommand`
- Bank accounts stored as child entities in EntityAggregate (same event stream)
- Cash register limited to one per entity (domain rule enforced in aggregate)

### File List

**NEW backend files:**
- `backend/src/portfolio/entity/iban.ts`
- `backend/src/portfolio/entity/bic.ts`
- `backend/src/portfolio/entity/bank-account-label.ts`
- `backend/src/portfolio/entity/bank-name.ts`
- `backend/src/portfolio/entity/exceptions/invalid-iban.exception.ts`
- `backend/src/portfolio/entity/exceptions/invalid-bic.exception.ts`
- `backend/src/portfolio/entity/exceptions/invalid-bank-account-label.exception.ts`
- `backend/src/portfolio/entity/exceptions/invalid-bank-name.exception.ts`
- `backend/src/portfolio/entity/exceptions/bank-account-not-found.exception.ts`
- `backend/src/portfolio/entity/exceptions/cash-register-cannot-be-default.exception.ts`
- `backend/src/portfolio/entity/exceptions/cash-register-already-exists.exception.ts`
- `backend/src/portfolio/entity/exceptions/invalid-bank-account-type.exception.ts`
- `backend/src/portfolio/entity/events/bank-account-added.event.ts`
- `backend/src/portfolio/entity/events/bank-account-updated.event.ts`
- `backend/src/portfolio/entity/events/bank-account-removed.event.ts`
- `backend/src/portfolio/entity/commands/add-a-bank-account.command.ts`
- `backend/src/portfolio/entity/commands/add-a-bank-account.handler.ts`
- `backend/src/portfolio/entity/commands/update-a-bank-account.command.ts`
- `backend/src/portfolio/entity/commands/update-a-bank-account.handler.ts`
- `backend/src/portfolio/entity/commands/remove-a-bank-account.command.ts`
- `backend/src/portfolio/entity/commands/remove-a-bank-account.handler.ts`
- `backend/src/presentation/entity/controllers/add-a-bank-account.controller.ts`
- `backend/src/presentation/entity/controllers/update-a-bank-account.controller.ts`
- `backend/src/presentation/entity/controllers/remove-a-bank-account.controller.ts`
- `backend/src/presentation/entity/controllers/get-bank-accounts.controller.ts`
- `backend/src/presentation/entity/dto/add-a-bank-account.dto.ts`
- `backend/src/presentation/entity/dto/update-a-bank-account.dto.ts`
- `backend/src/presentation/entity/queries/get-bank-accounts.query.ts`
- `backend/src/presentation/entity/queries/get-bank-accounts.handler.ts`
- `backend/prisma/migrations/20260210222139_add_bank_accounts/migration.sql`
- `backend/src/portfolio/entity/__tests__/add-a-bank-account.handler.spec.ts`
- `backend/src/portfolio/entity/__tests__/update-a-bank-account.handler.spec.ts`
- `backend/src/portfolio/entity/__tests__/remove-a-bank-account.handler.spec.ts`
- `backend/src/presentation/entity/__tests__/add-a-bank-account.controller.spec.ts`
- `backend/src/presentation/entity/__tests__/update-a-bank-account.controller.spec.ts`
- `backend/src/presentation/entity/__tests__/remove-a-bank-account.controller.spec.ts`
- `backend/src/presentation/entity/__tests__/get-bank-accounts.controller.spec.ts`

**MODIFIED backend files:**
- `backend/src/portfolio/entity/entity.aggregate.ts` — added bank account methods + state
- `backend/src/portfolio/entity/entity.module.ts` — registered new command handlers
- `backend/src/presentation/entity/entity-presentation.module.ts` — registered new controllers + query handler
- `backend/src/presentation/entity/projections/entity.projection.ts` — added bank account event handlers
- `backend/prisma/schema.prisma` — added BankAccount model + OwnershipEntity relation
- `backend/src/portfolio/entity/__tests__/entity.aggregate.spec.ts` — added 25 bank account tests
- `backend/src/presentation/entity/__tests__/create-an-entity.controller.spec.ts` — refactored import paths to use @portfolio alias
- `backend/src/presentation/entity/__tests__/update-an-entity.controller.spec.ts` — refactored import paths to use @portfolio alias

**NEW frontend files:**
- `frontend/src/app/(auth)/entities/[id]/bank-accounts/page.tsx`
- `frontend/src/components/features/entities/bank-account-form.tsx`
- `frontend/src/components/features/entities/bank-account-list.tsx`
- `frontend/src/components/features/entities/bank-account-card.tsx`
- `frontend/src/hooks/use-bank-accounts.ts`
- `frontend/src/lib/api/bank-accounts-api.ts`
- `frontend/src/lib/api/fetch-with-auth.ts`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/checkbox.tsx`
- `frontend/src/components/ui/alert-dialog.tsx`

**MODIFIED frontend files:**
- `frontend/src/app/(auth)/entities/[id]/edit/page.tsx` — added bank accounts link
- `frontend/src/components/features/dashboard/action-feed.tsx` — added bank account onboarding action
- `frontend/src/lib/api/entities-api.ts` — extracted fetchWithAuth to shared module
- `frontend/package-lock.json` — dependency changes
