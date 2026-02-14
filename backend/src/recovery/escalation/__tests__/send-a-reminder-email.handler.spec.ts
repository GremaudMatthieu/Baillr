jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { SendAReminderEmailHandler } from '../commands/send-a-reminder-email.handler';
import { SendAReminderEmailCommand } from '../commands/send-a-reminder-email.command';
import { EscalationAggregate } from '../escalation.aggregate';

describe('SendAReminderEmailHandler', () => {
  let handler: SendAReminderEmailHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new SendAReminderEmailHandler(mockRepository as never);
  });

  it('should initiate escalation and send reminder email', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new SendAReminderEmailCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
      'tenant@example.com',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('rent-call-123');
    expect(mockRepository.save).toHaveBeenCalledWith(aggregate);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(2); // EscalationInitiated + ReminderEmailSent
  });

  it('should be idempotent when tier 1 already completed', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.sendReminderEmail('tenant@example.com', new Date('2026-02-10'));
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new SendAReminderEmailCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
      'tenant@example.com',
    );

    await handler.execute(command);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(0); // no new events (both initiate + send are no-ops)
  });
});
