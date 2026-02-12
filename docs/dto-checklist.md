# DTO Defense-in-Depth Checklist

> Copy-paste review checklist for class-validator decorators, Zod schema rules, VO double-validation, and aggregate guard clauses.
> Every DTO must satisfy these rules before code review approval.
>
> **Related docs:** [Anti-Patterns](./anti-patterns.md) | [Project Context](./project-context.md)

---

## Table of Contents

1. [class-validator Decorator Requirements](#1-class-validator-decorator-requirements)
2. [Zod Schema Rules](#2-zod-schema-rules)
3. [VO Double-Validation Pattern](#3-vo-double-validation-pattern)
4. [Aggregate Guard Clauses](#4-aggregate-guard-clauses)
5. [Create-DTO Template](#5-create-dto-template)
6. [Update-DTO Template](#6-update-dto-template)
7. [Review Checklist](#7-review-checklist)

---

## 1. class-validator Decorator Requirements

### String Fields

| Scenario | Required Decorators | Example |
|----------|-------------------|---------|
| Required string | `@IsString()` `@IsNotEmpty()` `@MaxLength(N)` | `name: string` |
| Required string (range) | `@IsString()` `@Length(min, max)` | `@Length(1, 255) name: string` |
| Optional string | `@IsOptional()` `@IsString()` `@MaxLength(N)` | `type?: string` |
| Nullable update string | `@ValidateIf((_o, v) => v !== null)` `@IsOptional()` `@IsString()` `@MaxLength(N)` | `type?: string \| null` |
| String with pattern | `@IsString()` `@Matches(/regex/, { message })` | IBAN, SIRET |

**Concrete example (from `CreateAnEntityDto`):**
```typescript
@IsString()
@IsNotEmpty()
@MaxLength(255)  // ← MANDATORY on every string field
name!: string;

@IsOptional()
@IsString()
@Length(14, 14)
@Matches(/^\d{14}$/, { message: 'SIRET must be 14 digits' })
siret?: string;
```

### Numeric Fields

| Scenario | Required Decorators | Example |
|----------|-------------------|---------|
| Required integer | `@IsInt()` `@Min(N)` `@Max(N)` | `floor: number` |
| Required decimal | `@IsNumber()` `@Min(N)` `@Max(N)` | `surfaceArea: number` |
| Optional number | `@IsOptional()` `@IsNumber()` `@Min(N)` `@Max(N)` | `surfaceArea?: number` |
| Nullable number (update) | `@ValidateIf((o) => o.field !== undefined && o.field !== null)` `@IsInt()` | `floor?: number \| null` |

**Concrete example (from `CreateAUnitDto`):**
```typescript
@IsNumber()
@Min(0.01)
@Max(99999)  // ← MANDATORY on every numeric field
surfaceArea!: number;
```

### Array Fields

| Scenario | Required Decorators |
|----------|-------------------|
| Required array | `@IsArray()` `@ArrayMaxSize(N)` `@ValidateNested({ each: true })` `@Type(() => ChildDto)` |
| Optional array | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(N)` `@ValidateNested({ each: true })` `@Type(() => ChildDto)` |

**Concrete example (from `CreateAUnitDto`):**
```typescript
@IsOptional()
@IsArray()
@ArrayMaxSize(50)  // ← MANDATORY on every array field
@ValidateNested({ each: true })
@Type(() => BillableOptionDto)
billableOptions?: BillableOptionDto[];
```

### Enum / Constrained Fields

| Scenario | Required Decorators | Example |
|----------|-------------------|---------|
| String enum | `@IsString()` `@IsIn([...values])` | `type: 'apartment' \| 'parking'` |
| TypeScript enum | `@IsEnum(EnumType)` | `status: EntityStatus` |

**Concrete example (from `AddABankAccountDto`):**
```typescript
@IsIn(['bank_account', 'cash_register'])
type!: 'bank_account' | 'cash_register';
```

### Other Fields

| Scenario | Required Decorators |
|----------|-------------------|
| UUID | `@IsUUID()` |
| Boolean | `@IsBoolean()` |
| Nested object (required) | `@ValidateNested()` `@Type(() => ChildDto)` |
| Nested object (optional) | `@IsOptional()` `@ValidateNested()` `@Type(() => ChildDto)` |

---

## 2. Zod Schema Rules

### Rules for schemas used with `zodResolver`

| Rule | Wrong | Right |
|------|-------|-------|
| No `.default()` | `z.enum([...]).default("x")` | Use `defaultValues` in `useForm()` |
| No `.refine()` | `schema.refine((d) => ...)` | Validate cross-field in `onSubmit` |
| Zod v4 error param | `{ invalid_type_error: "..." }` | `{ error: "..." }` |
| Regex only | `z.string().length(36).regex(...)` | `z.string().regex(...)` |

### Zod field patterns

```typescript
// Required string
z.string().min(1, { error: "Required" }).max(255)

// Optional string
z.string().max(255).optional()

// Nullable string (update forms)
z.string().max(255).nullable().optional()

// Number
z.number().min(0).max(99999)

// Integer
z.number().int().min(0).max(99999)

// Enum
z.enum(["apartment", "parking", "commercial", "storage"])

// Array of objects
z.array(billableOptionSchema).max(50).optional()

// UUID
z.string().uuid()
```

### Form integration pattern

```typescript
const schema = z.object({
  name: z.string().min(1, { error: "Required" }).max(255),
  type: z.enum(["apartment", "parking"]),
  floor: z.number().int().min(-5).max(200).nullable().optional(),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {   // ← Defaults here, NOT in schema
    name: "",
    type: "apartment",
    floor: null,
  },
});
```

---

## 3. VO Double-Validation Pattern

Every field must be validated at **two levels**: DTO (presentation boundary) and VO (domain boundary).

### Pattern

```
Request → DTO (@MaxLength(255)) → Command → Aggregate → VO (length check) → Event
```

### Example: EntityName

**DTO layer:**
```typescript
// create-an-entity.dto.ts
@IsString()
@Length(1, 255)
name!: string;
```

**VO layer (redundant by design):**
```typescript
// entity-name.vo.ts
class EntityName {
  private constructor(private readonly value: string) {}

  static create(value: string): EntityName {
    if (!value || value.trim().length === 0) {
      throw EntityNameRequiredException.create();
    }
    if (value.length > 255) {
      throw EntityNameTooLongException.create();
    }
    return new EntityName(value.trim());
  }
}
```

### Why both?

| Layer | Protects against |
|-------|-----------------|
| DTO (`@MaxLength`) | Direct HTTP requests, malformed API calls |
| VO (`length > 255`) | Event replay, migrations, code paths bypassing DTO |

The aggregate is the **last line of defense**. If data reaches the aggregate without going through a DTO (e.g., rebuilding from events, data migration), the VO must still enforce constraints.

---

## 4. Aggregate Guard Clauses

### Enum/Type validation in aggregate

Never trust `as` casts. Always validate with guard clause + named exception.

**Wrong:**
```typescript
const type = data.type as BankAccountType; // ❌ Silent on invalid values
```

**Right:**
```typescript
const ALLOWED_TYPES = ['bank_account', 'cash_register'] as const;
if (!ALLOWED_TYPES.includes(data.type)) {
  throw InvalidBankAccountTypeException.create(data.type);
}
```

### No-op guard on update

Before emitting an update event, verify there are actual changes:

```typescript
update(data: Partial<PropertyData>) {
  const eventData = { propertyId: this.id, ...data };
  if (Object.keys(eventData).length <= 1) return; // Only ID — nothing changed
  this.apply(new PropertyUpdated(eventData));
}
```

### Named exceptions pattern

```typescript
// Base class
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific exception
export class EntityNameRequiredException extends DomainException {
  static create(): EntityNameRequiredException {
    return new EntityNameRequiredException('Entity name is required');
  }
}
```

---

## 5. Create-DTO Template

Copy-paste template for new create DTOs:

```typescript
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  Length,
  MaxLength,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsIn,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAFooDto {
  // ── ID (always required) ──
  @IsUUID()
  id!: string;

  // ── Required string ──
  @IsString()
  @Length(1, 255)
  name!: string;

  // ── Optional string ──
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  // ── Enum-like string ──
  @IsString()
  @IsIn(['type_a', 'type_b'])
  type!: string;

  // ── Required number ──
  @IsNumber()
  @Min(0)
  @Max(99999)
  amount!: number;

  // ── Optional integer ──
  @IsOptional()
  @IsInt()
  @Min(-5)
  @Max(200)
  floor?: number;

  // ── Required boolean ──
  @IsBoolean()
  isActive!: boolean;

  // ── Required nested object ──
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  // ── Optional array of nested objects ──
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ChildItemDto)
  items?: ChildItemDto[];

  // ── Regex-validated string ──
  @IsOptional()
  @IsString()
  @Matches(/^FR\d{2}[A-Z0-9]{23}$/, { message: 'Invalid IBAN format' })
  iban?: string;
}
```

---

## 6. Update-DTO Template

Copy-paste template for new update DTOs:

```typescript
import {
  IsString,
  IsOptional,
  Length,
  MaxLength,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAFooDto {
  // ── Optional string (not nullable) ──
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  // ── Nullable string (can be explicitly set to null) ──
  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  // ── Optional enum ──
  @IsOptional()
  @IsString()
  @IsIn(['type_a', 'type_b'])
  type?: string;

  // ── Optional number ──
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99999)
  amount?: number;

  // ── Nullable integer (conditional validation) ──
  @ValidateIf((o: UpdateAFooDto) => o.floor !== undefined && o.floor !== null)
  @IsInt()
  @Min(-5)
  @Max(200)
  floor?: number | null;

  // ── Optional nested object ──
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  // ── Optional array of nested objects ──
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ChildItemDto)
  items?: ChildItemDto[];
}
```

### Key differences from Create-DTO:

| Aspect | Create-DTO | Update-DTO |
|--------|-----------|-----------|
| Field optionality | Required unless `@IsOptional()` | All fields `@IsOptional()` |
| Nullable fields | N/A | `@ValidateIf((_o, v) => v !== null)` before `@IsOptional()` |
| Nullable numbers | N/A | `@ValidateIf((o) => o.field !== undefined && o.field !== null)` without `@IsOptional()` |
| UUID id | Always present | Never present (from URL param) |
| Default validation | Same | Strings use `@Length(1, N)` (not `@IsNotEmpty()`) |

---

## 7. Review Checklist

Use this checklist for every DTO code review:

### class-validator Decorators

- [ ] Every string field has `@MaxLength(N)` or `@Length(min, max)`
- [ ] Every numeric field has `@Max(N)` (and `@Min(N)` if applicable)
- [ ] Every array field has `@ArrayMaxSize(N)`
- [ ] Every nested object has `@ValidateNested()` + `@Type(() => Dto)`
- [ ] Every array of nested has `@ValidateNested({ each: true })` + `@Type(() => Dto)`
- [ ] Optional fields have `@IsOptional()` as FIRST decorator (after `@ValidateIf` if present)
- [ ] Nullable update fields use `@ValidateIf((_o, v) => v !== null)`
- [ ] Enum-like fields use `@IsIn([...])` or `@IsEnum()`
- [ ] Regex fields use `@Matches()` with custom error message
- [ ] UUID fields use `@IsUUID()`

### Zod Schema

- [ ] No `.default()` on schema (use `defaultValues` in `useForm`)
- [ ] No `.refine()` on schema (validate cross-field in `onSubmit`)
- [ ] Uses `error` param, not `invalid_type_error`/`required_error` (Zod v4)
- [ ] String fields have `.max(N)` constraint
- [ ] Number fields have `.max(N)` constraint
- [ ] Array fields have `.max(N)` constraint

### VO Double-Validation

- [ ] Every DTO string constraint has matching VO length check
- [ ] VOs use private constructor + static `create()` factory
- [ ] VOs throw named `DomainException` subclasses (not `new Error()`)
- [ ] Null Object pattern (`.empty()`, `.isEmpty`) for optional VOs

### Aggregate Guard Clauses

- [ ] Enum values validated with guard clause (not `as` cast)
- [ ] Guard clause throws named domain exception
- [ ] No-op guard on update (check `Object.keys().length > 1`)
- [ ] All domain rules enforced in aggregate (not in handler)
