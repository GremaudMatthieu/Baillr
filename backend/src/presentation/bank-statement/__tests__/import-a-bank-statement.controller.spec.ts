import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  ImportABankStatementController,
  type ImportResult,
} from '../controllers/import-a-bank-statement.controller';
import { BankStatementParserService } from '../../../infrastructure/bank-import/bank-statement-parser.service';
import type { ParsedTransaction } from '../../../infrastructure/bank-import/parsed-transaction.interface';

describe('ImportABankStatementController', () => {
  let controller: ImportABankStatementController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockPrisma: { bankTransaction: { findMany: jest.Mock } };
  let parser: BankStatementParserService;

  function freshTransactions(): ParsedTransaction[] {
    return [
      {
        date: '2026-01-15T00:00:00.000Z',
        amountCents: 80000,
        payerName: 'DUPONT JEAN',
        reference: 'VIR-001',
        rawLine: { Date: '15/01/2026', Montant: '800,00' },
      },
    ];
  }

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    mockPrisma = {
      bankTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    parser = new BankStatementParserService();
    jest.spyOn(parser, 'parseCsv').mockImplementation(() => freshTransactions());
    jest.spyOn(parser, 'parseExcel').mockImplementation(() => freshTransactions());

    controller = new ImportABankStatementController(
      mockCommandBus as never,
      mockEntityFinder as never,
      parser,
      mockPrisma as never,
    );
  });

  it('should import a CSV file successfully', async () => {
    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    const result: ImportResult = await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1' },
      'user_abc',
    );

    expect(result.transactionCount).toBe(1);
    expect(result.transactions).toHaveLength(1);
    expect(result.bankStatementId).toBeDefined();
    expect(parser.parseCsv).toHaveBeenCalled();
  });

  it('should import an Excel file successfully', async () => {
    const file = {
      originalname: 'releve.xlsx',
      buffer: Buffer.from('excel data'),
      mimetype:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    } as Express.Multer.File;

    const result: ImportResult = await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1' },
      'user_abc',
    );

    expect(result.transactionCount).toBe(1);
    expect(parser.parseExcel).toHaveBeenCalled();
  });

  it('should accept custom column mapping', async () => {
    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    const mapping = JSON.stringify({
      dateColumn: 'Operation Date',
      amountColumn: 'Amount',
    });

    await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1', mapping },
      'user_abc',
    );

    expect(parser.parseCsv).toHaveBeenCalledWith(
      file.buffer,
      expect.objectContaining({ dateColumn: 'Operation Date' }),
    );
  });

  it('should throw BadRequestException when no file provided', async () => {
    await expect(
      controller.handle(
        'entity-1',
        undefined as never,
        { bankAccountId: 'ba-1' },
        'user_abc',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException on invalid file type', async () => {
    jest.spyOn(parser, 'parseCsv').mockImplementation(() => {
      throw new Error('Empty CSV file: no data rows found');
    });
    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from(''),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    await expect(
      controller.handle(
        'entity-1',
        file,
        { bankAccountId: 'ba-1' },
        'user_abc',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException for unauthorized entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    await expect(
      controller.handle(
        'entity-999',
        file,
        { bankAccountId: 'ba-1' },
        'user_abc',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw on empty file error', async () => {
    jest.spyOn(parser, 'parseCsv').mockImplementation(() => {
      throw new Error('Empty CSV file: no data rows found');
    });

    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from(''),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    await expect(
      controller.handle(
        'entity-1',
        file,
        { bankAccountId: 'ba-1' },
        'user_abc',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return parsed transactions in response', async () => {
    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    const result = await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1' },
      'user_abc',
    );

    expect(result.transactions[0].amountCents).toBe(80000);
    expect(result.transactions[0].payerName).toBe('DUPONT JEAN');
  });

  it('should strip rawLine from response transactions', async () => {
    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    const result = await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1' },
      'user_abc',
    );

    expect(result.transactions[0]).not.toHaveProperty('rawLine');
    expect(result.transactions[0]).toEqual({
      date: '2026-01-15T00:00:00.000Z',
      amountCents: 80000,
      payerName: 'DUPONT JEAN',
      reference: 'VIR-001',
    });
  });

  it('should flag intra-import duplicates (same date+amount+reference)', async () => {
    const duplicateTransactions: ParsedTransaction[] = [
      {
        date: '2026-01-15T00:00:00.000Z',
        amountCents: 80000,
        payerName: 'DUPONT JEAN',
        reference: 'VIR-001',
        rawLine: { Date: '15/01/2026', Montant: '800,00' },
        isDuplicate: true,
      },
      {
        date: '2026-01-15T00:00:00.000Z',
        amountCents: 80000,
        payerName: 'MARTIN MARIE',
        reference: 'VIR-001',
        rawLine: { Date: '15/01/2026', Montant: '800,00' },
        isDuplicate: true,
      },
    ];
    jest.spyOn(parser, 'parseCsv').mockReturnValue(duplicateTransactions);

    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    const result = await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1' },
      'user_abc',
    );

    expect(result.transactions[0].isDuplicate).toBe(true);
    expect(result.transactions[1].isDuplicate).toBe(true);
    expect(result.transactions[0]).not.toHaveProperty('rawLine');
  });

  it('should flag cross-import duplicates when transaction already exists in DB', async () => {
    // Simulate an existing transaction in DB with same date+amount+reference
    mockPrisma.bankTransaction.findMany.mockResolvedValue([
      {
        date: new Date('2026-01-15T00:00:00.000Z'),
        amountCents: 80000,
        reference: 'VIR-001',
      },
    ]);

    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    const result = await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1' },
      'user_abc',
    );

    expect(result.transactions[0].isDuplicate).toBe(true);
  });

  it('should not flag cross-import duplicates when no match in DB', async () => {
    // Existing transaction with different reference
    mockPrisma.bankTransaction.findMany.mockResolvedValue([
      {
        date: new Date('2026-01-15T00:00:00.000Z'),
        amountCents: 80000,
        reference: 'VIR-999',
      },
    ]);

    const file = {
      originalname: 'releve.csv',
      buffer: Buffer.from('csv data'),
      mimetype: 'text/csv',
    } as Express.Multer.File;

    const result = await controller.handle(
      'entity-1',
      file,
      { bankAccountId: 'ba-1' },
      'user_abc',
    );

    expect(result.transactions[0].isDuplicate).toBeUndefined();
  });
});
