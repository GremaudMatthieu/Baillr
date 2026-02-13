import { Injectable, Logger } from '@nestjs/common';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ColumnMapping } from './column-mapping.interface.js';
import { DEFAULT_COLUMN_MAPPING } from './column-mapping.interface.js';
import type { ParsedTransaction } from './parsed-transaction.interface.js';

@Injectable()
export class BankStatementParserService {
  private readonly logger = new Logger(BankStatementParserService.name);

  parseCsv(
    buffer: Buffer,
    mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING,
  ): ParsedTransaction[] {
    const csvString = buffer.toString('utf-8');

    const result = Papa.parse<Record<string, string>>(csvString, {
      header: true,
      delimiter: '', // Auto-detect (comma, semicolon, tab)
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      this.logger.warn(
        `CSV parsing warnings: ${result.errors.map((e) => e.message).join(', ')}`,
      );
    }

    if (result.data.length === 0) {
      throw new Error('Empty CSV file: no data rows found');
    }

    const rowsToProcess = this.applySkipHeaderRows(
      result.data,
      mapping.skipHeaderRows,
    );

    return this.mapRows(rowsToProcess, mapping);
  }

  parseExcel(
    buffer: Buffer,
    mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING,
  ): ParsedTransaction[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('Empty Excel file: no sheets found');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: '',
      raw: false,
    });

    if (rows.length === 0) {
      throw new Error('Empty Excel file: no data rows found');
    }

    const rowsToProcess = this.applySkipHeaderRows(
      rows,
      mapping.skipHeaderRows,
    );

    return this.mapRows(rowsToProcess, mapping);
  }

  getHeaders(buffer: Buffer, fileType: 'csv' | 'excel'): string[] {
    if (fileType === 'csv') {
      const csvString = buffer.toString('utf-8');
      const result = Papa.parse<Record<string, string>>(csvString, {
        header: true,
        delimiter: '',
        preview: 1,
      });
      return result.meta.fields ?? [];
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: '',
      raw: false,
    });

    if (rows.length === 0) return [];
    return Object.keys(rows[0]);
  }

  private applySkipHeaderRows(
    rows: Record<string, string>[],
    skipHeaderRows?: number,
  ): Record<string, string>[] {
    if (!skipHeaderRows || skipHeaderRows <= 0) return rows;
    return rows.slice(skipHeaderRows);
  }

  private mapRows(
    rows: Record<string, string>[],
    mapping: ColumnMapping,
  ): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    for (const row of rows) {
      const rawDate = this.getColumnValue(row, mapping.dateColumn);
      const rawPayer = this.getColumnValue(row, mapping.payerColumn);
      const rawReference = this.getColumnValue(row, mapping.referenceColumn);

      if (!rawDate) continue; // Skip rows without a date

      const amountCents = this.parseAmount(row, mapping);
      const date = this.parseDate(rawDate, mapping.dateFormat);

      transactions.push({
        date,
        amountCents,
        payerName: rawPayer,
        reference: rawReference,
        rawLine: { ...row },
      });
    }

    // AC7: Flag duplicate transactions (same date + amount + reference within the same import)
    this.flagDuplicates(transactions);

    return transactions;
  }

  private flagDuplicates(transactions: ParsedTransaction[]): void {
    const seen = new Map<string, number[]>();

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const key = `${t.date}|${t.amountCents}|${t.reference}`;
      const indices = seen.get(key);
      if (indices) {
        indices.push(i);
      } else {
        seen.set(key, [i]);
      }
    }

    for (const indices of seen.values()) {
      if (indices.length > 1) {
        for (const idx of indices) {
          transactions[idx].isDuplicate = true;
        }
      }
    }
  }

  private parseAmount(
    row: Record<string, string>,
    mapping: ColumnMapping,
  ): number {
    // Handle separate debit/credit columns
    if (mapping.debitColumn && mapping.creditColumn) {
      const rawDebit = this.getColumnValue(row, mapping.debitColumn);
      const rawCredit = this.getColumnValue(row, mapping.creditColumn);

      if (rawCredit && rawCredit.trim()) {
        return this.parseAmountValue(
          rawCredit,
          mapping.amountFormat ?? 'european',
        );
      }
      if (rawDebit && rawDebit.trim()) {
        const value = this.parseAmountValue(
          rawDebit,
          mapping.amountFormat ?? 'european',
        );
        return value > 0 ? -value : value; // Debits are negative
      }
      return 0;
    }

    // Single amount column
    const rawAmount = this.getColumnValue(row, mapping.amountColumn);
    if (!rawAmount || !rawAmount.trim()) {
      throw new Error(`Missing amount value in row: ${JSON.stringify(row)}`);
    }

    return this.parseAmountValue(
      rawAmount,
      mapping.amountFormat ?? 'european',
    );
  }

  private parseAmountValue(
    raw: string,
    format: 'european' | 'standard',
  ): number {
    let cleaned = raw.trim();

    if (format === 'european') {
      // Remove thousands separators (dot or space)
      cleaned = cleaned.replace(/[\s.]/g, '');
      // Handle trailing minus sign
      if (cleaned.endsWith('-')) {
        cleaned = '-' + cleaned.slice(0, -1);
      }
      // Replace comma decimal separator with dot
      cleaned = cleaned.replace(',', '.');
    }

    const value = parseFloat(cleaned);
    if (isNaN(value)) {
      throw new Error(`Invalid amount: ${raw}`);
    }
    return Math.round(value * 100); // Convert to cents
  }

  private parseDate(raw: string, format?: string): string {
    const trimmed = raw.trim();

    // Try YYYY-MM-DD (ISO-ish)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const date = new Date(trimmed.substring(0, 10));
      if (!isNaN(date.getTime())) return date.toISOString();
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    const match = trimmed.match(
      /^(\d{2})[/\-.](\d{2})[/\-.](\d{4})/,
    );
    if (match) {
      const [, day, month, year] = match;
      const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      if (!isNaN(date.getTime())) return date.toISOString();
    }

    throw new Error(`Invalid date format: ${raw} (expected ${format ?? 'DD/MM/YYYY or YYYY-MM-DD'})`);
  }

  private getColumnValue(
    row: Record<string, string>,
    columnName: string,
  ): string {
    // Direct match
    if (row[columnName] !== undefined) return row[columnName];

    // Case-insensitive match
    const lowerKey = columnName.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lowerKey) return row[key];
    }

    return '';
  }
}
