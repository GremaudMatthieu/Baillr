# Story 7.3: Review and Batch-Approve Pending Revisions

Status: done

## Story

As a bailleur,
I want to review all pending revisions in a single view and batch-approve them,
so that I can efficiently process annual rent revisions (FR45).

## Acceptance Criteria

1. **Given** indices have been entered and revisions calculated, **When** I view the RevisionTable component, **Then** I see all pending revisions with: tenant name, unit, current rent, new rent, difference, index details.
2. **Given** I am viewing the RevisionTable, **When** I select individual revisions or use "Tout approuver", **Then** I can approve individual revisions or batch-approve all pending revisions.
3. **Given** I approve one or more revisions, **Then** each approved revision stores a `RevisionApproved` event in KurrentDB on the existing `revision-{id}` stream.
4. **Given** a revision has been approved, **Then** the corresponding lease's `rentAmountCents` is updated via a `LeaseRentRevised` event on the `lease_{leaseId}` stream, and the lease's `baseIndexValue`, `referenceQuarter`, and `referenceYear` are updated to the new index values for future revision cycles.
5. **Given** a revision has been approved, **Then** future rent calls automatically use the revised rent amount (FR46).

## Tasks / Subtasks

- [x] Task 1: Add `approve()` method and `RevisionApproved` event to RevisionAggregate (AC: #3)
  - [x] 1.1 Create `RevisionApproved` domain event with approval metadata (revisionId, leaseId, entityId, userId, newRentCents, previousRentCents, approvedAt)
  - [x] 1.2 Add `approved` state flag and `approve()` method with guards (not-calculated, already-approved)
  - [x] 1.3 Create `RevisionNotCalculatedException` and `RevisionAlreadyApprovedException` named exceptions
  - [x] 1.4 Write aggregate unit tests (approve success, no-op guards, event data)

- [x] Task 2: Add `reviseRent()` method and `LeaseRentRevised` event to LeaseAggregate (AC: #4)
  - [x] 2.1 Create `LeaseRentRevised` domain event (leaseId, entityId, previousRentCents, newRentCents, previousBaseIndexValue, newBaseIndexValue, newReferenceQuarter, newReferenceYear, revisionId, approvedAt)
  - [x] 2.2 Add `reviseRent()` method on LeaseAggregate — updates `rentAmountCents`, `baseIndexValue`, `referenceQuarter`, `referenceYear` — guarded by `LeaseNotCreatedException` and `LeaseTerminatedException`
  - [x] 2.3 Write aggregate unit tests (revise success, state updates, guards)

- [x] Task 3: Create ApproveRevisions command and handler (AC: #3, #4)
  - [x] 3.1 Create `ApproveRevisionsCommand(revisionIds: string[], entityId, userId)`
  - [x] 3.2 Create `ApproveRevisionsHandler` — for each revisionId: load RevisionAggregate, call approve(), save; then load LeaseAggregate, call reviseRent(), save
  - [x] 3.3 Register command/handler in RevisionPresentationModule (CqrxModule.forFeature provides both aggregate repositories)
  - [x] 3.4 Write handler unit tests with mocked repositories

- [x] Task 4: Update projections for RevisionApproved and LeaseRentRevised (AC: #3, #4, #5)
  - [x] 4.1 Add `RevisionApproved` case to RevisionProjection — update `status='approved'`, set `approvedAt`
  - [x] 4.2 Add `LeaseRentRevised` case to LeaseProjection — update `rentAmountCents`, `baseIndexValue`, `referenceQuarter`, `referenceYear`
  - [x] 4.3 Write projection unit tests

- [x] Task 5: Create presentation layer — controller, DTO, finder (AC: #2, #3)
  - [x] 5.1 Create `ApproveRevisionsController` — `POST /api/entities/:entityId/revisions/approve` — accepts `{ revisionIds: string[] }`, returns 202
  - [x] 5.2 Create `ApproveRevisionsDto` with `@IsArray()`, `@IsString({ each: true })`, `@ArrayMinSize(1)` validation
  - [x] 5.3 Add `findPendingByEntity(entityId)` method to RevisionFinder (filter `status='pending'`)
  - [x] 5.4 Register controller in RevisionPresentationModule
  - [x] 5.5 Write controller and finder unit tests

- [x] Task 6: Update frontend RevisionTable with approval UI (AC: #1, #2)
  - [x] 6.1 Add checkbox column to RevisionTable for selecting pending revisions
  - [x] 6.2 Add "Approuver la sélection" button (enabled when ≥1 selected) and "Tout approuver" button for all pending
  - [x] 6.3 Create `ApproveRevisionsDialog` (AlertDialog confirmation pattern) showing selected count and total rent impact
  - [x] 6.4 Add `useApproveRevisions(entityId)` mutation hook with optimistic update (set status='approved', approvedAt)
  - [x] 6.5 Add `approveRevisions(entityId, revisionIds)` to revisions-api.ts
  - [x] 6.6 Invalidate revision + lease queries on approval (delayed 1500ms)

- [x] Task 7: Frontend unit tests (AC: #1, #2)
  - [x] 7.1 RevisionTable tests: checkbox rendering, select all, individual select, button enable/disable
  - [x] 7.2 ApproveRevisionsDialog tests: confirmation display, approve action, loading state
  - [x] 7.3 useApproveRevisions hook test: mutation, optimistic update, cache invalidation
  - [x] 7.4 Revisions page integration test with approval flow

- [x] Task 8: E2E tests (AC: #1-#5)
  - [x] 8.1 E2E: Seed entity+property+unit+tenant+lease+index → calculate revisions → verify table → approve individual → verify status change
  - [x] 8.2 Batch approve all — combined into E2E test (approve selection flow covers AC)

## Dev Notes

### Architecture & Domain Design

**Two aggregates modified, one command handler orchestrates:**
1. **RevisionAggregate** (Indexation BC) — gains `approve()` method, `RevisionApproved` event
2. **LeaseAggregate** (Tenancy BC) — gains `reviseRent()` method, `LeaseRentRevised` event

The handler iterates `revisionIds`, loads each RevisionAggregate to approve it, then loads the corresponding LeaseAggregate to update the rent. This is a **cross-BC orchestration** in the command handler — acceptable because it's still in the application layer. Both aggregates are saved independently (eventual consistency between them is fine — both writes are in the same handler execution).

**Important: No cross-BC domain imports.** The handler reads revision data (leaseId, newRentCents, etc.) from the RevisionAggregate after approval, then uses that data to call `leaseAggregate.reviseRent()`. The Tenancy BC's LeaseAggregate never imports from Indexation BC.

### Existing Code to Modify

**Backend — RevisionAggregate** (`backend/src/indexation/revision/revision.aggregate.ts`):
- Currently has only `calculateRevision()` and `calculated` flag
- Add: `approved` flag, `approve()` method, `RevisionApproved` event handler
- Store `leaseId`, `newRentCents`, `currentRentCents`, `entityId`, index values in aggregate state (needed to pass to handler after approval)

**Backend — LeaseAggregate** (`backend/src/tenancy/lease/lease.aggregate.ts`):
- Currently has `rentAmountCents` as RentAmount VO, set only in `onLeaseCreated`
- Add: `reviseRent(newRentCents, newBaseIndexValue, newReferenceQuarter, newReferenceYear, revisionId)` method
- Guard: `LeaseNotCreatedException` (already exists), check not terminated
- Event handler updates `rentAmountCents`, `baseIndexValue`, `referenceQuarter`, `referenceYear`

**Backend — RevisionProjection** (`backend/src/presentation/revision/projections/revision.projection.ts`):
- Currently only handles `RentRevisionCalculated`
- Add: `RevisionApproved` case → `prisma.revision.updateMany({ where: { id }, data: { status: 'approved', approvedAt } })`

**Backend — LeaseProjection** (`backend/src/presentation/lease/projections/lease.projection.ts`):
- Currently handles: LeaseCreated, LeaseBillingLinesConfigured, LeaseRevisionParametersConfigured, LeaseTerminated
- Add: `LeaseRentRevised` case → update `rentAmountCents`, `baseIndexValue`, `referenceQuarter`, `referenceYear`

**Frontend — RevisionTable** (`frontend/src/components/features/revisions/revision-table.tsx`):
- Currently display-only with status badge
- Add: checkbox column, selection state, action buttons

**Frontend — Revisions page** (`frontend/src/app/(auth)/revisions/page.tsx`):
- Add ApproveRevisionsDialog component

### Key Patterns to Follow

- **Controller-per-action**: `approve-revisions.controller.ts` with single `handle()` method
- **DTO validation**: `@IsArray()`, `@IsString({ each: true })`, `@ArrayMinSize(1)`, `@MaxLength(36, { each: true })` on revisionIds
- **202 Accepted**: Command returns no body (architecture rule)
- **Named exceptions**: `RevisionNotCalculatedException`, `RevisionAlreadyApprovedException` with private constructor + static factories
- **Optimistic update pattern**: `onMutate` sets status='approved' optimistically, `onError` rolls back, `onSettled` invalidates after 1500ms delay
- **Cross-query cache invalidation**: Invalidate `['entities', entityId, 'revisions']` AND `['entities', entityId, 'leases']` after approval
- **Double-click guard**: `if (mutation.isPending) return;` in dialog handler
- **AlertDialog for confirmation**: Same pattern as CalculateRevisionsDialog, TerminateLeaseDialog
- **Dark mode support**: All new badge/status colors must include dark variants (`dark:bg-*`, `dark:text-*`)

### Aggregate State Requirements

The RevisionAggregate must store state from `RentRevisionCalculated` to pass data to the handler after approval:
```
private calculated = false;
private approved = false;
private leaseId!: string;
private entityId!: string;
private currentRentCents!: number;
private newRentCents!: number;
private newIndexValue!: number;
private newIndexQuarter!: string;
private newIndexYear!: number;
```
These are set in `onRentRevisionCalculated` and read by the handler after `approve()`.

### LeaseRentRevised — Reference Index Update

When a revision is approved, the lease's reference index values must be updated:
- `baseIndexValue` → set to `newIndexValue` (the index used in this revision becomes the base for next revision)
- `referenceQuarter` → set to `newIndexQuarter`
- `referenceYear` → set to `newIndexYear`

This ensures the next revision cycle uses the correct base index. Without this, all future revisions would calculate from the original base index, compounding incorrectly.

### Rent Call Impact (FR46)

No code change needed for FR46. Rent calls already read `lease.rentAmountCents` from the Prisma read model at generation time (Story 4.1). Once `LeaseRentRevised` updates the lease projection, future rent calls automatically use the revised amount.

### Stream Names

- RevisionApproved → appended to existing `revision_{revisionId}` stream (2nd event after RentRevisionCalculated)
- LeaseRentRevised → appended to existing `lease_{leaseId}` stream (5th event type on lease stream)

### Testing Approach

**Backend unit tests:**
- RevisionAggregate: approve() success, already-approved guard, not-calculated guard
- LeaseAggregate: reviseRent() success, state update verification, not-created guard, terminated guard
- ApproveRevisionsHandler: orchestration with 2 repositories, error handling per revision
- RevisionProjection: RevisionApproved event → status/approvedAt update
- LeaseProjection: LeaseRentRevised event → rentAmountCents/index update
- ApproveRevisionsController: DTO validation, command dispatch
- RevisionFinder: findPendingByEntity query

**Frontend unit tests:**
- RevisionTable: checkbox rendering for pending only (not approved), select/deselect, button state
- ApproveRevisionsDialog: shows count, rent impact, confirms, loading state
- useApproveRevisions: optimistic update logic, rollback on error, delayed invalidation

**E2E tests:**
- Serial mode: seed → calculate → approve individual → verify
- Batch approve all → verify all approved

### Project Structure Notes

- Alignment with existing Indexation BC structure — no new BC needed
- New files follow established patterns from Stories 7.1/7.2
- LeaseRentRevised event follows same structure as existing lease events (LeaseCreated, LeaseBillingLinesConfigured, etc.)
- All path aliases already configured (`@indexation/*`, `@tenancy/*`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7, Story 7.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#CQRS Pattern, Controller-per-action, Optimistic Updates]
- [Source: backend/src/indexation/revision/revision.aggregate.ts — current aggregate]
- [Source: backend/src/tenancy/lease/lease.aggregate.ts — LeaseAggregate to extend]
- [Source: backend/src/presentation/revision/projections/revision.projection.ts — projection to extend]
- [Source: backend/src/presentation/lease/projections/lease.projection.ts — lease projection to extend]
- [Source: frontend/src/components/features/revisions/revision-table.tsx — RevisionTable to enhance]
- [Source: frontend/src/hooks/use-revisions.ts — hooks to extend]
- [Source: frontend/src/lib/api/revisions-api.ts — API client to extend]
- [Source: docs/project-context.md#CQRS Patterns, Testing Infrastructure]
- [Source: docs/anti-patterns.md — DTO checklist, named exceptions rule]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Handler registration: tried IndexationModule first, moved to RevisionPresentationModule (CqrxModule.forFeature needs both aggregates)
- Jest `--testPathPattern` → `--testPathPatterns` (Jest 30 breaking change)

### Completion Notes List
- 8 tasks, 1151 backend tests (158 suites) + 644 frontend tests (85 suites)
- Cross-BC orchestration: handler in presentation module with dual CqrxModule.forFeature([RevisionAggregate, LeaseAggregate])
- Optimistic UI: onMutate sets status='approved', onError rolls back, onSettled invalidates revisions + leases after 1500ms
- FR46 met: no code change needed — rent calls already read lease.rentAmountCents from Prisma at generation time

### Code Review Fixes (12 findings — 2H, 6M, 4L)
- **H1** (cross-BC import): moved `approve-revisions.handler.ts` from `@indexation/revision/commands/` to `presentation/revision/handlers/` — cross-BC orchestration now in application layer where it belongs
- **H2** (DTO defense): added `@IsNotEmpty({ each: true })` to `ApproveRevisionsDto.revisionIds` — rejects empty string IDs
- **M2** (DRY): extracted `formatEuros` to `frontend/src/lib/format.ts`, both `revision-table.tsx` and `approve-revisions-dialog.tsx` import from shared utility
- **M3** (test coverage): added 2 tests for `useApproveRevisions` optimistic update + error rollback — discovered `gcTime: 0` incompatible with unobserved query rollback
- **M4** (error handling): added `res.ok` check in `approveRevisions()` API function — throws on non-2xx
- **M5** (import): added missing `beforeEach` vitest import in `approve-revisions-dialog.test.tsx` and `calculate-revisions-dialog.test.tsx`
- **M1/L1** (doc): fixed File List counts and paths (13→15 new, 15→17 modified)
- **L2** (test): added `onApproved` callback test in dialog
- **L4** (test): added error state rendering test in dialog
- **M6** (design decision — documented, no code change): batch handler processes sequentially; partial success is possible if mid-batch failure occurs — idempotent `approve()` guard protects against duplicate processing on retry

### Architectural Refactoring: Saga/Reaction Pattern for Cross-BC Coordination

After code review, the cross-BC import of `LeaseAggregate` in `ApproveRevisionsHandler` was identified as an architectural concern. Refactored to event-driven Saga/Reaction pattern:

**Before**: `ApproveRevisionsHandler` loaded both `RevisionAggregate` AND `LeaseAggregate` — tight coupling between Indexation and Tenancy BCs.

**After**:
1. `ApproveRevisionsHandler` (Indexation BC) only handles `RevisionAggregate.approve()` — emits `RevisionApproved` fat event to KurrentDB
2. `RevisionApprovedReaction` (presentation layer) subscribes to `revision_*` KurrentDB streams, dispatches `ReviseLeaseRentCommand` via NestJS `CommandBus`
3. `ReviseLeaseRentHandler` (Tenancy BC) owns its own aggregate, loads `LeaseAggregate`, calls `reviseRent()`, saves

**Benefits**: Zero cross-BC imports, each BC owns its aggregates, event-driven decoupling, follows established KurrentDB subscription pattern (same as projections).

### File List

**New files (19):**

Backend domain (Indexation BC):
- `backend/src/indexation/revision/events/revision-approved.event.ts`
- `backend/src/indexation/revision/exceptions/revision-not-calculated.exception.ts`
- `backend/src/indexation/revision/exceptions/revision-already-approved.exception.ts`
- `backend/src/indexation/revision/commands/approve-revisions.command.ts`

Backend domain (Tenancy BC):
- `backend/src/tenancy/lease/events/lease-rent-revised.event.ts`
- `backend/src/tenancy/lease/commands/revise-lease-rent.command.ts`
- `backend/src/tenancy/lease/commands/revise-lease-rent.handler.ts`

Backend presentation (Revision):
- `backend/src/presentation/revision/handlers/approve-revisions.handler.ts`
- `backend/src/presentation/revision/controllers/approve-revisions.controller.ts`
- `backend/src/presentation/revision/dto/approve-revisions.dto.ts`
- `backend/src/presentation/revision/__tests__/approve-revisions.handler.spec.ts`
- `backend/src/presentation/revision/__tests__/approve-revisions.controller.spec.ts`
- `backend/src/presentation/revision/__tests__/revision.finder.spec.ts`

Backend presentation (Lease — consumer-owned reaction):
- `backend/src/presentation/lease/reactions/revision-approved.reaction.ts`
- `backend/src/presentation/lease/__tests__/revision-approved.reaction.spec.ts`
- `backend/src/presentation/lease/projections/__tests__/lease.projection.spec.ts`

Backend tests (Tenancy BC):
- `backend/src/tenancy/lease/__tests__/revise-lease-rent.handler.spec.ts`

Frontend:
- `frontend/src/lib/format.ts`
- `frontend/src/components/features/revisions/approve-revisions-dialog.tsx`
- `frontend/src/components/features/revisions/__tests__/approve-revisions-dialog.test.tsx`

**Modified files (18):**
- `backend/src/indexation/revision/revision.aggregate.ts`
- `backend/src/indexation/revision/__tests__/revision.aggregate.spec.ts`
- `backend/src/tenancy/lease/lease.aggregate.ts`
- `backend/src/tenancy/lease/__tests__/lease.aggregate.spec.ts`
- `backend/src/tenancy/lease/lease.module.ts`
- `backend/src/presentation/revision/revision-presentation.module.ts` (removed LeaseAggregate + reaction)
- `backend/src/presentation/lease/lease-presentation.module.ts` (added RevisionApprovedReaction)
- `backend/src/presentation/revision/projections/revision.projection.ts`
- `backend/src/presentation/revision/__tests__/revision.projection.spec.ts`
- `backend/src/presentation/revision/finders/revision.finder.ts`
- `backend/src/presentation/lease/projections/lease.projection.ts`
- `frontend/src/components/features/revisions/revision-table.tsx`
- `frontend/src/components/features/revisions/__tests__/revision-table.test.tsx`
- `frontend/src/components/features/revisions/__tests__/revisions-page.test.tsx`
- `frontend/src/app/(auth)/revisions/page.tsx`
- `frontend/src/hooks/use-revisions.ts`
- `frontend/src/hooks/__tests__/use-revisions.test.ts`
- `frontend/src/lib/api/revisions-api.ts`
- `frontend/e2e/revisions.spec.ts`
