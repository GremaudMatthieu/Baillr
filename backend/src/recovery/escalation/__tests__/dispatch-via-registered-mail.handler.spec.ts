jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { DispatchViaRegisteredMailHandler } from '../commands/dispatch-via-registered-mail.handler';
import { DispatchViaRegisteredMailCommand } from '../commands/dispatch-via-registered-mail.command';
import { EscalationAggregate } from '../escalation.aggregate';

describe('DispatchViaRegisteredMailHandler', () => {
  let handler: DispatchViaRegisteredMailHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new DispatchViaRegisteredMailHandler(mockRepository as never);
  });

  it('should dispatch registered mail after formal notice', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.generateFormalNotice(new Date('2026-02-14'));
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new DispatchViaRegisteredMailCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
      'LRE-2026-001',
      'ar24',
      479,
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledWith(aggregate);
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
  });

  it('should create new aggregate if stream not found', async () => {
    const streamNotFound = new Error('stream-not-found');
    (streamNotFound as Error & { type: string }).type = 'stream-not-found';
    mockRepository.load.mockRejectedValue(streamNotFound);

    const command = new DispatchViaRegisteredMailCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
      'LRE-2026-001',
      'ar24',
      479,
    );

    // Should throw because formal notice not generated on fresh aggregate
    await expect(handler.execute(command)).rejects.toThrow(
      'Formal notice must be generated before dispatching via registered mail',
    );
  });

  it('should be idempotent when already dispatched', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.generateFormalNotice(new Date('2026-02-14'));
    aggregate.dispatchViaRegisteredMail('LRE-2026-001', 'ar24', 479);
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new DispatchViaRegisteredMailCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
      'LRE-2026-002',
      'ar24',
      479,
    );

    await handler.execute(command);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(0);
  });
});
