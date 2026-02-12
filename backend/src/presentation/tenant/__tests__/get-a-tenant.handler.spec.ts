import { NotFoundException } from '@nestjs/common';
import { GetATenantHandler } from '../queries/get-a-tenant.handler';
import { GetATenantQuery } from '../queries/get-a-tenant.query';

describe('GetATenantHandler', () => {
  let handler: GetATenantHandler;
  let finder: { findByIdAndUser: jest.Mock };

  const mockTenant = {
    id: 'tenant-1',
    entityId: 'entity-1',
    userId: 'user_clerk_123',
    type: 'individual',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
  };

  beforeEach(() => {
    finder = { findByIdAndUser: jest.fn().mockResolvedValue(mockTenant) };
    handler = new GetATenantHandler(finder as never);
  });

  it('should return tenant when found', async () => {
    const query = new GetATenantQuery('tenant-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(finder.findByIdAndUser).toHaveBeenCalledWith('tenant-1', 'user_clerk_123');
    expect(result).toEqual(mockTenant);
  });

  it('should throw NotFoundException when tenant not found', async () => {
    finder.findByIdAndUser.mockResolvedValue(null);
    const query = new GetATenantQuery('missing-id', 'user_clerk_123');

    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
  });
});
