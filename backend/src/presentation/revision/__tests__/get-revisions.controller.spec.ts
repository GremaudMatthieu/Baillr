import { GetRevisionsController } from '../controllers/get-revisions.controller';
import { GetRevisionsQuery } from '../queries/get-revisions.query';

describe('GetRevisionsController', () => {
  let controller: GetRevisionsController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  const revisions = [
    {
      id: 'rev-1',
      leaseId: 'lease-1',
      entityId: 'entity-1',
      tenantName: 'Dupont Jean',
      currentRentCents: 75000,
      newRentCents: 77097,
      status: 'pending',
    },
  ];

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetRevisionsController(queryBus as never);
  });

  it('should dispatch GetRevisionsQuery and return wrapped data', async () => {
    queryBus.execute.mockResolvedValue(revisions);

    const result = await controller.handle('entity-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetRevisionsQuery;
    expect(query).toBeInstanceOf(GetRevisionsQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual({ data: revisions });
  });
});
