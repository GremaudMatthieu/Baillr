jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { GenerateStakeholderNotificationsHandler } from '../commands/generate-stakeholder-notifications.handler';
import { GenerateStakeholderNotificationsCommand } from '../commands/generate-stakeholder-notifications.command';
import { EscalationAggregate } from '../escalation.aggregate';

describe('GenerateStakeholderNotificationsHandler', () => {
  let handler: GenerateStakeholderNotificationsHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new GenerateStakeholderNotificationsHandler(mockRepository as never);
  });

  it('should initiate escalation and generate stakeholder notifications', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new GenerateStakeholderNotificationsCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('rent-call-123');
    expect(mockRepository.save).toHaveBeenCalledWith(aggregate);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(2); // EscalationInitiated + StakeholderNotificationGenerated
  });

  it('should be idempotent when tier 3 already completed', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.generateStakeholderNotifications(new Date('2026-02-10'));
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new GenerateStakeholderNotificationsCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
    );

    await handler.execute(command);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(0);
  });
});
