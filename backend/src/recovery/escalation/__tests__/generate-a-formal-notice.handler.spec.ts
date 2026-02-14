jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { GenerateAFormalNoticeHandler } from '../commands/generate-a-formal-notice.handler';
import { GenerateAFormalNoticeCommand } from '../commands/generate-a-formal-notice.command';
import { EscalationAggregate } from '../escalation.aggregate';

describe('GenerateAFormalNoticeHandler', () => {
  let handler: GenerateAFormalNoticeHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new GenerateAFormalNoticeHandler(mockRepository as never);
  });

  it('should initiate escalation and generate formal notice', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new GenerateAFormalNoticeCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('rent-call-123');
    expect(mockRepository.save).toHaveBeenCalledWith(aggregate);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(2); // EscalationInitiated + FormalNoticeGenerated
  });

  it('should only generate formal notice if already initiated', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new GenerateAFormalNoticeCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
    );

    await handler.execute(command);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1); // Only FormalNoticeGenerated
  });

  it('should be idempotent when tier 2 already completed', async () => {
    const aggregate = new EscalationAggregate('rent-call-123');
    aggregate.initiate('rent-call-123', 'entity-456', 'tenant-789');
    aggregate.generateFormalNotice(new Date('2026-02-10'));
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new GenerateAFormalNoticeCommand(
      'rent-call-123',
      'entity-456',
      'tenant-789',
    );

    await handler.execute(command);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(0);
  });
});
