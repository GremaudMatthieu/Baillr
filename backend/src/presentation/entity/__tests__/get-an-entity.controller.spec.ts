import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetAnEntityController } from '../controllers/get-an-entity.controller';
import { GetAnEntityQuery } from '../queries/get-an-entity.query';

describe('GetAnEntityController', () => {
  let controller: GetAnEntityController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetAnEntityController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetAnEntityController>(GetAnEntityController);
  });

  it('should dispatch GetAnEntityQuery and return wrapped data', async () => {
    const entity = { id: 'e1', name: 'SCI One', type: 'sci' };
    queryBus.execute.mockResolvedValue(entity);

    const result = await controller.handle('e1', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetAnEntityQuery;
    expect(query).toBeInstanceOf(GetAnEntityQuery);
    expect(query.id).toBe('e1');
    expect(query.userId).toBe('user_clerk_123');
    expect(result).toEqual({ data: entity });
  });

  it('should propagate NotFoundException from query handler', async () => {
    queryBus.execute.mockRejectedValue(new NotFoundException('Entity not found'));

    await expect(controller.handle('nonexistent', 'user_clerk_123')).rejects.toThrow(
      NotFoundException,
    );
  });
});
