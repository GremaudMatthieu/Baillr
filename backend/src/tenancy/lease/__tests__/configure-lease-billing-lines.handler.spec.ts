import { ConfigureLeaseBillingLinesHandler } from '../commands/configure-lease-billing-lines.handler';
import { ConfigureLeaseBillingLinesCommand } from '../commands/configure-lease-billing-lines.command';
import { LeaseAggregate } from '../lease.aggregate';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('ConfigureLeaseBillingLinesHandler', () => {
  let handler: ConfigureLeaseBillingLinesHandler;
  let mockRepository: {
    load: jest.Mock<Promise<LeaseAggregate>, [string]>;
    save: jest.Mock<Promise<void>, [LeaseAggregate]>;
  };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn<Promise<LeaseAggregate>, [string]>(),
      save: jest.fn<Promise<void>, [LeaseAggregate]>().mockResolvedValue(undefined),
    };
    handler = new ConfigureLeaseBillingLinesHandler(
      mockRepository as unknown as ConstructorParameters<
        typeof ConfigureLeaseBillingLinesHandler
      >[0],
    );
  });

  function createExistingLease(id: string): LeaseAggregate {
    const aggregate = new LeaseAggregate(id);
    aggregate.create(
      'user_abc123',
      'entity-1',
      'tenant-1',
      'unit-1',
      '2026-03-01T00:00:00.000Z',
      63000,
      63000,
      5,
      'IRL',
    );
    aggregate.commit();
    return aggregate;
  }

  it('should configure billing lines on existing lease', async () => {
    const lease = createExistingLease('lease-1');
    mockRepository.load.mockResolvedValue(lease);

    const command = new ConfigureLeaseBillingLinesCommand('lease-1', [
      { chargeCategoryId: 'cat-water', amountCents: 5000 },
      { chargeCategoryId: 'cat-elec', amountCents: 3000 },
    ]);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('lease-1');
    expect(mockRepository.save).toHaveBeenCalledWith(lease);

    const events = lease.getUncommittedEvents();
    expect(events).toHaveLength(1);
  });

  it('should throw when aggregate not found', async () => {
    mockRepository.load.mockRejectedValue(new Error('Aggregate not found'));

    const command = new ConfigureLeaseBillingLinesCommand('nonexistent', [
      { chargeCategoryId: 'cat-1', amountCents: 5000 },
    ]);

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
  });

  it('should configure empty billing lines', async () => {
    const lease = createExistingLease('lease-1');
    mockRepository.load.mockResolvedValue(lease);

    const command = new ConfigureLeaseBillingLinesCommand('lease-1', []);

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledWith(lease);
  });
});
