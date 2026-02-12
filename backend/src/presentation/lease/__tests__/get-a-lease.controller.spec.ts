import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetALeaseController } from '../controllers/get-a-lease.controller';
import { GetALeaseQuery } from '../queries/get-a-lease.query';

describe('GetALeaseController', () => {
  let controller: GetALeaseController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetALeaseController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetALeaseController>(GetALeaseController);
  });

  it('should dispatch GetALeaseQuery with correct id and userId', async () => {
    const mockLease = { id: 'lease-1', tenantId: 't1', unitId: 'u1', rentAmountCents: 63000 };
    queryBus.execute.mockResolvedValue(mockLease);

    await controller.handle('lease-1', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetALeaseQuery;
    expect(query).toBeInstanceOf(GetALeaseQuery);
    expect(query.id).toBe('lease-1');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return wrapped data with lease', async () => {
    const mockLease = { id: 'lease-1', tenantId: 't1', unitId: 'u1', rentAmountCents: 63000 };
    queryBus.execute.mockResolvedValue(mockLease);

    const result = await controller.handle('lease-1', 'user_clerk_123');

    expect(result).toEqual({ data: mockLease });
  });

  it('should propagate exceptions from queryBus', async () => {
    queryBus.execute.mockRejectedValue(new Error('Not found'));

    await expect(controller.handle('missing-id', 'user_clerk_123')).rejects.toThrow('Not found');
  });
});
