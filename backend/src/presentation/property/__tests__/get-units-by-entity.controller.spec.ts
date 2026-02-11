import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { GetUnitsByEntityController } from '../controllers/get-units-by-entity.controller';
import { GetUnitsByEntityQuery } from '../queries/get-units-by-entity.query';
import { EntityFinder } from '../../entity/finders/entity.finder';

describe('GetUnitsByEntityController', () => {
  let controller: GetUnitsByEntityController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };
  let entityFinder: { findByIdAndUserId: jest.Mock };

  const mockUnits = [
    { id: 'unit-1', identifier: 'Apt 3B', type: 'apartment', propertyName: 'Résidence Sapiac' },
    { id: 'unit-2', identifier: 'Parking B1', type: 'parking', propertyName: 'Résidence Sapiac' },
  ];

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(mockUnits) };
    entityFinder = { findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetUnitsByEntityController],
      providers: [
        { provide: QueryBus, useValue: queryBus },
        { provide: EntityFinder, useValue: entityFinder },
      ],
    }).compile();

    controller = module.get<GetUnitsByEntityController>(GetUnitsByEntityController);
  });

  it('should verify entity ownership before querying', async () => {
    await controller.handle('entity-id', 'user_clerk_123');

    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-id', 'user_clerk_123');
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-id', 'user_clerk_123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch GetUnitsByEntityQuery with correct parameters', async () => {
    await controller.handle('entity-id', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetUnitsByEntityQuery;
    expect(query).toBeInstanceOf(GetUnitsByEntityQuery);
    expect(query.entityId).toBe('entity-id');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return units wrapped in data object', async () => {
    const result = await controller.handle('entity-id', 'user_clerk_123');

    expect(result).toEqual({ data: mockUnits });
  });
});
