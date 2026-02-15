import { UnauthorizedException } from '@nestjs/common';
import { GetBankTransactionsHandler } from '../queries/get-bank-transactions.handler';
import { GetBankTransactionsQuery } from '../queries/get-bank-transactions.query';

describe('GetBankTransactionsHandler', () => {
  let handler: GetBankTransactionsHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockBankStatementFinder: { findTransactions: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockBankStatementFinder = { findTransactions: jest.fn() };
    handler = new GetBankTransactionsHandler(
      mockEntityFinder as never,
      mockBankStatementFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetBankTransactionsQuery('entity-1', 'bs-1', 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return transactions for valid entity and bank statement', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const transactions = [{ id: 'tx-1', amountCents: 85000, label: 'LOYER DUPONT' }];
    mockBankStatementFinder.findTransactions.mockResolvedValue(transactions);

    const result = await handler.execute(
      new GetBankTransactionsQuery('entity-1', 'bs-1', 'user-1'),
    );

    expect(result).toEqual(transactions);
    expect(mockBankStatementFinder.findTransactions).toHaveBeenCalledWith(
      'bs-1',
      'entity-1',
      'user-1',
    );
  });
});
