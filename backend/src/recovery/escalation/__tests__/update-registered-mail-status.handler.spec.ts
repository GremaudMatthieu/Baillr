jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { UpdateRegisteredMailStatusHandler } from '../commands/update-registered-mail-status.handler';
import { UpdateRegisteredMailStatusCommand } from '../commands/update-registered-mail-status.command';
import { EscalationAggregate } from '../escalation.aggregate';

describe('UpdateRegisteredMailStatusHandler', () => {
  let handler: UpdateRegisteredMailStatusHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new UpdateRegisteredMailStatusHandler(mockRepository as never);
  });

  it('should update registered mail status', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.generateFormalNotice(new Date('2026-02-14'));
    aggregate.dispatchViaRegisteredMail('LRE-2026-001', 'ar24', 479);
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new UpdateRegisteredMailStatusCommand(
      'rent-call-123',
      'AR',
      'https://ar24.fr/proof/123',
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledWith(aggregate);
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
  });

  it('should no-op if no registered mail was dispatched', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new UpdateRegisteredMailStatusCommand(
      'rent-call-123',
      'AR',
      null,
    );

    await handler.execute(command);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(0);
  });
});
