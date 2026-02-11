---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/brainstorming/brainstorming-session-2026-02-08.md']
---

# UX Design Specification Baillr

**Author:** Monsieur
**Date:** 2026-02-08

---

## Executive Summary

### Project Vision

Baillr is a SaaS web application for French property managers (bailleurs) managing rental properties through SCIs or personal ownership. It replaces the fragmented workflow of specialized software (Emjysoft Gestion Locative) combined with Excel spreadsheets with a single, simple, fully automated solution. The property manager supervises; the software executes. Monthly management drops from ~2 hours to ~15 minutes.

### Target Users

**Primary Persona: Alain** — 52 years old, manages SCI SIRIUS WAT. 2 buildings, 10 apartments, 3 parking spots in Montauban. Uses Emjysoft + Excel for 8 years. Spends 2 hours every Saturday morning on property management. Intermediate tech proficiency — comfortable with digital tools but not a developer. Desktop-first user.

**Key user frustrations with current tools:**
- Rigid workflow imposed by software (data-centric instead of user-centric)
- Slow operations and dated UI creating friction at every step
- Split workflow between two tools (Emjysoft for rent calls/receipts, Excel for accounting/leases)

**User expectations:**
- Software that speaks the language of property management, not generic SaaS
- Professional, trustworthy aesthetic that appeals to SCI owners
- Complete automation with human supervision — the software proposes, the manager validates

### Key Design Challenges

1. **Domain complexity vs interface simplicity** — 64 functional requirements across 12 capability domains, legal concepts (loi ALUR, IRL/ILC/ICC, quittance vs reçu) must be presented without overwhelming the user
2. **Batch operations as core UX pattern** — Generate 10 rent calls, send 10 emails, match 8 payments: bulk actions must feel fluid, transparent, and reassuring with clear feedback
3. **Complete system onboarding** — No MVP concept; users must configure entities, properties, units, tenants, and leases upfront. Risk of abandonment if setup feels tedious
4. **Professional domain identity** — Not a generic tech SaaS: must resonate with SCI property managers, inspire confidence and professional seriousness

### Design Opportunities

1. **Dashboard "Health Pulse" as emotional anchor** — Color-coded unit mosaic (green/orange/red) delivers portfolio status at a glance. The moment that replaces 2 hours of Saturday morning stress
2. **Action feed = zero cognitive load** — The software tells what to do, the user validates. Inverts the Emjysoft paradigm where the user must know what to do next
3. **Anti-Emjysoft positioning** — Modern, fast, clean interface. Every screen is a direct contrast with the dated Emjysoft experience

## Core User Experience

### Defining Experience

The core experience of Baillr is the **monthly management cycle**: the recurring loop where the property manager opens the dashboard, sees what needs attention, and resolves everything in minutes through guided batch actions. The dashboard is the entry point, the action feed is the guide, and batch operations are the execution mechanism.

**Core loop:** Open dashboard → Review action feed → Execute proposed actions (batch generate, batch send, import & match, validate) → Dashboard turns green → Done.

**The ONE interaction to get right:** Bank statement import and automatic payment matching. This is where the user gains the most time versus the current Excel-based reconciliation. The system proposes matches; the user validates with one click each. This single interaction encapsulates the product promise: the software executes, the manager supervises.

### Platform Strategy

- **Desktop-first web application** optimized for mouse/keyboard interaction
- Responsive mobile adaptation for monitoring (dashboard, alerts) but not primary workflow execution
- No offline functionality required — SaaS with internet dependency acceptable for this use case
- No native mobile app — responsive web is sufficient for the monitoring use case
- Leverages browser capabilities: file upload (bank statements), PDF download, email integration

### Effortless Interactions

**Zero-thought actions (1 click each):**
- Generate all rent calls for the month → single batch action
- Send all rent calls by email with PDF → single batch action
- Validate a proposed payment match → single click per match
- Send all receipts after payment confirmation → single batch action
- Trigger a reminder for a late payment → single click from action feed

**Automatic without intervention:**
- Late payment detection based on configurable thresholds
- Receipt generation upon full payment confirmation
- IRL/ILC/ICC revision calculation when new INSEE index is available
- Action feed population with prioritized pending tasks
- Email alerts for critical events (unpaid rent, expiring insurance)

**Eliminated steps vs Emjysoft + Excel:**
- No manual rent call formatting — generated from lease data
- No switching between two applications — single unified tool
- No manual ledger entry — events build the account book automatically
- No manual IRL calculation — formula applied automatically with INSEE indices

### Critical Success Moments

1. **First batch generation** — User creates entities, properties, units, tenants, leases, clicks "Generate rent calls", and 10 rent calls appear in 2 seconds with correct amounts, IBANs, and legal mentions. This is the moment of realization: "this replaces everything."
2. **First bank reconciliation** — User imports a bank statement, system proposes matches. 8 payments matched in 30 seconds. Receipts generated instantly. The Saturday morning that used to take 2 hours is done in 12 minutes.
3. **Dashboard all green** — After the monthly cycle, all units show green (paid). The visual relief of seeing the entire portfolio healthy at a glance.
4. **First IRL revision** — System calculates revised rents automatically, generates 8 formal letters with correct legal formula. What used to require manual calculation and Word formatting is done in 3 clicks.

### Experience Principles

1. **Supervise, don't operate** — The software proposes actions; the user validates. Never require the user to figure out what to do next. The action feed is the guide.
2. **Batch by default** — Every repetitive action is designed as a batch operation first. Individual actions are the exception, not the rule.
3. **Instant feedback, total transparency** — Every batch action shows exactly what happened: how many generated, how many sent, how many matched. No black boxes.
4. **Domain-native language** — Use property management vocabulary (bail, quittance, appel de loyer, IRL), not generic SaaS terms. The interface speaks the user's professional language.
5. **Progressive disclosure** — Show the essential first, details on demand. Dashboard → action feed → specific task → detailed view. Never overwhelm with all 64 features at once.

## Desired Emotional Response

### Primary Emotional Goals

1. **In control and serene** — "My portfolio is managed, nothing slips through the cracks." The green dashboard delivers this serenity. The user never wonders if something was missed — the action feed surfaces everything proactively.
2. **Efficient and liberated** — "It's done in 15 minutes, my Saturday is free." The time savings IS the positive emotion. Every interaction reinforces that Baillr gives back time.
3. **Professional confidence** — "The documents are flawless, the calculations are correct, I'm fully compliant." Zero legal anxiety. Every generated document carries the right legal mentions, the right formula, the right references.

### Emotional Journey Mapping

| Stage | Desired Emotion | UX Trigger |
|-------|----------------|------------|
| First discovery | Curiosity + recognition | "This understands my job" — domain-native language, familiar concepts |
| Onboarding setup | Guided confidence | Progressive setup wizard, immediate visual feedback after each entity/property/unit creation |
| First batch generation | Wow + relief | 10 rent calls in 2 seconds — the realization moment |
| Monthly cycle | Calm efficiency | Dashboard → action feed → execute → done. Routine feels effortless |
| Bank reconciliation | Delight + speed | Automatic matching proposals validated with single clicks |
| Error/problem | Trust + clarity | Clear error messages, no data loss anxiety (event sourcing guarantees), actionable next steps |
| Returning user | Familiarity + anticipation | Dashboard immediately shows what needs attention — no rediscovery needed |

### Micro-Emotions

**Critical micro-emotions to cultivate:**
- **Confidence over confusion** — Every screen clearly communicates where the user is and what they can do. No dead ends, no hidden menus.
- **Trust over skepticism** — Financial calculations are transparent (show the formula, show the inputs, show the result). The user can verify without external tools.
- **Accomplishment over frustration** — Batch operations provide instant success feedback: "10 rent calls generated", "8 payments matched", "All receipts sent."

**Micro-emotions to prevent:**
- **Never confusion** — "Where do I do this?" must never occur. Navigation is predictable, action feed guides.
- **Never anxiety** — "Did it work?" must never linger. Every action has immediate, visible confirmation.
- **Never doubt** — "Is the IRL calculation correct?" is answered by showing the formula and INSEE reference directly on screen.

### Design Implications

- **Confidence** → Clean layout with clear hierarchy, breadcrumb navigation, consistent patterns across all modules
- **Serenity** → Dashboard color coding (green/orange/red) provides instant portfolio health assessment without reading numbers
- **Efficiency** → Batch action buttons prominently placed, minimal clicks to complete core workflows, keyboard shortcuts for power users
- **Trust** → Transparent calculations (show formula + inputs + result), immutable event history visible in account book, PDF preview before sending
- **Liberation** → Progress indicators during batch operations, completion summaries, "all done" states that feel rewarding

### Emotional Design Principles

1. **Show, don't tell** — Use visual cues (colors, icons, progress bars) to communicate state rather than text-heavy explanations
2. **Celebrate completion** — Every batch operation ends with a clear success summary. The user should feel accomplishment, not uncertainty
3. **Transparency builds trust** — Never hide calculations, never send without preview, never act without confirmation. The user supervises with full visibility
4. **Calm over excitement** — This is a professional tool for serious financial management. The emotional tone is calm confidence, not flashy gamification
5. **Anticipate needs** — The action feed surfaces tasks before the user thinks of them. Proactive guidance reduces cognitive load and creates the feeling of being supported

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**French Market Leaders:**
- **BailFacile** — Closest competitor in positioning. Clean, modern interface ("épurée et intuitive"), guided step-by-step workflows, targets individual landlords. Strength: simplicity and legal compliance. Weakness: still navigation-first (traditional sidebar → list → detail pattern).
- **Ublo** — Praised for UX design, unified dashboard concept. Targets professional managers and social housing — different persona. Relevant pattern: single centralized interface eliminating duplicate data entry.
- **GérerSeul** — Dominates Trustpilot ratings but with a more traditional, data-centric interface.

**International Benchmarks:**
- **AppFolio** — 94% Dashboard score, 94% Ease of Use. Industry benchmark for property management UX. Tile-based dashboards with real-time financial metrics.
- **Buildium** — Tile-based layout showing rent payment statuses, late fees, occupancy rates in real-time. Benchmarking capabilities comparing properties against industry standards.
- **DoorLoop** — Modern, fast interface with clean load times. Mobile-friendly design.

**Dashboard Industry Standard:**
Financial/banking dashboard style confirmed as the dominant pattern across all market leaders: colored KPI tiles, bar/line charts for treasury, prioritized alert lists, drill-down by property/tenant.

### Transferable UX Patterns

**Navigation Patterns:**
- Tile-based dashboard as central hub (from Buildium/AppFolio) — adapted as clickable unit mosaic
- Guided workflows for complex operations (from BailFacile) — adapted as continuous flow cycle
- Centralized single interface (from Ublo) — adapted as action-first paradigm

**Interaction Patterns:**
- One-click batch actions for bulk operations (industry standard)
- Contextual actions surfaced where needed (from BailFacile's guided workflows)
- Real-time status updates without page refresh (from AppFolio)

**Visual Patterns:**
- Color-coded status indicators: green (paid), orange (pending), red (late) (industry standard)
- Financial KPI tiles at top of dashboard (from banking apps)
- Progressive disclosure: summary → detail on demand (from AppFolio)

### Anti-Patterns to Avoid

1. **Navigation-first design** — All competitors force users to navigate to features. Users must know where to go and what to do. This creates cognitive load and wastes time.
2. **Page-per-operation workflow** — Monthly cycle split across 5+ separate pages (import page, matching page, receipts page, email page). Creates friction and disorientation.
3. **Data-centric interfaces** — Emjysoft paradigm: showing database tables with CRUD operations. Feels like a spreadsheet, not a management tool.
4. **Feature overload on dashboard** — Cramming every metric and chart onto the landing page. Creates overwhelm instead of clarity.
5. **Generic SaaS aesthetic** — Gradient buttons, rounded cards, startup vibes. Doesn't resonate with SCI property managers who need professional trust signals.

### Design Inspiration Strategy

**Baillr's Disruptive UX Positioning:**

All competitors have built **databases with an interface**. Baillr is an **management assistant with a database behind it.** The difference is fundamental: in BailFacile, you navigate data. In Baillr, you follow an action flow and everything gets done.

**Three Core Innovations:**

1. **Action-First Interface** — The dashboard is THE application. The action feed is the primary interface. Users don't navigate to features; features come to them. Traditional pages (tenants, leases) exist as secondary reference views.

2. **Continuous Flow Monthly Cycle** — The entire monthly cycle (import → match → validate → receipts → send → summary) runs as a single progressive flow on one screen. No page changes, no navigation. Like an e-commerce checkout tunnel, but for rental management.

3. **Clickable Status Mosaic** — The color-coded unit mosaic is not just an indicator — it's the entry point. Click a red tile → see the problem + proposed action. Click a green tile → see the receipt. Status IS navigation.

**What to Adopt:**
- Tile-based KPI display (from Buildium/AppFolio) for financial overview
- Color-coded status system (industry standard) for instant portfolio health
- Guided workflows (from BailFacile) as foundation for continuous flow

**What to Adapt:**
- Dashboard concept → elevated to action-first primary interface
- Batch operations → wrapped in continuous flow with rich feedback
- Status indicators → transformed into clickable navigation mosaic

**What to Avoid:**
- Navigation-first design (all competitors) → replaced by action-first paradigm
- Page-per-operation workflows → replaced by continuous flow
- Generic SaaS aesthetic → replaced by professional domain identity
- Data-centric CRUD interfaces → replaced by task-driven flows

**Deferred Innovation (Post-Launch):**
- Time-machine slider leveraging event sourcing for historical portfolio views
- Predictive intelligence on payment patterns and cash flow forecasting

## Design System Foundation

### Design System Choice

**shadcn/ui + Tailwind CSS 4 + Radix UI** — Themeable system with full source code ownership.

shadcn/ui components are copied into the project (not an npm dependency), built on Radix UI accessible headless primitives, and styled with Tailwind CSS 4. This provides proven, accessible components with complete customization control.

### Rationale for Selection

1. **Full code ownership** — Components live in the project source, not in node_modules. Every detail can be customized to match the professional property management identity without fighting a library's defaults.
2. **Native accessibility** — Radix UI guarantees keyboard navigation, screen reader support, and ARIA compliance out of the box. Critical for a professional tool used weekly.
3. **Tailwind 4 integration** — Utility-first CSS with native compatibility. No CSS conflicts, no specificity wars.
4. **Solo developer velocity** — No custom design system to build from scratch. shadcn/ui accelerates development while remaining fully flexible.
5. **Minimal visual opinion** — shadcn/ui is intentionally neutral, allowing Baillr's professional identity to be imposed without overriding opinionated defaults.
6. **Architecture alignment** — Already specified in the architecture document. No additional dependencies or technical decisions needed.

### Implementation Approach

- Install shadcn/ui CLI and initialize with Tailwind CSS 4 configuration
- Copy required components progressively as features are built (not all at once)
- Configure design tokens (colors, spacing, typography) in Tailwind config
- Extend with custom components for domain-specific patterns (unit mosaic, action feed, continuous flow)
- Co-locate component customizations alongside shadcn/ui base components in `components/ui/`

### Customization Strategy

**Color Identity: Deep Teal (Bleu Pétrole) + Slate**

- **Primary accent: Deep teal** — Rich, mature, grounded. Evokes stability and patrimoine. Distinctive in the property management SaaS market — no competitor uses this palette. Not associated with AI/tech aesthetics.
- **Neutral base: Slate** — Professional dark gray-blue for sidebar, headers, and structural elements. Comfortable for weekly use without eye fatigue.
- **Status colors (non-negotiable):**
  - Green — paid, healthy, complete
  - Orange/amber — pending, awaiting action
  - Red — late, urgent, requires attention
  - Gray — vacant, inactive, no lease
- **No conflict** — Deep teal accent is visually distinct from all four status colors.

**Visual Tone:**
- Professional and grounded — "patrimoine management tool", not "startup app"
- Clean and spacious — generous whitespace, clear hierarchy, no visual clutter
- Warm professionalism — not cold corporate, not casual startup
- Typography: clear, readable, sans-serif. Emphasis through weight and size, not decoration

**Component Customization Priorities:**
1. **Buttons** — Deep teal primary actions, slate secondary actions, status-colored contextual actions
2. **Cards** — Clean borders, subtle shadows, status-colored left border for at-a-glance status
3. **Tables** — Zebra striping with hover states, inline action buttons, batch selection checkboxes
4. **Forms** — Generous spacing, clear labels, inline validation with Zod, contextual help text
5. **Navigation** — Slate sidebar with deep teal active state, entity switcher prominently placed
6. **Custom components** — Unit mosaic tiles, action feed cards, continuous flow stepper, batch operation summaries

## Defining Core Experience

### Defining Experience

**Baillr in one sentence: "Open, follow the feed, everything is done in 15 minutes."**

The defining experience is the moment when Alain opens Baillr on a Saturday morning, follows the proposed actions in the action feed, and closes the application 15 minutes later with his entire portfolio managed. This is what he will tell another SCI manager about.

This is not a feature — it's a flow. The product's value is not in any single screen or capability, but in the seamless progression from "I opened the app" to "everything is done." The action feed orchestrates the entire session.

### User Mental Model

**Current mental model (Emjysoft + Excel):**
- User opens tool → must know what to do → navigates to features → executes one by one → switches to Excel → repeats
- Carries a mental checklist: "rent calls done? statement imported? payments matched? receipts sent? reminders sent?"
- The user is the orchestrator; the tools are passive instruments
- Knowledge lives in the user's head, not in the software

**Baillr mental model (target):**
- User opens Baillr → action feed tells what to do → user clicks → done → next → all green → closes
- No mental checklist needed — the software IS the checklist
- The software is the orchestrator; the user is the supervisor
- Knowledge lives in the system; the user validates decisions

**Mental model shift:** From "I manage my properties using software" to "My software manages my properties and I supervise."

### Success Criteria

**The core experience succeeds when:**

1. **Zero planning required** — Alain never needs to think "what should I do first?" The action feed presents tasks in priority order.
2. **Under 15 minutes** — The complete monthly cycle (rent calls + bank import + matching + receipts + reminders) completes in under 15 minutes for 10 units.
3. **No context switching** — Everything happens in one application. No Excel, no mental calculations, no switching between tools.
4. **Confidence at close** — When Alain closes the app, he knows nothing was missed. The dashboard shows all-green (or clearly explains what's pending and why).
5. **Repeatable routine** — The second month feels identical to the first. No re-learning, no rediscovery. Open → follow → done.

**Success indicators:**
- Time from app open to app close: <15 min for 10 units
- Actions taken outside Baillr during monthly cycle: zero
- Questions asked to the software ("where do I...?"): zero
- Dashboard status after cycle: all units green or explicitly tracked

### Novel UX Patterns

**Pattern classification: Familiar patterns combined in an innovative way.**

Baillr does not require users to learn entirely new interactions. Each individual pattern is familiar:
- Clicking a button (batch actions) — familiar
- Validating a proposed match (bank reconciliation) — familiar
- Reading a status dashboard (colored tiles) — familiar
- Following a checklist (action feed) — familiar

**The innovation is the combination:** These familiar patterns are woven into a single continuous flow that eliminates navigation, eliminates decision-making, and eliminates context switching. No single competitor does this.

**Three novel combinations:**

1. **Action feed as primary interface** — Familiar pattern (notification list) used as the main application interface rather than a secondary feature. Users don't navigate to the action feed; the action feed IS the app.
2. **Continuous flow for batch operations** — Familiar pattern (checkout tunnel) applied to property management. Import → match → validate → generate → send as a single uninterrupted flow instead of 5 separate pages.
3. **Status mosaic as navigation** — Familiar pattern (colored status indicators) elevated to a clickable navigation system. The status display IS the entry point to details and actions.

**No user education needed** — Each pattern individually requires zero learning. The innovation is invisible to the user; they simply experience "everything just flows."

### Experience Mechanics

**1. Initiation:**
- User opens Baillr → lands on dashboard
- Dashboard shows: unit mosaic (instant health check) + action feed (prioritized tasks) + KPI summary (collection rate, pending amount)
- Action feed items have clear labels and one-click action buttons
- First item is always the highest-priority task

**2. Interaction — Monthly Cycle Flow:**

```
Step 1: Action feed shows "Generate February rent calls" [Generate]
  → User clicks → 10 rent calls generated in 2 seconds
  → Summary: "10 rent calls generated. Total: 8,234.50€"
  → Next action appears: "Send all rent calls by email" [Send]

Step 2: User clicks Send
  → 10 emails with PDF sent
  → Summary: "10 emails sent. 2 without email address (manual download available)"
  → Action feed updates, next task surfaces

Step 3: Action feed shows "Import February bank statement" [Import]
  → User uploads CSV/Excel file
  → Continuous flow begins: matching screen appears inline

Step 4: Matching proposals displayed
  → "709.98€ from DOS SANTOS FIRME → Rent call Apt 102 Feb?" [✓] [✗]
  → User validates each match with single click
  → 8 matches validated in 30 seconds

Step 5: Receipts auto-generated for matched payments
  → "Send 8 receipts by email" [Send]
  → User clicks → done

Step 6: Late payment detected
  → "Apt 201 — Mme Dupont — 15 days late. Send reminder?" [Send reminder]
  → User clicks → email sent

Step 7: Summary
  → "Monthly cycle complete. 9/10 units paid. 1 reminder sent."
  → Dashboard updates: 9 green, 1 orange
```

**3. Feedback:**
- Every action produces an immediate visible result (count, amount, status change)
- Mosaic tiles change color in real-time as actions complete
- Batch summaries are rich and human-readable (not just "success")
- Errors are specific and actionable ("Mme Dupont has no email address — add it in tenant settings")

**4. Completion:**
- Dashboard shows final state: all green or clearly explained exceptions
- Action feed shows "No pending actions" or next scheduled task with date
- User knows they're done because the feed is empty and the mosaic is green
- Next session trigger: action feed will populate again when new tasks arise (next month, late payment detected, insurance expiring)

## Visual Design Foundation

### Color System

**Primary Palette: Deep Teal + Slate**

| Role | Color | Usage |
|------|-------|-------|
| Primary accent | Deep teal (bleu pétrole) | Action buttons, active states, links, highlights, brand identity |
| Neutral base | Slate | Sidebar background, headers, structural elements, text |
| Background | White / Slate-50 | Content areas, cards, forms |
| Surface | Slate-100 | Subtle backgrounds, hover states, table alternating rows |

**Status Colors (Non-negotiable, reserved for semantic meaning only):**

| Status | Color | Meaning |
|--------|-------|---------|
| Success / Paid | Green (emerald) | Payment received, lease active, action complete |
| Pending / Warning | Orange (amber) | Awaiting payment, awaiting action, approaching deadline |
| Late / Error | Red (rose) | Unpaid rent, overdue, error state, requires immediate attention |
| Vacant / Inactive | Gray (slate-300) | No active lease, disabled, inactive state |

**Semantic Color Mapping:**
- `primary` → deep teal (interactive elements, CTAs)
- `primary-foreground` → white (text on primary background)
- `secondary` → slate-200 (secondary buttons, less prominent actions)
- `accent` → deep teal light variant (subtle highlights, badges)
- `destructive` → red/rose (delete actions, critical warnings)
- `muted` → slate-100 (disabled states, placeholder text backgrounds)
- `border` → slate-200 (card borders, dividers, input borders)

**Dark Mode Palette:**
- Background: slate-900 / slate-950
- Surface: slate-800
- Text: slate-50 / slate-100
- Primary accent: deep teal (lighter variant for dark backgrounds, maintaining contrast)
- Status colors: same hues, adjusted for dark background contrast
- Borders: slate-700
- Dark mode is a first-class citizen, not an afterthought. Both themes must be designed simultaneously.

**Accessibility Compliance:**
- All text/background combinations must meet WCAG 2.1 AA minimum (4.5:1 contrast ratio for normal text, 3:1 for large text)
- Status colors are never the only indicator — always paired with icons or text labels
- Deep teal primary must maintain sufficient contrast on both light and dark backgrounds
- Focus indicators use deep teal ring with 2px offset for keyboard navigation visibility

### Typography System

**Primary Typeface: Inter**

Inter is a modern, highly legible sans-serif designed specifically for screen interfaces. It provides excellent readability at all sizes, extensive weight range, and built-in OpenType features for tabular numbers (critical for financial data).

**Why Inter:**
- Designed for UI, not adapted from print
- Tabular numbers (`font-variant-numeric: tabular-nums`) for aligned financial columns
- Excellent legibility at small sizes (table data, labels)
- Professional without being cold, modern without being trendy
- Free, open-source, widely available via Google Fonts or self-hosted
- Already the default in many shadcn/ui implementations

**Type Scale (based on 16px base):**

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 36px / 2.25rem | 700 | 1.2 | Dashboard KPI numbers, page hero |
| H1 | 30px / 1.875rem | 700 | 1.3 | Page titles |
| H2 | 24px / 1.5rem | 600 | 1.35 | Section headers |
| H3 | 20px / 1.25rem | 600 | 1.4 | Card titles, subsections |
| H4 | 16px / 1rem | 600 | 1.5 | Table headers, labels |
| Body | 16px / 1rem | 400 | 1.6 | Default text, descriptions |
| Body small | 14px / 0.875rem | 400 | 1.5 | Table cells, secondary text |
| Caption | 12px / 0.75rem | 500 | 1.4 | Timestamps, metadata, helper text |

**Financial Data Typography:**
- All monetary amounts use `font-variant-numeric: tabular-nums` for column alignment
- Amounts displayed with 2 decimal places, euro symbol after number (French convention): `709,98 €`
- Positive amounts in default text color, negative amounts in red
- Large KPI numbers use Display size with bold weight for visual impact

### Spacing & Layout Foundation

**Spacing Scale (4px base unit):**

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps (icon-to-text, inline elements) |
| sm | 8px | Component internal padding, compact spacing |
| md | 16px | Default component padding, form field gaps |
| lg | 24px | Section spacing, card padding |
| xl | 32px | Major section gaps |
| 2xl | 48px | Page-level spacing, layout gutters |

**Adaptive Density Strategy:**

| Context | Density | Rationale |
|---------|---------|-----------|
| Dashboard | Dense | Portfolio status at a glance without scrolling. Mosaic + KPIs + action feed + treasury visible simultaneously |
| Tables & Lists | Moderate | See 10+ items without scrolling while maintaining readability. Row height ~48px with comfortable padding |
| Forms & Data Entry | Spacious | Comfortable input experience for occasional use. Generous field spacing, clear labels, breathing room |
| Continuous Flow | Moderate-spacious | Guided experience with clear step progression. Enough space to focus on current action |

**Layout Grid:**
- 12-column grid for main content area
- Sidebar: fixed 240px width (collapsible to 64px icon-only)
- Max content width: 1280px (centered on larger screens)
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Dashboard: 2-column layout at lg+ (mosaic + KPIs left, action feed right), single column at md-

**Desktop-First Layout Structure:**
```
┌──────────────────────────────────────────────────┐
│ Header: Entity switcher + User menu              │
├────────┬─────────────────────────────────────────┤
│        │ Content Area (12-col grid)              │
│ Side-  │ ┌─────────────────┬───────────────────┐ │
│ bar    │ │ Mosaic + KPIs   │ Action Feed       │ │
│        │ ├─────────────────┴───────────────────┤ │
│ Nav    │ │ Treasury Chart / Detail View         │ │
│        │ └─────────────────────────────────────┘ │
├────────┴─────────────────────────────────────────┤
│ (No footer — content fills viewport)             │
└──────────────────────────────────────────────────┘
```

### Accessibility Considerations

- **Color contrast:** WCAG 2.1 AA minimum (4.5:1) for all text. AAA (7:1) preferred for body text.
- **Color independence:** Status is never conveyed by color alone — always paired with icons (checkmark, clock, alert triangle) and text labels.
- **Keyboard navigation:** Full keyboard accessibility via Radix UI primitives. Focus rings in deep teal, 2px with offset. Tab order follows visual layout.
- **Screen readers:** ARIA labels on all interactive elements. Live regions for batch operation results and status changes.
- **Font sizing:** Minimum 12px for any visible text. Users can scale via browser zoom without layout breaking.
- **Touch targets:** Minimum 44x44px for interactive elements (mobile responsive views).
- **Motion:** Respect `prefers-reduced-motion` for animations. All transitions are subtle and functional, not decorative.
- **Dark mode:** Designed as equal experience, not degraded. All contrast ratios validated for both themes.

## Design Direction Decision

### Design Directions Explored

Design direction was converged through collaborative exploration across steps 3-8 rather than through visual mockup comparison. The action-first paradigm, continuous flow innovation, and deep teal identity were defined through iterative discussion, competitive analysis, and persona-driven reasoning. No alternative directions were needed — the design vision emerged clearly from the product requirements and UX strategy.

### Chosen Direction

**"Professional Command Center"** — A dashboard-centric, action-first interface that combines the information density of a financial dashboard with the guided simplicity of a task manager.

**Visual Identity:**
- Deep teal (bleu pétrole) + slate palette with light and dark mode
- Inter typeface with tabular numbers for financial data
- Clean, spacious forms contrasting with dense, information-rich dashboard
- Status mosaic as both visual indicator and navigation entry point

**Layout Direction:**
- Fixed slate sidebar (240px, collapsible) with domain-native navigation labels
- Header bar with entity switcher (SCI selector) prominently placed
- Dashboard as primary landing: mosaic + KPIs (left), action feed (right), treasury chart (bottom)
- Content area fills viewport — no footer, no wasted space
- Continuous flow replaces multi-page workflows for batch operations

**Interaction Direction:**
- Action feed drives the experience — tasks surface automatically, user validates
- Single-click batch operations with rich inline summaries
- Mosaic tiles are clickable — status IS navigation
- Forms use progressive disclosure: essential fields first, advanced options expandable
- Modals for confirmations and previews (PDF preview before send)

**Component Style:**
- Cards with subtle shadows and status-colored left borders
- Tables with zebra striping, inline actions, batch selection
- Buttons: deep teal primary, slate secondary, status-colored contextual
- Toast notifications for batch operation results
- Skeleton loaders for async content (TanStack Query loading states)

### Design Rationale

1. **Action-first over navigation-first** — Competitors force users to navigate to features. Baillr brings features to the user via the action feed. This directly delivers the "15 minutes" promise.
2. **Dense dashboard, spacious forms** — Adaptive density matches the usage pattern: quick overview (dense) vs. occasional data entry (spacious). Validated by banking app patterns (AppFolio, Buildium).
3. **Deep teal identity** — Distinctive in the property management market (no competitor uses it), professional without being corporate, doesn't conflict with status colors (green/orange/red/gray).
4. **Continuous flow for monthly cycle** — E-commerce checkout tunnel pattern applied to property management. Eliminates page-per-operation anti-pattern found in all competitors.
5. **Dark mode as first-class** — Professional tool used weekly, often early morning. Dark mode reduces eye strain and signals modern, premium quality.

### Implementation Approach

**Phase 1 — Foundation:**
- Initialize shadcn/ui with deep teal + slate theme tokens in Tailwind config
- Set up light/dark mode toggle with system preference detection
- Build core layout shell: sidebar + header + content area
- Implement entity switcher component

**Phase 2 — Dashboard:**
- Build unit mosaic component (clickable tiles with status colors)
- Build action feed component (prioritized task cards with inline actions)
- Build KPI summary tiles (collection rate, pending amount, unit count)
- Build treasury chart (bar chart, income vs expenses, 12 months)

**Phase 3 — Continuous Flow:**
- Build flow stepper component for monthly cycle
- Build bank import + matching interface (inline, no page change)
- Build batch operation summary component (rich, human-readable results)

**Phase 4 — CRUD Views:**
- Build list/table views for entities, properties, units, tenants, leases
- Build form views with progressive disclosure
- Build detail views with contextual actions

**Design tokens to configure in Tailwind:**
```
deep-teal-50 through deep-teal-950 (10 shades)
slate-50 through slate-950 (existing Tailwind palette)
status-success (emerald)
status-warning (amber)
status-danger (rose)
status-neutral (slate-300)
```

## User Journey Flows

### Journey 1: Onboarding — First Setup

**Entry point:** User signs up via Clerk → lands on empty dashboard
**UX paradigm:** Action feed guides onboarding through empty states — no wizard, no modal sequence

**Flow:**

```mermaid
flowchart TD
    A[Sign up via Clerk] --> B[Empty Dashboard]
    B --> C[Action Feed: "Créez votre première entité propriétaire"]
    C --> D[User clicks → Entity creation form]
    D --> E[Fills: name, SIRET, address, bank accounts]
    E --> F[Saves → Dashboard shows entity, mosaic empty]
    F --> G[Action Feed: "Ajoutez votre premier bien immobilier"]
    G --> H[User clicks → Property creation form]
    H --> I[Fills: address, type, details]
    I --> J[Saves → Action Feed: "Créez les lots de ce bien"]
    J --> K[User clicks → Unit creation form]
    K --> L[Fills: unit name, type, options - boiler/parking]
    L --> M{More units?}
    M -->|Yes| K
    M -->|No| N[Action Feed: "Enregistrez vos locataires"]
    N --> O[User clicks → Tenant creation form]
    O --> P[Fills: name, type physique/morale, contact, insurance]
    P --> Q{More tenants?}
    Q -->|Yes| O
    Q -->|No| R[Action Feed: "Créez vos baux"]
    R --> S[User clicks → Lease creation form]
    S --> T[Fills: tenant, unit, rent, deposit, due date, IRL index, revision date, billing lines]
    T --> U{More leases?}
    U -->|Yes| S
    U -->|No| V[Action Feed: "Générez vos premiers appels de loyer"]
    V --> W[User clicks → Batch generation]
    W --> X[10 rent calls in 2 seconds]
    X --> Y[Summary + "Envoyez les appels par email"]
    Y --> Z[Dashboard alive: mosaic shows 10 orange units]
```

**Empty state progression:**
| Step | Dashboard State | Action Feed Message |
|------|----------------|---------------------|
| 1 | Completely empty | "Créez votre première entité propriétaire" |
| 2 | Entity created, no properties | "Ajoutez votre premier bien immobilier" |
| 3 | Property exists, no units | "Créez les lots de ce bien" |
| 4 | Units exist (gray tiles), no tenants | "Enregistrez vos locataires" |
| 5 | Tenants exist, no leases | "Créez vos baux" |
| 6 | Leases exist (gray → waiting) | "Générez vos premiers appels de loyer" |
| 7 | Rent calls generated (orange tiles) | "Envoyez les appels par email" |
| 8 | Emails sent | "Importez votre relevé bancaire quand disponible" |

**Key UX decisions:**
- Each form returns to dashboard after save — user sees progress visually (mosaic populating)
- Action feed always shows exactly ONE next step — never overwhelms with all remaining steps
- Mosaic tiles appear as gray (vacant) when units are created, then transition to orange (awaiting payment) after rent calls are generated
- Entity switcher appears in header as soon as first entity is created
- Estimated onboarding time: ~10 minutes for 10 units (per PRD success criteria)

### Journey 2: Monthly Cycle — Happy Path

**Entry point:** Dashboard on first Saturday of the month
**UX paradigm:** Continuous flow — entire cycle on one screen without page navigation

**Flow:**

```mermaid
flowchart TD
    A[Open Baillr → Dashboard] --> B[Mosaic: 8 green, 1 orange, 1 red]
    B --> C[KPIs: 90% collected, 1 pending, 1 late]
    C --> D[Action Feed prioritized list]

    D --> E["① Importez le relevé Banque Postale" - click]
    E --> F[File upload dialog → CSV/Excel selected]
    F --> G[--- CONTINUOUS FLOW BEGINS ---]

    G --> H[Matching proposals displayed inline]
    H --> I["709,98€ DOS SANTOS FIRME → Apt 102 Jan?" ✓/✗]
    I --> J[User validates with single click]
    J --> K{More matches?}
    K -->|Yes| I
    K -->|No| L[Summary: "8 paiements rapprochés"]

    L --> M[Receipts auto-generated]
    M --> N["Envoyez 8 quittances par email" - click]
    N --> O[8 emails sent]
    O --> P[Summary: "8 quittances envoyées"]

    P --> Q[--- CONTINUOUS FLOW ENDS ---]

    Q --> R[Action Feed: "Relance à envoyer - Apt 201 Mme Dupont"]
    R --> S[User clicks → Reminder email preview]
    S --> T[User confirms → Email sent]

    T --> U[Action Feed: "Importez le relevé BNP"]
    U --> V[Same flow → 2 more matches]

    V --> W[Dashboard updates: 10 green, 0 orange, 1 reminded]
    W --> X[Action Feed: "Aucune action en attente"]
    X --> Y[Done — 12 minutes total]
```

**Continuous flow detail (step-by-step on single screen):**
```
┌─────────────────────────────────────────────────┐
│ Cycle mensuel — Février 2026                    │
│                                                 │
│ ① Import relevé    ✅ Fichier chargé            │
│ ② Rapprochement    🔄 En cours                  │
│ ③ Quittances       ⏳ À venir                   │
│ ④ Envoi            ⏳ À venir                   │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Rapprochement bancaire                      │ │
│ │                                             │ │
│ │ 709,98€ DOS SANTOS FIRME                    │ │
│ │ → Appel loyer Apt 102 Janvier    [✓] [✗]   │ │
│ │                                             │ │
│ │ 986,33€ ACCO F.                             │ │
│ │ → Appel loyer Apt 302 Janvier    [✓] [✗]   │ │
│ │                                             │ │
│ │ 3/8 validés                      [Suivant]  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Key UX decisions:**
- Stepper at top shows progress through the flow (import → match → receipts → send)
- Matching happens inline — no page change, no modal
- Each match is a single row with validate/reject buttons
- After all matches validated, flow auto-advances to receipt step
- User can exit flow at any time — progress is saved, action feed will resume where left off
- Multiple bank statements handled sequentially (Banque Postale, then BNP)

### Journey 3: Unpaid Rent Management — 3-Tier Escalation

**Entry point:** Email alert or dashboard red tile
**UX paradigm:** Action feed proposes escalation steps, user validates each tier

**Flow:**

```mermaid
flowchart TD
    A[Dashboard: Apt 201 tile turns red] --> B[Action Feed: "Impayé détecté — Apt 201 Mme Dupont"]
    B --> C[Email alert sent to bailleur]

    C --> D[Action Feed: "Tier 1 — Envoyer relance email"]
    D --> E[User clicks → Email preview with amounts and references]
    E --> F[User confirms → Reminder email sent]
    F --> G[Status: "Relancé le 15/01 — en attente"]

    G --> H{Payment received?}
    H -->|Yes - Full| I[Receipt auto-generated → tile turns green]
    H -->|Yes - Partial| J[Partial receipt → balance updated → tile stays orange]
    H -->|No - 10 days| K[Action Feed: "Tier 2 — Mise en demeure recommandée"]

    K --> L[User clicks → Formal notice preview]
    L --> M[Legal mentions, amounts, lease references auto-filled]
    M --> N{Send method?}
    N -->|PDF download| O[Download for postal dispatch]
    N -->|AR24/Maileva| P[Send as registered mail via API]

    P --> Q[Status: "Mise en demeure envoyée le 25/01"]
    Q --> R{Payment received?}
    R -->|Yes| I
    R -->|No - 10 business days| S[Action Feed: "Tier 3 — Signalement impayé"]

    S --> T[User clicks → Multi-stakeholder notification]
    T --> U[3 letters generated: insurance, lawyer, guarantor]
    U --> V[User reviews each → confirms send]
    V --> W[Status: "Signalement émis le 08/02"]

    J --> X[Tenant current account shows balance: -209,98€]
    X --> Y{Remaining payment received?}
    Y -->|Yes| Z[Full receipt generated → tile turns green]
    Y -->|No| D
```

**Key UX decisions:**
- Escalation is proactive — the system proposes, never auto-executes (user always validates)
- Each tier shows a preview before sending (no surprises)
- Tenant current account is accessible from the red mosaic tile (click → see balance, history, escalation status)
- Partial payments tracked distinctly: reçu de paiement ≠ quittance de loyer
- Timeline of escalation visible in tenant detail view

### Journey 4: Annual Cycle — IRL Revision + Charges Regularization

**Entry point:** Action feed surfaces revision/regularization tasks at configured dates
**UX paradigm:** Batch review and approval with transparent calculations

**Flow:**

```mermaid
flowchart TD
    A[Action Feed: "Révision IRL — Nouvel indice Q2 disponible"] --> B[User clicks → Revision review screen]
    B --> C[Table: all leases with revision due]

    C --> D[Per lease row shows:]
    D --> E["Apt 102: 630,00€ × (146,68 / 145,17) = 636,55€"]
    E --> F[Formula + inputs + result — fully transparent]

    F --> G[User reviews all revisions]
    G --> H{Approve all?}
    H -->|Approve batch| I[All revisions applied]
    H -->|Modify individual| J[User adjusts specific lease → re-calculates]
    J --> I

    I --> K["Générer les lettres de révision" — click]
    K --> L[8 formal letters generated with legal formula]
    L --> M["Envoyer par email" — click]
    M --> N[Letters sent → revised rents apply to next rent calls]

    N --> O[--- January: Charges Regularization ---]
    O --> P[Action Feed: "Régularisation charges 2025 à effectuer"]
    P --> Q[User clicks → Charge entry form]
    Q --> R[Enter actual charges by category]
    R --> S[Enter water meter readings per unit]
    S --> T[System calculates per-tenant statement]
    T --> U[Pro-rata by occupancy period — provisions paid = balance]
    U --> V[Preview: "Mme Acco: trop-perçu 45€ / M. Dupont: complément 22€"]
    V --> W[User approves → statements generated]
    W --> X[Credits/debits applied to tenant current accounts]
    X --> Y["Exporter le livre de comptes 2025" — click]
    Y --> Z[Excel export ready for accountant]
```

**Key UX decisions:**
- IRL revision shows the complete formula inline (current_rent × new_index / previous_index) — builds trust
- Batch approval with individual override: approve all at once, or modify specific leases
- Charge regularization uses a structured form: charge categories on the left, amounts on the right
- Water meter readings entered per unit with automatic consumption calculation
- Pro-rata calculation shown transparently with dates and occupancy periods
- Account book export is one click from the action feed

### Journey Patterns

**Consistent patterns across all journeys:**

1. **Action Feed Entry** — Every journey starts from the action feed, never from navigation. The feed proposes, the user acts.
2. **Preview Before Action** — Every sending action (email, registered mail, revision letter) shows a preview. The user confirms with full visibility.
3. **Batch with Individual Override** — Batch operations are the default (approve all, send all), but individual items can be modified before batch execution.
4. **Rich Completion Summary** — Every batch operation ends with a human-readable summary: count, amounts, exceptions, next steps.
5. **Status Cascade** — Actions trigger visual status changes: mosaic tiles change color, KPIs update, action feed items complete and new ones surface.
6. **Progressive Escalation** — Systems that require multi-step processes (unpaid management, onboarding) advance one step at a time, never skipping ahead.

### Flow Optimization Principles

1. **Minimize clicks to value** — Monthly cycle from open to done in ~15 clicks for 10 units. Each click produces visible progress.
2. **No dead ends** — Every screen has a clear "next action." Empty states guide, error states suggest recovery, completion states show what's next.
3. **Interruptible flows** — The continuous flow (monthly cycle) can be interrupted and resumed. Progress is saved. The action feed remembers where the user left off.
4. **Transparent calculations** — Every financial computation (IRL formula, charge pro-rata, tenant balance) shows inputs + formula + result. The user never has to trust a black box.
5. **One flow, multiple banks** — The monthly cycle handles multiple bank statements sequentially within the same continuous flow, without restarting.

## Component Strategy

### Design System Components

**shadcn/ui components used directly or with light customization:**

| Component | Usage in Baillr |
|-----------|----------------|
| Button | Batch actions, CTAs, validate/reject |
| Card | Action feed items, KPI tiles, detail cards |
| Table | Entity/property/unit/tenant/lease lists |
| Form / Input / Label | CRUD forms (entity, property, unit, tenant, lease) |
| Select / Combobox | Entity switcher, selectors (property type, IRL index) |
| Dialog / AlertDialog | Send previews, delete confirmations |
| Toast | Batch results ("8 quittances envoyées") |
| Badge | Statuses (paid, pending, unpaid), types |
| Tabs | Detail view navigation (tenant: info/account/history) |
| Skeleton | Loading states (TanStack Query) |
| Avatar | Tenant initials in lists |
| Separator | Divisions in long forms |
| Switch | Dark mode toggle, on/off options |
| Tooltip | Contextual help on legal terms |
| Dropdown Menu | Contextual actions on table rows |
| Sheet | Mobile sidebar (responsive) |
| Accordion | Progressive disclosure in forms |
| Progress | Continuous flow progression |
| Checkbox | Batch selection in tables |
| Scroll Area | Long lists (action feed, matching) |

### Custom Components

**Components not available in shadcn/ui — designed for Baillr's unique patterns:**

#### UnitMosaic

**Purpose:** Display portfolio health at a glance through clickable color-coded tiles, each representing a rental unit
**Content:** Unit identifier (short label), status color (green/orange/red/gray), tenant name on hover
**Actions:** Click tile → navigate to unit detail with contextual actions; hover → tooltip with tenant + status detail
**States:** Green (paid), Orange (pending/awaiting), Red (late/unpaid), Gray (vacant/no lease), Pulsing border (action required)
**Variants:** Compact (dashboard — small tiles, max density), Expanded (full page — larger tiles with inline info)
**Accessibility:** ARIA grid role, keyboard arrow navigation between tiles, status announced by screen reader (not just color), focus ring on active tile

#### ActionFeed

**Purpose:** Guide the user through prioritized tasks — the primary interface replacing traditional navigation
**Content:** Action title, description, contextual amount/count, inline action button(s), timestamp, priority indicator
**Actions:** Primary CTA button per item (Generate, Send, Import, Approve), dismiss/snooze, expand for details
**States:** Default (pending action), In progress (spinner), Completed (green check + summary), Empty ("Aucune action en attente")
**Variants:** Dashboard (compact list, 5-7 visible items), Full-page (expanded with grouping by category), Onboarding (single-item focus with progress context)
**Accessibility:** ARIA live region for new items, action buttons keyboard-accessible, screen reader announces priority level

#### ContinuousFlowStepper

**Purpose:** Guide the monthly cycle as a single uninterrupted flow on one page — import → match → receipts → send
**Content:** Step labels, current step highlight, completion status per step, active step content area
**Actions:** Auto-advance on step completion, manual navigation to completed steps (review), exit flow (return to dashboard)
**States:** Pending (gray), Active (teal + expanded content), Completed (green check), Error (red — step failed)
**Variants:** Horizontal (desktop — steps as top bar), Vertical (mobile — steps as left sidebar)
**Accessibility:** ARIA stepper role, step labels announced, current step focus, keyboard navigation between steps

#### MatchingRow

**Purpose:** Present a bank transaction with its proposed rent call match for single-click validation
**Content:** Transaction amount, payer name (from bank), proposed match (unit + tenant + period), confidence indicator
**Actions:** Validate (✓), Reject (✗), Reassign (manually pick different rent call)
**States:** Default (proposed), Validated (green background), Rejected (strikethrough, dimmed), Reassigned (manual match shown), No match found (orange, manual assignment required)
**Variants:** Standard (single match), Ambiguous (multiple possible matches — dropdown to select)
**Accessibility:** Row keyboard-navigable, ✓/✗ as labeled buttons (not just icons), match description readable by screen reader

#### BatchSummary

**Purpose:** Provide rich, human-readable feedback after every batch operation
**Content:** Operation name, count of items processed, total amount, exceptions list, next suggested action
**Actions:** View details (expand exceptions), proceed to next action, dismiss
**States:** Success (all items processed), Partial success (some exceptions), Failure (operation failed)
**Variants:** Inline (within continuous flow), Toast-like (overlay after dashboard action), Full-page (for complex summaries like charge regularization)
**Accessibility:** ARIA alert role, summary text readable, exception list navigable

#### KPITile

**Purpose:** Display a financial metric with context (trend, comparison) in a compact tile format
**Content:** Metric label, current value (formatted €), trend indicator (up/down/stable), comparison period
**Actions:** Click → drill down to detailed view (e.g., click "Taux d'encaissement" → see per-unit breakdown)
**States:** Positive (green accent for good metrics), Warning (orange for concerning), Neutral (default)
**Variants:** Small (dashboard grid — number + label only), Medium (with trend), Large (with mini-chart)
**Accessibility:** Metric announced with label + value + trend direction

#### EntitySwitcher

**Purpose:** Switch between managed entities (SCIs, personal ownership) — always visible in the header
**Content:** Current entity name + type, dropdown list of all entities, "Manage entities" link
**Actions:** Select entity → entire dashboard/data refreshes for that entity context
**States:** Single entity (display only, no dropdown), Multiple entities (dropdown enabled), Loading (skeleton while switching)
**Variants:** Desktop (full name + dropdown), Mobile (abbreviated + sheet selector)
**Accessibility:** ARIA combobox role, entity names announced, current selection indicated

#### TenantCurrentAccount

**Purpose:** Display the tenant's financial ledger — all debits and credits with running balance
**Content:** Chronological event list (rent calls, payments, receipts, adjustments), running balance, period filter
**Actions:** Filter by period, export to PDF/Excel, click event → see source document
**States:** Balanced (zero balance — green), Credit (tenant overpaid — teal), Debit (tenant owes — red)
**Variants:** Summary (latest 3 months), Full (complete history), Print-ready (formatted for PDF export)
**Accessibility:** Table structure with sortable columns, balance announced with polarity

#### RevisionTable

**Purpose:** Present all IRL/ILC/ICC revisions due with transparent formula and batch approval
**Content:** Per-row: unit, current rent, formula (rent × new_index / old_index), new rent, delta
**Actions:** Approve all (batch), modify individual, reject individual, generate revision letters
**States:** Pending review, Approved, Modified (user-adjusted), Rejected
**Variants:** IRL (residential), ILC (commercial), ICC (construction) — different index references
**Accessibility:** Table with clear headers, formula readable as text, batch action labeled

#### StatusTimeline

**Purpose:** Show escalation history for unpaid rent management — visual timeline of actions taken
**Content:** Chronological entries: detection date, tier 1 reminder, tier 2 formal notice, tier 3 notification, payments received
**Actions:** Click entry → see document sent or payment detail
**States:** Active escalation (in progress), Resolved (payment received — green end), Ongoing (red indicator)
**Variants:** Compact (sidebar widget), Full (dedicated section in tenant detail)
**Accessibility:** ARIA timeline role, entries announced chronologically, status per entry described

### Component Implementation Strategy

**Approach:** Build custom components using shadcn/ui primitives + Tailwind design tokens. Every custom component is composed from existing atoms (Button, Card, Badge, etc.) to maintain visual consistency.

**Foundation Components** (from shadcn/ui — install progressively):
- Buttons, Cards, Tables, Forms, Dialogs, Toasts, Badges, Tabs, Skeleton, Tooltips, Dropdowns, Sheets, Accordion, Progress, Checkbox, ScrollArea

**Custom Components** (built on top of foundation):
- UnitMosaic (uses Card + Badge primitives)
- ActionFeed (uses Card + Button + Badge primitives)
- ContinuousFlowStepper (uses Progress + Card primitives)
- MatchingRow (uses Table row + Button primitives)
- BatchSummary (uses Card + Badge + Toast primitives)
- KPITile (uses Card primitive)
- EntitySwitcher (uses Select/Combobox primitive)
- TenantCurrentAccount (uses Table + Badge primitives)
- RevisionTable (uses Table + Button + Badge primitives)
- StatusTimeline (new structure, uses Card + Badge primitives)

### Implementation Roadmap

**Phase 1 — Core (needed for basic workflow):**
1. EntitySwitcher — needed for multi-entity navigation from day 1
2. ActionFeed — the primary interface, needed for dashboard and onboarding
3. UnitMosaic — the visual anchor, needed for dashboard
4. KPITile — financial overview on dashboard

**Phase 2 — Monthly Cycle (needed for core value delivery):**
5. ContinuousFlowStepper — the monthly cycle flow container
6. MatchingRow — bank reconciliation interaction
7. BatchSummary — feedback for all batch operations

**Phase 3 — Advanced Features (needed for complete management):**
8. TenantCurrentAccount — tenant financial detail
9. StatusTimeline — unpaid rent escalation tracking
10. RevisionTable — annual IRL revision workflow

## UX Consistency Patterns

### Button Hierarchy

**3 clearly distinguished action levels:**

| Level | Style | Usage | Examples |
|-------|-------|-------|----------|
| **Primary** | Deep teal, filled, bold | The main action of the page — one per screen | "Générer les appels", "Envoyer", "Valider tout" |
| **Secondary** | Slate outline, regular | Alternative or complementary actions | "Annuler", "Télécharger PDF", "Modifier" |
| **Ghost/Tertiary** | Text-only, muted | Discrete actions, navigation, back | "Retour", "Voir détail", "Plus d'options" |

**Strict rules:**
- Maximum 1 Primary button visible per action zone
- Destructive buttons (delete) use `destructive` color (red) in outline style, never filled — visible but not inviting
- Batch buttons always use Primary style with counter: "Envoyer (8)"
- Disabled buttons: opacity 50%, cursor not-allowed, tooltip explaining why
- Minimum size: 44x44px click area (mobile), 36px minimum height (desktop)

### Feedback Patterns

**Feedback hierarchy by action type:**

| Action Type | Feedback Mechanism | Duration | Example |
|------------|-------------------|----------|---------|
| **Batch operation** | BatchSummary component (inline or toast) | Persistent until dismissed | "8 quittances envoyées. 2 sans email (téléchargement disponible)" |
| **Single CRUD** | Toast notification | 5s auto-dismiss | "Locataire créé avec succès" |
| **Validation (✓/✗)** | Inline state change | Immediate, permanent | Row turns green background |
| **Error** | Toast + inline error | Persistent until resolved | "Erreur d'envoi pour Mme Dupont — adresse email manquante" |
| **Destructive action** | AlertDialog confirmation | Requires explicit action | "Supprimer le bail de M. Firme ? Cette action est irréversible." |
| **Long operation** | Progress bar + skeleton | Duration of operation | Import file parsing, batch email sending |

**Feedback principles:**
- Never "success" without detail — always indicate the count/amount processed
- Errors are always actionable — "email manquante" + link to tenant record
- Batch operations show a progress bar during execution (not just a spinner)
- Toasts stack vertically (max 3 visible), oldest dismissed first

### Form Patterns

**Standardized form structure:**

```
┌─────────────────────────────────────────────┐
│ Section Title (H3)                          │
│ Optional section description (muted text)   │
│                                             │
│ Label *                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Input with placeholder                  │ │
│ └─────────────────────────────────────────┘ │
│ Helper text or validation error             │
│                                             │
│ Label                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Input                                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌──────── Advanced Options (Accordion) ──┐  │
│ │ Hidden fields, disclosed on click      │  │
│ └────────────────────────────────────────┘  │
│                                             │
│         [Cancel]  [Save — Primary CTA]      │
└─────────────────────────────────────────────┘
```

**Form rules:**
- Validation via Zod schemas — inline errors appear on blur, not on every keystroke
- Required fields marked with `*` — optional fields unmarked (majority required = less noise)
- Monetary inputs: right-aligned, tabular-nums, Euro symbol suffix, 2 decimal places auto-formatted
- Date inputs: French format (JJ/MM/AAAA) with calendar picker
- Progressive disclosure via Accordion: essential fields visible, advanced options collapsed
- Form actions (Save/Cancel) always at bottom-right, sticky on long forms
- After save: toast confirmation + redirect to relevant list or dashboard

### Navigation Patterns

**Primary navigation — Slate sidebar:**

```
┌──────────┐
│ ◆ Baillr │  ← Logo
├──────────┤
│ Dashboard│  ← Always first, deep teal when active
│ Biens    │  ← Properties
│ Lots     │  ← Units
│ Locatair.│  ← Tenants
│ Baux     │  ← Leases
│ Compta   │  ← Accounting
│ Documents│  ← Generated documents
├──────────┤
│ Réglages │  ← Settings
└──────────┘
```

**Navigation rules:**
- Sidebar items use domain-native French labels — not English, not generic SaaS terms
- Active state: deep teal background + bold text. Hover: slate-200 background
- Sidebar collapsible to 64px (icons only) with toggle button at bottom
- Breadcrumb trail on all pages except dashboard: `Biens > Résidence Sapiac > Apt 102`
- Entity switcher always in header bar, above sidebar — context affects all views
- Back navigation: ghost button "← Retour" using `router.back()` (respects actual navigation history, not hardcoded parent), breadcrumb for hierarchy navigation. Never rely on browser back button alone
- Mobile: sidebar becomes Sheet (slide-in overlay) with hamburger trigger

### Modal & Overlay Patterns

**When to use which pattern:**

| Pattern | Usage | Example |
|---------|-------|---------|
| **Dialog (modal)** | Confirmations, send previews | "Prévisualiser quittance PDF", "Confirmer suppression" |
| **Sheet (slide-in)** | Quick-edit forms, detail panels | Mobile sidebar, quick-edit tenant info |
| **Inline expansion** | Additional detail in context | Matching row details, action feed item expanded |
| **Full page** | Complex forms, continuous flow | Lease creation, monthly cycle flow |
| **Never modal** | Primary workflows, CRUD creation | Forms are always full-page or inline, never in modals |

**Modal rules:**
- Modals have backdrop overlay (slate-900/50 opacity)
- ESC key and backdrop click close the modal (except for destructive confirmations)
- PDF previews use a large Dialog (80vh) with download button
- Max one modal layer — never stack modals on top of modals

### Empty States & Loading States

**Empty states follow the action-first paradigm:**

| Context | Empty State Content | Action |
|---------|-------------------|--------|
| No entities | Illustration + "Créez votre première entité propriétaire" | Primary CTA button |
| No properties | "Ajoutez un bien immobilier à [Entity Name]" | Primary CTA |
| Table with no data | Muted icon + descriptive text + CTA | "Aucun locataire. Ajoutez votre premier locataire." |
| No action feed items | Checkmark illustration + "Aucune action en attente" | No CTA needed — this is the goal state |
| Search with no results | "Aucun résultat pour '[query]'" | Suggest clearing filters |

**Loading states:**
- Skeleton loaders for all data-dependent content (never blank screens)
- Skeleton matches the layout of the loaded content (cards skeleton for cards, table rows for tables)
- TanStack Query handles loading/error/success states consistently
- Optimistic updates for single-click operations (validate match → instant green, rollback on error)

### Search & Filtering Patterns

**Search behavior:**
- Global search: accessible via `Cmd+K` (desktop) — searches across entities, tenants, units, leases
- List search: filter input at top of every table — filters client-side for small datasets (<100 items), server-side for large
- Search results grouped by type with clear section headers

**Filter behavior:**
- Table filters: dropdowns above table (status, property, period)
- Active filters shown as removable badges below filter bar
- "Clear all filters" link when any filter is active
- Filter state persisted in URL params (shareable, bookmarkable)

### Data Display Patterns

**Financial amounts:**
- French format: `1 234,56 €` (space thousands, comma decimal, euro after)
- Tabular-nums for column alignment in tables
- Positive = default text color, negative = red
- Large KPI numbers: Display size (36px), bold

**Dates:**
- French format: `15/01/2026` in tables and lists
- Long format: `15 janvier 2026` in documents and details
- Relative dates for recent events: "il y a 2 jours", "aujourd'hui"

**Tables:**
- Zebra striping (alternating slate-50 rows)
- Hover state: slate-100 background
- Sortable columns: click header to sort, arrow indicator for direction
- Batch selection: checkbox column on left, batch action bar appears at top when items selected
- Inline actions: icon buttons on row hover (edit, delete, view)
- Pagination: bottom-right, 10/25/50 items per page selector

## Responsive Design & Accessibility

### Responsive Strategy

**Desktop-first approach — responsive mobile for monitoring only:**

| Device | Role | Layout | Features |
|--------|------|--------|----------|
| **Desktop (1024px+)** | Primary workspace | Full layout: sidebar + 2-column content + charts | All features, keyboard shortcuts, dense dashboard, continuous flow |
| **Tablet (768px-1023px)** | Light management | Collapsed sidebar (icon-only), single column content | Dashboard monitoring, action feed execution, simplified tables |
| **Mobile (320px-767px)** | Monitoring only | No sidebar (hamburger Sheet), stacked layout | Dashboard mosaic, KPIs, action feed read, urgent actions only |

**Desktop layout (primary):**
```
┌──────────────────────────────────────────────────┐
│ Header: [Entity Switcher]        [Search] [User] │
├────────┬─────────────────────────────────────────┤
│ Side-  │ ┌─────────────┬───────────────────────┐ │
│ bar    │ │ Mosaic +    │ Action Feed           │ │
│ 240px  │ │ KPIs        │ (scrollable)          │ │
│        │ ├─────────────┴───────────────────────┤ │
│        │ │ Treasury Chart (12-month bar)        │ │
│        │ └─────────────────────────────────────┘ │
└────────┴─────────────────────────────────────────┘
```

**Tablet layout (simplified):**
```
┌──────────────────────────────────┐
│ Header: [≡] [Entity] [Search] [User] │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Mosaic (compact) + KPIs      │ │
│ ├──────────────────────────────┤ │
│ │ Action Feed (full width)     │ │
│ ├──────────────────────────────┤ │
│ │ Treasury Chart               │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Mobile layout (monitoring):**
```
┌────────────────────┐
│ [≡] Baillr  [User] │
├────────────────────┤
│ KPIs (2x2 grid)   │
├────────────────────┤
│ Mosaic (compact)   │
├────────────────────┤
│ Action Feed        │
│ (simplified cards) │
│ Urgent actions     │
│ only               │
└────────────────────┘
```

### Breakpoint Strategy

**Tailwind CSS 4 breakpoints (standard):**

| Breakpoint | Size | Layout Change |
|-----------|------|---------------|
| `sm` | 640px | Mobile optimizations, stacked forms |
| `md` | 768px | Tablet: icon sidebar, single-column content |
| `lg` | 1024px | Desktop: full sidebar, 2-column dashboard |
| `xl` | 1280px | Wide desktop: max-width content centered |

**Component-specific responsive behavior:**

| Component | Desktop (lg+) | Tablet (md) | Mobile (sm-) |
|-----------|--------------|-------------|-------------|
| **Sidebar** | Full 240px with labels | Collapsed 64px icons | Hidden, Sheet overlay |
| **UnitMosaic** | Grid 5-6 columns, compact tiles | Grid 3-4 columns | Grid 2-3 columns |
| **ActionFeed** | Right column, 5-7 items visible | Full width, scrollable | Full width, simplified cards |
| **ContinuousFlow** | Horizontal stepper + inline content | Horizontal stepper, full-width content | Vertical stepper, stacked content |
| **Tables** | Full columns with inline actions | Reduced columns, horizontal scroll | Card-based layout (no table) |
| **Forms** | 2-column for related fields | Single column | Single column, larger touch targets |
| **KPITiles** | 4-column row | 2x2 grid | 2x2 grid, larger text |
| **EntitySwitcher** | Full name + dropdown in header | Abbreviated name + dropdown | Full Sheet selector |
| **MatchingRow** | Full row with all details | Full row, smaller text | Card-based with swipe actions |

### Accessibility Strategy

**WCAG 2.1 AA compliance (minimum requirement):**

**Color & Contrast:**
- All text/background: minimum 4.5:1 contrast ratio (normal text), 3:1 (large text)
- Deep teal primary validated against both white and slate-950 backgrounds
- Status colors never the sole indicator — always paired with icons:
  - Green + checkmark
  - Orange + clock
  - Red + alert triangle
  - Gray + dash
- Dark mode contrast ratios independently validated

**Keyboard Navigation:**
- Full application usable without mouse
- Tab order follows visual layout (left-to-right, top-to-bottom)
- Focus ring: 2px deep teal outline with 2px offset (visible on all backgrounds)
- Skip link: "Aller au contenu principal" as first focusable element
- Custom keyboard shortcuts:
  - `Cmd+K` → Global search
  - `Escape` → Close modal/sheet/flow
  - `Enter` → Submit form / confirm action
  - Arrow keys → Navigate mosaic tiles, table rows

**Screen Reader Support:**
- Semantic HTML throughout: `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`
- ARIA landmarks: banner, navigation, main, complementary
- ARIA live regions for dynamic content:
  - `aria-live="polite"` → Action feed updates, batch progress
  - `aria-live="assertive"` → Error messages, critical alerts
- All images/icons have `alt` text or `aria-label`
- Form inputs associated with labels via `htmlFor`/`id`
- Table headers with `scope` attributes
- Mosaic tiles announced as: "Appartement 102, loyer payé" (not just color)

**Motion & Preferences:**
- `prefers-reduced-motion`: disable all animations, transitions instant
- `prefers-color-scheme`: auto-detect dark/light preference
- `prefers-contrast`: high contrast mode increases borders, reduces subtle backgrounds
- All transitions are functional (state changes), never decorative

### Testing Strategy

**Responsive Testing:**
- Chrome DevTools device simulation for all breakpoints during development
- Real device testing: iPhone SE (small), iPhone 15 (standard), iPad Air (tablet) — Safari
- Cross-browser: Chrome, Firefox, Safari, Edge (latest versions)
- Network throttling tests: 3G simulation for mobile performance validation

**Accessibility Testing:**
- **Automated (CI/CD):** axe-core via @axe-core/react — runs on every component render
- **Manual keyboard testing:** Full tab-through of every screen monthly
- **Screen reader testing:** VoiceOver (macOS/iOS) — primary screen reader for user base
- **Color contrast:** Contrast checker plugin in development browser
- **Color blindness:** Simulate protanopia, deuteranopia, tritanopia for status color validation

**Validation Checklist (per component):**
- Keyboard navigable (tab, enter, escape, arrows where applicable)
- Screen reader announces purpose and state
- Color contrast meets 4.5:1 minimum
- Touch targets at least 44x44px on mobile
- Focus ring visible on all backgrounds
- Works with `prefers-reduced-motion`
- Works with `prefers-color-scheme`
- Responsive at all 4 breakpoints

### Implementation Guidelines

**Responsive Development:**
- Use Tailwind responsive prefixes: `lg:grid-cols-2`, `md:hidden`, `sm:flex-col`
- Mobile-first CSS: base styles for mobile, override with `md:`, `lg:`, `xl:` prefixes
- Container queries for component-level responsiveness (sidebar collapse, mosaic grid)
- `rem` units for typography and spacing (user zoom-friendly)
- Fluid typography clamped: `clamp(14px, 1.5vw, 16px)` for body text
- Images: `next/image` with responsive `sizes` attribute for automatic optimization
- No horizontal scroll at any breakpoint — all content reflows or is accessible via tabs/sheets

**Accessibility Development:**
- Install `eslint-plugin-jsx-a11y` — enforce at lint level
- Radix UI provides ARIA compliance out of the box for all shadcn/ui components
- Custom components must follow WAI-ARIA Authoring Practices for their pattern (grid, listbox, dialog, etc.)
- Test with VoiceOver on every PR that modifies UI components
- Error messages linked to inputs via `aria-describedby`
- Loading states announced via `aria-busy="true"` on containers
