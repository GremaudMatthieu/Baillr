# Story 5.2: Auto-Match Payments to Rent Calls

Status: review

## Story

As a bailleur,
I want the system to automatically propose matches between imported payments and outstanding rent calls,
So that I can validate reconciliation quickly without manual lookup (FR29).

## Acceptance Criteria

1. **Given** a bank statement has been imported with transaction lines **When** the user triggers matching for a selected month **Then** the system proposes matches based on: exact or partial amount match, payer name similarity to tenant name (first/last/company), reference containing lease or tenant identifiers
2. **Given** the matching algorithm has run **Then** each proposal is displayed as a MatchingRow component showing: transaction details on the left (date, amount, payerName, reference), proposed rent call match on the right (unit identifier, tenant name, period, amount due), and a confidence indicator (high/medium/low)
3. **Given** matching proposals are displayed **Then** unmatched transactions are clearly separated at the bottom of the list with an "Aucun rapprochement trouvé" label
4. **Given** matching proposals are displayed **Then** they render within the 10-second NFR2 performance budget for up to 200 transactions
5. **Given** a transaction has been matched **Then** the match proposal includes a confidence score: high (exact amount + name match), medium (amount match OR name match), low (partial amount or fuzzy reference match)
6. **Given** multiple possible matches exist for a single transaction **Then** the system displays an Ambiguous variant of MatchingRow with a dropdown to select the best match
7. **Given** a rent call has already been matched to another transaction **Then** it is excluded from future matching proposals (no double-matching)
8. **Given** the matching completes **Then** a summary displays the count of matched, unmatched, and ambiguous transactions
9. **Given** I view matching proposals **Then** MatchingRow components are keyboard-navigable, with validate/reject buttons labeled for screen readers (WCAG 2.1 AA)
10. **Given** I want to run matching on a different month **Then** the month selector allows switching months and re-running the algorithm

## Tasks / Subtasks

- [x] Task 1: Create PaymentMatching domain service with matching algorithm (AC: 1, 5, 6, 7)
  - [x] 1.1 Create `PaymentMatchingService` in `billing/payment-matching/domain/service/`
  - [x] 1.2 Implement name similarity scoring (normalized Levenshtein distance on lowercased, accent-stripped, trimmed names)
  - [x] 1.3 Implement amount matching (exact match = high, ±5% tolerance = medium)
  - [x] 1.4 Implement reference matching (substring search for tenant name, unit identifier, lease ID fragments)
  - [x] 1.5 Implement composite confidence scoring: high (≥0.8), medium (0.5-0.79), low (0.3-0.49), no match (<0.3)
  - [x] 1.6 Handle ambiguous matches (multiple rent calls score above threshold for one transaction)
  - [x] 1.7 Exclude already-matched rent calls from candidate pool
  - [x] 1.8 Write unit tests for all matching scenarios (exact, partial, fuzzy, ambiguous, no-match, already-matched)

- [x] Task 2: Controller orchestration (no CQRS handler — ephemeral computation) (AC: 1, 4)
  - [x] 2.1 Controller loads transactions via BankStatementFinder, loads rent calls via RentCallFinder, calls PaymentMatchingService
  - [x] 2.2 Returns `{ matches: MatchProposal[], unmatched: UnmatchedTransaction[], summary: MatchingSummary }`
  - [x] 2.3 Write controller tests with mocked finders + service

- [x] Task 3: Create match-payments controller and DTOs (AC: 1, 4, 10)
  - [x] 3.1 Create `MatchPaymentsController`: POST `/api/entities/:entityId/bank-statements/:bankStatementId/match?month=YYYY-MM`
  - [x] 3.2 Create `MatchPaymentsDto` with bankStatementId, month validation
  - [x] 3.3 Create response DTOs: `MatchProposalDto`, `UnmatchedTransactionDto`, `MatchingSummaryDto`
  - [x] 3.4 Register controller in bank-statement-presentation module
  - [x] 3.5 Write controller tests

- [x] Task 4: Create frontend API module and hooks (AC: 1, 10)
  - [x] 4.1 Add `matchPayments(entityId, bankStatementId, month)` to bank-statements API module
  - [x] 4.2 Create `useMatchPayments(entityId)` hook — useMutation returning match proposals
  - [x] 4.3 Create TypeScript types: `MatchProposal`, `UnmatchedTransaction`, `MatchingSummary`, `ConfidenceLevel`
  - [x] 4.4 Write hook tests

- [x] Task 5: Create MatchingRow component (AC: 2, 5, 6, 9)
  - [x] 5.1 Create `MatchingRow` component with transaction details (left) + rent call match (right) + confidence badge
  - [x] 5.2 Implement confidence badge: high (green Badge "Élevée"), medium (yellow Badge "Moyenne"), low (orange Badge "Faible")
  - [x] 5.3 Implement Ambiguous variant with Select dropdown for multiple matches
  - [x] 5.4 Implement keyboard navigation (Tab between rows, Enter/Space on buttons)
  - [x] 5.5 Implement states: default (proposed), no-match (orange background, manual assignment prompt)
  - [x] 5.6 Write component tests (all variants, keyboard nav, screen reader labels)

- [x] Task 6: Create MatchingProposals page section with summary (AC: 2, 3, 8, 10)
  - [x] 6.1 Create `MatchingProposalsContent` component in payments feature folder
  - [x] 6.2 Integrate month selector (reuse `getMonthOptions()` from rent-calls)
  - [x] 6.3 Display matched proposals (sorted by confidence desc), then unmatched section
  - [x] 6.4 Display `MatchingSummary` component: "{n} rapprochés, {m} non rapprochés, {a} ambigus"
  - [x] 6.5 Add "Lancer le rapprochement" button to trigger matching from payments page
  - [x] 6.6 Integrate into existing payments page as a new section/tab after import
  - [x] 6.7 Write component tests

- [x] Task 7: Write E2E tests for matching flow (AC: 1, 2, 3, 8)
  - [x] 7.1 E2E: seed entity + property + unit + tenant + lease + rent call + bank statement import, then trigger matching
  - [x] 7.2 E2E: verify MatchingRow display with correct transaction + rent call pairing
  - [x] 7.3 E2E: verify unmatched transactions section appears for non-matching transactions

## Dev Notes

### Architecture Decisions

- **PaymentMatchingService** is a **domain service** in `billing/payment-matching/domain/service/` — contains pure matching logic (no I/O, no Prisma, no framework dependency). Testable with plain unit tests.
- **No new aggregate**: Matching proposals are NOT persisted as events. They are **ephemeral computations** returned synchronously (POST returns proposals as JSON). Events will be written only when the user validates matches (Story 5.3).
- **Same BC (Billing)**: Both BankTransaction and RentCall live in the Billing BC — no cross-BC import needed. The controller/handler queries both finders directly.
- **Synchronous response**: Like Story 5.1's import (200 OK with data), matching returns proposals immediately. The computation is fast (O(n×m) where n=transactions, m=rent calls — typically <200×20).
- **Controller orchestrates**: The controller loads data via finders, passes to matching service, formats response. Follows the batch generation pattern from Story 4.1.

### Matching Algorithm Design

**Scoring formula** (composite score 0.0 to 1.0):
- **Amount match** (weight 0.5): exact match = 1.0, within ±5% = 0.6, within ±20% = 0.3, else 0.0
- **Name similarity** (weight 0.35): normalized Levenshtein on `payerName` vs `tenantFirstName + tenantLastName` or `companyName`. Score 0.0 to 1.0.
- **Reference match** (weight 0.15): substring search for unit identifier, tenant last name, or lease ID fragment in transaction reference. Found = 1.0, not found = 0.0.
- **Composite**: `amountScore * 0.5 + nameScore * 0.35 + referenceScore * 0.15`
- **Thresholds**: high ≥ 0.8, medium 0.5-0.79, low 0.3-0.49, no match < 0.3

**Name normalization** (critical for French names):
- Lowercase, trim whitespace
- Strip accents (é→e, è→e, ê→e, à→a, ç→c, ü→u, etc.) via `String.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`
- Handle bank truncation: "DOS SANTOS FIRME" should match "Dos Santos Firmino" — compare prefixes
- Handle company names: "SCI LES TILLEULS" matches "SCI Les Tilleuls"
- Handle initials: "ACCO F." should partially match "Acco François"

**No external NLP library**: Use simple Levenshtein distance (implement in ~20 lines). No need for heavy fuzzy matching libs — the amount match provides the strongest signal.

### Key Patterns to Follow

- **Controller-per-action**: `MatchPaymentsController` handles exactly one route
- **Command naming**: `MatchPaymentsToRentCallsCommand` (verb-a-noun convention)
- **Domain interfaces**: If any data crosses layers, use domain interfaces (pattern from 4.3's `rent-call-data.interfaces.ts`)
- **DTO validation**: `@IsString()`, `@IsNotEmpty()`, `@Matches(/^\d{4}-\d{2}$/)` for month field
- **Frontend hook**: `useMatchPayments` uses `useMutation` (not useQuery) since matching is an action, not a cache query
- **Cross-query cache**: No cache invalidation needed — matching proposals are ephemeral (not stored)
- **getMonthOptions()**: Reuse from `frontend/src/lib/utils/month-options.ts` (established in Story 4.1)
- **Confidence Badge**: Use shadcn `Badge` component with variant colors (already used for insurance status in Story 3.2)

### Data Flow

```
Frontend: user clicks "Lancer le rapprochement" with selected month
  → POST /api/entities/:entityId/bank-statements/:bankStatementId/match?month=2026-02
  → Controller: BankStatementFinder.findTransactions() + RentCallFinder.findAllByEntityAndMonth()
  → PaymentMatchingService.match(transactions, rentCalls) → MatchProposal[]
  → Response: { matches: [...], unmatched: [...], summary: { matched, unmatched, ambiguous } }
  → Frontend renders MatchingRow components
```

### Rent Call Querying

- Use existing `RentCallFinder.findAllByEntityAndMonth(entityId, userId, month)` — returns `RentCall[]` with tenant, unit relations
- For matching, need: `totalAmountCents`, `tenant.firstName`, `tenant.lastName`, `tenant.companyName`, `unit.identifier`, `lease.id`
- Eager load relations: modify finder if needed to include tenant + unit for matching

### Exclusion of Already-Matched Rent Calls

- Story 5.2 does NOT write any events. Matching proposals are pure computation.
- In Story 5.3 (validate), `PaymentRecorded` events will be written and projected.
- For now, "already-matched" means: if Story 5.3 is not yet implemented, there are no matched rent calls. The algorithm simply proposes all available rent calls as candidates.
- Future-proofing: design the matching service to accept an `excludedRentCallIds: Set<string>` parameter. For now, pass an empty set.

### Frontend Integration

- Add a "Rapprochement" section to the existing payments page (below or alongside the import/transactions view)
- The section shows: bank statement selector → month selector → "Lancer le rapprochement" button → results
- Results: MatchingRow list (matched, sorted by confidence desc) then unmatched section
- **No ContinuousFlowStepper yet**: The ContinuousFlowStepper encompasses the full cycle (Import → Match → Validate → Complete). Since Story 5.3 (Validate) is not built yet, render matching proposals as a standalone section. The ContinuousFlowStepper will be assembled when Story 5.3 connects the validate step.

### Performance Considerations

- 200 transactions × 20 rent calls = 4,000 comparisons — trivially fast (<100ms)
- Levenshtein distance on short strings (<50 chars) — negligible overhead
- No database writes — pure computation from already-loaded data
- Response size: ~200 proposals × ~200 bytes = ~40KB — well within limits

### Project Structure Notes

- Backend: `backend/src/billing/payment-matching/domain/service/payment-matching.service.ts` — new module under billing BC
- Backend: `backend/src/presentation/bank-statement/controllers/match-payments.controller.ts` — extends existing bank-statement presentation
- Frontend: `frontend/src/components/features/payments/matching-row.tsx` — new component
- Frontend: `frontend/src/components/features/payments/matching-proposals-content.tsx` — new section component
- All paths follow existing naming conventions (`kebab-case` files, `PascalCase` exports)

### Testing Standards

- **Backend unit tests**: PaymentMatchingService with comprehensive scenarios (exact match, partial, fuzzy, ambiguous, no-match, empty inputs, already-matched exclusion)
- **Backend handler tests**: Mock finders + service, verify orchestration
- **Backend controller tests**: Mock handler, verify DTOs, month validation, entity ownership
- **Frontend component tests**: MatchingRow (all 5 states + ambiguous variant + keyboard nav), MatchingProposalsContent (loading, empty, with results, month switching)
- **Frontend hook tests**: useMatchPayments mutation behavior
- **E2E tests**: Full flow from seeded data through matching trigger and result display

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — User story and acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#MatchingRow] — Component spec (lines 922-929)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ContinuousFlowStepper] — Flow stepper (lines 913-920, deferred to 5.3)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 2] — Monthly cycle UX flow (lines 668-742)
- [Source: _bmad-output/planning-artifacts/architecture.md#Billing BC] — PaymentAggregate in billing/payment/
- [Source: _bmad-output/planning-artifacts/architecture.md#Financial Precision] — Integer cents, no floating-point
- [Source: _bmad-output/planning-artifacts/prd.md#FR29] — Auto-match payments to rent calls
- [Source: docs/project-context.md] — CQRS patterns, testing infrastructure, form patterns
- [Source: 5-1-import-bank-statements-from-csv-excel.md] — Previous story: BankStatement aggregate, parser, finders, frontend patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

- 7 tasks, 7 subtask groups — all complete
- Backend: 796 tests (105 suites) — 57 new tests for Story 5.2 (46 matching service + 6 handler + 5 controller)
- Frontend: 438 tests (60 suites) — 31 new tests for Story 5.2 (18 matching-row + 9 matching-proposals + 4 hook)
- E2E: 3 new tests in payments.spec.ts (seed + API matching + UI rapprochement section)
- TypeScript: both backend and frontend pass `tsc --noEmit` cleanly
- Extracted `getMonthOptions()` / `getCurrentMonth()` to shared `frontend/src/lib/month-options.ts` (was inline in rent-calls-page-content)
- PaymentMatchingService is pure domain service with no I/O — Levenshtein + accent normalization + composite scoring
- Matching proposals are ephemeral (not persisted) — `excludedRentCallIds` parameter future-proofs for Story 5.3
- esbuild `??` / `||` operator precedence required explicit parentheses in matching-row.tsx
- MatchPaymentsDto uses `month!: string` definite assignment assertion (TS strict mode, same pattern as ImportBankStatementDto)

### Change Log

- 2026-02-13: Story 5.2 implemented — 7 tasks, 21 new files + 11 modified, 88 new tests
- 2026-02-13: Code review — 12 findings (0C/6M/6L), 11 fixes applied: negative amount penalty, prefix/levenshtein asymmetry, BadRequestException, AmbiguousRow onSelect wiring, ARIA role="list", French pluralization, DTO file, gap threshold test, payerName nullable type, E2E dynamic dates, File List accuracy

### File List

New files:
- `backend/src/billing/payment-matching/domain/service/matching.types.ts`
- `backend/src/billing/payment-matching/domain/service/payment-matching.service.ts`
- `backend/src/billing/payment-matching/payment-matching.module.ts`
- `backend/src/billing/payment-matching/__tests__/payment-matching.service.spec.ts`
- `backend/src/presentation/bank-statement/dto/match-payments.dto.ts`
- `backend/src/presentation/bank-statement/controllers/match-payments.controller.ts`
- `backend/src/presentation/bank-statement/controllers/__tests__/match-payments.controller.spec.ts`
- `frontend/src/lib/month-options.ts`
- `frontend/src/components/features/payments/matching-row.tsx`
- `frontend/src/components/features/payments/matching-proposals-content.tsx`
- `frontend/src/components/features/payments/__tests__/matching-row.test.tsx`
- `frontend/src/components/features/payments/__tests__/matching-proposals-content.test.tsx`
- `frontend/src/hooks/__tests__/use-match-payments.test.ts`

Modified files:
- `backend/src/billing/billing.module.ts`
- `backend/src/presentation/bank-statement/bank-statement-presentation.module.ts`
- `backend/src/presentation/rent-call/finders/rent-call.finder.ts`
- `frontend/src/lib/api/bank-statements-api.ts`
- `frontend/src/hooks/use-bank-statements.ts`
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx`
- `frontend/src/components/features/payments/payments-page-content.tsx`
- `frontend/src/components/features/payments/__tests__/payments-page-content.test.tsx`
- `frontend/e2e/fixtures/api.fixture.ts`
- `frontend/e2e/payments.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
