import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetATenantController } from '../controllers/get-a-tenant.controller';
import { GetATenantQuery } from '../queries/get-a-tenant.query';

describe('GetATenantController', () => {
  let controller: GetATenantController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetATenantController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetATenantController>(GetATenantController);
  });

  it('should dispatch GetATenantQuery with correct id and userId', async () => {
    const mockTenant = { id: 'tenant-1', firstName: 'Jean', lastName: 'Dupont' };
    queryBus.execute.mockResolvedValue(mockTenant);

    await controller.handle('tenant-1', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetATenantQuery;
    expect(query).toBeInstanceOf(GetATenantQuery);
    expect(query.id).toBe('tenant-1');
    expect(query.userId).toBe('user_clerk_123');
  });

  it('should return wrapped data with tenant', async () => {
    const mockTenant = { id: 'tenant-1', firstName: 'Jean', lastName: 'Dupont' };
    queryBus.execute.mockResolvedValue(mockTenant);

    const result = await controller.handle('tenant-1', 'user_clerk_123');

    expect(result).toEqual({ data: mockTenant });
  });

  it('should propagate exceptions from queryBus', async () => {
    queryBus.execute.mockRejectedValue(new Error('Not found'));

    await expect(controller.handle('missing-id', 'user_clerk_123')).rejects.toThrow('Not found');
  });
});
