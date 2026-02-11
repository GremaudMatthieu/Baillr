import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetPropertiesController } from '../controllers/get-properties.controller';
import { GetPropertiesQuery } from '../queries/get-properties.query';

describe('GetPropertiesController', () => {
  let controller: GetPropertiesController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPropertiesController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetPropertiesController>(GetPropertiesController);
  });

  it('should dispatch GetPropertiesQuery with correct entityId and userId', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetPropertiesQuery;
    expect(query).toBeInstanceOf(GetPropertiesQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return wrapped data with properties', async () => {
    const properties = [
      { id: 'p1', name: 'Résidence A', entityId: 'e1' },
      { id: 'p2', name: 'Maison B', entityId: 'e1' },
    ];
    queryBus.execute.mockResolvedValue(properties);

    const result = await controller.handle('entity-1', 'user_clerk_123');

    expect(result).toEqual({ data: properties });
  });

  it('should return empty array when no properties', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await controller.handle('entity-1', 'user_clerk_new');

    expect(result).toEqual({ data: [] });
  });

  it('should propagate userId to ensure user-scoped filtering', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', 'user_clerk_other');

    const query = queryBus.execute.mock.calls[0]?.[0] as GetPropertiesQuery;
    expect(query.userId).toBe('user_clerk_other');
    expect(query.entityId).toBe('entity-1');
  });

  it('should propagate different entityId for different entities', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-abc', 'user_clerk_123');

    const query = queryBus.execute.mock.calls[0]?.[0] as GetPropertiesQuery;
    expect(query.entityId).toBe('entity-abc');
  });
});
