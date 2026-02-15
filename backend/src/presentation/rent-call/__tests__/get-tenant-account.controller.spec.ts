import { GetTenantAccountController } from '../controllers/get-tenant-account.controller';
import { GetTenantAccountQuery } from '../queries/get-tenant-account.query';

describe('GetTenantAccountController', () => {
  let controller: GetTenantAccountController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetTenantAccountController(queryBus as never);
  });

  it('should dispatch GetTenantAccountQuery and return result', async () => {
    const accountData = { entries: [{ id: 'ae-1' }], balanceCents: -85000 };
    queryBus.execute.mockResolvedValue(accountData);

    const result = await controller.handle('entity-1', 'tenant-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetTenantAccountQuery;
    expect(query).toBeInstanceOf(GetTenantAccountQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.tenantId).toBe('tenant-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual(accountData);
  });
});
