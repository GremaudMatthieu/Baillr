import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetLeasesController } from '../controllers/get-leases.controller';
import { GetLeasesQuery } from '../queries/get-leases.query';

describe('GetLeasesController', () => {
  let controller: GetLeasesController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetLeasesController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetLeasesController>(GetLeasesController);
  });

  it('should dispatch GetLeasesQuery with correct entityId and userId', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetLeasesQuery;
    expect(query).toBeInstanceOf(GetLeasesQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return wrapped data with leases', async () => {
    const leases = [
      { id: 'l1', entityId: 'e1', tenantId: 't1', unitId: 'u1', rentAmountCents: 63000 },
      { id: 'l2', entityId: 'e1', tenantId: 't2', unitId: 'u2', rentAmountCents: 45000 },
    ];
    queryBus.execute.mockResolvedValue(leases);

    const result = await controller.handle('entity-1', 'user_clerk_123');

    expect(result).toEqual({ data: leases });
  });

  it('should return empty array when no leases', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await controller.handle('entity-1', 'user_clerk_new');

    expect(result).toEqual({ data: [] });
  });

  it('should propagate userId to ensure user-scoped filtering', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', 'user_clerk_other');

    const query = queryBus.execute.mock.calls[0]?.[0] as GetLeasesQuery;
    expect(query.userId).toBe('user_clerk_other');
    expect(query.entityId).toBe('entity-1');
  });
});
