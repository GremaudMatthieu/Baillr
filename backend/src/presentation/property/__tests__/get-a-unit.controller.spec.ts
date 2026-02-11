import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetAUnitController } from '../controllers/get-a-unit.controller';
import { GetAUnitQuery } from '../queries/get-a-unit.query';

describe('GetAUnitController', () => {
  let controller: GetAUnitController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  const mockUnit = {
    id: 'unit-1',
    propertyId: 'property-1',
    userId: 'user_clerk_123',
    identifier: 'Apt 3B',
    type: 'apartment',
    floor: 3,
    surfaceArea: 65.5,
    billableOptions: [{ label: 'Entretien chaudière', amountCents: 1500 }],
  };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(mockUnit) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetAUnitController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetAUnitController>(GetAUnitController);
  });

  it('should dispatch GetAUnitQuery with correct parameters', async () => {
    await controller.handle('unit-1', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetAUnitQuery;
    expect(query).toBeInstanceOf(GetAUnitQuery);
    expect(query.id).toBe('unit-1');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return unit wrapped in data object', async () => {
    const result = await controller.handle('unit-1', 'user_clerk_123');

    expect(result).toEqual({ data: mockUnit });
  });
});
