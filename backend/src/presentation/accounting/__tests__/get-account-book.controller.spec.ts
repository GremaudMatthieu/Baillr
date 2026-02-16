import { GetAccountBookController } from '../controllers/get-account-book.controller';
import { GetAccountBookQuery } from '../queries/get-account-book.query';

describe('GetAccountBookController', () => {
  let controller: GetAccountBookController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetAccountBookController(queryBus as never);
  });

  it('should dispatch query with all params and return wrapped data', async () => {
    const accountBookResult = {
      entries: [{ id: 'ae-1', category: 'rent_call' }],
      totalBalanceCents: 80000,
      availableCategories: ['rent_call'],
    };
    queryBus.execute.mockResolvedValue(accountBookResult);

    const result = await controller.handle(
      'entity-1',
      'user-1',
      {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        category: 'rent_call',
        tenantId: 'tenant-1',
      },
    );

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetAccountBookQuery;
    expect(query).toBeInstanceOf(GetAccountBookQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(query.startDate).toBe('2026-01-01');
    expect(query.endDate).toBe('2026-01-31');
    expect(query.category).toBe('rent_call');
    expect(query.tenantId).toBe('tenant-1');
    expect(result).toEqual({ data: accountBookResult });
  });

  it('should dispatch query without optional params', async () => {
    const emptyResult = {
      entries: [],
      totalBalanceCents: 0,
      availableCategories: [],
    };
    queryBus.execute.mockResolvedValue(emptyResult);

    const result = await controller.handle('entity-1', 'user-1', {});

    const query = queryBus.execute.mock.calls[0]?.[0] as GetAccountBookQuery;
    expect(query.startDate).toBeUndefined();
    expect(query.endDate).toBeUndefined();
    expect(query.category).toBeUndefined();
    expect(query.tenantId).toBeUndefined();
    expect(result).toEqual({ data: emptyResult });
  });

  it('should forward partial filters', async () => {
    queryBus.execute.mockResolvedValue({
      entries: [],
      totalBalanceCents: 0,
      availableCategories: [],
    });

    await controller.handle(
      'entity-1',
      'user-1',
      {
        startDate: '2026-01-01',
        category: 'payment',
      },
    );

    const query = queryBus.execute.mock.calls[0]?.[0] as GetAccountBookQuery;
    expect(query.startDate).toBe('2026-01-01');
    expect(query.endDate).toBeUndefined();
    expect(query.category).toBe('payment');
    expect(query.tenantId).toBeUndefined();
  });
});
