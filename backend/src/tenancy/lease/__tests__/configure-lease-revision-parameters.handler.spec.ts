import { ConfigureLeaseRevisionParametersHandler } from '../commands/configure-lease-revision-parameters.handler';
import { ConfigureLeaseRevisionParametersCommand } from '../commands/configure-lease-revision-parameters.command';
import { LeaseAggregate } from '../lease.aggregate';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('ConfigureLeaseRevisionParametersHandler', () => {
  let handler: ConfigureLeaseRevisionParametersHandler;
  let mockRepository: {
    load: jest.Mock<Promise<LeaseAggregate>, [string]>;
    save: jest.Mock<Promise<void>, [LeaseAggregate]>;
  };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn<Promise<LeaseAggregate>, [string]>(),
      save: jest.fn<Promise<void>, [LeaseAggregate]>().mockResolvedValue(undefined),
    };
    handler = new ConfigureLeaseRevisionParametersHandler(
      mockRepository as unknown as ConstructorParameters<
        typeof ConfigureLeaseRevisionParametersHandler
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

  it('should configure revision parameters on existing lease', async () => {
    const lease = createExistingLease('lease-1');
    mockRepository.load.mockResolvedValue(lease);

    const command = new ConfigureLeaseRevisionParametersCommand(
      'lease-1',
      15,
      3,
      'Q2',
      2025,
      142.06,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('lease-1');
    expect(mockRepository.save).toHaveBeenCalledWith(lease);

    const events = lease.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual(
      expect.objectContaining({
        revisionDay: 15,
        revisionMonth: 3,
        referenceQuarter: 'Q2',
        referenceYear: 2025,
        baseIndexValue: 142.06,
      }),
    );
  });

  it('should throw when aggregate not found', async () => {
    mockRepository.load.mockRejectedValue(new Error('Aggregate not found'));

    const command = new ConfigureLeaseRevisionParametersCommand(
      'nonexistent',
      15,
      3,
      'Q2',
      2025,
      142.06,
    );

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
  });

  it('should configure revision parameters with null base index', async () => {
    const lease = createExistingLease('lease-1');
    mockRepository.load.mockResolvedValue(lease);

    const command = new ConfigureLeaseRevisionParametersCommand(
      'lease-1',
      1,
      1,
      'Q1',
      2026,
      null,
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledWith(lease);
    const events = lease.getUncommittedEvents();
    expect(events).toHaveLength(1);
  });
});
