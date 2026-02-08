# Story 1.3: Implement Core Layout Shell with Responsive Design

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want to see a professional application layout with sidebar navigation, header, and main content area,
so that I can navigate the application on both desktop and mobile (FR64).

## Acceptance Criteria

1. **Given** I am authenticated, **When** I access the application on a desktop (>=1024px), **Then** I see a full sidebar with French-language navigation labels, a header with user menu, and a main content area **And** the layout uses the deep teal + slate color palette with Inter typeface

2. **Given** I am authenticated, **When** I access the application on a tablet (768px), **Then** the sidebar collapses to icon-only mode (64px) **And** all content remains accessible

3. **Given** I am authenticated, **When** I access the application on mobile (<640px), **Then** the sidebar is hidden behind a hamburger menu **And** the layout adapts to monitoring-only mode

4. **Given** I access the application, **When** I toggle the dark mode switch, **Then** the theme toggles between light and dark **And** my preference is persisted across sessions (localStorage)

5. **Given** any screen size, **When** I navigate via keyboard, **Then** WCAG 2.1 AA compliance is met: 4.5:1 contrast, keyboard navigation works, focus indicators are visible (deep teal ring, 2px offset)

6. **Given** this is the first story with UI components, **When** I check the design system, **Then** shadcn/ui is initialized with Tailwind CSS 4 + Radix UI **And** the deep teal + slate design tokens are configured in `globals.css`

## Tasks / Subtasks

- [x] **Task 1: Initialize shadcn/ui and design system tokens** (AC: 6)
  - [x] 1.1 Initialize shadcn/ui in the frontend project — run `npx shadcn@latest init` and select "New York" style, CSS variables, and Tailwind CSS
  - [x] 1.2 Configure deep teal + slate color palette in `src/app/globals.css` using `@theme` directive (Tailwind CSS 4 pattern — NOT `tailwind.config.js`)
  - [x] 1.3 Add Inter font from Google Fonts (replace Geist) — configure as primary sans-serif with `tabular-nums` for financial data
  - [x] 1.4 Configure light and dark mode CSS variables for the full palette (see Design Token Reference below)
  - [x] 1.5 Install required shadcn/ui components: `button`, `sheet`, `separator`, `tooltip`, `switch`, `scroll-area`, `dropdown-menu`, `avatar`

- [x] **Task 2: Create the `(auth)` route group with layout** (AC: 1, 2, 3)
  - [x] 2.1 Create `src/app/(auth)/layout.tsx` — the authenticated layout shell containing sidebar + header + main content area
  - [x] 2.2 Move the default `src/app/page.tsx` content to `src/app/(auth)/dashboard/page.tsx` as a temporary placeholder (just showing "Tableau de bord" as H1)
  - [x] 2.3 Redirect root `/` to `/dashboard` for authenticated users

- [x] **Task 3: Implement the sidebar component** (AC: 1, 2, 3)
  - [x] 3.1 Create `src/components/layout/sidebar.tsx` — full sidebar (240px) with French-language navigation labels
  - [x] 3.2 Navigation items: Tableau de bord, Biens, Locataires, Baux, Comptabilite, Documents, Reglages — with appropriate icons (Lucide)
  - [x] 3.3 Active state: deep teal background + bold text; Hover: slate-700 background on dark sidebar
  - [x] 3.4 Sidebar collapsible to icon-only (64px) at `md` breakpoint via CSS, or via toggle button
  - [x] 3.5 Mobile: sidebar becomes Sheet (slide-in overlay) triggered by hamburger button in header
  - [x] 3.6 Baillr logo/branding at top of sidebar
  - [x] 3.7 Install `lucide-react` for icons

- [x] **Task 4: Implement the header component** (AC: 1, 2, 3)
  - [x] 4.1 Create `src/components/layout/header.tsx` — top header bar
  - [x] 4.2 Left side: hamburger menu trigger (mobile only), breadcrumb area (placeholder for now)
  - [x] 4.3 Right side: dark mode toggle (Switch), Clerk `<UserButton />` for user menu
  - [x] 4.4 Responsive: on mobile, show hamburger trigger; on desktop, no hamburger

- [x] **Task 5: Implement dark mode** (AC: 4)
  - [x] 5.1 Create `src/hooks/use-theme.ts` — custom hook for theme management with localStorage persistence
  - [x] 5.2 Apply `dark` class on `<html>` element based on user preference (Tailwind CSS dark mode via class strategy)
  - [x] 5.3 Respect `prefers-color-scheme` system preference as default
  - [x] 5.4 Dark mode toggle in header using shadcn/ui Switch component
  - [x] 5.5 Ensure all design tokens have proper dark mode variants

- [x] **Task 6: Configure responsive layout** (AC: 1, 2, 3)
  - [x] 6.1 Desktop (lg+, >=1024px): full 240px sidebar + header + main content area
  - [x] 6.2 Tablet (md, 768px-1023px): collapsed 64px icon-only sidebar + header + main content area
  - [x] 6.3 Mobile (sm-, <768px): no sidebar (Sheet overlay), header with hamburger, full-width content
  - [x] 6.4 Main content area: max-width 1280px, centered on larger screens, 12-column grid ready
  - [x] 6.5 No footer — content fills viewport

- [x] **Task 7: Accessibility compliance** (AC: 5)
  - [x] 7.1 Semantic HTML: `<nav>` for sidebar, `<header>` for header, `<main>` for content area
  - [x] 7.2 ARIA landmarks: banner, navigation, main
  - [x] 7.3 Skip link: "Aller au contenu principal" as first focusable element
  - [x] 7.4 Focus ring: 2px deep teal outline with 2px offset on all interactive elements
  - [x] 7.5 Keyboard navigation: Tab through sidebar items, Enter to navigate, Escape to close mobile Sheet
  - [x] 7.6 Install `eslint-plugin-jsx-a11y` and add to ESLint config

- [x] **Task 8: Verify and validate** (AC: all)
  - [x] 8.1 Run `npm run lint` — zero errors in both apps
  - [x] 8.2 Run `npx tsc --noEmit` — zero TypeScript errors
  - [x] 8.3 Run `npm test` in backend — all 27 existing tests still pass
  - [x] 8.4 Visual check: desktop, tablet, mobile layouts match spec
  - [x] 8.5 Dark mode toggle works and persists on page refresh
  - [x] 8.6 Keyboard navigation works through all interactive elements

## Dev Notes

### CRITICAL: This is the Design System Foundation

This story establishes the visual identity and layout pattern that ALL 47 remaining stories build upon. Every page, component, and interaction in Baillr will be contained within this layout shell. Get the design tokens, the responsive breakpoints, and the component patterns right — they propagate everywhere.

### Architecture Compliance

**Location for layout components:** `frontend/src/components/layout/`

**Files to create:**
```
frontend/src/
├── app/
│   ├── globals.css                    # MODIFY: design tokens, Inter font, dark mode
│   ├── layout.tsx                     # MODIFY: add Inter font, dark mode class
│   ├── page.tsx                       # MODIFY: redirect to /dashboard
│   └── (auth)/
│       ├── layout.tsx                 # NEW: authenticated layout shell
│       └── dashboard/
│           └── page.tsx               # NEW: placeholder dashboard page
├── components/
│   ├── ui/                            # NEW: shadcn/ui components installed here
│   │   ├── button.tsx
│   │   ├── sheet.tsx
│   │   ├── separator.tsx
│   │   ├── tooltip.tsx
│   │   ├── switch.tsx
│   │   ├── scroll-area.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── avatar.tsx
│   └── layout/
│       ├── sidebar.tsx                # NEW: main sidebar navigation
│       ├── header.tsx                 # NEW: top header bar
│       └── skip-link.tsx              # NEW: accessibility skip link
├── hooks/
│   └── use-theme.ts                   # NEW: dark mode management hook
└── lib/
    └── utils.ts                       # NEW: shadcn/ui cn() utility (clsx + twMerge)
```

### Design Token Reference (Deep Teal + Slate Palette)

Configure in `globals.css` using Tailwind CSS 4 `@theme` directive. **DO NOT create a `tailwind.config.js` file** — Tailwind 4 uses CSS-based config.

```css
@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Deep Teal Primary Palette */
  --color-primary-50: oklch(0.97 0.02 200);
  --color-primary-100: oklch(0.93 0.04 200);
  --color-primary-200: oklch(0.85 0.07 200);
  --color-primary-300: oklch(0.75 0.10 200);
  --color-primary-400: oklch(0.62 0.12 200);
  --color-primary-500: oklch(0.50 0.12 200);
  --color-primary-600: oklch(0.45 0.12 200);
  --color-primary-700: oklch(0.38 0.10 200);
  --color-primary-800: oklch(0.32 0.08 200);
  --color-primary-900: oklch(0.27 0.07 200);
  --color-primary-950: oklch(0.20 0.05 200);

  /* Status Colors */
  --color-status-success: oklch(0.60 0.15 155);  /* Emerald green */
  --color-status-warning: oklch(0.75 0.15 75);   /* Amber */
  --color-status-danger: oklch(0.60 0.20 20);    /* Rose red */
  --color-status-neutral: oklch(0.70 0.01 260);  /* Slate gray */
}
```

**Light mode CSS variables** (on `:root`):
```css
:root {
  --background: oklch(1.00 0 0);           /* White */
  --foreground: oklch(0.15 0.01 260);      /* Slate-900 */
  --card: oklch(1.00 0 0);
  --card-foreground: oklch(0.15 0.01 260);
  --primary: oklch(0.45 0.12 200);         /* Deep teal-600 */
  --primary-foreground: oklch(1.00 0 0);   /* White text on teal */
  --secondary: oklch(0.90 0.01 260);       /* Slate-200 */
  --secondary-foreground: oklch(0.15 0.01 260);
  --muted: oklch(0.95 0.005 260);          /* Slate-100 */
  --muted-foreground: oklch(0.50 0.01 260);
  --accent: oklch(0.93 0.04 200);          /* Teal-100 */
  --accent-foreground: oklch(0.27 0.07 200);
  --destructive: oklch(0.55 0.20 25);      /* Red */
  --destructive-foreground: oklch(1.00 0 0);
  --border: oklch(0.90 0.01 260);          /* Slate-200 */
  --input: oklch(0.90 0.01 260);
  --ring: oklch(0.45 0.12 200);            /* Deep teal for focus */
  --sidebar: oklch(0.18 0.01 260);         /* Slate-900 (dark sidebar) */
  --sidebar-foreground: oklch(0.93 0.005 260);
  --sidebar-accent: oklch(0.45 0.12 200);  /* Deep teal active */
  --sidebar-accent-foreground: oklch(1.00 0 0);
}
```

**Dark mode CSS variables** (on `.dark`):
```css
.dark {
  --background: oklch(0.13 0.01 260);      /* Slate-950 */
  --foreground: oklch(0.95 0.005 260);     /* Slate-50 */
  --card: oklch(0.18 0.01 260);            /* Slate-900 */
  --card-foreground: oklch(0.95 0.005 260);
  --primary: oklch(0.55 0.12 200);         /* Deep teal-500 (lighter for dark bg) */
  --primary-foreground: oklch(1.00 0 0);
  --secondary: oklch(0.25 0.01 260);       /* Slate-800 */
  --secondary-foreground: oklch(0.95 0.005 260);
  --muted: oklch(0.22 0.01 260);           /* Slate-850 */
  --muted-foreground: oklch(0.65 0.005 260);
  --accent: oklch(0.32 0.08 200);          /* Teal-800 */
  --accent-foreground: oklch(0.93 0.04 200);
  --destructive: oklch(0.50 0.20 25);
  --destructive-foreground: oklch(1.00 0 0);
  --border: oklch(0.30 0.01 260);          /* Slate-700 */
  --input: oklch(0.30 0.01 260);
  --ring: oklch(0.55 0.12 200);            /* Lighter teal for dark mode focus */
  --sidebar: oklch(0.13 0.01 260);         /* Slate-950 */
  --sidebar-foreground: oklch(0.90 0.005 260);
  --sidebar-accent: oklch(0.55 0.12 200);
  --sidebar-accent-foreground: oklch(1.00 0 0);
}
```

### shadcn/ui Initialization (Tailwind CSS 4)

**CRITICAL:** shadcn/ui v2+ supports Tailwind CSS 4 natively. When running `npx shadcn@latest init`:
- Select "New York" style (more compact, suits professional tool)
- Choose CSS variables mode
- It will auto-detect Tailwind CSS 4 and configure appropriately
- Components are installed to `src/components/ui/`
- A `lib/utils.ts` file is created with the `cn()` helper (clsx + tailwind-merge)

**Important:** shadcn/ui init may modify `globals.css` — carefully review what it adds and integrate with the deep teal design tokens. Do NOT let it overwrite the custom palette.

### Inter Font Configuration

Replace the current Geist fonts with Inter in `layout.tsx`:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
```

**IMPORTANT:** The `@theme` directive in `globals.css` defines `--font-sans: 'Inter', ...` which Tailwind 4 uses for `font-sans`. The Next.js font loader handles optimal loading, and the CSS variable connects them.

### Sidebar Navigation Items

French-language labels as specified in the UX design:

| Label | Icon (Lucide) | Route | Description |
|-------|--------------|-------|-------------|
| Tableau de bord | `LayoutDashboard` | `/dashboard` | Main dashboard (active by default) |
| Biens | `Building2` | `/properties` | Properties list (future) |
| Locataires | `Users` | `/tenants` | Tenants list (future) |
| Baux | `FileText` | `/leases` | Leases list (future) |
| Comptabilite | `BookOpen` | `/accounting` | Account book (future) |
| Documents | `FolderOpen` | `/documents` | Generated documents (future) |
| Reglages | `Settings` | `/settings` | Settings (future, separate section) |

**Rules:**
- Active state: deep teal background (`bg-sidebar-accent`) + white text
- Hover state: slate-700 background on dark sidebar
- Icons: 20x20 (w-5 h-5), Lucide React icons
- Sidebar background: dark slate (matches the "Professional Command Center" design direction)
- Text: light slate/white on dark sidebar background

### Responsive Breakpoints

Match UX design spec exactly:

| Breakpoint | Width | Sidebar | Header | Layout |
|-----------|-------|---------|--------|--------|
| `lg+` | >=1024px | Full 240px with labels | Standard | 2-zone: sidebar + content |
| `md` | 768-1023px | Collapsed 64px icons | Standard | 2-zone: narrow sidebar + content |
| `sm-` | <768px | Hidden (Sheet overlay) | With hamburger | Full-width content |

### Dark Mode Implementation

**Strategy:** CSS class on `<html>` element (Tailwind `darkMode: 'class'` equivalent in v4).

**Implementation:**
1. `use-theme.ts` hook reads from localStorage, falls back to `prefers-color-scheme`
2. Toggles `dark` class on `document.documentElement`
3. Persists to `localStorage('baillr-theme')` with values: `'light'`, `'dark'`, `'system'`
4. Switch component in header toggles between light and dark

**IMPORTANT:** Tailwind CSS 4 uses the `dark` variant which responds to the `.dark` class by default (no `darkMode: 'class'` config needed — it works automatically in v4 via CSS `@media (prefers-color-scheme: dark)` OR the `.dark` class).

### Previous Story Intelligence

**From Story 1.1:**
- Tailwind CSS 4 configured with `@import "tailwindcss"` in `globals.css` and `@tailwindcss/postcss` in PostCSS
- Currently uses `@theme inline` directive in `globals.css` (Tailwind 4 pattern)
- Geist fonts loaded via `next/font/google` — need to replace with Inter
- `tsconfig.json` path alias: `@/*` maps to `./src/*`
- Empty component directories with `.gitkeep` files
- Layout metadata: `title: 'Baillr'`, `description: 'Gestion locative pour bailleurs'`

**From Story 1.2:**
- ClerkProvider wraps the entire app in `layout.tsx`
- `<html lang="fr">` already set
- Middleware protects all routes except `/sign-in` and `/sign-up`
- `<UserButton />` component available from `@clerk/nextjs` for user menu in header
- `src/lib/api/client.ts` exists — server-side API client with Clerk auth
- 27 backend tests passing (must not regress)

**Current `globals.css` content (to be replaced):**
```css
@import "tailwindcss";
:root {
  --background: #ffffff;
  --foreground: #171717;
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**Current `layout.tsx` structure (to be modified):**
- Imports `Geist` and `Geist_Mono` from `next/font/google` → replace with `Inter`
- Wraps children in `<ClerkProvider>` → KEEP
- `<html lang="fr">` → KEEP
- Body has `antialiased` class → KEEP, add dark mode class management

### Git Intelligence

Last 2 commits:
1. `fe619a0` — `feat(auth): configure Clerk authentication with JWT verification`
2. `111b594` — `Initial commit`

Files from Story 1.2 that are relevant: `frontend/src/app/layout.tsx` (will be modified again), `frontend/src/middleware.ts` (no changes needed).

### What NOT To Create in This Story

- No dashboard content — just a placeholder `<h1>Tableau de bord</h1>` page (dashboard content is Story 1.4)
- No EntitySwitcher component — that's Epic 2 Story 2.3
- No ActionFeed component — that's Epic 2/8
- No UnitMosaic component — that's Epic 2 Story 2.6
- No KPITile components — that's Epic 8
- No API endpoints or backend changes — this is frontend-only
- No route pages beyond `/dashboard` placeholder — other pages come in later epics
- No breadcrumb implementation — just reserve the space in the header

### Anti-Patterns to Avoid

- **DO NOT** create a `tailwind.config.js` or `tailwind.config.ts` — Tailwind CSS 4 uses CSS-based configuration via `@theme` in `globals.css`
- **DO NOT** use `@tailwind base; @tailwind components; @tailwind utilities;` — Tailwind 4 uses `@import "tailwindcss";`
- **DO NOT** hardcode colors — use CSS variables and Tailwind tokens (`bg-primary`, `text-muted-foreground`, etc.)
- **DO NOT** use inline styles for layout — use Tailwind responsive prefixes (`lg:w-60`, `md:w-16`, `sm:hidden`)
- **DO NOT** put layout components in `app/` directory — they belong in `components/layout/`
- **DO NOT** use `console.log` for debugging in committed code
- **DO NOT** break existing Clerk auth integration — `ClerkProvider`, middleware, and sign-in/sign-up pages must remain functional
- **DO NOT** remove or modify the `page.tsx` boilerplate before creating the redirect — ensure `/` always lands somewhere
- **DO NOT** use `useState` for theme when localStorage is needed — use the dedicated `use-theme.ts` hook
- **DO NOT** skip the `.dark` class-based approach — system preference detection alone is insufficient (users need explicit toggle)

### Project Structure Notes

- Alignment with architecture's frontend structure: `components/ui/` for shadcn/ui, `components/layout/` for shell components, `hooks/` for custom hooks
- No deviation from architecture — `(auth)/layout.tsx` route group matches the architecture's `(auth)/` pattern exactly
- This story does NOT create any `components/features/` directories — those come with Epic 2+

### References

- [Source: architecture.md#Frontend Architecture] — Component library (shadcn/ui), routing (App Router), state management
- [Source: architecture.md#Complete Project Directory Structure] — `src/components/layout/`, `src/app/(auth)/`
- [Source: ux-design-specification.md#Design System Foundation] — Color system, typography, spacing
- [Source: ux-design-specification.md#Visual Design Foundation] — Deep teal + slate palette, Inter typeface
- [Source: ux-design-specification.md#Responsive Design & Accessibility] — Breakpoints, sidebar behavior, WCAG
- [Source: ux-design-specification.md#Navigation Patterns] — French labels, sidebar structure, active states
- [Source: ux-design-specification.md#Accessibility Strategy] — WCAG 2.1 AA, keyboard nav, skip link, focus ring
- [Source: epics.md#Story 1.3] — Acceptance criteria and user story
- [Source: epics.md#Epic 1] — Epic goal: "user can see an empty dashboard with the full layout"
- [Source: 1-1-initialize-repository.md] — Foundation setup, Tailwind CSS 4 config, directory structure
- [Source: 1-2-configure-clerk-authentication.md] — Clerk integration, layout.tsx current state, middleware

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- ESLint flagged unused `X` import in sidebar.tsx — removed
- ESLint `react-hooks/set-state-in-effect` error in use-theme.ts — refactored from `useState` + `useEffect` to `useSyncExternalStore` pattern for proper external store synchronization
- shadcn/ui v3.8.4 init auto-detected Tailwind CSS 4, installed with New York style and slate base color
- `lucide-react` was auto-installed by shadcn/ui init — no separate installation needed (Task 3.7)
- `eslint-plugin-jsx-a11y` already included transitively via `eslint-config-next/core-web-vitals`

### Completion Notes List

- **Task 1**: Initialized shadcn/ui with New York style, configured deep teal + slate design tokens in globals.css using `@theme inline` and CSS variables (oklch color space), replaced Geist with Inter font (tabular-nums enabled via `font-feature-settings: "tnum"`), installed all 8 required shadcn/ui components
- **Task 2**: Created `(auth)` route group with layout shell (sidebar + header + main), dashboard placeholder page with "Tableau de bord" H1, root `/` redirects to `/dashboard` via Next.js `redirect()`
- **Task 3**: Sidebar with 7 French-language nav items (Lucide icons), dark slate background, deep teal active state with bold text, hover state slate-700, Baillr branding at top, three responsive modes (full 240px / collapsed 64px with tooltips / Sheet overlay for mobile)
- **Task 4**: Header with hamburger (mobile only), breadcrumb placeholder, dark mode toggle (Switch), Clerk UserButton for user menu
- **Task 5**: Theme management via `useSyncExternalStore` hook, localStorage persistence (`baillr-theme` key), system preference fallback, `.dark` class toggling on `<html>`, Sun/Moon icons with Switch toggle
- **Task 6**: Responsive layout — lg+ full sidebar, md collapsed icon-only, <768px Sheet overlay, main content max-w-[1280px] centered, no footer (content fills viewport via `h-dvh`)
- **Task 7**: Semantic HTML (`<nav>`, `<header>`, `<main>`), ARIA landmarks (banner, navigation, main), skip link "Aller au contenu principal", focus ring 2px deep teal with 2px offset, keyboard nav through sidebar items, Sheet Escape to close, `eslint-plugin-jsx-a11y` available via eslint-config-next
- **Task 8**: `npm run lint` — 0 errors, `npx tsc --noEmit` — 0 errors, `npm test` (backend) — 27/27 pass, `next build` — successful with all routes rendered

### Change Log

- 2026-02-08: Implemented core layout shell with responsive design (Story 1.3) — design system foundation with shadcn/ui, deep teal + slate palette, sidebar navigation, header, dark mode, accessibility compliance
- 2026-02-08: Code review (AI) — 5 fixes applied:
  - [H1] Mobile sidebar now closes after navigation via `onNavigate` callback on Link clicks
  - [M1] Added inline blocking script in root layout to prevent dark mode FOUC
  - [M2] Fixed French accents: Comptabilité, Réglages, Barre latérale
  - [M3] Removed redundant `role="main"` and `role="banner"` on semantic elements
  - [M4] Removed misleading `aria-label` on empty breadcrumb placeholder div
  - [L1] Added `package-lock.json` to File List (documentation accuracy)
  - [L2] Fixed `lib/utils/cn.ts` → `lib/utils.ts` in Dev Notes planned structure
  - [L3] ThemeToggle: replaced `toggleTheme` with `setTheme(checked ? "dark" : "light")` for correct Switch semantics

### File List

**New files:**
- frontend/src/app/(auth)/layout.tsx — authenticated layout shell
- frontend/src/app/(auth)/dashboard/page.tsx — placeholder dashboard page
- frontend/src/components/layout/sidebar.tsx — sidebar navigation component
- frontend/src/components/layout/header.tsx — header bar component
- frontend/src/components/layout/theme-toggle.tsx — dark mode toggle component
- frontend/src/components/layout/skip-link.tsx — accessibility skip link
- frontend/src/components/ui/button.tsx — shadcn/ui button
- frontend/src/components/ui/sheet.tsx — shadcn/ui sheet (mobile sidebar)
- frontend/src/components/ui/separator.tsx — shadcn/ui separator
- frontend/src/components/ui/tooltip.tsx — shadcn/ui tooltip
- frontend/src/components/ui/switch.tsx — shadcn/ui switch (dark mode toggle)
- frontend/src/components/ui/scroll-area.tsx — shadcn/ui scroll area
- frontend/src/components/ui/dropdown-menu.tsx — shadcn/ui dropdown menu
- frontend/src/components/ui/avatar.tsx — shadcn/ui avatar
- frontend/src/hooks/use-theme.ts — dark mode management hook
- frontend/src/lib/utils.ts — cn() utility (clsx + tailwind-merge)
- frontend/components.json — shadcn/ui configuration

**Modified files:**
- frontend/src/app/globals.css — replaced with deep teal + slate design tokens, Inter font, light/dark mode CSS variables
- frontend/src/app/layout.tsx — replaced Geist with Inter font, added suppressHydrationWarning for dark mode
- frontend/src/app/page.tsx — replaced boilerplate with redirect to /dashboard
- frontend/package.json — added shadcn/ui dependencies (clsx, tailwind-merge, class-variance-authority, lucide-react, radix-ui, tw-animate-css, shadcn)
- frontend/package-lock.json — updated with new dependencies

**Deleted files:**
- frontend/src/components/.gitkeep — replaced by actual component files
- frontend/src/hooks/.gitkeep — replaced by actual hook file
