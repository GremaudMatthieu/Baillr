import { GetChargeRegularizationController } from '../controllers/get-charge-regularization.controller';
import { GetChargeRegularizationQuery } from '../queries/get-charge-regularization.query';

describe('GetChargeRegularizationController', () => {
  let controller: GetChargeRegularizationController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetChargeRegularizationController(queryBus as never);
  });

  it('should dispatch query with fiscal year and return wrapped data', async () => {
    const regularization = {
      id: 'e1-2025',
      fiscalYear: 2025,
      totalBalanceCents: 5000,
    };
    queryBus.execute.mockResolvedValue(regularization);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock
      .calls[0]?.[0] as GetChargeRegularizationQuery;
    expect(query).toBeInstanceOf(GetChargeRegularizationQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(query.fiscalYear).toBe(2025);
    expect(result).toEqual({ data: regularization });
  });

  it('should dispatch query without fiscal year when not provided', async () => {
    const allRegularizations = [
      { id: 'e1-2025', fiscalYear: 2025 },
      { id: 'e1-2024', fiscalYear: 2024 },
    ];
    queryBus.execute.mockResolvedValue(allRegularizations);

    const result = await controller.handle('entity-1', undefined, 'user-1');

    const query = queryBus.execute.mock
      .calls[0]?.[0] as GetChargeRegularizationQuery;
    expect(query.fiscalYear).toBeUndefined();
    expect(result).toEqual({ data: allRegularizations });
  });

  it('should return null for invalid fiscalYear param', async () => {
    const result = await controller.handle('entity-1', 'abc', 'user-1');

    expect(result).toEqual({ data: null });
    expect(queryBus.execute).not.toHaveBeenCalled();
  });
});
