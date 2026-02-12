import { GetTenantsHandler } from '../queries/get-tenants.handler';
import { GetTenantsQuery } from '../queries/get-tenants.query';

describe('GetTenantsHandler', () => {
  let handler: GetTenantsHandler;
  let finder: { findAllByEntityAndUser: jest.Mock };

  const mockTenants = [
    { id: 't1', firstName: 'Jean', lastName: 'Dupont', entityId: 'e1' },
    { id: 't2', firstName: 'Marie', lastName: 'Martin', entityId: 'e1' },
  ];

  beforeEach(() => {
    finder = { findAllByEntityAndUser: jest.fn().mockResolvedValue(mockTenants) };
    handler = new GetTenantsHandler(finder as never);
  });

  it('should return tenants from finder', async () => {
    const query = new GetTenantsQuery('entity-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(finder.findAllByEntityAndUser).toHaveBeenCalledWith('entity-1', 'user_clerk_123');
    expect(result).toEqual(mockTenants);
  });

  it('should return empty array when no tenants', async () => {
    finder.findAllByEntityAndUser.mockResolvedValue([]);
    const query = new GetTenantsQuery('entity-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(result).toEqual([]);
  });
});
