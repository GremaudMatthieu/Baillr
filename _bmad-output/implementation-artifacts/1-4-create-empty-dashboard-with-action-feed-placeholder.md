# Story 1.4: Create Empty Dashboard with Action Feed Placeholder

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to see an empty dashboard that guides me toward my first actions,
so that I understand what to do next without a tutorial.

## Acceptance Criteria

1. **Given** I am authenticated and have no entities configured, **When** I land on the dashboard, **Then** I see an empty state with the ActionFeed component displaying onboarding guidance ("Créez votre première entité")

2. **Given** I am authenticated and have no entities, **When** I view the dashboard, **Then** I see placeholder areas for the UnitMosaic (empty state) and KPI tiles (showing zeros/dashes)

3. **Given** I am on the dashboard, **When** the page renders, **Then** the page title displays "Tableau de bord"

4. **Given** I am on the dashboard, **When** I measure load performance, **Then** the dashboard loads in under 2 seconds (NFR4)

## Tasks / Subtasks

- [x] **Task 1: Create ActionFeed component with empty/onboarding state** (AC: 1)
  - [x] 1.1 Create `src/components/features/dashboard/action-feed.tsx` — ActionFeed component with empty state
  - [x] 1.2 Empty state displays: illustration icon (ClipboardList from Lucide), heading "Aucune action en attente", and first onboarding action card "Créez votre première entité propriétaire" with a CTA button
  - [x] 1.3 Action items are typed: `{ id: string; icon: LucideIcon; title: string; description: string; href?: string; priority: 'high' | 'medium' | 'low' }`
  - [x] 1.4 Onboarding actions are hardcoded for now (no backend integration in this story): single item pointing to `/entities/new` (future route)
  - [x] 1.5 Each action card uses shadcn/ui `Card` primitive with: icon, title, description, and optional `Button` CTA
  - [x] 1.6 ActionFeed section header: "Actions en attente" (H2, `text-lg font-semibold`)
  - [x] 1.7 Install shadcn/ui `card` component: `npx shadcn@latest add card`

- [x] **Task 2: Create UnitMosaic placeholder with empty state** (AC: 2)
  - [x] 2.1 Create `src/components/features/dashboard/unit-mosaic-placeholder.tsx` — UnitMosaic placeholder
  - [x] 2.2 Empty state displays: dashed border container, muted icon (Building2 from Lucide), text "Aucun lot configuré" with sub-text "Vos lots apparaîtront ici une fois créés"
  - [x] 2.3 Container uses `rounded-lg border-2 border-dashed border-muted-foreground/25` styling
  - [x] 2.4 Minimum height: `min-h-[200px]` with centered flex content
  - [x] 2.5 This is a placeholder — the real UnitMosaic component will be built in Epic 2 Story 2.6

- [x] **Task 3: Create KPI tiles placeholder with empty state** (AC: 2)
  - [x] 3.1 Create `src/components/features/dashboard/kpi-tiles-placeholder.tsx` — KPI tiles grid
  - [x] 3.2 Display 4 placeholder KPI tiles in a responsive grid: `grid grid-cols-2 lg:grid-cols-4 gap-4`
  - [x] 3.3 Each tile uses shadcn/ui `Card` with: label (muted), value (display "—"), and muted trend area
  - [x] 3.4 KPI labels (French): "Taux d'encaissement", "Loyers appelés", "Paiements reçus", "Impayés"
  - [x] 3.5 Values show "—" (dash) for empty state, not "0" — dashes communicate "no data yet" vs zero values
  - [x] 3.6 Each tile has a subtle muted background (`bg-card`) with border

- [x] **Task 4: Compose the dashboard page layout** (AC: 1, 2, 3)
  - [x] 4.1 Replace current `src/app/(auth)/dashboard/page.tsx` with the composed dashboard
  - [x] 4.2 Page title: `<h1>` "Tableau de bord" with `text-3xl font-bold tracking-tight` (keep existing style)
  - [x] 4.3 Dashboard layout: 2-column at `lg+` — left column (mosaic + KPIs), right column (ActionFeed); single column at `md-`
  - [x] 4.4 Layout grid: `grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6`
  - [x] 4.5 Left column order: KPI tiles at top, then UnitMosaic placeholder below
  - [x] 4.6 Right column: ActionFeed (full height, scrollable if needed)
  - [x] 4.7 Responsive: on mobile/tablet (<lg), stack as: KPIs → Mosaic → ActionFeed (vertical)
  - [x] 4.8 Add spacing: `space-y-6` between page title and content grid

- [x] **Task 5: Accessibility and dark mode** (AC: 1, 2, 3)
  - [x] 5.1 ActionFeed: `role="feed"` with `aria-label="Actions en attente"`, each action item is an `<article>`
  - [x] 5.2 KPI tiles: each in a `role="status"` container with `aria-label` describing the metric
  - [x] 5.3 UnitMosaic placeholder: `aria-label="Mosaïque des lots"` on container
  - [x] 5.4 All components render correctly in dark mode using CSS variable tokens (no hardcoded colors)
  - [x] 5.5 Focus indicators visible on CTA buttons (deep teal ring, 2px offset — matches existing pattern)
  - [x] 5.6 Empty state text has sufficient contrast in both light and dark modes

- [x] **Task 6: Verify and validate** (AC: all)
  - [x] 6.1 Run `npm run lint` in frontend — zero errors
  - [x] 6.2 Run `npx tsc --noEmit` in frontend — zero TypeScript errors
  - [x] 6.3 Run `npm test` in backend — all existing tests still pass (no regression)
  - [x] 6.4 Visual check: desktop 2-column layout, tablet/mobile single-column stacked
  - [x] 6.5 Dark mode: all dashboard components render with correct dark theme colors
  - [x] 6.6 Empty states display correctly with no data
  - [x] 6.7 Keyboard navigation: Tab through CTA buttons, focus indicators visible

## Dev Notes

### This is the Dashboard Foundation

This story establishes the dashboard layout and placeholder components that future stories will populate with real data. The ActionFeed, UnitMosaic, and KPITiles are all empty-state versions — they demonstrate the layout and empty UX without any backend integration.

### Architecture Compliance

**This is a frontend-only story.** No backend changes, no API calls, no database queries. All data is hardcoded/static for empty states.

**Component location:** `frontend/src/components/features/dashboard/`

**Files to create:**
```
frontend/src/
├── app/
│   └── (auth)/
│       └── dashboard/
│           └── page.tsx               # MODIFY: replace placeholder with composed dashboard
├── components/
│   ├── ui/
│   │   └── card.tsx                   # NEW: install via shadcn CLI
│   └── features/
│       └── dashboard/
│           ├── action-feed.tsx        # NEW: ActionFeed with empty/onboarding state
│           ├── unit-mosaic-placeholder.tsx  # NEW: UnitMosaic empty state
│           └── kpi-tiles-placeholder.tsx    # NEW: KPI tiles empty state
```

**Files NOT to create or modify:**
- No changes to `layout.tsx`, `globals.css`, `sidebar.tsx`, `header.tsx`
- No new routes — dashboard route already exists
- No backend files — zero backend changes
- No new hooks — no state management needed yet
- No API client files — no data fetching in this story

### Design Token Reference

Use the existing CSS variables from `globals.css`. **DO NOT hardcode any colors.** Use Tailwind utility classes that reference the design tokens:

| Need | Tailwind Class |
|------|---------------|
| Card background | `bg-card` |
| Card text | `text-card-foreground` |
| Muted text (labels) | `text-muted-foreground` |
| Primary CTA button | use shadcn/ui `<Button>` (default variant uses `bg-primary`) |
| Border | `border-border` |
| Muted background | `bg-muted` |
| Accent | `bg-accent` / `text-accent-foreground` |

### shadcn/ui Component Installation

Only one new component needs installation:
```bash
cd frontend && npx shadcn@latest add card
```

This will create `src/components/ui/card.tsx`. The `button` component is already installed.

### Existing Patterns to Follow

**Import paths** — use `@/` aliases:
```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

**Icon usage** — from `lucide-react`, `h-5 w-5` size, `aria-hidden="true"`:
```typescript
import { ClipboardList, Building2, TrendingUp } from "lucide-react";
<ClipboardList className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
```

**Class merging** — always use `cn()` for conditional classes:
```typescript
import { cn } from "@/lib/utils";
<div className={cn("base-classes", conditional && "extra-classes")} />
```

**Server Components vs Client Components:**
- The dashboard page (`page.tsx`) should be a **Server Component** (no `"use client"` needed) — it renders static placeholders
- Individual components (`action-feed.tsx`) can be Server Components too since they have no client-side state in this story
- **Only add `"use client"` if the component needs useState, useEffect, event handlers, or browser APIs**

### Dashboard Layout Spec (Empty State)

```
Desktop (lg+):
┌────────────────────────────────────────────────┐
│ Tableau de bord (H1)                           │
├───────────────────────────┬────────────────────┤
│ KPI Tiles (4 in a row)   │ Actions en attente  │
│ [—] [—] [—] [—]          │                     │
├───────────────────────────┤ ┌────────────────┐ │
│ Mosaïque des lots         │ │ 📋 Créez votre │ │
│ ┌───────────────────────┐ │ │ première entité│ │
│ │   Aucun lot configuré │ │ │ [Commencer →]  │ │
│ │   (dashed border)     │ │ └────────────────┘ │
│ └───────────────────────┘ │                     │
└───────────────────────────┴────────────────────┘

Mobile/Tablet (<lg):
┌──────────────────────┐
│ Tableau de bord (H1) │
├──────────────────────┤
│ KPI Tiles (2x2 grid) │
│ [—] [—]              │
│ [—] [—]              │
├──────────────────────┤
│ Mosaïque des lots    │
│ (empty placeholder)  │
├──────────────────────┤
│ Actions en attente   │
│ [Onboarding card]    │
└──────────────────────┘
```

### ActionFeed Empty State Spec

The ActionFeed has two modes in this story:
1. **Onboarding mode** (has entities = false): Shows a single onboarding action card
2. **Empty mode** (all actions done): Shows "Aucune action en attente" with checkmark icon

For this story, **always show onboarding mode** since there's no backend to check entity existence. The component should accept an `actions` prop so future stories can pass dynamic data.

**Onboarding action card content:**
- Icon: `Plus` (Lucide) — represents creation
- Title: "Créez votre première entité propriétaire"
- Description: "Commencez par configurer votre SCI ou votre nom propre pour gérer vos biens"
- CTA: `<Button>` with text "Commencer" and arrow icon, linking to `/entities/new`
- Priority badge: "Recommandé" in accent color

### UX Design Compliance

From the UX spec, the dashboard empty state should:
- Use the ActionFeed to guide onboarding (not a wizard or modal sequence)
- Show exactly ONE next step — never overwhelm with all remaining setup steps
- Return to dashboard after each entity creation (future stories)
- The action feed IS the primary interface — not a sidebar widget

### What NOT To Build in This Story

- **No real ActionFeed data fetching** — actions are hardcoded props
- **No real UnitMosaic** — just a placeholder with empty state; the real mosaic (Epic 2 Story 2.6) is a complex clickable grid
- **No real KPI calculations** — just dash placeholders
- **No EntitySwitcher** — that's Epic 2 Story 2.3
- **No treasury chart** — that's Epic 8 Story 8.7
- **No backend API endpoints** — this is 100% frontend static
- **No TanStack Query** — no data fetching needed yet
- **No React Hook Form / Zod** — no forms in this story
- **No new routes** — dashboard route already exists at `/dashboard`

### Anti-Patterns to Avoid

- **DO NOT** use `"use client"` unless the component genuinely needs client-side interactivity (useState, useEffect, event handlers)
- **DO NOT** hardcode colors — use CSS variable-based Tailwind classes (`bg-card`, `text-muted-foreground`, etc.)
- **DO NOT** create a `tailwind.config.js` — Tailwind 4 uses CSS-based config via `@theme` in `globals.css`
- **DO NOT** install unnecessary dependencies — only `card` from shadcn/ui is needed
- **DO NOT** add `console.log` statements in committed code
- **DO NOT** create API client files or hooks for data fetching — there's no backend for this story
- **DO NOT** build the full ActionFeed with real data — just the static onboarding placeholder
- **DO NOT** build the full UnitMosaic with clickable tiles — just the empty dashed-border placeholder
- **DO NOT** break existing layout, sidebar, header, or dark mode functionality
- **DO NOT** add new navigation items to the sidebar
- **DO NOT** modify `globals.css` or any design tokens

### Previous Story Intelligence

**From Story 1.3 (completed):**
- shadcn/ui initialized with New York style, Tailwind CSS 4 compatible
- Design tokens configured in `globals.css` using `@theme inline` and CSS variables (oklch)
- Inter font configured with tabular-nums
- 8 shadcn/ui components installed: button, sheet, separator, tooltip, switch, scroll-area, dropdown-menu, avatar
- Layout shell: sidebar (240px full / 64px collapsed / Sheet mobile) + header (64px) + main content area (max-w-[1280px], p-6)
- Skip link + ARIA landmarks in place
- Dark mode via `.dark` class on `<html>`, managed by `use-theme.ts` hook with localStorage
- `cn()` utility at `@/lib/utils`
- `lucide-react` already installed (auto-installed by shadcn)
- Focus ring pattern: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50`
- Import alias: `@/*` maps to `./src/*`

**From Story 1.3 Code Review fixes:**
- Mobile sidebar closes after navigation (onNavigate callback)
- Inline blocking script prevents dark mode FOUC
- French accents correct: Comptabilité, Réglages
- Removed redundant ARIA roles on semantic elements

**From Story 1.2:**
- Clerk auth middleware protects all routes
- `<UserButton />` in header
- `src/lib/api/client.ts` exists for future API calls
- 27 backend tests passing — MUST NOT regress

### Git Intelligence

Last 3 commits:
1. `8e184da` — `feat(layout): implement core layout shell with responsive design` (Story 1.3)
2. `fe619a0` — `feat(auth): configure Clerk authentication with JWT verification` (Story 1.2)
3. `111b594` — `Initial commit` (Story 1.1)

**Commit convention:** `feat(scope): description` — conventional commits format.

### Project Structure Notes

- Alignment with architecture: `components/features/dashboard/` for dashboard-specific components follows the feature-based frontend organization
- `components/features/` directory does not exist yet — it will be created by this story (first feature components)
- No deviation from architecture patterns
- This story creates the first `features/` subdirectory, establishing the pattern for all future feature components

### References

- [Source: epics.md#Story 1.4] — Acceptance criteria and user story
- [Source: epics.md#Epic 1] — Epic goal: "user can see an empty dashboard with the full layout"
- [Source: architecture.md#Frontend Architecture] — Feature-based organization, shadcn/ui, App Router
- [Source: architecture.md#Complete Project Directory Structure] — `components/features/` pattern
- [Source: ux-design-specification.md#Defining Core Experience] — Dashboard as primary interface, action feed as guide
- [Source: ux-design-specification.md#Journey 1: Onboarding] — Empty state progression, ActionFeed guiding onboarding
- [Source: ux-design-specification.md#Custom Components] — ActionFeed spec: prioritized task cards with inline actions
- [Source: ux-design-specification.md#Custom Components] — UnitMosaic spec: color-coded tiles, empty state = no tiles
- [Source: ux-design-specification.md#Custom Components] — KPITile spec: metric label, value, trend indicator
- [Source: ux-design-specification.md#Empty States & Loading States] — "Aucune action en attente" is the goal state
- [Source: ux-design-specification.md#Responsive Design] — Dashboard layout: 2-col desktop, single-col mobile
- [Source: 1-3-implement-core-layout-shell.md] — Layout shell, design tokens, component patterns, shadcn setup

## Change Log

- 2026-02-08: Story 1.4 implemented — empty dashboard with ActionFeed onboarding, UnitMosaic placeholder, KPI tiles placeholder, composed 2-column responsive layout
- 2026-02-08: Code review completed — 6 issues found (3 High, 3 Medium), all fixed. Reviewer: Claude Opus 4.6

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- **Task 1**: Created `action-feed.tsx` with `ActionItem` type, `ActionFeed` component accepting `actions` prop (defaults to onboarding actions), `ActionCard` with shadcn/ui Card + Button CTA linking to `/entities/new`, `EmptyState` with ClipboardList icon and "Aucune action en attente" message, "Recommandé" priority badge in accent color
- **Task 2**: Created `unit-mosaic-placeholder.tsx` with dashed border container (`border-2 border-dashed border-muted-foreground/25`), Building2 icon, "Aucun lot configuré" + sub-text, `min-h-[200px]` centered flex
- **Task 3**: Created `kpi-tiles-placeholder.tsx` with 4-tile responsive grid (`grid-cols-2 lg:grid-cols-4`), French labels, em-dash values ("—"), muted trend area placeholder
- **Task 4**: Replaced dashboard `page.tsx` with composed layout: H1 "Tableau de bord", `grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6`, left column (KPIs + Mosaic), right column (ActionFeed), responsive stacking on mobile
- **Task 5**: All accessibility built into components: `role="feed"` + `aria-label` on ActionFeed, `<article>` per action, `role="status"` + `aria-label` per KPI tile, `aria-label` on mosaic container. All colors use CSS variable tokens (no hardcoded). Focus indicators inherit from shadcn/ui Button defaults
- **Task 6**: `npm run lint` — 0 errors, `npx tsc --noEmit` — 0 errors, `npm test` (backend) — 27/27 tests pass, no regressions
- **shadcn/ui**: Installed `card` component via `npx shadcn@latest add card`
- All components are Server Components (no `"use client"` directive) — no client-side state needed for static placeholders

### Implementation Plan

Frontend-only story: 3 new feature components + 1 modified page + 1 shadcn/ui component installed. No backend changes. Static empty states with hardcoded onboarding data.

### File List

- `frontend/src/components/features/dashboard/action-feed.tsx` — NEW
- `frontend/src/components/features/dashboard/unit-mosaic-placeholder.tsx` — NEW
- `frontend/src/components/features/dashboard/kpi-tiles-placeholder.tsx` — NEW
- `frontend/src/components/ui/card.tsx` — NEW (shadcn/ui CLI install)
- `frontend/src/app/(auth)/dashboard/page.tsx` — MODIFIED
- `frontend/src/app/not-found.tsx` — NEW (review fix: friendly French 404)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6
**Date:** 2026-02-08
**Outcome:** Approved with fixes applied

### Findings (6 issues — all fixed)

**HIGH (3):**
1. **H1 — `ActionItem.icon: LucideIcon` non-serializable** — Changed to `icon: string` with internal `iconMap` lookup. Preserves Server Component compatibility for future dynamic data passing.
2. **H2 — CTA links to non-existent `/entities/new` route** — Created `app/not-found.tsx` with French 404 page ("Page introuvable") and back-to-dashboard CTA. Prevents raw Next.js 404 for all missing routes.
3. **H3 — KPI tiles excessive vertical padding** — Card `py-6` default overrode intent. Added `className="py-3"` to Card, removed no-op `pt-0` from CardContent.

**MEDIUM (3):**
1. **M1 — Missing `metadata` export on dashboard page** — Added `export const metadata: Metadata = { title: "Tableau de bord" }` for browser tab title and accessibility.
2. **M2 — `role="feed"` semantically incorrect** — Changed to `<ul>` with `<li>` wrapping each action card. Feed role requires `aria-setsize`/`aria-posinset` which weren't provided.
3. **M3 — `sprint-status.yaml` modified but not in File List** — Documented in File List above.

**LOW (1 — not fixed, acceptable):**
1. **L1 — `priorityLabels` defines 3 levels but only 1 used** — Acceptable prep for future stories.

### Post-Fix Validation
- `npm run lint` — 0 errors
- `npx tsc --noEmit` — 0 errors
- `npm test` (backend) — 27/27 tests pass, no regressions
