# Story 4.2: Generate Rent Call PDF Documents

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a bailleur,
I want each rent call to be available as a downloadable PDF with correct amounts, IBAN, legal mentions, and lease references,
So that I can provide professional, legally compliant billing documents (FR19, FR27).

## Acceptance Criteria

1. **Given** rent calls have been generated for a month, **When** I click a download button on a rent call card, **Then** the system generates a PDF document containing: entity name and address, tenant name and address, lease reference, billing period (month), all billing line items with amounts, total amount due, due date (monthly due date from lease), entity's default IBAN and BIC, legal mention "Avis d'échéance envoyé à titre gratuit conformément à l'article 21 de la loi n° 89-462 du 6 juillet 1989"
2. **Given** a rent call PDF is generated, **Then** all amounts are displayed in French format (1 234,56 €) with euro sign suffix
3. **Given** a rent call PDF is generated, **Then** PDF generation completes in under 3 seconds per document (NFR3)
4. **Given** a rent call PDF is generated, **Then** the document is returned as a downloadable file (Content-Disposition: attachment) with filename `appel-loyer-{tenantLastName}-{month}.pdf`
5. **Given** I am on the rent call list page, **Then** each rent call card displays a "Télécharger PDF" secondary button
6. **Given** a pro-rata rent call, **Then** the PDF indicates "Prorata du {startDate} au {endDate}" with the number of occupied days / total days in month
7. **Given** the entity has no bank account configured, **Then** the IBAN/BIC section is omitted from the PDF (not an error)
8. **Given** I am not the owner of the entity, **When** I request a rent call PDF, **Then** I receive a 401 Unauthorized response

## Tasks / Subtasks

- [x] Task 1: Install PDFKit and create PdfGeneratorService infrastructure (AC: 1, 3)
  - [x] 1.1: Install `pdfkit` and `@types/pdfkit` in backend: `npm install pdfkit && npm install -D @types/pdfkit`
  - [x] 1.2: Create `backend/src/infrastructure/document/` directory
  - [x] 1.3: Create `PdfGeneratorService` — `@Injectable()`, method `generateRentCallPdf(data: RentCallPdfData): Promise<Buffer>`. Uses PDFKit to create an A4 PDF document, pipes to a Buffer, returns the Buffer.
  - [x] 1.4: Create `RentCallPdfData` interface: `{ entityName, entityAddress, entitySiret?, tenantName, tenantAddress, unitIdentifier, leaseReference (startDate), billingPeriod (month label), dueDate (day of month), rentAmountCents, billingLines: Array<{label, amountCents, type}>, totalAmountCents, isProRata, occupiedDays?, totalDaysInMonth?, iban?, bic? }`
  - [x] 1.5: Create `backend/src/infrastructure/document/document.module.ts` — exports `PdfGeneratorService`
  - [x] 1.6: Register `DocumentModule` in `app.module.ts` as global module
  - [x] 1.7: Write PdfGeneratorService unit tests (5 tests: valid full PDF with all fields, PDF without IBAN, pro-rata PDF, French number formatting, output is valid Buffer with PDF header)

- [x] Task 2: Create rent call PDF template layout (AC: 1, 2, 6, 7)
  - [x] 2.1: Create `backend/src/infrastructure/document/templates/rent-call.template.ts` — pure function `renderRentCallPdf(doc: PDFKit.PDFDocument, data: RentCallPdfData): void` that draws all sections on the PDFKit document
  - [x] 2.2: Layout sections (top to bottom, A4 portrait):
    - **Header**: Entity name (bold, 16pt), entity address, SIRET if present
    - **Recipient block** (right-aligned): Tenant name, tenant address
    - **Title**: "AVIS D'ÉCHÉANCE" (centered, 14pt, bold)
    - **Subtitle**: "Période : {billingPeriod}" (e.g., "Période : Février 2026")
    - **Reference**: "Lot : {unitIdentifier}" and "Bail débutant le : {leaseStartDate}"
    - **Billing table**: columns Label | Montant, rows: "Loyer" + each billing line + horizontal rule + "TOTAL" (bold)
    - **Pro-rata note** (conditional): "Prorata : {occupiedDays}/{totalDaysInMonth} jours" — only if `isProRata === true`
    - **Due date**: "Date d'exigibilité : le {dueDate} de chaque mois"
    - **Payment info** (conditional): "Règlement par virement bancaire :" + IBAN + BIC — only if IBAN is present
    - **Legal footer**: "Avis d'échéance envoyé à titre gratuit conformément à l'article 21 de la loi n° 89-462 du 6 juillet 1989"
  - [x] 2.3: Create `formatEuroCents(amountCents: number): string` utility — returns French-formatted currency string (e.g., `75000` → `"750,00 €"`) using `Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })`. Export from `backend/src/infrastructure/document/format-euro.util.ts`
  - [x] 2.4: Create `formatMonthLabel(month: string): string` utility — converts "2026-02" → "Février 2026" using French month names. Export from same util file
  - [x] 2.5: Write template rendering tests (4 tests: verify each section presence via mock PDFKit doc spy, verify French formatting, verify conditional IBAN, verify conditional pro-rata note)

- [x] Task 3: Create backend PDF download endpoint (AC: 1, 3, 4, 8)
  - [x] 3.1: Create `GetRentCallPdfController` — `GET /api/entities/:entityId/rent-calls/:rentCallId/pdf`, `@UseGuards(ClerkAuthGuard)`, `@HttpCode(200)`
  - [x] 3.2: Controller flow: extract userId from JWT → verify entity ownership via EntityFinder → load rent call via RentCallFinder → load related data (tenant, unit, lease, entity bank accounts) via Prisma joins → assemble `RentCallPdfData` → call `PdfGeneratorService.generateRentCallPdf()` → set response headers (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="appel-loyer-{tenantLastName}-{month}.pdf"`) → send Buffer
  - [x] 3.3: Create `RentCallPdfAssembler` service — `@Injectable()`, method `assembleFromRentCall(rentCall, tenant, unit, lease, entity, bankAccounts): RentCallPdfData`. Responsible for mapping Prisma models to the PDF data interface. Extracts tenant full name (individual: `{firstName} {lastName}`, company: `{companyName}`), formats addresses, finds default bank account.
  - [x] 3.4: Add `findByIdAndEntity(rentCallId, entityId)` method to `RentCallFinder` — returns rent call with `include: { tenant: true, unit: true, lease: true, entity: { include: { bankAccounts: true } } }` (eager loading all related data for PDF)
  - [x] 3.5: Register controller and assembler in `RentCallPresentationModule`
  - [x] 3.6: Write controller unit tests (6 tests: success returns PDF buffer with correct headers, rent call not found 404, entity not found 401, pro-rata rent call, rent call without IBAN, company tenant filename)

- [x] Task 4: Add Prisma schema relation for RentCall → Lease (AC: 1)
  - [x] 4.1: Verify existing `RentCall` model has `lease Lease @relation(fields: [leaseId], references: [id])` — already exists from Story 4.1.
  - [x] 4.2: Verify `Lease` model has `rentCalls RentCall[]` back-relation — already exists.
  - [x] 4.3: Verify `Entity` model relation includes `bankAccounts` for eager loading — `OwnershipEntity` has `bankAccounts BankAccount[]`.
  - [x] 4.4: No migration needed — relations are already defined. No `prisma generate` required.

- [x] Task 5: Create frontend PDF download API and hook (AC: 4, 5)
  - [x] 5.1: Add `downloadRentCallPdf(entityId: string, rentCallId: string): Promise<Blob>` to `rent-calls-api.ts` — uses direct fetch with `Accept: application/pdf` header, returns response blob
  - [x] 5.2: Create `useDownloadRentCallPdf(entityId: string)` hook in `use-rent-calls.ts` — NOT a React Query mutation (it's a file download, not data mutation). Instead, export a `downloadPdf(rentCallId: string)` function that: calls API, creates object URL, triggers download via hidden `<a>` element with `.click()`, revokes object URL
  - [x] 5.3: Handle download state: `{ isDownloading: boolean, downloadingId: string | null, error: string | null }` — managed via `useState` in the hook
  - [x] 5.4: Write hook tests (3 tests: successful download triggers blob URL, handles API error, sets loading state correctly)

- [x] Task 6: Add PDF download button to rent call list UI (AC: 5)
  - [x] 6.1: Add "Télécharger PDF" `Button variant="outline" size="sm"` to each rent call card in `rent-call-list.tsx` — positioned in card actions area
  - [x] 6.2: Button shows `Download` icon (lucide-react) + "Télécharger PDF" label
  - [x] 6.3: Button shows loading spinner when `downloadingId === rentCall.id`, disabled during download
  - [x] 6.4: On download error, show inline error message above card list
  - [x] 6.5: Write component tests (5 new tests added: button renders, not rendered without callback, click triggers download, loading state, error display)

- [x] Task 7: Backend + frontend tests and E2E (AC: 1-8)
  - [x] 7.1: Write RentCallPdfAssembler unit tests (4 tests: individual tenant, company tenant, no bank account, pro-rata data assembly)
  - [x] 7.2: Write formatEuroCents unit tests (4 tests: standard amount, zero, large number, cents precision)
  - [x] 7.3: Write formatMonthLabel unit tests (3 tests: valid month, January edge, December edge)
  - [x] 7.4: E2E test: navigate to rent calls page → verify PDF download button visible → click download → verify PDF file downloaded (check filename)
  - [x] 7.5: E2E test: verify PDF download button not visible when no rent calls generated (covered by existing empty-state test in rent-call-list)

## Dev Notes

### Architecture Decisions

- **PDFKit over Puppeteer**: PDFKit is chosen for server-side PDF generation because: (1) no headless browser dependency — lightweight, <3s generation time per NFR3, (2) no Chromium binary needed on Railway deployment, (3) programmatic control over layout matching the architecture's `pdf-generator.service.ts` pattern, (4) PDFKit v0.17.x is the latest stable version. Puppeteer would add ~400MB deployment overhead and require Chromium setup.
- **Infrastructure service, NOT domain**: `PdfGeneratorService` lives in `infrastructure/document/`, NOT in the Billing BC. Per architecture (lines 437-438): "Document generation and email delivery are infrastructure services, not bounded contexts. They have no business invariants." The PDF generation is a stateless rendering operation with no domain rules.
- **Template as pure function**: The rent call template is a pure function `renderRentCallPdf(doc, data)` that draws on a PDFKit document. This makes templates testable in isolation, reusable, and consistent with the architecture's `templates/rent-call.template.ts` location.
- **RentCallPdfAssembler**: Bridges the gap between Prisma read models and PDF data. The assembler maps database records to the `RentCallPdfData` interface, handling name formatting, address composition, and bank account selection. This keeps the controller thin and the PDF service generic.
- **Buffer response (not file storage)**: PDFs are generated on-demand and returned as HTTP response buffers. They are NOT stored on disk or in a database. This is simpler (no file storage infra), sufficient for MVP (single-user SaaS), and aligned with the current Railway deployment. Storage can be added later (Epic 4.3 may need stored PDFs for email attachments — that story will decide).
- **GET endpoint for download**: `GET /api/entities/:entityId/rent-calls/:rentCallId/pdf` follows REST conventions for resource representation. No DTO needed for query parameters. Authorization via `@UseGuards(ClerkAuthGuard)` + EntityFinder ownership check.
- **Blob download pattern**: Frontend triggers browser download via object URL + hidden anchor click. No React Query mutation needed — this is a side-effect (file download), not a cache mutation.

### Previous Story Intelligence

**From Story 4.1 (Rent Call Generation)**:
- RentCall Prisma model has `entity`, `tenant`, `unit`, `lease` relations — reuse for eager loading
- RentCallFinder already exists in `presentation/rent-call/finders/rent-call.finder.ts` — extend with `findByIdAndEntity` method
- `rent-call-list.tsx` renders Card-based UI — add download button to card actions
- `use-rent-calls.ts` hook exists — extend with download hook
- `rent-calls-api.ts` API module exists — add `downloadRentCallPdf` method
- French currency formatting already solved: `Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })` — reuse in PDF template
- mock-cqrx.ts pattern for Jest testing of billing BC modules

**From Story 4.1 Code Review**:
- Finding #3: unsafe `as` casts — avoid in assembler, use proper type validation
- Finding #4: composite index `@@index([entityId, month])` already added — no change needed
- Finding #11: `?? null` for nullable event fields — same pattern applies to optional PDF fields

**From Story 3.1 (Tenants)**:
- Tenant model has `firstName`, `lastName`, `companyName`, `type` (individual/company), `email`, `address` (JSON)
- PostalAddress format: `{ street, city, postalCode, country }` — all nullable

**From Story 2.2 (Bank Accounts)**:
- BankAccount model has `iban`, `bic`, `label`, `type` — stored as child entities in EntityAggregate
- Bank accounts accessible via `entity.bankAccounts` relation
- Default bank account: use first `bank_account` type (not `cash_register`)

### Existing Code to Extend

| File | Change |
|------|--------|
| `backend/src/presentation/rent-call/finders/rent-call.finder.ts` | Add `findByIdAndEntity()` with eager loading |
| `backend/src/presentation/rent-call/rent-call-presentation.module.ts` | Register new controller + assembler |
| `backend/src/app.module.ts` | Register `DocumentModule` |
| `frontend/src/lib/api/rent-calls-api.ts` | Add `downloadRentCallPdf()` |
| `frontend/src/hooks/use-rent-calls.ts` | Add `useDownloadRentCallPdf()` |
| `frontend/src/components/features/rent-calls/rent-call-list.tsx` | Add download button per card |

### New Files to Create

| File | Purpose |
|------|---------|
| `backend/src/infrastructure/document/pdf-generator.service.ts` | Infrastructure PDF generation service |
| `backend/src/infrastructure/document/document.module.ts` | NestJS module for document infra |
| `backend/src/infrastructure/document/templates/rent-call.template.ts` | Rent call PDF template (pure function) |
| `backend/src/infrastructure/document/format-euro.util.ts` | French currency + month formatting utilities |
| `backend/src/infrastructure/document/__tests__/pdf-generator.service.spec.ts` | PDF service tests |
| `backend/src/infrastructure/document/__tests__/rent-call.template.spec.ts` | Template rendering tests |
| `backend/src/infrastructure/document/__tests__/format-euro.util.spec.ts` | Formatting utility tests |
| `backend/src/presentation/rent-call/controllers/get-rent-call-pdf.controller.ts` | PDF download endpoint |
| `backend/src/presentation/rent-call/services/rent-call-pdf-assembler.service.ts` | Data assembler for PDF |
| `backend/src/presentation/rent-call/__tests__/get-rent-call-pdf.controller.spec.ts` | Controller tests |
| `backend/src/presentation/rent-call/__tests__/rent-call-pdf-assembler.spec.ts` | Assembler tests |
| `frontend/src/components/features/rent-calls/__tests__/rent-call-list-download.test.tsx` | Download button tests |

### Value Objects

No new VOs needed — this story uses existing VOs from Story 4.1 (RentCallMonth, RentCallLineItem) and existing Prisma models for data access.

### Events

No new events — PDF generation is a read-side operation (query, not command). No state change in the aggregate.

### Commands

No new commands — PDF generation is a synchronous read operation, not a write operation.

### API Endpoints

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| `GET` | `/api/entities/:entityId/rent-calls/:rentCallId/pdf` | Download rent call PDF | `200 OK` with `Content-Type: application/pdf` binary |

### PDFKit Configuration

```typescript
const doc = new PDFDocument({
  size: 'A4',           // 595.28 x 841.89 points
  margin: 50,           // 50pt margins
  info: {
    Title: `Avis d'échéance - ${data.tenantName} - ${data.billingPeriod}`,
    Author: data.entityName,
    Subject: 'Avis d\'échéance de loyer',
  },
});
```

### French Number Formatting

```typescript
// In format-euro.util.ts
export function formatEuroCents(amountCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100);
}

export function formatMonthLabel(month: string): string {
  const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  const [year, monthNum] = month.split('-').map(Number);
  return `${MONTHS[monthNum - 1]} ${year}`;
}
```

### Rent Call PDF Document Structure

```
┌──────────────────────────────────────────────┐
│  SCI EXAMPLE                                 │
│  12 rue de la Paix                           │
│  75002 PARIS                                 │
│  SIRET: 12345678901234                       │
│                                              │
│                        M. Jean DUPONT        │
│                        5 avenue Victor Hugo  │
│                        69003 LYON            │
│                                              │
│           AVIS D'ÉCHÉANCE                    │
│         Période : Février 2026               │
│                                              │
│  Lot : Apt 101                               │
│  Bail débutant le : 01/01/2025               │
│                                              │
│  ┌──────────────────────┬───────────┐        │
│  │ Désignation          │   Montant │        │
│  ├──────────────────────┼───────────┤        │
│  │ Loyer                │  750,00 € │        │
│  │ Provisions sur       │           │        │
│  │   charges            │  100,00 € │        │
│  │ Ordures ménagères    │   25,00 € │        │
│  ├──────────────────────┼───────────┤        │
│  │ TOTAL                │  875,00 € │        │
│  └──────────────────────┴───────────┘        │
│                                              │
│  Date d'exigibilité : le 5 de chaque mois   │
│                                              │
│  Règlement par virement bancaire :           │
│  IBAN : FR76 1234 5678 9012 3456 7890 123    │
│  BIC  : BNPAFRPP                             │
│                                              │
│  ──────────────────────────────────────────  │
│  Avis d'échéance envoyé à titre gratuit      │
│  conformément à l'article 21 de la loi       │
│  n° 89-462 du 6 juillet 1989                 │
└──────────────────────────────────────────────┘
```

### Testing Standards

**Backend (Jest)**:
- PdfGeneratorService: valid PDF buffer output, correct Content-Type, PDF header bytes (%PDF-1.x) (~5 tests)
- RentCallTemplate: section rendering via PDFKit doc spy, French formatting, conditional sections (~4 tests)
- formatEuroCents: standard, zero, large, precision (~4 tests)
- formatMonthLabel: valid month, January, December (~3 tests)
- GetRentCallPdfController: success, not found, unauthorized, pro-rata, no IBAN, invalid ID (~6 tests)
- RentCallPdfAssembler: individual tenant, company tenant, no bank account, pro-rata (~4 tests)

**Frontend (Vitest)**:
- RentCallList download button: renders, click triggers, loading state, error display (~4 tests)
- useDownloadRentCallPdf hook: download success, error, loading state (~3 tests)

**E2E (Playwright)**:
- Download button visible when rent calls exist (~1 test)
- Click download triggers file download (~1 test, use `page.waitForEvent('download')`)

### Known Pitfalls to Avoid

1. **DO NOT use Puppeteer or headless Chrome** — too heavy for Railway deployment, PDFKit is sufficient
2. **DO NOT store PDFs on disk** — generate on-demand, return as HTTP response buffer
3. **DO NOT create a new aggregate or event** — PDF generation is a read-side operation
4. **DO NOT import domain aggregates** — use Prisma read models via finders
5. **DO NOT forget `Content-Disposition: attachment`** — browser must download, not display inline
6. **DO NOT hardcode month names** — use the `formatMonthLabel` utility
7. **DO NOT use floating-point for currency** — always `amountCents / 100` via `Intl.NumberFormat`
8. **DO NOT forget to handle missing tenant address** — some tenants may not have address configured, use empty string fallback
9. **DO NOT forget entity ownership authorization** — always verify via EntityFinder before serving PDF
10. **DO NOT forget `@types/pdfkit`** — PDFKit ships without TypeScript types
11. **PDFKit Buffer collection**: use `doc.on('data', chunks.push)` + `doc.on('end', resolve)` pattern to collect PDF buffer — do NOT use `doc.pipe(fs.createWriteStream())` (no file system)
12. **Intl.NumberFormat narrow no-break space**: test regex must use `.` wildcard for space characters in formatted currency (Story 4.1 lesson)

### Project Structure Notes

- Alignment with architecture: `infrastructure/document/` is the correct location per architecture lines 1249-1257
- `PdfGeneratorService` is generic infrastructure — will be reused by receipts (Epic 5), revision letters (Epic 7), formal notices (Epic 6)
- Template files follow the architecture pattern: one template file per document type
- The `formatEuroCents` utility will be reused across all future PDF templates

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.2] — User story, acceptance criteria, FR19, FR27
- [Source: _bmad-output/planning-artifacts/architecture.md — Infrastructure Services] — PdfGeneratorService in infrastructure/document/
- [Source: _bmad-output/planning-artifacts/architecture.md — Document Templates] — templates/rent-call.template.ts
- [Source: _bmad-output/planning-artifacts/architecture.md — Financial Precision] — Integer cents, Intl.NumberFormat
- [Source: _bmad-output/planning-artifacts/architecture.md — Naming Conventions] — kebab-case files, PascalCase classes
- [Source: _bmad-output/planning-artifacts/architecture.md — API Patterns] — GET for resource representation
- [Source: _bmad-output/planning-artifacts/prd.md — FR19] — Rent call documents with amounts, IBANs, legal mentions
- [Source: _bmad-output/planning-artifacts/prd.md — FR27] — All documents as downloadable PDFs
- [Source: _bmad-output/planning-artifacts/prd.md — NFR3] — PDF generation in under 3 seconds
- [Source: _bmad-output/planning-artifacts/prd.md — French Rental Law] — Loi ALUR, mandatory legal mentions
- [Source: _bmad-output/planning-artifacts/prd.md — Implementation Considerations] — Server-side PDF generation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Button Hierarchy] — "Télécharger PDF" as secondary button
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Critical Success Moments] — Correct amounts, IBANs, legal mentions
- [Source: _bmad-output/implementation-artifacts/4-1-generate-rent-calls-for-all-active-leases-in-batch.md] — RentCall model, API, frontend components
- [Source: docs/project-context.md — Backend Architecture] — Infrastructure service pattern
- [Source: docs/project-context.md — Testing Infrastructure] — Jest + Vitest + Playwright patterns
- [Source: docs/anti-patterns.md] — Named exceptions, DTO checklist, guard clauses
- [Source: docs/dto-checklist.md] — @MaxLength, @Max, defense-in-depth
- [Source: gererseul.com — Appel de loyer] — French legal requirements: article 21 loi 89-462, gratuit mention
- [Source: hippobilier.com — Contenu avis d'échéance] — Required fields: bailleur identity, locataire identity, property address, amounts, period

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- PDFKit content stream is FlateDecode compressed — text assertions on raw buffer only work for uncompressed PDF info objects (Author, Title), not for body text. Adjusted test to check metadata instead of content stream.
- Mock completeness obligation triggered: `useDownloadRentCallPdf` added to `use-rent-calls.ts` required updating the mock in `rent-calls-page-content.test.tsx` (Story 3.5 pattern).
- TypeScript narrowing: `companyName: null` literal types as `null` not `string | null`, required `as string | null` widening in test factory function.

### Completion Notes List

- **Task 1**: Installed PDFKit v0.16.x + @types/pdfkit. Created PdfGeneratorService in infrastructure/document/ as @Global() module. 5 unit tests passing.
- **Task 2**: Created rent-call.template.ts pure function with all AC-required sections (header, recipient, title, billing table, pro-rata, payment info, legal footer). Created formatEuroCents + formatMonthLabel utilities. 11 unit tests passing (4 template + 4 formatEuro + 3 formatMonth).
- **Task 3**: Created GetRentCallPdfController (GET /api/entities/:entityId/rent-calls/:rentCallId/pdf), RentCallPdfAssembler service, extended RentCallFinder with findByIdAndEntity eager loading. 6 controller unit tests passing.
- **Task 4**: Verified all Prisma relations already exist from Story 4.1 — no schema changes needed.
- **Task 5**: Added downloadRentCallPdf API function (direct fetch with Accept: application/pdf), useDownloadRentCallPdf hook with useState-managed download state, blob URL + hidden anchor download pattern. 3 hook tests passing.
- **Task 6**: Added "Télécharger PDF" Button (outline, sm) with Download/Loader2 icons, disabled during download, inline error display. Wired in rent-calls-page-content.tsx. 5 new component tests + existing 6 = 11 total.
- **Task 7**: RentCallPdfAssembler (4 tests), formatEuroCents (4 tests), formatMonthLabel (3 tests), 2 E2E tests added to rent-calls.spec.ts (PDF button visible, download triggers file).

**Test totals**: 638 backend tests (90 suites) + 358 frontend tests (47 suites) — 0 regressions, all pass. TypeScript compiles clean on both backend and frontend.

### Change Log

- 2026-02-13: Story 4.2 implemented — PDFKit PDF generation infrastructure, rent call PDF template, download endpoint, frontend download hook + button, E2E tests

### File List

**New files (14):**
- `backend/src/infrastructure/document/pdf-generator.service.ts`
- `backend/src/infrastructure/document/document.module.ts`
- `backend/src/infrastructure/document/rent-call-pdf-data.interface.ts`
- `backend/src/infrastructure/document/format-euro.util.ts`
- `backend/src/infrastructure/document/templates/rent-call.template.ts`
- `backend/src/infrastructure/document/__tests__/pdf-generator.service.spec.ts`
- `backend/src/infrastructure/document/__tests__/rent-call.template.spec.ts`
- `backend/src/infrastructure/document/__tests__/format-euro.util.spec.ts`
- `backend/src/presentation/rent-call/controllers/get-rent-call-pdf.controller.ts`
- `backend/src/presentation/rent-call/services/rent-call-pdf-assembler.service.ts`
- `backend/src/presentation/rent-call/__tests__/get-rent-call-pdf.controller.spec.ts`
- `backend/src/presentation/rent-call/__tests__/rent-call-pdf-assembler.spec.ts`
- `frontend/src/hooks/__tests__/use-download-rent-call-pdf.test.tsx`

**Modified files (11):**
- `backend/package.json` (pdfkit + @types/pdfkit dependencies)
- `backend/package-lock.json`
- `backend/src/app.module.ts` (DocumentModule import)
- `backend/src/presentation/rent-call/finders/rent-call.finder.ts` (findByIdAndEntity method)
- `backend/src/presentation/rent-call/rent-call-presentation.module.ts` (new controller + assembler)
- `frontend/src/lib/api/rent-calls-api.ts` (downloadRentCallPdf function)
- `frontend/src/hooks/use-rent-calls.ts` (useDownloadRentCallPdf hook)
- `frontend/src/components/features/rent-calls/rent-call-list.tsx` (download button + props)
- `frontend/src/components/features/rent-calls/rent-calls-page-content.tsx` (download hook wiring)
- `frontend/src/components/features/rent-calls/__tests__/rent-call-list.test.tsx` (5 new download tests)
- `frontend/src/components/features/rent-calls/__tests__/rent-calls-page-content.test.tsx` (useDownloadRentCallPdf mock)
- `frontend/e2e/rent-calls.spec.ts` (2 new PDF download E2E tests)
