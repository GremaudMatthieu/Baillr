import { GetChargeCategoriesController } from '../controllers/get-charge-categories.controller';
import { GetChargeCategoriesQuery } from '../queries/get-charge-categories.query';

describe('GetChargeCategoriesController', () => {
  let controller: GetChargeCategoriesController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetChargeCategoriesController(queryBus as never);
  });

  it('should dispatch GetChargeCategoriesQuery and return wrapped data', async () => {
    const categories = [{ id: '1', slug: 'water', label: 'Eau', isStandard: true }];
    queryBus.execute.mockResolvedValue(categories);

    const result = await controller.handle('entity-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetChargeCategoriesQuery;
    expect(query).toBeInstanceOf(GetChargeCategoriesQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual({ data: categories });
  });
});
