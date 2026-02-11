# Story 2.3: Implement Entity Switcher Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to switch between my entities within a single session,
so that I can manage multiple SCIs without logging out (FR4).

## Acceptance Criteria

1. **Given** I have multiple entities, **When** I click the EntitySwitcher in the sidebar header, **Then** I see a dropdown listing all my entities with their type (SCI/nom propre) and name
2. **Given** I see the entity dropdown, **When** I select an entity, **Then** the entire application context updates (all queries filter by this entityId), **And** the current entity name is displayed prominently in the sidebar
3. **Given** I switch entities, **When** the new entity is selected, **Then** the switch is instantaneous (no page reload), **And** all data displayed (properties, units, dashboard) reflects the selected entity only (NFR9 — tenant data isolation)
4. **Given** I have only one entity, **When** the sidebar renders, **Then** the EntitySwitcher displays the entity name without a dropdown (display only)
5. **Given** I have no entities, **When** the sidebar renders, **Then** the EntitySwitcher shows an empty state guiding to entity creation

## Tasks / Subtasks

- [x] **Task 1: Create EntityContext provider** (AC: 2, 3)
  - [x] 1.1 Create `frontend/src/contexts/entity-context.tsx` — React Context providing `{ currentEntityId, setCurrentEntityId, currentEntity }`. Persist selection in `localStorage` with key `baillr_current_entity_id`. On mount: if stored ID exists AND matches a loaded entity → use it; else auto-select first entity. Provide `EntityProvider` wrapping component.
  - [x] 1.2 Wrap `QueryProvider` with `EntityProvider` in `frontend/src/app/(auth)/layout.tsx` — EntityProvider sits INSIDE QueryProvider (needs React Query access to fetch entities)

- [x] **Task 2: Create EntitySwitcher component** (AC: 1, 2, 4, 5)
  - [x] 2.1 Create `frontend/src/components/layout/entity-switcher.tsx` — uses `useEntities()` and `EntityContext`. Renders a DropdownMenu (from shadcn/ui, already installed) with: trigger showing current entity name + type badge, menu items listing all entities with type + name, check icon on selected entity, "Gérer les entités" link at bottom
  - [x] 2.2 Single entity: display name and type badge, no dropdown arrow, no menu
  - [x] 2.3 No entities: display "Aucune entité" with link to `/entities/new`
  - [x] 2.4 Loading state: skeleton placeholder matching component dimensions

- [x] **Task 3: Integrate EntitySwitcher into sidebar** (AC: 1, 2)
  - [x] 3.1 Modify `frontend/src/components/layout/sidebar.tsx` — Add EntitySwitcher between SidebarBrand and navigation. Desktop (lg+): full EntitySwitcher with name + type. Tablet (md): collapsed EntitySwitcher showing only initials/icon. Mobile (Sheet): full EntitySwitcher same as desktop
  - [x] 3.2 Pass `collapsed` prop to EntitySwitcher for tablet variant

- [x] **Task 4: Wire entity context to data fetching** (AC: 3)
  - [x] 4.1 Create `frontend/src/hooks/use-current-entity.ts` — convenience hook: `useCurrentEntity()` returning `{ entityId, entity, setEntityId, isLoading }` from EntityContext
  - [x] 4.2 Update `frontend/src/hooks/use-bank-accounts.ts` — verify it already uses entityId parameter (it does — no changes needed, but verify)
  - [x] 4.3 Update `frontend/src/components/features/dashboard/action-feed.tsx` — make onboarding actions context-aware: if entities exist but no bank accounts for current entity, show bank account CTA with entityId in href

- [x] **Task 5: Update entity query caching for context** (AC: 3)
  - [x] 5.1 On entity switch: do NOT invalidate queries — let staleTime (30s) handle reconciliation. Simply update the context ID. Components depending on entityId re-render with new entityId and refetch via their own query keys.
  - [x] 5.2 Ensure entity list query (`["entities"]`) is NOT invalidated on switch — the entity list is global across all entities

- [x] **Task 6: Accessibility and visual polish** (AC: 1, 2, 4)
  - [x] 6.1 EntitySwitcher accessibility: keyboard navigation (Enter opens dropdown, Arrow keys navigate, Enter selects, Escape closes), ARIA combobox/listbox pattern via DropdownMenu (Radix handles this), `aria-label="Sélecteur d'entité"`, current entity announced to screen readers
  - [x] 6.2 Dark mode: use CSS variable tokens (bg-sidebar, text-sidebar-foreground, etc.) — no hardcoded colors
  - [x] 6.3 Entity type badge: "SCI" in accent variant, "Nom propre" in secondary variant
  - [x] 6.4 Collapsed sidebar (tablet): show first letter of entity name in a circular avatar with tooltip showing full name

- [x] **Task 7: Testing and validation** (AC: 1-5)
  - [x] 7.1 Run `npm run lint` in frontend — zero errors
  - [x] 7.2 Run `npx tsc --noEmit` in frontend — zero TypeScript errors
  - [x] 7.3 Run `npm test` in backend — all 109 existing tests pass (MUST NOT regress)
  - [x] 7.4 Manual verification: entity switch updates context, persists across page navigation, persists on refresh (localStorage)

## Dev Notes

### CRITICAL: This is a Frontend-Only Story

No backend changes required. The backend already provides:
- `GET /api/entities` → returns all user entities (userId from JWT)
- Entity data includes `id`, `type`, `name` — all needed for the switcher

The core work is:
1. A React Context to hold the selected entity ID
2. A UI component to switch between entities
3. Integration into the sidebar layout

### Architecture Compliance

**Frontend state management rule (from architecture.md):**
- "No global store (no Redux, no Zustand). TanStack Query manages server state. Only global client state: active management entity (SCI / personal name) via React Context."
- This story implements that React Context for active entity

**CQRS/ES alignment:**
- The EntitySwitcher reads from the existing `useEntities()` hook (React Query → GET /api/entities)
- No commands are dispatched — entity selection is purely client-side state
- Future stories (2.4+) will use `currentEntityId` from context to scope their queries

**Multi-tenant isolation (NFR9):**
- All future queries will include `entityId` (from context) as a filter
- Currently only `useEntities()` and `useBankAccounts(entityId)` exist
- Bank accounts already scoped by entityId parameter — EntityContext makes this automatic

### EntityContext Design

```typescript
// frontend/src/contexts/entity-context.tsx

interface EntityContextValue {
  currentEntityId: string | null;
  setCurrentEntityId: (id: string) => void;
  currentEntity: EntityData | undefined;
  isLoading: boolean;
}
```

**Selection logic:**
1. On mount → read `localStorage.getItem("baillr_current_entity_id")`
2. When entities load → validate stored ID exists in entity list
3. If valid → use stored ID. If invalid or missing → auto-select first entity
4. On switch → update state + persist to localStorage
5. If entities are empty → currentEntityId = null, currentEntity = undefined

**Why localStorage (not URL param):**
- Entity selection is global context, not page-specific
- Should survive across page navigations and browser refreshes
- URL params would clutter every route with `?entityId=xxx`
- Aligns with architecture doc: "React Context" for active entity

### EntitySwitcher Component Design

**Component location:** `frontend/src/components/layout/entity-switcher.tsx`

**UI structure (desktop — full sidebar):**
```
┌──────────────────────────────┐
│ ▼ SCI SIRIUS WAT             │  ← DropdownMenu trigger
│   SCI                        │  ← Type badge
└──────────────────────────────┘
```

**Dropdown open:**
```
┌──────────────────────────────┐
│ ✓ SCI SIRIUS WAT        SCI │
│   Matthieu Dupont   Nom pr.  │
├──────────────────────────────┤
│ Gérer les entités          → │
└──────────────────────────────┘
```

**Tablet (collapsed sidebar — 64px):**
```
┌────┐
│ SW │  ← Initials in Avatar + Tooltip with full name
└────┘
```

**Key UI patterns:**
- Use `DropdownMenu` from shadcn/ui (Radix-based, accessible by default)
- `ChevronsUpDown` icon from lucide-react (standard shadcn/ui pattern for switchers)
- `Check` icon from lucide-react for selected entity
- `Badge` component for type label
- `Avatar` with `AvatarFallback` for collapsed state (initials)
- `Tooltip` for collapsed state (show full name)

### Sidebar Integration

The EntitySwitcher goes between the brand header and the navigation:

```
┌──────────────┐
│ Baillr       │  ← SidebarBrand
├──────────────┤
│ EntitySwitch │  ← NEW: EntitySwitcher
├──────────────┤
│ Dashboard    │  ← SidebarNav
│ Entités      │
│ Biens        │
│ ...          │
```

Three sidebar variants to update:
1. **Desktop (lg+):** Full EntitySwitcher with name + badge
2. **Tablet (md):** Collapsed EntitySwitcher with Avatar + Tooltip
3. **Mobile (Sheet):** Full EntitySwitcher (same as desktop)

### ActionFeed Context Awareness

Currently the ActionFeed uses hardcoded onboarding actions. Update to:
- If no entities exist → show "Créez votre première entité" (already exists)
- If entity exists but has no bank accounts → show "Ajoutez un compte bancaire" with `href="/entities/[currentEntityId]/bank-accounts"` (use entityId from context)
- The "Ajoutez un bien immobilier" action remains as-is (properties not yet implemented)

### Anti-Patterns (FORBIDDEN)

- **Do NOT create a global state store** (Redux, Zustand) — use React Context ONLY
- **Do NOT put EntitySwitcher in the header** — it goes in the sidebar, per UX spec: "Entity switcher always in header bar, above sidebar" (BUT the current layout puts entity-level context in the sidebar — follow the existing sidebar pattern since the header has the breadcrumb area)
- **Do NOT invalidate queries on entity switch** — rely on staleTime (30s) for reconciliation
- **Do NOT add entityId to URL params** — store in React Context + localStorage
- **Do NOT use `"use client"` on the context file itself** — only on the provider component. Actually: the context file MUST use `"use client"` since `createContext` is client-only in Next.js App Router
- **Do NOT add `.js` extensions in frontend imports** — frontend uses default module resolution (NOT `moduleResolution: "nodenext"`)
- **Do NOT hardcode colors** — use CSS variable tokens
- **Do NOT create a separate API call for entity selection** — it's purely client-side state

### Previous Story Intelligence

**From Story 2.2 (patterns to follow):**
- `useEntities()` hook at `frontend/src/hooks/use-entities.ts` — returns `{ data: EntityData[], isLoading, error }`
- `EntityData` type from `frontend/src/lib/api/entities-api.ts` — includes `id`, `type` ("sci" | "nom_propre"), `name`, and all other fields
- DropdownMenu already installed (`frontend/src/components/ui/dropdown-menu.tsx`)
- Badge already installed (`frontend/src/components/ui/badge.tsx`)
- Avatar already installed (if not, will need `npx shadcn@latest add avatar`)
- `fetchWithAuth` at `frontend/src/lib/api/fetch-with-auth.ts` — shared API utility
- Sidebar uses `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent` CSS tokens
- The collapsed sidebar pattern: `collapsed` prop → show icon/initial only + Tooltip

**From Story 2.1 (patterns established):**
- Zod: use `.regex()` only — no `.length()` + `.regex()` together
- React Query: staleTime 30s (configured in QueryProvider)
- No `invalidateQueries` in onSettled without 1500ms delay
- Frontend lint: 2 pre-existing React Compiler warnings (not errors)

### What NOT to Build

- **No entityId middleware on backend** — not needed yet, future stories will add if required
- **No entity-scoped queries** — current queries (entities, bank accounts) already work correctly; future stories (2.4: properties, 2.5: units) will add entityId-scoped queries
- **No entity creation from the switcher** — the "Gérer les entités" link navigates to `/entities` page
- **No entity search/filter in dropdown** — with typically <10 entities, a simple list is sufficient
- **No persistence to backend** — entity selection is client-side only (no "last selected entity" API)
- **No websocket for entity sync** — management tool, not real-time app

### Project Structure Notes

```
frontend/src/
├── contexts/                           # NEW DIRECTORY
│   └── entity-context.tsx             # NEW: EntityContext + EntityProvider
├── hooks/
│   └── use-current-entity.ts          # NEW: convenience hook
├── components/
│   └── layout/
│       ├── entity-switcher.tsx        # NEW: EntitySwitcher component
│       └── sidebar.tsx                # MODIFY: integrate EntitySwitcher
├── app/
│   └── (auth)/
│       └── layout.tsx                 # MODIFY: add EntityProvider
└── components/
    └── features/
        └── dashboard/
            └── action-feed.tsx        # MODIFY: context-aware bank account CTA
```

### shadcn/ui Components Needed

All already installed:
- `DropdownMenu` — `frontend/src/components/ui/dropdown-menu.tsx` ✅
- `Badge` — `frontend/src/components/ui/badge.tsx` ✅
- `Avatar` — `frontend/src/components/ui/avatar.tsx` ✅ (verify, install if missing)
- `Tooltip` — `frontend/src/components/ui/tooltip.tsx` ✅
- `Separator` — `frontend/src/components/ui/separator.tsx` ✅
- `Skeleton` — `frontend/src/components/ui/skeleton.tsx` ✅

### Technology Versions (Already Installed)

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.1.6 | App Router — `"use client"` needed for context |
| React | 19 | `createContext`, `useContext`, `useState`, `useEffect` |
| @tanstack/react-query | already installed | `useEntities()` for entity data |
| shadcn/ui | initialized | DropdownMenu, Badge, Avatar, Tooltip |
| lucide-react | already installed | `ChevronsUpDown`, `Check`, `Building2` icons |
| Tailwind CSS | 4 | CSS variable tokens |

### TypeScript Module Resolution

**Frontend uses default module resolution** — NO `.js` extensions on imports:
```typescript
import { useEntities } from "@/hooks/use-entities";
import { EntitySwitcher } from "@/components/layout/entity-switcher";
```
This is different from the backend which uses `moduleResolution: "nodenext"`.

### Git Intelligence

**Commit convention:** `feat(scope): description` — conventional commits
**Recent commits:**
1. `9343757` — `feat(entity): associate bank accounts and cash register to entities`
2. `591e722` — `fix(frontend): add delayed cache reconciliation after mutations`
3. `e5d3af0` — `refactor(backend): reduce duplication and improve type safety`

### References

- [Source: epics.md#Story 2.3] — "switch between my entities within a single session"
- [Source: epics.md#FR4] — "Bailleur can switch between entities within a single session"
- [Source: architecture.md#Frontend Architecture] — "Only global client state: active management entity via React Context"
- [Source: architecture.md#Multi-Tenant Isolation] — "entityId in event metadata + all Prisma queries filtered by entityId"
- [Source: ux-design-specification.md#EntitySwitcher] — Component spec: purpose, content, actions, states, variants, accessibility
- [Source: ux-design-specification.md#Navigation Patterns] — "Entity switcher always in header bar, above sidebar — context affects all views"
- [Source: ux-design-specification.md#Component Strategy] — EntitySwitcher uses Select/Combobox primitive
- [Source: 2-2-associate-bank-accounts-to-an-entity.md] — Established patterns: fetchWithAuth, optimistic updates, CSS tokens, accessibility patterns

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Date:** 2026-02-11
**Outcome:** Approved with fixes applied

### Review Pass 1: Issues Found: 4 High, 3 Medium, 2 Low

**Fixed (6):**
- [H1] SSR guard: localStorage calls in sync-during-render block lacked `typeof window` guard — added
- [H2] Avatar size mismatch: `size="sm"` (24px) inside 32px container in collapsed variant — removed prop, uses default 32px
- [H3] Tooltip/DropdownMenu nesting: Radix Tooltip wrapping DropdownMenuTrigger in collapsed mode caused conflicting event handlers — removed Tooltip, DropdownMenu is self-sufficient
- [M1] DRY violation: 31 lines of dropdown content duplicated between collapsed and full variants — extracted `EntityDropdownItems` component
- [M2] Action feed not filtering: `useOnboardingActions()` showed "create entity" even when entity exists — now conditionally includes based on `entityId`
- [M3] Double `useEntities()` call: EntitySwitcher called both `useEntities()` and `useEntityContext()` (which also calls `useEntities()`) — exposed `entities` from EntityContext, removed direct `useEntities()` import from EntitySwitcher

**Deferred (1):**
- [H4] No frontend test infrastructure — vitest + @testing-library not installed, no tests for new components (tracked as Review Follow-up)

**Not fixed (2 LOW):**
- [L1] `aria-label` on non-interactive div for single entity full variant — cosmetic a11y (replaced with `role="status"` on collapsed variant only)
- [L2] sprint-status.yaml not in story File List — tracking file, acceptable

### Review Pass 2 (post entity-switch navigation): Issues Found: 2 High, 2 Medium, 2 Low

**Fixed (6):**
- [H1] Mobile Sheet stays open after entity switch: `handleEntitySwitch` called `router.push` but didn't close the mobile Sheet — added `onNavigate` prop to EntitySwitcher, passed `onMobileClose` from sidebar mobile Sheet variant
- [H2] Story documentation desync: story marked "done" but entity switch navigation redirect (`handleEntitySwitch` + `router.push`) was undocumented — updated Change Log, File List descriptions, and Completion Notes
- [M1] `getEntityInitials` defensive gap: `split(/\s+/)` on names with leading whitespace produced empty segments — added `.filter(Boolean)` to chain
- [M2] "Gérer les entités" link doesn't close mobile Sheet: `<Link>` in `EntityDropdownItems` navigated without closing Sheet — added `onClick={onNavigate}` to link
- [L1] Redirect from entity-agnostic pages: `handleEntitySwitch` redirected from ALL non-dashboard pages including `/entities` (global list) — excluded `/entities` from redirect condition
- [L2] `role="status"` semantically incorrect on single entity collapsed display: live region on static content — removed `role="status"`, kept `aria-label`

### Validation (both passes)

- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (2 pre-existing warnings)
- `npm test` (backend): 109 tests pass
- All 5 ACs verified as implemented

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- React Compiler lint error: `setState` in `useEffect` flagged as cascading render risk → refactored to "sync state during render" pattern (storing previous state comparison inline, no useEffect)
- React Compiler lint error: `useRef` access during render flagged as ref-during-render → refactored to eliminate useRef entirely, using direct state derivation with `setStoredId` called conditionally during render
- QueryProvider scope: moved from wrapping only `{children}` to wrapping entire layout (Sidebar + Header + Main) since EntitySwitcher in sidebar needs React Query context

### Completion Notes List

- Task 1: Created `EntityContext` with `EntityProvider` using React Context + localStorage persistence. Used "sync state during render" pattern (React docs-approved) to validate stored entity ID against loaded entities list without useEffect. QueryProvider + EntityProvider now wrap the entire auth layout.
- Task 2: Created `EntitySwitcher` component with 4 states: loading (Skeleton), no entities (link to create), single entity (display only), multiple entities (DropdownMenu with Check icon, Badge type labels, "Gérer les entités" link). All states have both full and collapsed variants.
- Task 3: Integrated EntitySwitcher into sidebar between SidebarBrand and SidebarNav in all 3 variants (desktop full, tablet collapsed, mobile Sheet). Tablet uses `collapsed` prop for Avatar + Tooltip display.
- Task 4: Created `useCurrentEntity()` convenience hook. Verified `useBankAccounts` already scoped by entityId. Made ActionFeed context-aware: bank account CTA now uses `entityId` from context in its href.
- Task 5: No query invalidation on entity switch — by design. Context update triggers re-render, components refetch via their own query keys. Entity list query remains global.
- Task 6: Accessibility handled by Radix DropdownMenu (keyboard nav, ARIA). All colors use CSS variable tokens. Badge variants: `default` for SCI, `secondary` for Nom propre. Collapsed state uses Avatar + Tooltip.
- Task 7: All validations pass — lint 0 errors (2 pre-existing warnings), tsc 0 errors, 109 backend tests pass.

### Change Log

- 2026-02-11: Implemented entity switcher component — 4 new files, 3 modified files, 1 shadcn/ui component installed (Skeleton)
- 2026-02-11: Code review pass 1 (AI) — 6 fixes applied (H1: SSR guard, H2: Avatar size, H3: Tooltip/Dropdown nesting, M1: DRY extraction, M2: action filter, M3: context entities exposure). 1 action item deferred (H4: frontend test infrastructure).
- 2026-02-11: Added entity switch navigation redirect — `handleEntitySwitch` with `router.push("/dashboard")` on entity switch from entity-scoped pages (Slack/Linear/Notion pattern)
- 2026-02-11: Code review pass 2 (AI) — 6 fixes applied (H1: mobile Sheet close, H2: story docs sync, M1: initials filter, M2: "Gérer" link Sheet close, L1: entity-agnostic page exclusion, L2: role="status" removal).

### Review Follow-ups (AI)

- [ ] [AI-Review][HIGH] Set up frontend test framework (vitest + @testing-library/react) and write unit tests for EntityContext, EntitySwitcher, useCurrentEntity, ActionFeed — no test infrastructure exists in frontend yet (NFR21 requires >95% coverage)

### File List

- `frontend/src/contexts/entity-context.tsx` — NEW: EntityContext + EntityProvider with localStorage persistence, entities exposed in context
- `frontend/src/components/layout/entity-switcher.tsx` — NEW: EntitySwitcher component (4 states, full + collapsed variants), EntityDropdownItems extracted, `onNavigate` prop for mobile Sheet close, `handleEntitySwitch` redirects to dashboard from entity-scoped pages
- `frontend/src/hooks/use-current-entity.ts` — NEW: useCurrentEntity() convenience hook, exposes entities
- `frontend/src/components/ui/skeleton.tsx` — NEW: shadcn/ui Skeleton component (installed via CLI)
- `frontend/src/app/(auth)/layout.tsx` — MODIFIED: moved QueryProvider to wrap entire layout, added EntityProvider
- `frontend/src/components/layout/sidebar.tsx` — MODIFIED: integrated EntitySwitcher between brand and nav in all 3 variants, passes `onNavigate={onMobileClose}` in mobile Sheet
- `frontend/src/components/features/dashboard/action-feed.tsx` — MODIFIED: context-aware onboarding actions filtered by entity existence
