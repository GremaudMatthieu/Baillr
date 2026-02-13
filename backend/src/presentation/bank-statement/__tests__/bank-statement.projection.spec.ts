import { BankStatementProjection } from '../projections/bank-statement.projection';
import type { BankStatementImportedData } from '../../../billing/bank-statement/events/bank-statement-imported.event';

describe('BankStatementProjection', () => {
  let projection: BankStatementProjection;
  let mockPrisma: {
    bankStatement: { findUnique: jest.Mock; create: jest.Mock };
    bankTransaction: { createMany: jest.Mock };
  };
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };

  const eventData: BankStatementImportedData = {
    bankStatementId: 'bs-123',
    entityId: 'entity-1',
    userId: 'user_abc',
    bankAccountId: 'ba-1',
    fileName: 'releve.csv',
    transactionCount: 2,
    transactions: [
      {
        date: '2026-01-15T00:00:00.000Z',
        amountCents: 80000,
        payerName: 'DUPONT JEAN',
        reference: 'VIR-001',
      },
      {
        date: '2026-01-16T00:00:00.000Z',
        amountCents: -50000,
        payerName: 'EDF',
        reference: 'PRLV-002',
      },
    ],
    importedAt: '2026-01-20T10:00:00.000Z',
  };

  beforeEach(() => {
    mockPrisma = {
      bankStatement: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(undefined),
      },
      bankTransaction: {
        createMany: jest.fn().mockResolvedValue(undefined),
      },
    };
    mockKurrentDb = {
      client: {
        subscribeToAll: jest.fn().mockReturnValue({
          on: jest.fn(),
        }),
      },
    };

    projection = new BankStatementProjection(
      mockKurrentDb as never,
      mockPrisma as never,
    );
  });

  it('should create bank statement row on BankStatementImported', async () => {
    // Access private method via type assertion
    await (projection as unknown as { onBankStatementImported: (data: BankStatementImportedData) => Promise<void> }).onBankStatementImported(eventData);

    expect(mockPrisma.bankStatement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'bs-123',
        entityId: 'entity-1',
        userId: 'user_abc',
        bankAccountId: 'ba-1',
        fileName: 'releve.csv',
        transactionCount: 2,
      }),
    });
  });

  it('should create transaction rows on BankStatementImported', async () => {
    await (projection as unknown as { onBankStatementImported: (data: BankStatementImportedData) => Promise<void> }).onBankStatementImported(eventData);

    expect(mockPrisma.bankTransaction.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          bankStatementId: 'bs-123',
          entityId: 'entity-1',
          amountCents: 80000,
          payerName: 'DUPONT JEAN',
        }),
        expect.objectContaining({
          bankStatementId: 'bs-123',
          entityId: 'entity-1',
          amountCents: -50000,
          payerName: 'EDF',
        }),
      ]),
    });
  });

  it('should persist isDuplicate flag in transaction rows', async () => {
    const dataWithDuplicates: BankStatementImportedData = {
      ...eventData,
      transactions: [
        {
          date: '2026-01-15T00:00:00.000Z',
          amountCents: 80000,
          payerName: 'DUPONT JEAN',
          reference: 'VIR-001',
          isDuplicate: true,
        },
        {
          date: '2026-01-15T00:00:00.000Z',
          amountCents: 80000,
          payerName: 'MARTIN MARIE',
          reference: 'VIR-001',
          isDuplicate: true,
        },
      ],
    };

    await (projection as unknown as { onBankStatementImported: (data: BankStatementImportedData) => Promise<void> }).onBankStatementImported(dataWithDuplicates);

    const callData = mockPrisma.bankTransaction.createMany.mock.calls[0][0].data;
    expect(callData[0].isDuplicate).toBe(true);
    expect(callData[1].isDuplicate).toBe(true);
  });

  it('should default isDuplicate to false when not present in event', async () => {
    await (projection as unknown as { onBankStatementImported: (data: BankStatementImportedData) => Promise<void> }).onBankStatementImported(eventData);

    const callData = mockPrisma.bankTransaction.createMany.mock.calls[0][0].data;
    expect(callData[0].isDuplicate).toBe(false);
    expect(callData[1].isDuplicate).toBe(false);
  });

  it('should skip projection if bank statement already exists', async () => {
    mockPrisma.bankStatement.findUnique.mockResolvedValue({ id: 'bs-123' });

    await (projection as unknown as { onBankStatementImported: (data: BankStatementImportedData) => Promise<void> }).onBankStatementImported(eventData);

    expect(mockPrisma.bankStatement.create).not.toHaveBeenCalled();
    expect(mockPrisma.bankTransaction.createMany).not.toHaveBeenCalled();
  });
});
