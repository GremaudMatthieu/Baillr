import { GetBankTransactionsController } from '../controllers/get-bank-transactions.controller';
import { GetBankTransactionsQuery } from '../queries/get-bank-transactions.query';

describe('GetBankTransactionsController', () => {
  let controller: GetBankTransactionsController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetBankTransactionsController(queryBus as never);
  });

  it('should dispatch GetBankTransactionsQuery and return result', async () => {
    const transactions = [{ id: 'tx-1', amountCents: 85000 }];
    queryBus.execute.mockResolvedValue(transactions);

    const result = await controller.handle('entity-1', 'bs-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetBankTransactionsQuery;
    expect(query).toBeInstanceOf(GetBankTransactionsQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.bankStatementId).toBe('bs-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual(transactions);
  });
});
