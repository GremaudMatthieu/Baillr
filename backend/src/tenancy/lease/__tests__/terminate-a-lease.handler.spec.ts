import { TerminateALeaseHandler } from '../commands/terminate-a-lease.handler';
import { TerminateALeaseCommand } from '../commands/terminate-a-lease.command';
import { LeaseAggregate } from '../lease.aggregate';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('TerminateALeaseHandler', () => {
  let handler: TerminateALeaseHandler;
  let mockRepository: {
    load: jest.Mock<Promise<LeaseAggregate>, [string]>;
    save: jest.Mock<Promise<void>, [LeaseAggregate]>;
  };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn<Promise<LeaseAggregate>, [string]>(),
      save: jest.fn<Promise<void>, [LeaseAggregate]>().mockResolvedValue(undefined),
    };
    handler = new TerminateALeaseHandler(
      mockRepository as unknown as ConstructorParameters<typeof TerminateALeaseHandler>[0],
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

  it('should terminate a lease with valid end date', async () => {
    const lease = createExistingLease('lease-1');
    mockRepository.load.mockResolvedValue(lease);

    const command = new TerminateALeaseCommand('lease-1', '2026-06-15T00:00:00.000Z');
    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('lease-1');
    expect(mockRepository.save).toHaveBeenCalledWith(lease);

    const events = lease.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual(
      expect.objectContaining({
        leaseId: 'lease-1',
        endDate: '2026-06-15T00:00:00.000Z',
      }),
    );
  });

  it('should throw when aggregate not found', async () => {
    mockRepository.load.mockRejectedValue(new Error('Aggregate not found'));

    const command = new TerminateALeaseCommand('nonexistent', '2026-06-15T00:00:00.000Z');
    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
  });
});
