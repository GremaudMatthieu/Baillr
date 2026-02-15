import { GetALeaseController } from '../controllers/get-a-lease.controller';
import { GetALeaseQuery } from '../queries/get-a-lease.query';

describe('GetALeaseController', () => {
  let controller: GetALeaseController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetALeaseController(queryBus as never);
  });

  it('should dispatch GetALeaseQuery and return result', async () => {
    const leaseData = {
      data: {
        id: 'lease-1',
        entityId: 'entity-1',
        billingLines: [],
      },
    };
    queryBus.execute.mockResolvedValue(leaseData);

    const result = await controller.handle('lease-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetALeaseQuery;
    expect(query).toBeInstanceOf(GetALeaseQuery);
    expect(query.id).toBe('lease-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual(leaseData);
  });
});
