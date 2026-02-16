import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import type { AccountBookExcelData } from './account-book-excel-data.interface.js';

@Injectable()
export class ExcelGeneratorService {
  generateAccountBookExcel(data: AccountBookExcelData): Buffer {
    const wb = XLSX.utils.book_new();
    const rows: (string | number | null | { t: string; f: string })[][] = [];

    // Header section (rows 1-4)
    rows.push([data.entityName]);
    rows.push([`Période : ${data.dateRange}`]);
    rows.push([`Exporté le : ${data.exportDate}`]);
    rows.push([]); // empty separator

    // Column headers (row 5)
    const headerRow = [
      'Date',
      'Type',
      'Description',
      'Locataire',
      'Débit (€)',
      'Crédit (€)',
      'Solde (€)',
    ];
    rows.push(headerRow);

    const headerRowIndex = 4; // 0-based index of column header row

    // Track all subtotal rows for grand total SUM formula
    const subtotalDebitRows: number[] = [];
    const subtotalCreditRows: number[] = [];

    // Category sections
    const categories = Object.keys(data.entriesByCategory);
    for (const category of categories) {
      const categoryEntries = data.entriesByCategory[category];
      if (categoryEntries.length === 0) continue;

      // Section header row
      rows.push([category]);
      const sectionHeaderRow = rows.length; // 1-based row number (for XLSX ref)

      // Data rows
      const firstDataRow = sectionHeaderRow + 1; // 1-based
      for (const entry of categoryEntries) {
        rows.push([
          entry.date,
          entry.category,
          entry.description,
          entry.tenantName,
          entry.debitEuros,
          entry.creditEuros,
          entry.balanceEuros,
        ]);
      }
      const lastDataRow = firstDataRow + categoryEntries.length - 1; // 1-based

      // Subtotal row with SUM formulas
      const subtotalRow = lastDataRow + 1; // 1-based
      subtotalDebitRows.push(subtotalRow);
      subtotalCreditRows.push(subtotalRow);
      rows.push([
        null,
        null,
        `Sous-total ${category}`,
        null,
        { t: 'n', f: `SUM(E${firstDataRow}:E${lastDataRow})` } as unknown as number,
        { t: 'n', f: `SUM(F${firstDataRow}:F${lastDataRow})` } as unknown as number,
        null,
      ]);
    }

    // Empty separator before grand total
    rows.push([]);

    // Grand total row with SUM of subtotals
    const grandTotalRow: (string | number | null | { t: string; f: string })[] = [
      null,
      null,
      'TOTAL',
      null,
      null,
      null,
      data.totalBalanceEuros,
    ];
    if (subtotalDebitRows.length > 0) {
      const debitRefs = subtotalDebitRows.map((r) => `E${r}`).join(',');
      grandTotalRow[4] = { t: 'n', f: debitRefs.includes(',') ? `SUM(${debitRefs})` : debitRefs } as unknown as number;
      const creditRefs = subtotalCreditRows.map((r) => `F${r}`).join(',');
      grandTotalRow[5] = { t: 'n', f: creditRefs.includes(',') ? `SUM(${creditRefs})` : creditRefs } as unknown as number;
    }
    rows.push(grandTotalRow);

    // Create worksheet from rows
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Now override formula cells — aoa_to_sheet doesn't handle { t, f } objects
    this.applyFormulaCells(ws, rows);

    // Apply number format to amount columns (E, F, G) for 2-decimal display
    this.applyNumberFormats(ws, rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 22 }, // Type
      { wch: 40 }, // Description
      { wch: 25 }, // Locataire
      { wch: 14 }, // Débit (€)
      { wch: 14 }, // Crédit (€)
      { wch: 14 }, // Solde (€)
    ];

    // Merge entity name across columns (row 1)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Entity name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Date range
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Export date
    ];

    // Add section header merges
    let rowIdx = headerRowIndex + 1; // after column headers
    for (const category of categories) {
      const categoryEntries = data.entriesByCategory[category];
      if (categoryEntries.length === 0) continue;
      // Section header row merge
      ws['!merges'].push({
        s: { r: rowIdx, c: 0 },
        e: { r: rowIdx, c: 6 },
      });
      rowIdx += categoryEntries.length + 1 + 1; // entries + subtotal + section header
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Livre de comptes');

    return Buffer.from(
      XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as ArrayBuffer,
    );
  }

  private applyFormulaCells(
    ws: XLSX.WorkSheet,
    rows: (string | number | null | { t: string; f: string })[][],
  ): void {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell && typeof cell === 'object' && 't' in cell && 'f' in cell) {
          const ref = XLSX.utils.encode_cell({ r, c });
          ws[ref] = { t: 'n', f: cell.f, v: 0 };
        }
      }
    }
  }

  private applyNumberFormats(
    ws: XLSX.WorkSheet,
    rows: (string | number | null | { t: string; f: string })[][],
  ): void {
    const amountCols = [4, 5, 6]; // E, F, G (Débit, Crédit, Solde)
    for (let r = 0; r < rows.length; r++) {
      for (const c of amountCols) {
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = ws[ref];
        if (cell && cell.t === 'n') {
          cell.z = '#,##0.00';
        }
      }
    }
  }
}
