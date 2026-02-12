import { UpdateATenantHandler } from '../commands/update-a-tenant.handler';
import { UpdateATenantCommand } from '../commands/update-a-tenant.command';
import { TenantAggregate } from '../tenant.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

function createExistingTenant(): TenantAggregate {
  const aggregate = new TenantAggregate('tenant-id');
  aggregate.create(
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
  );
  aggregate.commit();
  return aggregate;
}

describe('UpdateATenantHandler', () => {
  let handler: UpdateATenantHandler;
  let mockRepository: {
    load: jest.Mock<Promise<TenantAggregate>, [string]>;
    save: jest.Mock<Promise<void>, [TenantAggregate]>;
  };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn<Promise<TenantAggregate>, [string]>(),
      save: jest.fn<Promise<void>, [TenantAggregate]>().mockResolvedValue(undefined),
    };
    handler = new UpdateATenantHandler(mockRepository as never);
  });

  it('should load aggregate, call update, and save', async () => {
    const existing = createExistingTenant();
    mockRepository.load.mockResolvedValue(existing);

    const command = new UpdateATenantCommand('tenant-id', 'user_clerk_123', 'Pierre');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('tenant-id');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const existing = createExistingTenant();
    mockRepository.load.mockResolvedValue(existing);

    const command = new UpdateATenantCommand('tenant-id', 'user_clerk_123', '');

    await expect(handler.execute(command)).rejects.toThrow('First name is required');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate unauthorized access exception', async () => {
    const existing = createExistingTenant();
    mockRepository.load.mockResolvedValue(existing);

    const command = new UpdateATenantCommand('tenant-id', 'user_wrong_user', 'Pierre');

    await expect(handler.execute(command)).rejects.toThrow(
      'You are not authorized to access this tenant',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
