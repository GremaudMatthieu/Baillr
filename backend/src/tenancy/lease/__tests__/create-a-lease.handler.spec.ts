// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

import { CreateALeaseHandler } from '../commands/create-a-lease.handler';
import { CreateALeaseCommand } from '../commands/create-a-lease.command';
import { LeaseAggregate } from '../lease.aggregate';

describe('CreateALeaseHandler', () => {
  let handler: CreateALeaseHandler;
  let mockRepository: { save: jest.Mock<Promise<void>, [LeaseAggregate]> };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [LeaseAggregate]>().mockResolvedValue(undefined),
    };
    handler = new CreateALeaseHandler(mockRepository as never);
  });

  it('should create a new lease and save it', async () => {
    const command = new CreateALeaseCommand(
      'lease-123',
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

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    expect(savedAggregate).toBeInstanceOf(LeaseAggregate);

    const events = savedAggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect((events[0] as { data: Record<string, unknown> }).data).toMatchObject({
      id: 'lease-123',
      entityId: 'entity-1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      rentAmountCents: 63000,
      securityDepositCents: 63000,
      monthlyDueDate: 5,
      revisionIndexType: 'IRL',
    });
  });

  it('should propagate domain errors from aggregate', async () => {
    const command = new CreateALeaseCommand(
      'lease-123',
      'user_abc123',
      'entity-1',
      'tenant-1',
      'unit-1',
      '2026-03-01T00:00:00.000Z',
      0, // Invalid: zero rent
      63000,
      5,
      'IRL',
    );

    await expect(handler.execute(command)).rejects.toThrow('Rent amount must be positive');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
