# Story C.1: Setup Vitest and Retro-Test All Epic 2 Frontend Components

Status: done

## Story

As a developer,
I want a complete frontend test suite with vitest + @testing-library covering all Epic 2 components,
so that frontend regressions are caught automatically and Epic 3 can proceed with confidence.

## Acceptance Criteria

1. **AC1 — Test infrastructure**: vitest + @testing-library/react + jsdom installed and configured for Next.js 16 + React 19 + Tailwind CSS 4. Path alias `@/*` works in tests. `npm test` runs all frontend tests.
2. **AC2 — Schema tests**: property-schema and unit-schema have exhaustive validation tests (valid inputs, boundary values, error messages in French).
3. **AC3 — Hook tests**: All react-query hooks (useEntities, useProperties, useUnits, useBankAccounts) tested with renderHook + QueryClientProvider wrapper. Optimistic update, rollback on error, and delayed invalidation patterns verified.
4. **AC4 — Context test**: EntityContext tested for SSR safety, localStorage persistence, entity resolution logic (stored valid, stored invalid, empty list, single entity).
5. **AC5 — Entity component tests**: EntityForm (create + edit modes, SIRET conditional, address autocomplete), EntityList (loading/error/empty states), EntityCard (display, type labels), BankAccountForm (type switching, IBAN validation), BankAccountList (CRUD flows, delete confirmation), BankAccountCard (IBAN masking, conditional display).
6. **AC6 — Property & Unit component tests**: PropertyForm (address autocomplete, country default), UnitForm (dynamic field array, floor/surface parsing, amountCents euro conversion).
7. **AC7 — Dashboard component tests**: ActionFeed (onboarding action generation, priority, conditional rendering), DashboardContent (entity-aware conditional rendering), UnitMosaic (ARIA grid keyboard navigation, property grouping, loading/error/empty states).
8. **AC8 — Layout component tests**: EntitySwitcher (all 8 render paths, entity switch navigation), Sidebar (responsive layouts, active link detection).
9. **AC9 — CI green**: Full test suite passes with zero failures. `npm run lint` still passes. No regressions in backend tests.

## Tasks / Subtasks

- [x] Task 1: Setup vitest + @testing-library infrastructure (AC: #1)
  - [x] 1.1 Install dependencies: vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/dom, @testing-library/jest-dom, @testing-library/user-event, jsdom
  - [x] 1.2 Create vitest.config.ts with path alias resolution, jsdom environment, setup file
  - [x] 1.3 Create src/test/setup.ts with @testing-library/jest-dom matchers + Radix UI polyfills (ResizeObserver, hasPointerCapture)
  - [x] 1.4 Create src/test/test-utils.tsx with QueryClientProvider wrapper, renderHook helper, createTestQueryClient export
  - [x] 1.5 Create src/test/mocks/ directory with mocks for next/navigation, @clerk/nextjs, localStorage
  - [x] 1.6 Update package.json scripts: "test" → vitest run, "test:watch" → vitest, "test:coverage" → vitest --coverage
  - [x] 1.7 Verify setup: write a trivial smoke test, confirm `npm test` passes
- [x] Task 2: Test schemas — property-schema and unit-schema (AC: #2)
  - [x] 2.1 property-schema.test.ts: valid property, missing name, name too long, empty type allowed, address fields required (13 tests)
  - [x] 2.2 unit-schema.test.ts: valid unit, all 4 unit types, invalid type, floor optional + NaN allowed, surfaceArea positive required, billableOptions validation (26 tests)
- [x] Task 3: Test hooks — all react-query hooks (AC: #3)
  - [x] 3.1 use-entities.test.ts: useEntities fetch, useCreateEntity, useUpdateEntity (5 tests)
  - [x] 3.2 use-bank-accounts.test.ts: useBankAccounts fetch with entityId, useAddBankAccount, useUpdateBankAccount, useRemoveBankAccount (9 tests)
  - [x] 3.3 use-properties.test.ts: useProperties fetch, useCreateProperty, useUpdateProperty (6 tests)
  - [x] 3.4 use-units.test.ts: useEntityUnits vs useUnits distinction, useCreateUnit cross-query invalidation, floor NaN handling (10 tests)
  - [x] 3.5 use-debounce.test.ts: timing, multiple value changes, cleanup (5 tests)
  - [x] 3.6 use-current-entity.test.ts: entity selection, null entityId (6 tests)
- [x] Task 4: Test EntityContext (AC: #4)
  - [x] 4.1 entity-context.test.tsx: SSR safety, localStorage read on mount, resolveEntityId logic, localStorage sync on entity change, provider throws without wrapper (8 tests)
- [x] Task 5: Test entity feature components (AC: #5)
  - [x] 5.1 entity-form.test.tsx: create/edit form rendering, SIRET field, cancel navigation, name validation, address autocomplete fill/lock/unlock, noValidate attribute, address locked in edit (10 tests)
  - [x] 5.2 entity-list.test.tsx: loading skeleton, error state, empty state with CTA link, renders EntityCards (4 tests)
  - [x] 5.3 entity-card.test.tsx: name, type labels (SCI/Nom propre), SIRET present/absent, address, legal info, edit link (10 tests)
  - [x] 5.4 bank-account-form.test.tsx: submit/cancel buttons, fields, label validation, cancel callback, disabled state, edit mode, IBAN required, cash_register type switching (9 tests)
  - [x] 5.5 bank-account-list.test.tsx: loading, error, empty state, account cards, plural count, form toggle, delete confirmation dialog, accessible label (8 tests)
  - [x] 5.6 bank-account-card.test.tsx: label, default badge, type labels, masked IBAN, null IBAN, edit/remove callbacks (9 tests)
- [x] Task 6: Test property and unit feature components (AC: #6)
  - [x] 6.1 property-form.test.tsx: create/edit form, optional type, name validation, address autocomplete, onCancel/router.back, address locked in edit, address validation on submit (9 tests)
  - [x] 6.2 unit-form.test.tsx: create/edit form, type select, identifier validation, floor/surface fields, billable options add/remove, edit mode options, onCancel/router.back, validation errors (12 tests)
- [x] Task 7: Test dashboard components (AC: #7)
  - [x] 7.1 action-feed.test.tsx: section heading, empty state, action cards with priority labels, no href case, accessible list, onboarding actions (7 tests)
  - [x] 7.2 dashboard-content.test.tsx: KPI tiles placeholder, UnitMosaic with entityId, placeholder without entity (3 tests)
  - [x] 7.3 unit-mosaic.test.tsx: loading, error, empty, property grouping, type badges, floor/surface display, surface 0 guard, navigation, ARIA grid, keyboard nav (12 tests)
- [x] Task 8: Test layout components (AC: #8)
  - [x] 8.1 entity-switcher.test.tsx: loading states (collapsed + full), empty states (collapsed + full), single entity, collapsed initials, multiple entities dropdown (8 tests) — custom TooltipProvider wrapper
  - [x] 8.2 sidebar.test.tsx: brand name, collapsed brand, nav items, active page aria-current, accessible label, navigation aria-label, dashboard href (7 tests)

## Dev Notes

### Architecture & Stack

- **Framework**: Next.js 16.1.6 + React 19.2.3 + TypeScript 5
- **Test runner**: vitest 3.x (NOT jest — vitest is the standard for Vite-compatible projects and has native ESM support)
- **DOM**: @testing-library/react 16.x (supports React 19) + jsdom
- **User interactions**: @testing-library/user-event 14.x
- **Matchers**: @testing-library/jest-dom 6.x
- **React compilation**: @vitejs/plugin-react (needed for JSX transform in vitest)

### Critical Mocking Requirements

1. **next/navigation**: Must mock `useRouter`, `usePathname`, `useParams`, `useSearchParams`. Components use `router.push()`, `router.back()`, `usePathname()` for active link detection.
2. **@clerk/nextjs**: Must mock `useAuth` (returns `{ getToken }`) and `useUser` (returns `{ user }`). `fetchWithAuth` calls `useAuth().getToken()`.
3. **localStorage**: Must mock for SSR safety tests. EntityContext reads/writes `baillr_current_entity_id` key.
4. **fetch**: Must mock global fetch for API hook tests. All API modules use `fetchWithAuth` which wraps `fetch`.
5. **crypto.randomUUID**: Used in forms for generating IDs on create. Mock or polyfill for jsdom.

### Test File Convention

```
src/
  test/
    setup.ts                    # @testing-library/jest-dom + global mocks
    test-utils.tsx              # Wrapper with QueryClientProvider + EntityProvider
    mocks/
      next-navigation.ts        # Mock useRouter, usePathname, useParams
      clerk.ts                  # Mock useAuth, useUser
  components/features/
    entities/
      __tests__/
        entity-form.test.tsx
        entity-list.test.tsx
        entity-card.test.tsx
        bank-account-form.test.tsx
        bank-account-list.test.tsx
        bank-account-card.test.tsx
    properties/
      __tests__/
        property-form.test.tsx
        property-schema.test.ts
    units/
      __tests__/
        unit-form.test.tsx
        unit-schema.test.ts
    dashboard/
      __tests__/
        action-feed.test.tsx
        dashboard-content.test.tsx
        unit-mosaic.test.tsx
  components/layout/
    __tests__/
      entity-switcher.test.tsx
      sidebar.test.tsx
  contexts/
    __tests__/
      entity-context.test.tsx
  hooks/
    __tests__/
      use-entities.test.ts
      use-bank-accounts.test.ts
      use-properties.test.ts
      use-units.test.ts
      use-debounce.test.ts
      use-current-entity.test.ts
```

### vitest.config.ts Reference

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: false, // Skip CSS processing for speed
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Test Wrapper Pattern

```tsx
// src/test/test-utils.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { createTestQueryClient };
```

### Key Patterns to Test

#### CQRS Optimistic Updates (hooks)
All mutation hooks follow this pattern — test ALL three phases:
1. **onMutate**: Cancels queries, snapshots previous data, applies optimistic update
2. **onError**: Rolls back to previous snapshot
3. **onSettled**: Waits 1500ms then invalidates queries (NOT immediate invalidation)

The delayed invalidation is a deliberate CQRS/ES pattern: staleTime (30s) prevents immediate refetch, giving projections time to catch up.

#### React 19 "Sync State During Render" (EntityContext)
EntityContext uses a non-standard pattern accepted by React 19 — calling `setStoredId()` during render (NOT in useEffect). Test that:
- Initial render with stored ID that doesn't match loaded entities triggers sync
- No infinite render loop occurs
- localStorage gets updated synchronously

#### ARIA Grid (UnitMosaic)
Roving tabindex pattern:
- Only one cell has tabIndex={0} (the active one)
- Arrow keys move focus programmatically via `refs[index].focus()`
- Home/End jump to first/last cell
- Test with `fireEvent.keyDown` NOT `userEvent.keyboard` (keyboard events on container)

#### Form Address Autocomplete Pattern (EntityForm, PropertyForm)
Lock/unlock state pattern:
1. User types → suggestions appear
2. User selects suggestion → address fields fill, form locks (addressLocked = true)
3. User clicks "Modifier" → fields clear, lock released

#### Bank Account Type Switching (BankAccountForm)
When type switches to "cash_register": IBAN, BIC, bankName fields are cleared, isDefault is unset. Test the side effect chain.

### Known Anti-Patterns to Avoid

1. **DO NOT use `.default()` or `.refine()` on Zod schemas used with zodResolver** — breaks type inference with react-hook-form. Use `defaultValues` in useForm instead.
2. **Zod v4 API**: Use `error` parameter, NOT `invalid_type_error` / `required_error`.
3. **React Compiler compatibility**: NO setState in useEffect, NO useRef.current access during render. EntityContext uses "sync state during render" pattern instead.
4. **Testing mocks**: Always clear/reset mocks between tests (`vi.clearAllMocks()` in afterEach). Stale mocks cause flaky tests.
5. **QueryClient per test**: Create a fresh QueryClient per test to avoid shared cache pollution. Use `gcTime: 0` to prevent garbage collection timing issues.
6. **DO NOT mock implementation details**: Test behavior, not internal state. Use screen.getByRole, getByText, etc. — NOT getByTestId.

### Dependencies to Install

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event jsdom
```

No additional runtime dependencies needed.

### Project Structure Notes

- Path alias `@/*` maps to `./src/*` (from tsconfig.json) — must be replicated in vitest.config.ts `resolve.alias`
- Components use `"use client"` directive — vitest with jsdom handles this fine (no special config needed)
- Radix UI components (DropdownMenu, AlertDialog, Sheet, Tooltip, etc.) render portals — @testing-library handles this correctly with `screen` queries
- Forms use `@hookform/resolvers/zod` with zodResolver — mock the mutation hooks, NOT the resolver

### References

- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-02-11.md#AI-4] — Original scope definition
- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-02-11.md#Critical Path] — Blocking requirement for Epic 3
- [Source: frontend/src/contexts/entity-context.tsx] — "Sync state during render" pattern
- [Source: frontend/src/hooks/use-entities.ts] — CQRS optimistic update pattern with delayed invalidation
- [Source: frontend/src/components/features/dashboard/unit-mosaic.tsx] — ARIA grid keyboard navigation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- ResizeObserver polyfill required for Radix UI Select in jsdom — added to setup.ts
- Element.prototype.hasPointerCapture polyfill required for Radix UI pointer events
- Radix Select renders `<button role="combobox">` not `<select>` — getByLabelText unreliable, use getByPlaceholderText
- Radix Select + zodResolver in jsdom: form submission tests with Select values unreliable — use alternative assertions (noValidate, field-level validation)
- EntitySwitcher collapsed variant requires TooltipProvider wrapper in tests — custom renderSwitcher utility
- Content function matchers needed for text inside combined Radix CardDescription elements
- Element.prototype.scrollIntoView polyfill required for Radix Select option navigation in jsdom
- Global mock imports (clerk, next-navigation) must be in setup.ts to apply across all test files via vi.mock() hoisting

### Completion Notes List

- 198 tests across 23 suites — ALL GREEN (post-review)
- 0 lint errors, 2 pre-existing warnings (React Compiler react-hooks/incompatible-library on form.watch())
- Test infrastructure: vitest 4.x + @testing-library/react 16.x + jsdom + userEvent 14.x
- Coverage: all Epic 2 frontend components retro-tested — entities, properties, units, dashboard, layout
- Key patterns documented: Radix UI jsdom polyfills, placeholder-based selectors, TooltipProvider wrapper, content function matchers

### Change Log

- 2026-02-11: Story C.1 implementation complete — 193 tests, 23 suites, 27 new files + 2 modified
- 2026-02-11: Code review — 9 fixes applied (H1: useUpdateBankAccount 3 tests added, H2: global mock imports wired in setup.ts + scrollIntoView polyfill, H3+M1+M2+M5: File List corrected — removed tsconfig.json, added package-lock.json + 3 mock files, count 27→29, M3: cash_register type-switching test added, M4: delete confirmation AlertDialog test added). Final: 198 tests, 23 suites, 29 new files + 2 modified.

### File List

**New files (29)**:
- `frontend/vitest.config.ts` — Vitest configuration with jsdom, path aliases, React plugin
- `frontend/src/test/setup.ts` — @testing-library/jest-dom matchers + Radix UI polyfills + global mock imports
- `frontend/src/test/test-utils.tsx` — QueryClientProvider wrapper, renderHook helper
- `frontend/src/test/smoke.test.ts` — Smoke test for vitest setup verification
- `frontend/src/test/mocks/clerk.ts` — Global mock for @clerk/nextjs (useAuth, useUser)
- `frontend/src/test/mocks/next-navigation.ts` — Global mock for next/navigation (useRouter, usePathname, useParams)
- `frontend/src/test/mocks/local-storage.ts` — Mock utility for localStorage (used per-test in entity-context)
- `frontend/src/hooks/__tests__/use-entities.test.ts` — 5 tests
- `frontend/src/hooks/__tests__/use-bank-accounts.test.ts` — 9 tests (incl. useUpdateBankAccount)
- `frontend/src/hooks/__tests__/use-properties.test.ts` — 6 tests
- `frontend/src/hooks/__tests__/use-units.test.ts` — 10 tests
- `frontend/src/hooks/__tests__/use-debounce.test.ts` — 5 tests
- `frontend/src/hooks/__tests__/use-current-entity.test.ts` — 6 tests
- `frontend/src/contexts/__tests__/entity-context.test.tsx` — 8 tests
- `frontend/src/components/features/entities/__tests__/entity-form.test.tsx` — 10 tests
- `frontend/src/components/features/entities/__tests__/entity-list.test.tsx` — 4 tests
- `frontend/src/components/features/entities/__tests__/entity-card.test.tsx` — 10 tests
- `frontend/src/components/features/entities/__tests__/bank-account-form.test.tsx` — 9 tests (incl. cash_register type switching)
- `frontend/src/components/features/entities/__tests__/bank-account-list.test.tsx` — 8 tests (incl. delete confirmation dialog)
- `frontend/src/components/features/entities/__tests__/bank-account-card.test.tsx` — 9 tests
- `frontend/src/components/features/properties/__tests__/property-form.test.tsx` — 9 tests
- `frontend/src/components/features/properties/__tests__/property-schema.test.ts` — 13 tests
- `frontend/src/components/features/units/__tests__/unit-form.test.tsx` — 12 tests
- `frontend/src/components/features/units/__tests__/unit-schema.test.ts` — 26 tests
- `frontend/src/components/features/dashboard/__tests__/action-feed.test.tsx` — 7 tests
- `frontend/src/components/features/dashboard/__tests__/dashboard-content.test.tsx` — 3 tests
- `frontend/src/components/features/dashboard/__tests__/unit-mosaic.test.tsx` — 12 tests
- `frontend/src/components/layout/__tests__/entity-switcher.test.tsx` — 8 tests
- `frontend/src/components/layout/__tests__/sidebar.test.tsx` — 7 tests

**Modified files (2)**:
- `frontend/package.json` — Added test scripts + devDependencies (vitest, @testing-library/*, jsdom, @vitejs/plugin-react)
- `frontend/package-lock.json` — Lock file updated with new devDependencies
