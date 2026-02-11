import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetUnitsController } from '../controllers/get-units.controller';
import { GetUnitsQuery } from '../queries/get-units.query';

describe('GetUnitsController', () => {
  let controller: GetUnitsController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  const mockUnits = [
    { id: 'unit-1', identifier: 'Apt 3B', type: 'apartment' },
    { id: 'unit-2', identifier: 'Parking B1', type: 'parking' },
  ];

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(mockUnits) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetUnitsController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetUnitsController>(GetUnitsController);
  });

  it('should dispatch GetUnitsQuery with correct parameters', async () => {
    await controller.handle('property-id', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetUnitsQuery;
    expect(query).toBeInstanceOf(GetUnitsQuery);
    expect(query.propertyId).toBe('property-id');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return units wrapped in data object', async () => {
    const result = await controller.handle('property-id', 'user_clerk_123');

    expect(result).toEqual({ data: mockUnits });
  });
});
