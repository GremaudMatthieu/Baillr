# Story 2.6: Display Unit Mosaic on Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to see all my units across all properties displayed as a color-coded mosaic on the dashboard,
so that I can instantly see the status of my entire portfolio (FR8).

## Acceptance Criteria

1. **Given** I have properties with units under the selected entity, **When** I view the dashboard, **Then** I see the UnitMosaic component displaying one tile per unit, grouped by property name
2. **Given** I view the UnitMosaic, **Then** tiles show the unit identifier and property name, **And** vacant units (no active lease) appear as gray tiles
3. **Given** I click a unit tile in the mosaic, **Then** I am navigated to the unit detail page (`/properties/:propertyId/units/:unitId`)
4. **Given** I view the mosaic on desktop (lg+), **Then** the mosaic displays as a responsive grid layout, **And** on mobile (<lg) it displays as a horizontally scrollable list or compact grid
5. **Given** I add a new unit, **When** the dashboard refreshes (optimistic UI with staleTime reconciliation), **Then** the new unit tile appears in the mosaic
6. **Given** I have no properties or no units, **When** I view the dashboard, **Then** I see the existing empty state placeholder ("Aucun lot configuré") with guidance to create units
7. **Given** I have multiple properties with units, **When** I view the mosaic, **Then** units are visually grouped by property with a property name header per group

## Tasks / Subtasks

- [x] **Task 1: Create a backend endpoint to fetch all units for an entity** (AC: 1, 5)
  - [x] 1.1 Create `GetUnitsByEntityQuery` + handler in `presentation/property/queries/` — accepts `entityId` and `userId`, queries all units across all properties belonging to this entity
  - [x] 1.2 Create `GetUnitsByEntityController` at `GET /api/entities/:entityId/units` — dispatches query, returns `{ data: UnitData[] }` with property info joined
  - [x] 1.3 Validate route parameters via `ParseUUIDPipe` on `:entityId` param — no separate DTO file needed (GET request with route param only)
  - [x] 1.4 Add `findAllByEntityAndUser(entityId: string, userId: string)` method to `UnitFinder` — Prisma query joining units through properties to filter by entityId + userId
  - [x] 1.5 Register controller and query handler in `property-presentation.module.ts`
  - [x] 1.6 Write tests: controller spec, query handler spec

- [x] **Task 2: Create frontend API and hook for entity-level units** (AC: 1, 5)
  - [x] 2.1 Add `getUnitsByEntity(entityId: string)` method to `units-api.ts` — calls `GET /api/entities/:entityId/units`
  - [x] 2.2 Add `UnitWithPropertyData` interface extending `UnitData` with `propertyName: string` field
  - [x] 2.3 Add `useEntityUnits(entityId: string)` hook to `use-units.ts` — queryKey: `["entities", entityId, "units"]`, enabled: `!!entityId`, staleTime: 30_000

- [x] **Task 3: Create UnitMosaic component** (AC: 1, 2, 3, 4, 6, 7)
  - [x] 3.1 Create `frontend/src/components/features/dashboard/unit-mosaic.tsx`:
    - Accepts `entityId: string` prop
    - Uses `useEntityUnits(entityId)` to fetch all units across all properties
    - Groups units by `propertyId` with property name as group header
    - Renders responsive grid of clickable unit tiles
    - Each tile shows: unit identifier (primary), property name (secondary in group header), unit type badge, gray background (vacant — no lease system yet)
    - Click handler: `router.push(\`/properties/\${unit.propertyId}/units/\${unit.id}\`)`
    - Loading state: Skeleton tiles (4-8 skeleton cards)
    - Empty state: reuse existing placeholder pattern ("Aucun lot configuré")
  - [x] 3.2 Responsive grid layout:
    - Desktop (lg+): `grid-cols-4` or `grid-cols-5` depending on count
    - Tablet (md): `grid-cols-3`
    - Mobile: `grid-cols-2`
  - [x] 3.3 Tile design:
    - Card-based tile with `bg-muted` (gray — vacant status)
    - Unit identifier as primary text (font-medium)
    - Unit type as small Badge (secondary variant)
    - Floor + surface area as muted caption text
    - Hover: `hover:bg-accent/50` with subtle transition
    - Min width per tile to prevent squishing
  - [x] 3.4 Property grouping:
    - Section per property with property name as `<h3>` header
    - Grid resets per property group
    - If only 1 property, show group header anyway for consistency

- [x] **Task 4: Replace dashboard placeholder with UnitMosaic** (AC: 1, 6)
  - [x] 4.1 Create `frontend/src/app/(auth)/dashboard/dashboard-content.tsx` — `"use client"` wrapper component that uses `useCurrentEntity()` to get `entityId` and renders `KpiTilesPlaceholder` + `UnitMosaic` (or `UnitMosaicPlaceholder` when no entityId). **CRITICAL**: The current `page.tsx` is a **Server Component** (exports `metadata`) — hooks CANNOT be used directly. Extract the interactive content into a Client Component.
  - [x] 4.2 Modify `frontend/src/app/(auth)/dashboard/page.tsx`:
    - Replace inline layout with `<DashboardContent />` in left column
    - Keep `<ActionFeed />` in right column (already a Client Component)
    - Keep `export const metadata` (Server Component stays a Server Component)
  - [x] 4.3 The `UnitMosaic` component handles entityId being null internally (show placeholder) — no conditional logic needed in `DashboardContent` beyond passing `entityId ?? ""`

- [x] **Task 5: Testing and validation** (AC: 1-7)
  - [x] 5.1 Run `npm run lint` in backend — zero errors
  - [x] 5.2 Run `npx tsc --noEmit` in backend — zero TypeScript errors
  - [x] 5.3 Run `npm test` in backend — all tests pass (234 tests, 39 suites)
  - [x] 5.4 Run `npm run lint` in frontend — zero errors (2 pre-existing warnings from React Compiler + form.watch)
  - [x] 5.5 Run `npx tsc --noEmit` in frontend — zero TypeScript errors
  - [x] 5.6 Manual verification: create entity + property + units → dashboard shows mosaic with tiles → click tile navigates to unit detail

## Dev Notes

### Story Overview

This story creates the **UnitMosaic** component for the dashboard — the visual anchor of the entire application per the UX specification. At this stage (no lease system yet), all units display as **gray tiles** (vacant). Future stories (Epic 3+) will add green/orange/red status colors when leases and payments are implemented.

**Key insight**: This story requires a **new backend endpoint** to fetch all units across all properties for an entity. The existing `GET /properties/:propertyId/units` only returns units for a single property. The mosaic needs all units for the entire entity in one call.

### Architecture Compliance

**CQRS/ES Pattern:**
- **New query endpoint** `GET /api/entities/:entityId/units` — read-only, queries PostgreSQL via Prisma
- **No new domain code** — no aggregate changes, no new events
- **Presentation layer only** — new controller + query handler + finder method in existing `presentation/property/` module
- **Cross-aggregate query**: UnitFinder joins units → properties to filter by entityId

**Frontend Pattern:**
- **React Query** for data fetching with staleTime 30s
- **No mutations** in this story — purely read-only display
- **Optimistic rendering**: mosaic benefits from existing optimistic create in `useCreateUnit` — new units appear immediately via cache

**Component Design (from UX specification):**
- UnitMosaic is a **custom component** built on shadcn/ui primitives (Card, Badge)
- **Clickable tiles** — status IS navigation (click tile → unit detail)
- **Color-coded** — gray for vacant (only status available at this point)
- **Responsive grid** — 4-5 columns desktop, 3 tablet, 2 mobile
- **Grouped by property** — visual separation with property name headers
- **ARIA grid role** for keyboard navigation

### Critical Design Decision: Data Fetching Strategy

**Option chosen: Single endpoint returning all entity units with property name**

The mosaic needs units from ALL properties under an entity. Two options:
1. **N+1 pattern** (rejected): fetch properties list, then fetch units per property — creates N+1 queries, flickering as each loads
2. **Single endpoint** (chosen): `GET /api/entities/:entityId/units` returns all units with `propertyName` joined — single query, single loading state, clean grouping

The backend query joins through the `property` relation to get `propertyName` and filters by `entityId` (through property ownership). This follows the presentation layer pattern of denormalized read queries.

### Tile Design (Initial — Vacant Only)

At this stage, all tiles are gray (vacant):
```
┌──────────────────┐
│  Apt 3B          │  ← unit identifier (font-medium)
│  Appartement     │  ← type badge (Badge variant="secondary")
│  Étage 2 · 45 m² │  ← floor + surface (text-xs text-muted-foreground)
└──────────────────┘
  gray background, hover:accent
```

Future stories will add status colors:
- Green (emerald) → paid (active lease, rent collected)
- Orange (amber) → pending (rent call sent, awaiting payment)
- Red (rose) → late (unpaid rent)
- Gray (slate) → vacant (no active lease) ← **current**

### Responsive Grid Layout

```
Desktop (lg+):     Tablet (md):       Mobile:
┌──┬──┬──┬──┬──┐   ┌──┬──┬──┐        ┌──┬──┐
│  │  │  │  │  │   │  │  │  │        │  │  │
├──┼──┼──┼──┼──┤   ├──┼──┼──┤        ├──┼──┤
│  │  │  │  │  │   │  │  │  │        │  │  │
└──┴──┴──┴──┴──┘   └──┴──┴──┘        └──┴──┘
```

### Property Grouping UX

```
Résidence Sapiac                        ← property name header
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Apt 1 │ │Apt 2 │ │Apt 3 │ │Park 1│
└──────┘ └──────┘ └──────┘ └──────┘

12 Rue de la Paix                       ← second property
┌──────┐ ┌──────┐
│Apt A │ │Cave 1│
└──────┘ └──────┘
```

### Previous Story Intelligence

**From Story 2.5 (Units):**
- UnitAggregate and read model fully implemented
- `UnitFinder` at `backend/src/presentation/property/finders/unit.finder.ts` — extend with `findAllByEntityAndUser()`
- `useUnits(propertyId)` hook at `frontend/src/hooks/use-units.ts` — add `useEntityUnits(entityId)` alongside
- `units-api.ts` at `frontend/src/lib/api/units-api.ts` — add `getUnitsByEntity(entityId)` method
- `UnitData` interface already defined in `units-api.ts`
- `UNIT_TYPE_LABELS` mapping already used in property detail page
- `PropertyPresentationModule` already exports `UnitFinder`

**From Story 2.4 (Properties):**
- `PropertyFinder` at `backend/src/presentation/property/finders/property.finder.ts` — provides property data
- `useProperties(entityId)` hook already used in ActionFeed — may need for fallback or reference

**From Story 2.3 (Entity Switcher):**
- `useCurrentEntity()` returns `{ entityId: string | null, ... }` — always use `?? ""` when passing to hooks
- Entity context wraps entire auth layout — UnitMosaic has access to entityId

**From Story 2.1 (Entities):**
- `EntityFinder.findByIdAndUserId()` available for cross-aggregate authorization
- Presentation module pattern established

**From Dashboard page (Story 1.4):**
- `UnitMosaicPlaceholder` at `frontend/src/components/features/dashboard/unit-mosaic-placeholder.tsx` — to be replaced
- Dashboard layout: 2-column grid `lg:grid-cols-[1fr_400px]` — mosaic in left column
- KPI tiles placeholder above mosaic area

### Backend Endpoint Design

**`GET /api/entities/:entityId/units`**

Response format:
```json
{
  "data": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "propertyName": "Résidence Sapiac",
      "userId": "user_xxx",
      "identifier": "Apt 3B",
      "type": "apartment",
      "floor": 2,
      "surfaceArea": 45.0,
      "billableOptions": [...],
      "createdAt": "2026-02-11T...",
      "updatedAt": "2026-02-11T..."
    }
  ]
}
```

**Prisma query pattern:**
```typescript
findAllByEntityAndUser(entityId: string, userId: string) {
  return this.prisma.unit.findMany({
    where: {
      userId,
      property: { entityId, userId },
    },
    include: { property: { select: { name: true } } },
    orderBy: [
      { property: { name: 'asc' } },
      { identifier: 'asc' },
    ],
  });
}
```

The response maps `property.name` → `propertyName` in the query handler.

### Accessibility (UX Spec Compliance)

Per the UX Design Specification's UnitMosaic component spec:
- **ARIA grid role** — keyboard arrow navigation between tiles
- **Status announced by screen reader** (not just color) — "Appartement 3B, vacant"
- **Focus ring** on active tile — deep teal 2px with offset
- **Keyboard navigation**: Tab to mosaic, Arrow keys between tiles, Enter to navigate
- At this stage, all tiles announce "vacant" status

### What NOT to Build

- **No color-coded statuses** (green/orange/red) — requires lease/payment system (Epic 3+)
- **No pulsing border** for "action required" — requires escalation system (Epic 6)
- **No expanded variant** — only compact dashboard variant for now
- **No hover tooltip** with tenant name — no tenants linked yet
- **No real-time WebSocket updates** — rely on staleTime reconciliation
- **No drag-and-drop** — not in requirements
- **No filtering/search** within mosaic — not in requirements
- **No treasury chart** — separate story (Epic 8)
- **No KPI tiles implementation** — separate story (Epic 8)

### Technology Versions (Already Installed)

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.1.6 | App Router, `"use client"` for interactive pages |
| React | 19 | Hooks, useRouter |
| NestJS | 11 | CQRS, class-validator |
| @nestjs/cqrs | 11 | QueryBus |
| Prisma | 7 | Read models, includes/joins |
| @tanstack/react-query | installed | useQuery |
| shadcn/ui | initialized | Card, Badge, Skeleton |
| lucide-react | installed | Building2, Home, Car icons |
| Tailwind CSS | 4 | Responsive grid utilities |

### TypeScript Module Resolution

- **Backend**: `moduleResolution: "nodenext"` — `.js` extensions required on imports
- **Frontend**: default resolution — NO `.js` extensions on imports
- **Path alias**: Frontend uses `@/` → `./src/`, Backend uses relative paths

### UNIT_TYPE_LABELS Extraction

`UNIT_TYPE_LABELS` is **duplicated 3 times** in the codebase: `unit-form.tsx`, `properties/[id]/page.tsx`, `units/[unitId]/page.tsx`. **Extract it** to a shared constant file `frontend/src/lib/constants/unit-types.ts` and import from there in UnitMosaic and existing files. This prevents a 4th copy.

```typescript
// frontend/src/lib/constants/unit-types.ts
export const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  parking: "Parking",
  commercial: "Local commercial",
  storage: "Cave / Garde-meuble",
};
```

### Frontend Anti-Patterns (FORBIDDEN)

- NEVER use `setState` in `useEffect` — use "sync state during render" pattern
- NEVER hardcode parent link in back button — use `router.back()`
- NEVER add `.js` extensions in frontend imports
- NEVER skip loading/empty states — always handle all query states

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component file | kebab-case | `unit-mosaic.tsx` |
| Component export | PascalCase | `UnitMosaic` |
| Hook file | kebab-case | `use-units.ts` |
| Hook export | camelCase | `useEntityUnits` |
| API method | camelCase | `getUnitsByEntity` |
| Controller | VerbANounController | `GetUnitsByEntityController` |
| Query | VerbANounQuery | `GetUnitsByEntityQuery` |
| Query handler | VerbANounHandler | `GetUnitsByEntityHandler` |

### Project Structure Notes

```
backend/src/
├── presentation/
│   └── property/
│       ├── controllers/
│       │   ├── get-units-by-entity.controller.ts    # NEW
│       │   └── ... (existing controllers)
│       ├── queries/
│       │   ├── get-units-by-entity.query.ts         # NEW
│       │   ├── get-units-by-entity.handler.ts       # NEW
│       │   └── ... (existing queries)
│       ├── finders/
│       │   └── unit.finder.ts                       # MODIFY: add findAllByEntityAndUser()
│       ├── property-presentation.module.ts          # MODIFY: register new controller + handler
│       └── __tests__/
│           ├── get-units-by-entity.controller.spec.ts   # NEW
│           └── get-units-by-entity.handler.spec.ts      # NEW

frontend/src/
├── lib/
│   ├── constants/
│   │   └── unit-types.ts            # NEW: shared UNIT_TYPE_LABELS (extracted from 3 duplicates)
│   └── api/
│       └── units-api.ts             # MODIFY: add UnitWithPropertyData, getUnitsByEntity()
├── hooks/
│   └── use-units.ts                 # MODIFY: add useEntityUnits()
├── components/features/dashboard/
│   ├── unit-mosaic.tsx              # NEW: main mosaic component
│   ├── unit-mosaic-placeholder.tsx  # EXISTING: kept as empty state inside UnitMosaic
│   └── dashboard-content.tsx        # NEW: "use client" wrapper (page.tsx is Server Component)
├── app/(auth)/dashboard/
│   └── page.tsx                     # MODIFY: use DashboardContent client wrapper
```

### References

- [Source: epics.md#Story 2.6] — "display all units across all properties as a color-coded mosaic on the dashboard"
- [Source: epics.md#FR8] — "Bailleur can view all units across all properties with their current status"
- [Source: architecture.md#Frontend Architecture] — TanStack Query, optimistic updates, component library (shadcn/ui)
- [Source: architecture.md#API Patterns] — Queries via GET, 200 OK with data payload
- [Source: ux-design-specification.md#UnitMosaic] — Custom component: clickable color-coded tiles, ARIA grid role, keyboard navigation, compact/expanded variants
- [Source: ux-design-specification.md#Responsive Strategy] — Grid 5-6 columns desktop, 3-4 tablet, 2-3 mobile
- [Source: ux-design-specification.md#Color System] — Gray (slate-300) for vacant/inactive status
- [Source: ux-design-specification.md#Journey 1] — Step 4: "Units exist (gray tiles), no tenants"
- [Source: 2-5-create-and-configure-units-within-a-property.md] — UnitData interface, UnitFinder, useUnits hook, units-api.ts
- [Source: 2-4-create-properties-under-an-entity.md] — PropertyFinder, property detail page, dual URL pattern
- [Source: 2-3-implement-entity-switcher-component.md] — useCurrentEntity(), entityId: string | null

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1**: Created `GET /api/entities/:entityId/units` endpoint with cross-aggregate Prisma join (units → properties → entity), EntityFinder ownership check, and mapped `property.name` → `propertyName` in handler response. 7 new tests (controller + handler).
- **Task 2**: Extended `units-api.ts` with `UnitWithPropertyData` interface and `getUnitsByEntity()` method. Added `useEntityUnits(entityId)` hook with `staleTime: 30_000`.
- **Task 3**: Built `UnitMosaic` component with property grouping, responsive grid (2/3/4/5 cols), skeleton loading, empty state, ARIA grid roles, and keyboard-navigable tiles. Extracted `UNIT_TYPE_LABELS` to shared `lib/constants/unit-types.ts` (deduplicated from 3 files).
- **Task 4**: Created `DashboardContent` client wrapper to bridge Server Component `page.tsx` (which exports `metadata`) with interactive `useCurrentEntity()` hook. Replaced `UnitMosaicPlaceholder` in dashboard layout.
- **Task 5**: All validation passed — 234 backend tests (39 suites), zero lint errors, zero TypeScript errors in both frontend and backend.

### Change Log

- 2026-02-11: Story 2.6 implementation complete — UnitMosaic on dashboard with entity-level endpoint, property grouping, responsive grid, ARIA accessibility, UNIT_TYPE_LABELS extraction
- 2026-02-11: Code review complete — 6 fixes applied (ARIA keyboard nav, error state, cache invalidation, surface 0 guard, task/file list accuracy)

### File List

**New files:**
- `backend/src/presentation/property/queries/get-units-by-entity.query.ts`
- `backend/src/presentation/property/queries/get-units-by-entity.handler.ts`
- `backend/src/presentation/property/controllers/get-units-by-entity.controller.ts`
- `backend/src/presentation/property/__tests__/get-units-by-entity.controller.spec.ts`
- `backend/src/presentation/property/__tests__/get-units-by-entity.handler.spec.ts`
- `frontend/src/lib/constants/unit-types.ts`
- `frontend/src/components/features/dashboard/unit-mosaic.tsx`
- `frontend/src/components/features/dashboard/dashboard-content.tsx`

**Referenced files (existing, unchanged):**
- `frontend/src/components/features/dashboard/unit-mosaic-placeholder.tsx` — reused in DashboardContent for no-entity state

**Modified files:**
- `backend/src/presentation/property/finders/unit.finder.ts` — added `findAllByEntityAndUser()`
- `backend/src/presentation/property/property-presentation.module.ts` — registered new controller + handler
- `frontend/src/lib/api/units-api.ts` — added `UnitWithPropertyData` interface and `getUnitsByEntity()` method
- `frontend/src/hooks/use-units.ts` — added `useEntityUnits()` hook
- `frontend/src/app/(auth)/dashboard/page.tsx` — replaced inline content with `<DashboardContent />`
- `frontend/src/components/features/units/unit-form.tsx` — import `UNIT_TYPE_LABELS` from shared constant
- `frontend/src/app/(auth)/properties/[id]/page.tsx` — import `UNIT_TYPE_LABELS` from shared constant
- `frontend/src/app/(auth)/properties/[id]/units/[unitId]/page.tsx` — import `UNIT_TYPE_LABELS` from shared constant

### Senior Developer Review (AI)

**Reviewer:** Monsieur (Claude Opus 4.6)
**Date:** 2026-02-11
**Outcome:** Changes Requested — 9 issues found (2 High, 4 Medium, 3 Low), all HIGH and MEDIUM fixed automatically

**Fixes Applied:**
1. **[H1] ARIA grid keyboard navigation** — Added roving tabindex with ArrowUp/Down/Left/Right, Home/End key handlers, `onFocus` sync, and `tileRefs` for programmatic focus management (`unit-mosaic.tsx`)
2. **[H2] Missing error state** — Added `UnitMosaicError` component with `role="alert"`, destructured `isError` from `useEntityUnits` (`unit-mosaic.tsx`)
3. **[M1] Task 1.3 false claim** — Updated task description to reflect `ParseUUIDPipe` usage instead of nonexistent DTO file (story file)
4. **[M2] Cross-query cache invalidation** — Added `invalidateQueries({ queryKey: ["entities"] })` in `onSettled` of both `useCreateUnit` and `useUpdateUnit` so dashboard mosaic refreshes after mutations (`use-units.ts`)
5. **[M3] Surface 0 m² display** — Conditioned `surfaceArea` display on `> 0` in `formatFloorAndSurface` (`unit-mosaic.tsx`)
6. **[M4] Missing referenced file in File List** — Added `unit-mosaic-placeholder.tsx` as referenced file (story file)

**Low issues (not fixed, acceptable):**
- [L1] Task 1.3 description vs reality — addressed via M1 fix
- [L2] No barrel file for `lib/constants/` — YAGNI, single file
- [L3] No action link in empty state — ActionFeed handles onboarding guidance
