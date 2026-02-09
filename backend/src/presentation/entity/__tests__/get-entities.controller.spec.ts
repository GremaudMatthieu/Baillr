import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetEntitiesController } from '../controllers/get-entities.controller';
import { GetEntitiesQuery } from '../queries/get-entities.query';

describe('GetEntitiesController', () => {
  let controller: GetEntitiesController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetEntitiesController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetEntitiesController>(GetEntitiesController);
  });

  it('should dispatch GetEntitiesQuery and return wrapped data', async () => {
    const entities = [
      { id: 'e1', name: 'SCI One', type: 'sci' },
      { id: 'e2', name: 'Jean', type: 'nom_propre' },
    ];
    queryBus.execute.mockResolvedValue(entities);

    const result = await controller.handle('user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetEntitiesQuery;
    expect(query).toBeInstanceOf(GetEntitiesQuery);
    expect(query.userId).toBe('user_clerk_123');
    expect(result).toEqual({ data: entities });
  });

  it('should return empty array when no entities', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await controller.handle('user_clerk_new');

    expect(result).toEqual({ data: [] });
  });
});
