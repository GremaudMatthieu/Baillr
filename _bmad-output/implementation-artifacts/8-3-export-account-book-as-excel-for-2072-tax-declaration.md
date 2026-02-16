# Story 8.3: Export Account Book as Excel for 2072 Tax Declaration

Status: done

## Story

As a bailleur,
I want to export the account book as an Excel file formatted for 2072 tax declaration preparation,
so that I can easily transmit financial data to my accountant (FR55).

## Acceptance Criteria

1. **AC1 — Export button:** The accounting page (`/accounting`) displays an export button ("Exporter en Excel") next to the filters. The button is disabled when there are no entries to export. The button shows a loading spinner while the export is in progress.
2. **AC2 — Excel generation endpoint:** `GET /api/entities/:entityId/accounting/export` returns an `.xlsx` file as a binary download. The endpoint accepts the same optional query params as the existing `GET /api/entities/:entityId/accounting` (startDate, endDate, category, tenantId). Uses CQRS QueryBus pattern (C2-1 norm). Entity ownership validated via EntityFinder.
3. **AC3 — Excel content:** The generated Excel file contains all entries matching the current filters with proper column headers in French: Date, Type, Description, Locataire, Débit (€), Crédit (€), Solde (€). Amounts are formatted as numbers with 2 decimal places (euros, not cents). Category values use French labels (from OPERATION_TYPE_LABELS).
4. **AC4 — Entity details header:** The Excel file includes an entity information header above the data table: entity name, date range (from filters or "Toutes les dates"), generation date. This header section is clearly separated from the data rows.
5. **AC5 — Summary totals:** The Excel file includes summary totals below the data table: total debits, total credits, and final balance. These use Excel SUM formulas (not hardcoded values) so the accountant can verify.
6. **AC6 — 2072 format structuring:** The export separates entries by operation type (rent_call, payment, overpayment_credit, charge_regularization) with subtotals per type, making it easy for an accountant to map to 2072 declaration lines (revenus fonciers, charges déductibles).
7. **AC7 — Filename convention:** The downloaded file is named `livre-comptes-{entity-name}-{YYYY-MM-DD}.xlsx` where entity name is sanitized (no special chars) and date is the export date. Content-Disposition header sets the filename. CORS exposes Content-Disposition.
8. **AC8 — Response headers:** The endpoint sets `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="..."`, and CORS exposes Content-Disposition header.
9. **AC9 — Tests:** Backend: export handler test (filter forwarding, entity validation), export controller test (headers, auth), Excel service test (content verification). Frontend: hook test, button rendering test (disabled state, loading state). E2E: trigger export, verify download filename.
10. **AC10 — All tests green:** All existing backend + frontend + E2E tests pass. No regressions.

## Tasks / Subtasks

- [x] Task 1: Create ExcelGeneratorService in infrastructure (AC: #3, #4, #5, #6)
  - [x] 1.1 Create `backend/src/infrastructure/document/excel-generator.service.ts`
  - [x] 1.2 Implement `generateAccountBookExcel(data: AccountBookExcelData): Promise<Buffer>` using `xlsx` library (already in dependencies v0.18.5)
  - [x] 1.3 Define `AccountBookExcelData` interface in `backend/src/infrastructure/document/account-book-excel-data.interface.ts`
  - [x] 1.4 Implement entity header section (rows 1-4: entity name, date range, export date, empty separator)
  - [x] 1.5 Implement data table with French column headers: Date, Type, Description, Locataire, Débit (€), Crédit (€), Solde (€)
  - [x] 1.6 Implement category grouping: entries sorted by category, with subtotals per category section
  - [x] 1.7 Implement summary totals row with Excel SUM formulas
  - [x] 1.8 Format amounts as euros (divide cents by 100, 2 decimal places, number format)
  - [x] 1.9 Set column widths for readability
  - [x] 1.10 Register `ExcelGeneratorService` in `DocumentModule` (already @Global)
  - [x] 1.11 Unit test: `excel-generator.service.spec.ts` — verify sheet structure, headers, formulas, category grouping

- [x] Task 2: Create export endpoint in accounting presentation module (AC: #2, #7, #8)
  - [x] 2.1 Create `backend/src/presentation/accounting/queries/export-account-book.query.ts`
  - [x] 2.2 Create `backend/src/presentation/accounting/queries/export-account-book.handler.ts` — reuses AccountingFinder + EntityFinder, delegates to ExcelGeneratorService
  - [x] 2.3 Create `backend/src/presentation/accounting/controllers/export-account-book.controller.ts` — `GET /api/entities/:entityId/accounting/export`
  - [x] 2.4 Set response headers: Content-Type, Content-Disposition with sanitized filename
  - [x] 2.5 Reuse `GetAccountBookQueryParamsDto` for filter validation
  - [x] 2.6 Register controller + handler in `AccountingPresentationModule`
  - [x] 2.7 Unit tests: handler test (4 tests), controller test (3 tests)

- [x] Task 3: Create AccountBookExcelAssembler (AC: #3, #4, #6)
  - [x] 3.1 Create `backend/src/presentation/accounting/assemblers/account-book-excel.assembler.ts`
  - [x] 3.2 Map AccountEntryWithTenant[] → AccountBookExcelData (format tenant names, translate categories, convert cents→euros)
  - [x] 3.3 Include entity details (name, address) from EntityFinder
  - [x] 3.4 Unit test: assembler mapping test

- [x] Task 4: Frontend download function and hook (AC: #1, #7)
  - [x] 4.1 Add `downloadAccountBookExcel(entityId, filters, getToken)` to `frontend/src/lib/api/accounting-api.ts` — follows existing blob download pattern
  - [x] 4.2 Create `frontend/src/hooks/use-download-account-book-excel.ts` — useState-managed (following useDownloadReceipt pattern)
  - [x] 4.3 Hook test: `use-download-account-book-excel.test.ts`

- [x] Task 5: Add export button to accounting page (AC: #1)
  - [x] 5.1 Add "Exporter en Excel" button with Download icon to `account-book-content.tsx` — positioned next to filters
  - [x] 5.2 Button disabled when no entries, shows Loader2 spinner when downloading
  - [x] 5.3 Pass current filters to download function (export respects active filters)
  - [x] 5.4 Component test: button rendering, disabled state, loading state

- [x] Task 6: CORS configuration for Content-Disposition (AC: #8)
  - [x] 6.1 Verify CORS exposedHeaders includes Content-Disposition (already configured from Story 4.2 PDF pattern — verified it applies to this endpoint too)

- [x] Task 7: E2E test (AC: #9, #10)
  - [x] 7.1 E2E spec: `accounting-export.spec.ts` — navigate to accounting, click export, verify download filename
  - [x] 7.2 Full test suite regression: all backend + frontend tests pass

- [x] Task 8: Final verification and File List (AC: #10)
  - [x] 8.1 Run `git status --short` and compare with File List below
  - [x] 8.2 Run full backend + frontend + E2E test suites

## Dev Notes

### CRITICAL: Build on Existing Accounting Infrastructure (Story 8.1)

**This story adds an export endpoint to the existing `presentation/accounting/` module.** The AccountingFinder, query params DTO, entity validation, and filtering are ALL already implemented. Do NOT recreate any of this — reuse it.

**What already exists (reuse — DO NOT duplicate):**
- `AccountingFinder.findByEntity(entityId, filters)` — returns `AccountEntryWithTenant[]` with tenant join
- `AccountingFinder.getTotalBalance(entityId, tenantId?)` — entity-level or tenant-filtered balance
- `GetAccountBookQueryParamsDto` — validates startDate, endDate, category, tenantId
- `EntityFinder.findByIdAndUserId(entityId, userId)` — ownership check
- `AccountingPresentationModule` — registered in app.module.ts, imports CqrsModule + EntityPresentationModule
- `OPERATION_TYPE_LABELS` — French category labels (frontend constant)
- `formatCurrency()` — French number formatting utility

**What this story ADDS:**
- `ExcelGeneratorService` in `infrastructure/document/` — generates .xlsx buffer (follows PdfGeneratorService pattern)
- `ExportAccountBookController` + `ExportAccountBookHandler` — new export endpoint in accounting presentation module
- `AccountBookExcelAssembler` — maps finder data → Excel data interface
- Frontend download hook + export button in existing AccountBookContent component

### Architecture Compliance

**ExcelGeneratorService in infrastructure/document/ (NOT in presentation/):**
Per architecture, document generation services (PDF, Excel) live in `infrastructure/document/` as global services. The `DocumentModule` is already `@Global()`. Register `ExcelGeneratorService` alongside `PdfGeneratorService`.

**Controller-per-Action pattern:** Create a separate `ExportAccountBookController` (not add a route to `GetAccountBookController`). Each controller handles exactly one HTTP action.

**CQRS QueryBus pattern:** The handler reuses `AccountingFinder` and delegates to `ExcelGeneratorService`. The handler does NOT call Prisma directly — only through the finder (established C2-1 pattern).

### Backend Structure (New Files)

```
backend/src/
├── infrastructure/document/
│   ├── excel-generator.service.ts           # NEW — generates .xlsx buffer
│   ├── account-book-excel-data.interface.ts  # NEW — data interface for Excel
│   └── __tests__/
│       └── excel-generator.service.spec.ts   # NEW
├── presentation/accounting/
│   ├── controllers/
│   │   ├── get-account-book.controller.ts    # EXISTS
│   │   └── export-account-book.controller.ts # NEW — GET /export
│   ├── queries/
│   │   ├── get-account-book.query.ts         # EXISTS
│   │   ├── get-account-book.handler.ts       # EXISTS
│   │   ├── export-account-book.query.ts      # NEW
│   │   └── export-account-book.handler.ts    # NEW
│   ├── assemblers/
│   │   └── account-book-excel.assembler.ts   # NEW
│   ├── dto/
│   │   └── get-account-book-query-params.dto.ts # EXISTS — reuse for export
│   ├── __tests__/
│   │   ├── export-account-book.handler.spec.ts  # NEW
│   │   ├── export-account-book.controller.spec.ts # NEW
│   │   └── account-book-excel.assembler.spec.ts  # NEW
│   └── accounting-presentation.module.ts     # MODIFY — add controller + handler
```

### Frontend Structure (New/Modified Files)

```
frontend/src/
├── hooks/
│   ├── use-download-account-book-excel.ts     # NEW
│   └── __tests__/
│       └── use-download-account-book-excel.test.ts # NEW
├── lib/api/
│   └── accounting-api.ts                       # MODIFY — add downloadAccountBookExcel
├── components/features/accounting/
│   ├── account-book-content.tsx                # MODIFY — add export button
│   └── __tests__/
│       └── account-book-content.test.tsx       # MODIFY — add export button tests
└── e2e/
    └── accounting-export.spec.ts              # NEW
```

### xlsx Library Usage (Already in Dependencies)

The `xlsx` library (SheetJS) v0.18.5 is already installed in `backend/package.json`. Import pattern:

```typescript
import * as XLSX from 'xlsx';

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from array of arrays (aoa)
const ws = XLSX.utils.aoa_to_sheet(rows);

// Set column widths
ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 40 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Livre de comptes');

// Generate buffer
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
```

**IMPORTANT:** Use `XLSX.utils.aoa_to_sheet()` (array of arrays) for full control over cell formatting. Do NOT use `json_to_sheet` as it cannot place header rows above the data table.

### AccountBookExcelData Interface

```typescript
export interface AccountBookExcelEntry {
  date: string;         // DD/MM/YYYY format
  category: string;     // French label (not raw key)
  description: string;
  tenantName: string;
  debitEuros: number | null;   // null if credit
  creditEuros: number | null;  // null if debit
  balanceEuros: number;
}

export interface AccountBookExcelData {
  entityName: string;
  dateRange: string;       // "01/01/2025 — 31/12/2025" or "Toutes les dates"
  exportDate: string;      // DD/MM/YYYY
  entries: AccountBookExcelEntry[];
  // Pre-grouped by category for 2072 structuring
  entriesByCategory: Record<string, AccountBookExcelEntry[]>;
  totalDebitEuros: number;
  totalCreditEuros: number;
  totalBalanceEuros: number;
}
```

### Excel Sheet Structure (2072 Tax Format)

```
Row 1: Entity name (bold, merged across columns)
Row 2: "Période : 01/01/2025 — 31/12/2025"
Row 3: "Exporté le : 16/02/2026"
Row 4: (empty separator)
Row 5: Column headers (bold, background color): Date | Type | Description | Locataire | Débit (€) | Crédit (€) | Solde (€)

--- Category: Appels de loyer ---
Row 6: Section header "Appels de loyer" (bold, merged)
Row 7-N: Rent call entries
Row N+1: Subtotal "Sous-total Appels de loyer" (bold) with SUM formulas

--- Category: Paiements ---
Row N+2: Section header "Paiements" (bold, merged)
...entries...
Subtotal row

--- Category: Trop-perçus ---
...if entries exist...

--- Category: Régularisation ---
...if entries exist...

--- Grand Total ---
Row M: "TOTAL" (bold) with SUM of all subtotals
```

**Why category grouping for 2072:** The French 2072 tax declaration (revenus fonciers for SCIs) requires income and charges to be reported in separate categories. Grouping entries by type allows the accountant to directly map:
- `rent_call` → Line 1: Loyers bruts encaissés
- `payment` → Cross-reference for encaissements
- `charge_regularization` → Line 4: Charges récupérables
- `adjustment` → Various deductible lines

### Filename Sanitization (Reuse Existing Pattern)

From Story 4.2 (rent call PDF), there's already a `sanitizeForFilename` utility in `backend/src/infrastructure/document/`. Check if it exists at:
- `backend/src/infrastructure/document/pdf-constants.ts` (Story 5.6 extraction)
- or inline in the rent call assembler

Reuse the same sanitization: replace accented chars, spaces → hyphens, remove special chars, lowercase.

### Content-Disposition and CORS

From Story 4.2, CORS already exposes `Content-Disposition` header. Verify the CORS config at `backend/src/main.ts` includes:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  exposedHeaders: ['Content-Disposition'],
});
```

The export controller sets:
```typescript
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
res.end(buffer);
```

### Frontend Blob Download Pattern (Follow Existing)

The blob download pattern is established in `downloadPdfFromEndpoint()` (rent-calls-api.ts). Follow the EXACT same pattern:

```typescript
export async function downloadAccountBookExcel(
  entityId: string,
  filters: AccountingFilters | undefined,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) throw new Error("Authentication required");

  const params = new URLSearchParams();
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.tenantId) params.set("tenantId", filters.tenantId);

  const query = params.toString();
  const url = `${BACKEND_URL}/api/entities/${entityId}/accounting/export${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let message = `Download failed: ${response.status}`;
    if (contentType?.includes("application/json")) {
      const error = (await response.json()) as { message?: string };
      if (error.message) message = error.message;
    }
    throw new Error(message);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = match?.[1] ?? `livre-comptes-${entityId}.xlsx`;
  const blob = await response.blob();
  return { blob, filename };
}
```

### Download Hook Pattern (Follow useDownloadReceipt)

```typescript
export function useDownloadAccountBookExcel(entityId: string) {
  const { getToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadExcel = useCallback(
    async (filters?: AccountingFilters) => {
      setIsDownloading(true);
      setError(null);
      try {
        const { blob, filename } = await downloadAccountBookExcel(entityId, filters, getToken);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de téléchargement");
      } finally {
        setIsDownloading(false);
      }
    },
    [entityId, getToken],
  );

  return { downloadExcel, isDownloading, error };
}
```

### Export Button in AccountBookContent

Add the button between the title and the filters:
```tsx
import { Download, Loader2 } from "lucide-react";
import { useDownloadAccountBookExcel } from "@/hooks/use-download-account-book-excel";

// Inside AccountBookInner:
const { downloadExcel, isDownloading } = useDownloadAccountBookExcel(entityId);

// In the JSX, next to the title:
<div className="mb-6 flex items-center justify-between">
  <h1 className="text-2xl font-bold tracking-tight">Livre de comptes</h1>
  <Button
    variant="outline"
    size="sm"
    onClick={() => downloadExcel(filters)}
    disabled={!data || data.entries.length === 0 || isDownloading}
  >
    {isDownloading ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <Download className="mr-2 h-4 w-4" />
    )}
    Exporter en Excel
  </Button>
</div>
```

### ExportAccountBookHandler Pattern

```typescript
@QueryHandler(ExportAccountBookQuery)
export class ExportAccountBookHandler implements IQueryHandler<ExportAccountBookQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly accountingFinder: AccountingFinder,
    private readonly assembler: AccountBookExcelAssembler,
    private readonly excelGenerator: ExcelGeneratorService,
  ) {}

  async execute(query: ExportAccountBookQuery): Promise<{ buffer: Buffer; filename: string }> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) throw new UnauthorizedException();

    const entries = await this.accountingFinder.findByEntity(query.entityId, {
      startDate: query.startDate,
      endDate: query.endDate,
      category: query.category,
      tenantId: query.tenantId,
    });

    const excelData = this.assembler.assemble(entity, entries, {
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const buffer = this.excelGenerator.generateAccountBookExcel(excelData);
    const filename = this.assembler.buildFilename(entity.name);

    return { buffer, filename };
  }
}
```

### ExportAccountBookController Pattern

```typescript
@Controller('entities/:entityId/accounting')
export class ExportAccountBookController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('export')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
    @Query() query: GetAccountBookQueryParamsDto,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.queryBus.execute<
      ExportAccountBookQuery,
      { buffer: Buffer; filename: string }
    >(new ExportAccountBookQuery(entityId, userId, query.startDate, query.endDate, query.category, query.tenantId));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }
}
```

**IMPORTANT:** When using `@Res()`, NestJS does NOT automatically send the response — you must call `res.end()` manually. Also import `Response` from `express` (the project uses Express under NestJS).

### Testing Strategy

**Backend (Jest):**
- `ExcelGeneratorService` — verify: sheet exists, column headers correct, amounts are numbers (not cents), category grouping, SUM formulas in subtotals/totals, entity header rows
- `ExportAccountBookHandler` — verify: EntityFinder called, AccountingFinder called with filters, assembler called, returns buffer + filename
- `ExportAccountBookController` — verify: auth guard, correct content-type header, Content-Disposition header, ParseUUIDPipe on entityId
- `AccountBookExcelAssembler` — verify: cents→euros conversion, tenant name formatting, category label translation, date formatting, filename sanitization

**Frontend (Vitest):**
- `useDownloadAccountBookExcel` — verify: calls downloadAccountBookExcel, manages isDownloading state, handles errors
- `AccountBookContent` — verify: export button rendered, disabled when no entries, shows spinner when downloading

**E2E (Playwright):**
- Navigate to `/accounting`, trigger export via button click, verify download event fires with `.xlsx` filename
- Use `page.waitForEvent('download')` pattern (same as Story 4.2 PDF E2E)

### Previous Story Learnings (Story 8.1)

From the 8.1 code review (12 findings):
- **Tablet responsive `hidden lg:table-cell`** — already applied to Type and Locataire columns
- **`Prisma.AccountEntryWhereInput` typed where** — no unsafe `as` casts
- **`GetAccountBookQueryParamsDto` with class-validator** — reuse this for export (same filters)
- **`getAvailableCategories()` via groupBy** — available if needed for category-specific sheets
- **UTC timezone for date parsing** — always use `timeZone: "UTC"` in `toLocaleDateString()`
- **No `exports: [AccountingFinder]`** — finder stays internal to the module, handler accesses it via DI

From Story 4.2 (PDF download) and Story 5.6 (receipt PDF):
- **Content-Disposition CORS exposure** — already configured in main.ts
- **`sanitizeForFilename`** — reuse from `pdf-constants.ts`
- **Blob download pattern** — `URL.createObjectURL` + hidden `<a>` click + `URL.revokeObjectURL`
- **`page.waitForEvent('download')` in E2E** — established pattern

### CORS Notes

CORS `exposedHeaders: ['Content-Disposition']` was added in Story 4.2. Verify it still works for this new endpoint (same origin, same CORS config). No additional CORS changes should be needed.

### xlsx Library Notes

- `xlsx` v0.18.5 uses CommonJS by default. In the NestJS ESM context, import as `import * as XLSX from 'xlsx'` (or check if `import XLSX from 'xlsx'` works with the project's tsconfig module resolution)
- For number formatting in cells, use `{ t: 'n', z: '#,##0.00' }` to get French-compatible number display
- Column widths via `ws['!cols']` — set `wch` (width in characters)
- Merged cells via `ws['!merges']` — for entity header and section headers
- For SUM formulas: `{ t: 'n', f: 'SUM(E7:E15)' }` — the formula reference must use the actual row numbers

### Project Structure Notes

- `infrastructure/document/` already contains `DocumentModule` (@Global), `PdfGeneratorService`, and templates. Adding `ExcelGeneratorService` is a natural extension
- The assembler pattern (`RentCallPdfAssembler`, etc.) is established — create `AccountBookExcelAssembler` in `presentation/accounting/assemblers/`
- No new Prisma migration needed — reads existing `account_entries` table
- No new path aliases needed — all imports within existing module paths

### References

- [Source: architecture.md#Bounded Contexts & Context Map] — `presentation/accounting/` as read-only module
- [Source: 8-1-implement-event-sourced-account-book.md] — AccountingFinder, query params, entity validation patterns
- [Source: architecture.md#Structure Patterns] — presentation module structure, controller-per-action
- [Source: project-context.md#CQRS / Event Sourcing Patterns] — QueryBus pattern
- [Source: epics.md#Story 8.3] — FR55 acceptance criteria
- [Source: 4-2-generate-rent-call-pdf-documents.md] — Content-Disposition CORS, blob download, sanitizeForFilename

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- xlsx `!cols` not preserved on round-trip read → fixed test to verify sheet range (7 columns) instead of `ws['!cols']`
- TypeScript entryDate type mismatch (string vs Date) in assembler test → fixed with `new Date()` wrappers

### Completion Notes List

- 8 tasks, all complete
- Backend: 1529 tests (228 suites) ✅
- Frontend: 801 tests (102 suites) ✅
- Typecheck: clean ✅
- CORS already configured (Story 4.2) — no changes needed
- Reused existing infrastructure: AccountingFinder, GetAccountBookQueryParamsDto, EntityFinder, sanitizeForFilename, DocumentModule
- ExcelGeneratorService uses xlsx (SheetJS) v0.18.5 with aoa_to_sheet for full control over cell formatting
- Formula cells applied via private applyFormulaCells method (aoa_to_sheet doesn't handle { t, f } objects natively)
- Category ordering follows 2072 tax declaration structure (rent_call → revenus fonciers, payment → encaissements, etc.)

### File List

**New files (13):**
- `backend/src/infrastructure/document/account-book-excel-data.interface.ts`
- `backend/src/infrastructure/document/excel-generator.service.ts`
- `backend/src/infrastructure/document/__tests__/excel-generator.service.spec.ts`
- `backend/src/presentation/accounting/queries/export-account-book.query.ts`
- `backend/src/presentation/accounting/queries/export-account-book.handler.ts`
- `backend/src/presentation/accounting/controllers/export-account-book.controller.ts`
- `backend/src/presentation/accounting/assemblers/account-book-excel.assembler.ts`
- `backend/src/presentation/accounting/__tests__/export-account-book.handler.spec.ts`
- `backend/src/presentation/accounting/__tests__/export-account-book.controller.spec.ts`
- `backend/src/presentation/accounting/__tests__/account-book-excel.assembler.spec.ts`
- `frontend/src/hooks/use-download-account-book-excel.ts`
- `frontend/src/hooks/__tests__/use-download-account-book-excel.test.tsx`
- `frontend/e2e/accounting-export.spec.ts`

**Modified files (5):**
- `backend/src/infrastructure/document/document.module.ts` — added ExcelGeneratorService to providers/exports
- `backend/src/presentation/accounting/accounting-presentation.module.ts` — added ExportAccountBookController, ExportAccountBookHandler, AccountBookExcelAssembler
- `frontend/src/lib/api/accounting-api.ts` — added downloadAccountBookExcel function
- `frontend/src/components/features/accounting/account-book-content.tsx` — added export button with Download/Loader2 icons
- `frontend/src/components/features/accounting/__tests__/account-book-content.test.tsx` — added 4 export button tests

### Change Log

- **ExcelGeneratorService**: New infrastructure service generating .xlsx buffers using SheetJS (aoa_to_sheet). Supports entity header, French column headers, category grouping with subtotals via SUM formulas, grand total, and column widths. Registered in @Global() DocumentModule.
- **Export endpoint**: `GET /api/entities/:entityId/accounting/export` — CQRS QueryBus pattern, reuses GetAccountBookQueryParamsDto for filter validation, sets Content-Type xlsx + Content-Disposition headers.
- **AccountBookExcelAssembler**: Maps AccountEntryWithTenant[] → AccountBookExcelData. Translates category keys to French labels, orders by CATEGORY_ORDER for 2072 tax structure, formats dates DD/MM/YYYY UTC, converts cents→euros.
- **Frontend hook**: useDownloadAccountBookExcel — useState-managed (follows useDownloadReceipt pattern), blob download via hidden `<a>` click.
- **Export button**: "Exporter en Excel" button in AccountBookContent, disabled when no entries or downloading, Loader2 spinner during download. Passes current filters to download function.
- **E2E test**: accounting-export.spec.ts — seeds entity+property+unit+tenant+lease+rent call, verifies export button triggers .xlsx download.

### Senior Developer Review (AI)

**Reviewer:** Monsieur on 2026-02-16
**Findings:** 1 High, 5 Medium, 3 Low — 7 fixed

| # | Sev | Finding | Fix Applied |
|---|-----|---------|-------------|
| H1 | HIGH | CATEGORY_LABELS duplicated backend/frontend — desync risk | Added SYNC comment pointing to frontend constant |
| M1 | MED | Unused `_headerRowIndex` parameter in `applyFormulaCells` | Removed parameter and call-site arg |
| M2 | MED | Grand total row missing balance value (col G) | Added `data.totalBalanceEuros` to grand total row + test assertion |
| M3 | MED | No click interaction test for export button | Added test verifying `downloadExcel` called with filters on click |
| M4 | MED | `downloadAccountBookExcel` uses raw fetch vs `fetchWithAuth` | Accepted — established blob download pattern (Story 4.2) |
| M5 | MED | `buildFilename`/`exportDate` use `new Date()` — non-deterministic tests | Added `jest.useFakeTimers()` + exact date assertions |
| L1 | LOW | Story File List says "14 new files" but lists 13 | Fixed count to 13 |
| L2 | LOW | Amount cells lack `#,##0.00` number format | Added `applyNumberFormats` method (SheetJS CE round-trip limitation noted in test) |
| L3 | LOW | E2E test data accumulation | Accepted — project convention (timestamp-based, no cleanup) |

