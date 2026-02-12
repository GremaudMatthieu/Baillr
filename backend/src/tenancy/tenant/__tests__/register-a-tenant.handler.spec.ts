import { RegisterATenantHandler } from '../commands/register-a-tenant.handler';
import { RegisterATenantCommand } from '../commands/register-a-tenant.command';
import { TenantAggregate } from '../tenant.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('RegisterATenantHandler', () => {
  let handler: RegisterATenantHandler;
  let mockRepository: { save: jest.Mock<Promise<void>, [TenantAggregate]> };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [TenantAggregate]>().mockResolvedValue(undefined),
    };
    handler = new RegisterATenantHandler(mockRepository as never);
  });

  it('should create a new aggregate, call create, and save', async () => {
    const command = new RegisterATenantCommand(
      'tenant-id',
      'user_clerk_123',
      'entity-id',
      'individual',
      'Jean',
      'Dupont',
      null,
      null,
      'jean.dupont@example.com',
      '0612345678',
      { street: '15 rue de la Paix', postalCode: '75002', city: 'Paris', complement: null },
      null,
      null,
      null,
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate).toBeInstanceOf(TenantAggregate);
    expect(savedAggregate?.id).toBe('tenant-id');
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should pass all command fields to aggregate.create', async () => {
    const command = new RegisterATenantCommand(
      'tenant-id-2',
      'user_clerk_456',
      'entity-id-2',
      'company',
      'Marie',
      'Lefevre',
      'SCI Les Oliviers',
      '12345678901234',
      'contact@sci-oliviers.com',
      null,
      { street: null, postalCode: null, city: null, complement: null },
      null,
      null,
      null,
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({
      id: 'tenant-id-2',
      userId: 'user_clerk_456',
      entityId: 'entity-id-2',
      type: 'company',
      firstName: 'Marie',
      lastName: 'Lefevre',
      companyName: 'SCI Les Oliviers',
      siret: '12345678901234',
      email: 'contact@sci-oliviers.com',
      phoneNumber: null,
    });
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const command = new RegisterATenantCommand(
      'tenant-id',
      'user_clerk_123',
      'entity-id',
      'individual',
      '', // Empty first name should throw
      'Dupont',
      null,
      null,
      'jean@example.com',
      null,
      { street: null, postalCode: null, city: null, complement: null },
      null,
      null,
      null,
    );

    await expect(handler.execute(command)).rejects.toThrow('First name is required');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
