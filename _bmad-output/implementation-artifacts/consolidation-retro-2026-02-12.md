# Consolidation Sprint Retrospective — Testing & Anti-Patterns

**Date:** 2026-02-12
**Facilitator:** Bob (Scrum Master)
**Sprint:** Consolidation Sprint — Testing & Anti-Patterns (3 stories, blocking Epic 3)
**Status:** Complete (3/3 stories)

## Team Participants

- **Monsieur** (Project Lead)
- **Bob** (Scrum Master — Facilitator)
- **Alice** (Product Owner)
- **Charlie** (Senior Developer)
- **Dana** (QA Engineer)
- **Elena** (Junior Developer)

## Sprint Summary

### Delivery Metrics

| Metric | Value |
|--------|-------|
| Stories completed | 3/3 (100%) |
| Frontend unit tests added | 198 (23 suites) — from 0 |
| E2E tests added | 16 (4 suites) — from 0 |
| Total new tests | 214 |
| Backend tests | 234 (unchanged, zero regressions) |
| New files | ~46 |
| Modified files | ~8 |
| Documents centralized | 3 (anti-patterns, DTO checklist, project context) |
| CI script added | 1 (check-dto-imports.sh) |
| Code review fixes | 25 total (9 + 7 + 7, stable trend) |
| Debug issues | ~7 (jsdom polyfills + ESLint false positives) |
| Production incidents | 0 |

### Stories Delivered

| Story | Theme | Tests Added | New Files | Review Fixes | Debug Issues |
|-------|-------|-------------|-----------|-------------|-------------|
| C.1 | Setup Vitest + retro-test Epic 2 frontend | 198 (23 suites) | 29 | 9 | 5 (polyfills) |
| C.2 | Setup Playwright E2E + onboarding scenarios | 16 (4 suites) | 13 (+2 deleted) | 7 (of 13 findings) | 2 (ESLint) |
| C.3 | Centralize anti-patterns and DTO checklist | 0 (docs only) | 4 | 7 (of 8 findings) | 0 |

### Business Outcomes

- Frontend testing gap from Epic 2 fully closed (0 → 214 tests)
- Knowledge centralized: 40+ anti-patterns, DTO checklist, project context
- All 3 critical path items from Epic 2 retro completed
- Epic 3 officially unblocked
- Developer experience (DX) massively improved

## What Went Well

### 1. From Zero to 214 Frontend Tests
Story C.1 delivered 198 unit tests covering every Epic 2 component (entities, properties, units, dashboard, layout, hooks, schemas, context). Story C.2 added 16 E2E tests covering the complete onboarding flow, editing, entity switching, and navigation. The frontend went from the weakest link (0 tests) to a solid safety net.

### 2. Permanent Testing Infrastructure
The Radix UI polyfills (ResizeObserver, hasPointerCapture, scrollIntoView), Clerk auth bypass (`@clerk/testing` + `setupClerkTestingToken()`), global mock wiring pattern, and QueryClient test wrapper are permanent investments. Every future component and E2E test benefits from this foundation.

### 3. Knowledge Centralization
`docs/anti-patterns.md` (40+ entries, 8 categories), `docs/dto-checklist.md` (copy-paste review checklist), `docs/project-context.md` (single-source-of-truth reference) — scattered knowledge from 6 Epic 2 stories is now consolidated. The `scripts/check-dto-imports.sh` CI script adds automated enforcement.

### 4. Previous Retro Commitments Honored (4/5)
4 out of 5 action items from the Epic 2 retrospective were fully completed. All 3 critical path items were delivered. Only AI-2 (prisma generate automation) was partially addressed (documented but no automated hook).

### 5. Pragmatic Prioritization
The team chose to document CI/prod concerns (E2E idempotency, prisma generate hook) without blocking Epic 3 progress. DX improvement was the priority, and it was achieved.

## What Didn't Go Well

### 1. File List Accuracy — Systemic Issue (3/3 Stories)
Every single story had File List corrections in code review. C.1: 5 corrections (tsconfig removed, package-lock + 3 mocks added). C.2: package-lock.json missing. C.3: sprint-status.yaml missing. The dev agent does not reconcile its File List against git reality.

### 2. Dead Code Created by Anticipation (C.2)
`selectors.ts` and `cleanup.ts` were created as reusable utilities but never imported by any spec file. Deleted in review. The dev agent creates helpers anticipatively that turn out to be YAGNI.

### 3. Tests Written Against Wrong UI Assumptions (C.2)
Editing tests assumed separate `/edit` routes for property and unit, when the actual UI uses inline editing (`useState(isEditing)`). This was a Critical finding in review. The dev agent didn't verify the existing component code before writing test assertions.

### 4. AI-2 (prisma generate automation) Not Implemented
Documented in anti-patterns but no actual post-migration hook was created. First Prisma migration in Epic 3 (Story 3.1 — Tenant model) will require manual `prisma generate`.

### 5. E2E Onboarding Not Idempotent
`onboarding.spec.ts` expects empty state (no entities). Fails on repeat runs with the same Clerk test user. Acceptable for local development but will need addressing for CI pipeline.

## Key Insights

1. **DX transformation is measurable** — 0 → 214 tests, 0 → 3 centralized docs, 0 → 1 CI validation script. The consolidation sprint delivered exactly what the Epic 2 retro demanded.

2. **Review fixes stayed stable (7-9), not declining** — Unlike Epic 2 (18 → 6), the consolidation sprint had stable review fix counts. Expected: each story was a fundamentally different domain (unit testing, E2E, documentation), so there was no pattern reuse between stories.

3. **The adversarial review caught what tests couldn't** — 3 Critical findings in C.2 (wrong element roles, wrong route assumptions, dead code) would have been silent bugs without review. Automated tests and adversarial review are complementary, not substitutable.

4. **YAGNI applies to test utilities** — Creating helpers "for reuse" before a second consumer exists produces dead code. Better to inline first, extract when a pattern repeats.

5. **File List accuracy is the most persistent quality gap** — 3/3 stories across 3 different domains all had the same issue. This needs a process fix, not just awareness.

## Previous Retrospective Follow-Through

### Epic 2 Retro Action Items (2026-02-11)

| # | Action Item | Status | Evidence |
|---|-------------|--------|----------|
| AI-1 | Centralize anti-patterns in story templates | ✅ Completed | `docs/anti-patterns.md` — 40+ entries, 8 categories |
| AI-2 | Automate `prisma generate` after migration | ⏳ Partial | Documented in anti-patterns.md, no automated hook |
| AI-3 | DTO defense-in-depth checklist | ✅ Completed | `docs/dto-checklist.md` + `scripts/check-dto-imports.sh` |
| AI-4 | Setup vitest + retro-tests Epic 2 | ✅ Completed | 198 tests, 23 suites (Story C.1) |
| AI-5 | Setup Playwright E2E + onboarding | ✅ Completed | 16 E2E tests, 4 suites (Story C.2) |

**Score: 4/5 completed, 1 partially addressed.**

### Epic 2 Team Agreements

| # | Agreement | Respected? |
|---|-----------|------------|
| 1 | No story "done" without frontend tests | ✅ Infrastructure ready |
| 2 | Every review verifies DTO checklist | ✅ Checklist + CI script created |
| 3 | Anti-patterns centralized within 24h | ✅ docs/anti-patterns.md delivered |
| 4 | prisma generate automated | ⏳ Documented, not automated |

### Critical Path (All 3 Complete)

| # | Item | Status |
|---|------|--------|
| 1 | Setup vitest + full retro-tests | ✅ Story C.1 |
| 2 | Setup Playwright + E2E onboarding | ✅ Story C.2 |
| 3 | Centralize anti-patterns + DTO checklist | ✅ Story C.3 |

## Significant Discovery Analysis

**No significant discoveries that invalidate Epic 3 planning.** The consolidation sprint was purely additive (tests + docs) with zero changes to domain code. All Epic 2 dependencies for Epic 3 remain stable:

- Entity aggregate with bank accounts ✅ (234 backend + 198 frontend tests)
- Property aggregate with dual URL pattern ✅
- Unit aggregate with billable options ✅
- UnitMosaic ready for lease status integration ✅
- Anti-patterns and DTO checklist available for reference ✅

## Next Epic Preview — Epic 3: Tenant & Lease Management

### Overview
6 stories covering FR9-FR17: tenant registration, insurance tracking with expiry alerts, lease creation, billing lines, revision parameters, and lease termination with pro-rata calculation.

### Dependencies on Consolidation Sprint (all satisfied)
- Frontend tests ✅ → automated validation for Epic 3 components
- E2E infrastructure ✅ → lease flow scenarios testable end-to-end
- Centralized docs ✅ → each Story 3.x Dev Notes can reference docs/

### New Complexities
- **New Bounded Context**: Tenancy BC (first inter-BC communication with Portfolio)
- **Scheduled jobs**: Insurance expiry daily check (Story 3.2) — first cron
- **Financial calculations**: Pro-rata in integer cents with troncature (Story 3.6)
- **French rental law domain**: IRL/ILC/ICC indices, revision formulas (Story 3.5)
- **Multi-form orchestration**: 5-step lease creation flow (Story 3.3-3.5)
- **Child entities in new aggregate**: Billing lines in LeaseAggregate (Map<> pattern)

### Preparation Needed
- AI-2 carry-over: `prisma generate` hook before first migration
- Inter-BC event pattern to establish in Story 3.3
- Integer cent arithmetic conventions to formalize

## Action Items

### Process Improvements

**AI-1: File List — systematic verification against `git status`**
- Owner: Charlie (Senior Dev)
- Success criteria: each future story includes a File List reconciliation step against git diff before passing to review

**AI-2: Complete `prisma generate` automation (carry-over from Epic 2)**
- Owner: Charlie (Senior Dev)
- Success criteria: a `postmigrate` script in `backend/package.json` that runs `prisma generate` automatically after `migrate dev`
- Timing: address in Story 3.1 (first Prisma migration for Tenant model)

### Technical Debt — Address at Production Readiness

**AI-3: Make E2E tests idempotent for CI**
- Owner: Dana (QA)
- Priority: LOW (not blocking before production)
- Scope: fresh Clerk test user per run OR DELETE endpoint for cleanup

**AI-4: Eliminate anticipatory dead code in stories**
- Owner: Charlie (Senior Dev)
- Success criteria: convention "YAGNI for helpers" — only create utilities when a second import exists

### Team Agreements

1. Every story verifies its File List against `git status` before review
2. Helpers/utilities are only created when a second import exists (YAGNI)
3. E2E and editing tests verify existing component code before writing assertions
4. CI/prod concerns (E2E idempotency, prisma hook) are tracked but not blocking for Epic 3

## Readiness Assessment

| Dimension | Status | Notes |
|-----------|--------|-------|
| Backend testing & quality | ✅ Solid | 234 tests, 39 suites, 0 regressions |
| Frontend testing & quality | ✅ Solid | 198 unit + 16 E2E tests (was ⚠️ in Epic 2 retro) |
| Documentation | ✅ Comprehensive | 3 centralized docs + CI script |
| Deployment | ℹ️ Local only | No production pressure |
| Stakeholder acceptance | ✅ Approved | "Le travail est remarquable" |
| Technical health | ✅ Solid | Zero regressions, mature patterns |
| Unresolved blockers | ✅ None | Epic 3 fully unblocked |

## Commitments Summary

| Category | Count |
|----------|-------|
| Action Items | 4 |
| Team Agreements | 4 |
| Critical Path Items | 0 (Epic 3 unblocked) |

## Next Steps

1. Begin Epic 3 planning — create Story 3.1 with SM agent
2. Address AI-2 (prisma generate hook) during Story 3.1 setup
3. Reference `docs/anti-patterns.md` and `docs/dto-checklist.md` in Story 3.1 Dev Notes
4. Track AI-3 (E2E idempotency) for future production readiness sprint

## Closing Notes

The Consolidation Sprint delivered on its core promise: transform the frontend from a zero-test liability into a 214-test safety net, and centralize scattered knowledge into actionable documentation. The team honored 4/5 commitments from the Epic 2 retrospective and completed all 3 critical path items. The DX improvement is the most significant outcome — every future story benefits from the testing infrastructure, polyfill patterns, and centralized anti-patterns established here.

Project Lead's assessment: **"Le travail est remarquable."**

---
*Retrospective facilitated by Bob (Scrum Master) on 2026-02-12*
*Second retrospective — follows Epic 2 retro (2026-02-11)*
