import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetTenantsController } from '../controllers/get-tenants.controller';
import { GetTenantsQuery } from '../queries/get-tenants.query';

describe('GetTenantsController', () => {
  let controller: GetTenantsController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetTenantsController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetTenantsController>(GetTenantsController);
  });

  it('should dispatch GetTenantsQuery with correct entityId and userId', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetTenantsQuery;
    expect(query).toBeInstanceOf(GetTenantsQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return wrapped data with tenants', async () => {
    const tenants = [
      { id: 't1', firstName: 'Jean', lastName: 'Dupont', entityId: 'e1' },
      { id: 't2', firstName: 'Marie', lastName: 'Martin', entityId: 'e1' },
    ];
    queryBus.execute.mockResolvedValue(tenants);

    const result = await controller.handle('entity-1', 'user_clerk_123');

    expect(result).toEqual({ data: tenants });
  });

  it('should return empty array when no tenants', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await controller.handle('entity-1', 'user_clerk_new');

    expect(result).toEqual({ data: [] });
  });

  it('should propagate userId to ensure user-scoped filtering', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', 'user_clerk_other');

    const query = queryBus.execute.mock.calls[0]?.[0] as GetTenantsQuery;
    expect(query.userId).toBe('user_clerk_other');
    expect(query.entityId).toBe('entity-1');
  });
});
