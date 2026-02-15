import { GetBankStatementsController } from '../controllers/get-bank-statements.controller';
import { GetBankStatementsQuery } from '../queries/get-bank-statements.query';

describe('GetBankStatementsController', () => {
  let controller: GetBankStatementsController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetBankStatementsController(queryBus as never);
  });

  it('should dispatch GetBankStatementsQuery and return result', async () => {
    const statements = [{ id: 'bs-1', filename: 'relevé-01.csv' }];
    queryBus.execute.mockResolvedValue(statements);

    const result = await controller.handle('entity-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetBankStatementsQuery;
    expect(query).toBeInstanceOf(GetBankStatementsQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual(statements);
  });
});
