import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { GetUnpaidRentCallsController } from '../controllers/get-unpaid-rent-calls.controller';
import { EntityFinder } from '../../entity/finders/entity.finder';
import { GetUnpaidRentCallsQuery } from '../queries/get-unpaid-rent-calls.query';

describe('GetUnpaidRentCallsController', () => {
  let controller: GetUnpaidRentCallsController;
  let queryBus: { execute: jest.Mock };
  let entityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };
    entityFinder = { findByIdAndUserId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetUnpaidRentCallsController],
      providers: [
        { provide: QueryBus, useValue: queryBus },
        { provide: EntityFinder, useValue: entityFinder },
      ],
    }).compile();

    controller = module.get<GetUnpaidRentCallsController>(GetUnpaidRentCallsController);
  });

  it('should return unpaid rent calls when entity exists', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const mockData = [
      { id: 'rc-1', daysLate: 10, tenantLastName: 'Dupont' },
    ];
    queryBus.execute.mockResolvedValue(mockData);

    const result = await controller.handle('entity-1', 'user_123');

    expect(result).toEqual({ data: mockData });
    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user_123');
    const query = queryBus.execute.mock.calls[0]?.[0] as GetUnpaidRentCallsQuery;
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user_123');
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'user_123')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
