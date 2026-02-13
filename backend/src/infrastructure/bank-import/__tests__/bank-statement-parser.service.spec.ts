import { BankStatementParserService } from '../bank-statement-parser.service';
import type { ColumnMapping } from '../column-mapping.interface';

describe('BankStatementParserService', () => {
  let service: BankStatementParserService;

  beforeEach(() => {
    service = new BankStatementParserService();
  });

  describe('parseCsv', () => {
    it('should parse a standard CSV file with default mapping', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;1.234,56;DUPONT JEAN;VIR-001',
        '16/01/2026;-500,00;EDF;PRLV-002',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result).toHaveLength(2);
      expect(result[0].amountCents).toBe(123456);
      expect(result[0].payerName).toBe('DUPONT JEAN');
      expect(result[0].reference).toBe('VIR-001');
      expect(result[1].amountCents).toBe(-50000);
    });

    it('should parse CSV with custom column mapping', () => {
      const csv = [
        'Operation Date,Amount,Description,Ref Number',
        '2026-01-15,1234.56,DUPONT JEAN,VIR-001',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');
      const mapping: ColumnMapping = {
        dateColumn: 'Operation Date',
        amountColumn: 'Amount',
        payerColumn: 'Description',
        referenceColumn: 'Ref Number',
        amountFormat: 'standard',
      };

      const result = service.parseCsv(buffer, mapping);

      expect(result).toHaveLength(1);
      expect(result[0].amountCents).toBe(123456);
      expect(result[0].payerName).toBe('DUPONT JEAN');
    });

    it('should skip header rows when configured', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        'Banque Postale - Relevé de compte', // extra header row to skip
        '15/01/2026;100,00;DUPONT;REF-1',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      // PapaParse uses first row as header, so "Banque Postale..." becomes a data row
      const result = service.parseCsv(buffer, {
        dateColumn: 'Date',
        amountColumn: 'Montant',
        payerColumn: 'Libellé',
        referenceColumn: 'Référence',
        amountFormat: 'european',
        skipHeaderRows: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].amountCents).toBe(10000);
    });

    it('should throw on empty CSV file', () => {
      const buffer = Buffer.from('', 'utf-8');

      expect(() => service.parseCsv(buffer)).toThrow(
        'Empty CSV file: no data rows found',
      );
    });
  });

  describe('parseExcel', () => {
    it('should parse an Excel file with default mapping', () => {
      // Create a minimal Excel buffer using xlsx
      const XLSX = require('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([
        ['Date', 'Montant', 'Libellé', 'Référence'],
        ['15/01/2026', '1.234,56', 'DUPONT JEAN', 'VIR-001'],
        ['16/01/2026', '-500,00', 'EDF', 'PRLV-002'],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = service.parseExcel(buffer);

      expect(result).toHaveLength(2);
      expect(result[0].amountCents).toBe(123456);
      expect(result[0].payerName).toBe('DUPONT JEAN');
      expect(result[1].amountCents).toBe(-50000);
    });

    it('should throw on empty Excel file', () => {
      const XLSX = require('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([
        ['Date', 'Montant', 'Libellé', 'Référence'],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      expect(() => service.parseExcel(buffer)).toThrow(
        'Empty Excel file: no data rows found',
      );
    });
  });

  describe('amount parsing', () => {
    it('should parse European format amounts correctly', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;1.234,56;TEST;REF',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result[0].amountCents).toBe(123456);
    });

    it('should parse standard format amounts correctly', () => {
      const csv = [
        'Date,Amount,Payer,Ref',
        '2026-01-15,1234.56,TEST,REF',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');
      const mapping: ColumnMapping = {
        dateColumn: 'Date',
        amountColumn: 'Amount',
        payerColumn: 'Payer',
        referenceColumn: 'Ref',
        amountFormat: 'standard',
      };

      const result = service.parseCsv(buffer, mapping);

      expect(result[0].amountCents).toBe(123456);
    });

    it('should parse negative amounts (debits)', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;-1.234,56;TEST;REF',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result[0].amountCents).toBe(-123456);
    });

    it('should parse trailing minus sign amounts', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;500,00-;TEST;REF',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result[0].amountCents).toBe(-50000);
    });

    it('should handle separate debit/credit columns', () => {
      const csv = [
        'Date;Débit;Crédit;Libellé;Référence',
        '15/01/2026;;1.000,00;DUPONT;VIR-001',
        '16/01/2026;500,00;;EDF;PRLV-002',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');
      const mapping: ColumnMapping = {
        dateColumn: 'Date',
        amountColumn: 'Montant',
        payerColumn: 'Libellé',
        referenceColumn: 'Référence',
        amountFormat: 'european',
        debitColumn: 'Débit',
        creditColumn: 'Crédit',
      };

      const result = service.parseCsv(buffer, mapping);

      expect(result).toHaveLength(2);
      expect(result[0].amountCents).toBe(100000); // Credit: positive
      expect(result[1].amountCents).toBe(-50000); // Debit: negative
    });
  });

  describe('date parsing', () => {
    it('should parse DD/MM/YYYY format', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;100,00;TEST;REF',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      const parsed = new Date(result[0].date);
      expect(parsed.getUTCFullYear()).toBe(2026);
      expect(parsed.getUTCMonth()).toBe(0); // January
      expect(parsed.getUTCDate()).toBe(15);
    });

    it('should parse YYYY-MM-DD format', () => {
      const csv = [
        'Date,Amount,Payer,Ref',
        '2026-01-15,100.00,TEST,REF',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');
      const mapping: ColumnMapping = {
        dateColumn: 'Date',
        amountColumn: 'Amount',
        payerColumn: 'Payer',
        referenceColumn: 'Ref',
        amountFormat: 'standard',
      };

      const result = service.parseCsv(buffer, mapping);

      const parsed = new Date(result[0].date);
      expect(parsed.getUTCFullYear()).toBe(2026);
      expect(parsed.getUTCMonth()).toBe(0);
      expect(parsed.getUTCDate()).toBe(15);
    });
  });

  describe('malformed row handling', () => {
    it('should skip rows without a date', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;100,00;DUPONT;REF-1',
        ';200,00;MISSING DATE;REF-2',
        '16/01/2026;300,00;MARTIN;REF-3',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result).toHaveLength(2);
      expect(result[0].payerName).toBe('DUPONT');
      expect(result[1].payerName).toBe('MARTIN');
    });
  });

  describe('duplicate detection', () => {
    it('should flag transactions with same date+amount+reference as duplicates', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;800,00;DUPONT JEAN;VIR-001',
        '16/01/2026;500,00;EDF;PRLV-002',
        '15/01/2026;800,00;MARTIN MARIE;VIR-001',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result).toHaveLength(3);
      expect(result[0].isDuplicate).toBe(true);
      expect(result[1].isDuplicate).toBeUndefined();
      expect(result[2].isDuplicate).toBe(true);
    });

    it('should not flag transactions with different amounts as duplicates', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;800,00;DUPONT;VIR-001',
        '15/01/2026;900,00;DUPONT;VIR-001',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result[0].isDuplicate).toBeUndefined();
      expect(result[1].isDuplicate).toBeUndefined();
    });

    it('should not flag unique transactions as duplicates', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;800,00;DUPONT;VIR-001',
        '16/01/2026;500,00;EDF;PRLV-002',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const result = service.parseCsv(buffer);

      expect(result[0].isDuplicate).toBeUndefined();
      expect(result[1].isDuplicate).toBeUndefined();
    });
  });

  describe('getHeaders', () => {
    it('should extract CSV headers', () => {
      const csv = [
        'Date;Montant;Libellé;Référence',
        '15/01/2026;100,00;TEST;REF',
      ].join('\n');
      const buffer = Buffer.from(csv, 'utf-8');

      const headers = service.getHeaders(buffer, 'csv');

      expect(headers).toEqual(['Date', 'Montant', 'Libellé', 'Référence']);
    });

    it('should extract Excel headers', () => {
      const XLSX = require('xlsx');
      const ws = XLSX.utils.aoa_to_sheet([
        ['Date', 'Montant', 'Libellé', 'Référence'],
        ['15/01/2026', '100,00', 'TEST', 'REF'],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const headers = service.getHeaders(buffer, 'excel');

      expect(headers).toEqual(['Date', 'Montant', 'Libellé', 'Référence']);
    });
  });
});
