# Story 7.4: Generate IRL/ILC/ICC Revision Letters

Status: done

## Story

As a bailleur,
I want to generate revision letters with the detailed formula and legal mentions,
So that I can formally notify tenants of their rent revision (FR23, FR27).

## Acceptance Criteria

1. **Given** a revision has been approved, **When** I click "Générer la lettre" on an approved revision, **Then** the system produces a PDF containing: entity details (name, address, SIRET), tenant details (name, address), lease reference (start date), revision date, previous rent amount, new rent amount, complete formula with index values (type, base quarter/value, new quarter/value), effective date of new rent, legal mentions required by French law (article 17-1 loi 89-462).

2. **Given** an approved revision exists in the RevisionTable, **When** I view the revision row, **Then** a "Télécharger la lettre" button is displayed for approved revisions only (not pending).

3. **Given** I click the download button, **When** the PDF is generated, **Then** it downloads with filename `lettre-revision-{tenantLastName}-{YYYY-MM}.pdf` and generation completes in under 3 seconds (NFR3).

4. **Given** multiple approved revisions exist, **When** I select several and click "Télécharger les lettres", **Then** individual PDFs are generated and downloaded for each selected revision (sequential downloads, no ZIP).

5. **Given** a revision letter PDF is generated, **Then** the formula section displays: `Nouveau loyer = Ancien loyer × (Nouvel indice / Ancien indice)` with actual numeric values substituted, and the result matches the approved `newRentCents` value.

## Tasks / Subtasks

- [x] Task 1 — Create RevisionLetterPdfData interface and template (AC: #1, #5)
  - [x] 1.1 Create `revision-letter-pdf-data.interface.ts` in `infrastructure/document/`
  - [x] 1.2 Create `revision-letter.template.ts` in `infrastructure/document/templates/`
  - [x] 1.3 Add `generateRevisionLetterPdf(data)` method to `PdfGeneratorService`
  - [x] 1.4 Write template unit tests (mock doc spy pattern)

- [x] Task 2 — Create RevisionLetterPdfAssembler (AC: #1, #3)
  - [x] 2.1 Create `revision-letter-pdf.assembler.ts` in `presentation/revision/services/`
  - [x] 2.2 Map Prisma Revision + Tenant + Unit + Lease + Entity → `RevisionLetterPdfData`
  - [x] 2.3 Write assembler unit tests

- [x] Task 3 — Create download controller endpoint (AC: #1, #2, #3)
  - [x] 3.1 Create `DownloadRevisionLetterController` — `GET /api/entities/:entityId/revisions/:revisionId/letter`
  - [x] 3.2 Set Content-Type `application/pdf` and Content-Disposition `attachment; filename="..."`
  - [x] 3.3 Expose Content-Disposition via CORS (Access-Control-Expose-Headers)
  - [x] 3.4 Guard: return 404 if revision not found or not approved
  - [x] 3.5 Write controller unit tests

- [x] Task 4 — Update RevisionFinder for letter data (AC: #1)
  - [x] 4.1 Add `findByIdAndEntity(revisionId, entityId)` to RevisionFinder — separate queries for tenant, entity, lease
  - [x] 4.2 Write finder unit tests

- [x] Task 5 — Frontend download hook and API function (AC: #2, #3)
  - [x] 5.1 Add `downloadRevisionLetter(entityId, revisionId)` to `revisions-api.ts` (blob download pattern)
  - [x] 5.2 Create `useDownloadRevisionLetter(entityId)` hook — useState-managed (not useMutation), returns `{ downloadLetter, isDownloading, downloadingId }`
  - [x] 5.3 Write hook unit tests

- [x] Task 6 — Update RevisionTable with download button (AC: #2, #4)
  - [x] 6.1 Add "Télécharger la lettre" button on approved revision rows (Download icon)
  - [x] 6.2 Add batch download: "Télécharger les lettres" button for selected approved revisions (sequential download loop)
  - [x] 6.3 Loading state per row (spinner on downloadingId match)
  - [x] 6.4 Write RevisionTable updated unit tests

- [x] Task 7 — Frontend unit tests (AC: #1-#5)
  - [x] 7.1 RevisionTable: download button renders only for approved, loading state, batch download
  - [x] 7.2 useDownloadRevisionLetter hook: download trigger, downloading state, error handling
  - [x] 7.3 Revisions page integration: download action in context

- [x] Task 8 — E2E tests (AC: #1-#3)
  - [x] 8.1 E2E: Navigate to revisions → verify download button on approved revision → click → assert download event with correct filename
  - [x] 8.2 E2E: Verify pending revisions do NOT show download button

## Dev Notes

### Architecture & Domain Design

**No new aggregate or domain event needed.** This story is a pure read-side operation:
1. Query approved revision data from Prisma (RevisionFinder)
2. Assemble into PDF data (RevisionLetterPdfAssembler)
3. Generate PDF buffer (PdfGeneratorService)
4. Stream to client (Controller)

This follows the exact same pattern as:
- Story 4.2 (Rent Call PDF) — `RentCallPdfAssembler` + `renderRentCallPdf` + download controller
- Story 5.6 (Receipt PDF) — `ReceiptPdfAssembler` + `renderReceiptPdf` + download controller
- Story 6.2 (Formal Notice PDF) — `FormalNoticePdfAssembler` + `renderFormalNoticePdf` + download controller

**No domain events, no commands, no aggregates modified.** Pure presentation layer + infrastructure.

### RevisionLetterPdfData Interface

```typescript
export interface RevisionLetterPdfData {
  // Entity (sender)
  entityName: string;
  entityAddress: string;
  entitySiret: string | null;

  // Tenant (recipient)
  tenantFirstName: string;
  tenantLastName: string;
  tenantCompanyName: string | null;
  tenantAddress: string;

  // Lease reference
  leaseStartDate: string; // DD/MM/YYYY format

  // Revision details
  revisionDate: string; // DD/MM/YYYY — approvedAt date
  currentRentCents: number;
  newRentCents: number;
  differenceCents: number;
  effectiveDate: string; // DD/MM/YYYY — revision effective date

  // Formula components
  revisionIndexType: string; // IRL | ILC | ICC
  baseIndexQuarter: string; // e.g. "T1 2025"
  baseIndexValue: number;
  newIndexQuarter: string; // e.g. "T3 2025"
  newIndexValue: number;

  // Document metadata
  documentDate: string; // DD/MM/YYYY — generation date (today)
  city: string; // Entity city for "Fait à {city}"
}
```

### PDF Template Content — French Legal Letter

The revision letter must follow French rental law requirements (article 17-1 of loi n° 89-462 du 6 juillet 1989):

**Structure:**
1. **Header**: Entity info (top-left), Tenant info (top-right), date + city
2. **Subject**: "Objet : Avis de révision de loyer"
3. **Reference**: Lease start date, unit reference
4. **Body**: Formal notification paragraph with revision date reference
5. **Formula section**:
   ```
   Indice de référence : {revisionIndexType}
   Ancien indice ({baseIndexQuarter}) : {baseIndexValue}
   Nouvel indice ({newIndexQuarter}) : {newIndexValue}

   Loyer actuel : {currentRent} €
   Nouveau loyer = {currentRent} × ({newIndexValue} / {baseIndexValue}) = {newRent} €
   Variation : +{difference} €
   ```
6. **Effective date**: "Le nouveau loyer prendra effet à compter du {effectiveDate}."
7. **Legal mention**: "Conformément à l'article 17-1 de la loi n° 89-462 du 6 juillet 1989, le bailleur peut réviser le loyer une fois par an à la date convenue entre les parties ou, à défaut, à la date anniversaire du bail."
8. **Closing**: Signature block

### Existing Code to Leverage (DO NOT reinvent)

**PdfGeneratorService** (`backend/src/infrastructure/document/pdf-generator.service.ts`):
- Add 5th method: `generateRevisionLetterPdf(data: RevisionLetterPdfData): Promise<Buffer>`
- Follow exact pattern of existing methods (create PDFDocument, set metadata, call template, collect buffer)

**Template pattern** (`infrastructure/document/templates/`):
- Export pure function: `renderRevisionLetterPdf(doc: PDFKit.PDFDocument, data: RevisionLetterPdfData): void`
- Use `formatEuroCents()` from `format-euro.util.ts`
- Use `A4_PAGE_WIDTH`, `DEFAULT_MARGIN` from `pdf-constants.ts`
- Helvetica font, 10-16pt sizes, same positioning patterns as existing templates

**Assembler pattern** — follow `RentCallPdfAssembler` / `FormalNoticePdfAssembler`:
- Input: Prisma revision record with eager-loaded relations
- Output: `RevisionLetterPdfData` interface
- Format dates as DD/MM/YYYY
- Format address as `street, complement, postalCode city`
- Tenant name: use `companyName` for company tenants, `firstName lastName` for individuals

**Download controller** — follow `DownloadRentCallPdfController`:
- `GET /api/entities/:entityId/revisions/:revisionId/letter`
- Set `Content-Type: application/pdf`
- Set `Content-Disposition: attachment; filename="lettre-revision-{lastName}-{YYYY-MM}.pdf"`
- Expose Content-Disposition via CORS headers
- `res.end(buffer)` to stream
- Use `sanitizeForFilename()` if available, or replicate the pattern

**Blob download (frontend)** — follow `downloadRentCallPdf()` in `rent-calls-api.ts`:
- `URL.createObjectURL(blob)` + hidden `<a>` click + `URL.revokeObjectURL()`
- Standalone async function, not inside hook

**Download hook** — follow `useDownloadRentCallPdf(entityId)`:
- `useState`-managed: `{ isDownloading, downloadingId, error }`
- NOT useMutation (download is not a cache mutation)

### Existing Code to Modify

**Backend:**
- `backend/src/infrastructure/document/pdf-generator.service.ts` — add `generateRevisionLetterPdf()` method
- `backend/src/infrastructure/document/document.module.ts` — no change needed (already @Global)
- `backend/src/presentation/revision/finders/revision.finder.ts` — add `findByIdWithRelations()` method
- `backend/src/presentation/revision/revision-presentation.module.ts` — register new controller + assembler

**Frontend:**
- `frontend/src/lib/api/revisions-api.ts` — add `downloadRevisionLetter()` function
- `frontend/src/hooks/use-revisions.ts` — add `useDownloadRevisionLetter()` hook
- `frontend/src/components/features/revisions/revision-table.tsx` — add download button column
- `frontend/src/app/(auth)/revisions/page.tsx` — may need minor update for download context

### RevisionFinder Eager Loading

Add method to `RevisionFinder`:
```typescript
async findByIdWithRelations(revisionId: string, entityId: string) {
  return this.prisma.revision.findFirst({
    where: { id: revisionId, entityId },
    include: {
      // Note: Revision table stores denormalized tenantName, unitLabel
      // but we need full tenant/entity data for the letter
    },
  });
}
```

**Important**: The Revision Prisma model already stores denormalized `tenantName`, `unitLabel`, but for the letter we also need:
- Entity full address + SIRET → query Entity by `entityId`
- Tenant full address → query Tenant by `tenantId`
- Lease start date → query Lease by `leaseId`

**Approach**: Either eager load via Prisma relations (if FK exists) or do separate queries in assembler. Check Prisma schema for Revision relations. If no FK relations exist on the Revision model, the assembler should accept multiple query results:
```typescript
assemble(revision: Revision, entity: Entity, tenant: Tenant, lease: Lease): RevisionLetterPdfData
```

### Effective Date Logic

The "effective date" for the revision letter should be derived from:
- The lease's revision month + day (configured in Story 3.5)
- Combined with the year of the approved revision
- Example: If lease revision is on day 15 of month 7, and revision approved for 2026, effective date = 15/07/2026

**Alternative (simpler)**: Use `approvedAt` as the effective date, since the revision takes effect from the approval date. Check with existing revision data — the `Revision` Prisma model has `approvedAt` field.

### Filename Convention

Follow established pattern:
- Rent call: `appel-loyer-{tenantLastName}-{month}.pdf`
- Receipt: `quittance-{tenantLastName}-{month}.pdf`
- Formal notice: `mise-en-demeure-{tenantLastName}-{date}.pdf`

**Revision letter**: `lettre-revision-{tenantLastName}-{YYYY-MM}.pdf`
- `{tenantLastName}` = tenant's last name (or company name for company tenants)
- `{YYYY-MM}` = `newIndexYear`-`newIndexQuarter` (e.g., "2026-T3")
- Sanitize filename (replace spaces with dashes, remove special chars)

### Batch Download (AC #4)

For batch download of multiple revision letters:
- Frontend loops through selected revision IDs
- Sequential `await downloadRevisionLetter(entityId, revisionId)` calls
- Each triggers a separate file download
- Loading state tracks current download via `downloadingId`
- No ZIP generation needed (matches existing patterns — no ZIP anywhere in codebase)

### Testing Approach

**Backend unit tests:**
- `renderRevisionLetterPdf` template: mock doc spy, verify `.text()` calls contain formula, legal mention, entity/tenant info
- `RevisionLetterPdfAssembler`: input mapping, date formatting, address formatting, company vs individual tenant
- `DownloadRevisionLetterController`: 200 with PDF buffer, 404 for missing/unapproved revision, content headers
- `RevisionFinder.findByIdWithRelations`: query with entity guard

**Frontend unit tests:**
- RevisionTable: download button only on approved rows, batch button enables on approved selection
- `useDownloadRevisionLetter`: downloading state management, downloadingId tracking
- Integration: download action in page context

**E2E tests:**
- Navigate to revisions page → verify approved revision has download button → click → `page.waitForEvent('download')` → assert `download.suggestedFilename()` matches pattern
- Verify pending revision does NOT have download button

### Key Patterns to Follow

- **Controller-per-action**: `download-revision-letter.controller.ts` with single `handle()` method
- **GET for download**: Not POST — downloading a document is a read operation
- **No body on response**: Stream buffer directly via `res.end(buffer)`
- **CORS header**: `Access-Control-Expose-Headers: Content-Disposition` (learned from Story 4.2 review)
- **Filename sanitization**: Use `sanitizeForFilename()` utility (Story 5.6 pattern)
- **Dark mode**: Any new UI elements (buttons, badges) must include dark mode variants
- **Double-click guard**: `if (isDownloading) return;` in download handler
- **Error handling**: try/catch in download function, display error via toast or inline

### Project Structure Notes

- Alignment with existing Indexation BC + PDF infrastructure patterns
- No new Prisma schema changes needed (Revision model already has all data)
- No new path aliases needed (all existing)
- No new BC module — everything fits in existing `presentation/revision/` + `infrastructure/document/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 7, Story 7.4]
- [Source: _bmad-output/planning-artifacts/architecture.md — Document Generation & Email section]
- [Source: docs/project-context.md — CQRS patterns, file structure conventions]
- [Source: docs/anti-patterns.md — DTO validation, testing patterns]
- [Source: docs/dto-checklist.md — validation decorator requirements]
- [Source: Story 7.3 completion notes — Saga/Reaction pattern, RevisionAggregate state]
- [Source: Story 4.2 completion notes — PDF generation infrastructure, blob download, CORS]
- [Source: Story 5.6 completion notes — Receipt PDF, sanitizeForFilename, DRY download helper]
- [Source: Story 6.2 completion notes — Formal notice + stakeholder letter PDF templates]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None.

### Completion Notes List

- Pure read-side story: no new aggregates, domain events, or commands. Template + assembler + controller + download hook pattern.
- Revision Prisma model has NO FK relations — controller performs 4 separate queries (EntityFinder, RevisionFinder, TenantFinder, LeaseFinder) and passes all to the assembler.
- `TenantPresentationModule` added to `RevisionPresentationModule` imports for `TenantFinder` dependency.
- Effective date uses `approvedAt` (simpler approach per Dev Notes).
- Filename: `lettre-revision-{lastName}-{year}-{quarter}.pdf` using `sanitizeForFilename()`.
- Batch download: sequential loop over selected approved revisions (or all approved if none selected).
- 168 backend indexation+revision tests (24 suites), 42 frontend revision tests (6 suites) — all green.
- Both typechecks pass clean.
- **Code review (10 fixes):**
  - H1: `baseIndexYear` missing from full CQRS chain — added to command, aggregate, event, projection, Prisma schema, assembler, frontend interface. Backward-compat fallback in projection (`data.baseIndexYear ?? data.newIndexYear`).
  - M2+M5: `useDownloadRevisionLetter` used `isDownloading` state in `useCallback` deps — replaced with `useRef` guard to fix batch download stale closure and unstable callback.
  - M4: Template test missing tenant/entity address verification — added 2 test cases.
  - L1: Removed unnecessary `@HttpCode(200)` on GET controller.
  - L2: `formatDate` in assembler used local timezone — changed to UTC methods.
  - L3: Simplified conditional E2E test to count approved badges vs download buttons.
  - Plus: `baseIndexYear` added to all test fixtures across 5 backend + 3 frontend test files.

### File List

**New files (9):**
- `backend/src/infrastructure/document/revision-letter-pdf-data.interface.ts`
- `backend/src/infrastructure/document/templates/revision-letter.template.ts`
- `backend/src/infrastructure/document/templates/__tests__/revision-letter.template.spec.ts`
- `backend/src/presentation/revision/services/revision-letter-pdf-assembler.service.ts`
- `backend/src/presentation/revision/services/__tests__/revision-letter-pdf-assembler.service.spec.ts`
- `backend/src/presentation/revision/controllers/download-revision-letter.controller.ts`
- `backend/src/presentation/revision/__tests__/download-revision-letter.controller.spec.ts`
- `frontend/src/hooks/use-download-revision-letter.ts`
- `frontend/src/hooks/__tests__/use-download-revision-letter.test.tsx`

**Modified files (22 — includes review fixes):**
- `backend/prisma/schema.prisma` (review H1: added baseIndexYear column)
- `backend/src/indexation/revision/commands/calculate-a-revision.command.ts` (review H1)
- `backend/src/indexation/revision/commands/calculate-a-revision.handler.ts` (review H1)
- `backend/src/indexation/revision/revision.aggregate.ts` (review H1)
- `backend/src/indexation/revision/events/rent-revision-calculated.event.ts` (review H1)
- `backend/src/indexation/revision/__tests__/revision.aggregate.spec.ts` (review H1)
- `backend/src/indexation/revision/__tests__/calculate-a-revision.handler.spec.ts` (review H1)
- `backend/src/indexation/revision/__tests__/approve-revisions.handler.spec.ts` (review H1)
- `backend/src/infrastructure/document/pdf-generator.service.ts`
- `backend/src/presentation/revision/controllers/calculate-revisions.controller.ts` (review H1)
- `backend/src/presentation/revision/finders/revision.finder.ts`
- `backend/src/presentation/revision/__tests__/revision.finder.spec.ts`
- `backend/src/presentation/revision/__tests__/calculate-revisions.controller.spec.ts` (review H1)
- `backend/src/presentation/revision/__tests__/revision.projection.spec.ts` (review H1)
- `backend/src/presentation/revision/projections/revision.projection.ts` (review H1)
- `backend/src/presentation/revision/revision-presentation.module.ts`
- `frontend/src/lib/api/revisions-api.ts`
- `frontend/src/components/features/revisions/revision-table.tsx`
- `frontend/src/components/features/revisions/__tests__/revision-table.test.tsx`
- `frontend/src/components/features/revisions/__tests__/revisions-page.test.tsx`
- `frontend/src/components/features/revisions/__tests__/approve-revisions-dialog.test.tsx` (review H1)
- `frontend/e2e/revisions.spec.ts` (review L3)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
