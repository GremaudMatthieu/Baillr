jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { AnnualChargesAggregate } from '../annual-charges.aggregate';
import { RecordAnnualChargesHandler } from '../commands/record-annual-charges.handler';
import { RecordAnnualChargesCommand } from '../commands/record-annual-charges.command';

describe('RecordAnnualChargesHandler', () => {
  let handler: RecordAnnualChargesHandler;
  let mockRepository: { save: jest.Mock; load: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn(),
    };
    handler = new RecordAnnualChargesHandler(mockRepository as never);
  });

  it('should load aggregate by id, call record, then save', async () => {
    const aggregate = new AnnualChargesAggregate('entity1-2025');
    mockRepository.load.mockResolvedValue(aggregate);

    const charges = [
      { category: 'water', label: 'Eau', amountCents: 45000 },
      { category: 'electricity', label: 'Électricité', amountCents: 30000 },
    ];
    const command = new RecordAnnualChargesCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      charges,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    expect(savedAggregate.id).toBe('entity1-2025');

    const events = savedAggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data.entityId).toBe('entity-1');
    expect(events[0].data.userId).toBe('user-1');
    expect(events[0].data.fiscalYear).toBe(2025);
    expect(events[0].data.charges).toHaveLength(2);
    expect(events[0].data.totalAmountCents).toBe(75000);
  });

  it('should propagate VO validation errors', async () => {
    const aggregate = new AnnualChargesAggregate('test-id');
    mockRepository.load.mockResolvedValue(aggregate);

    const charges = [
      { category: 'invalid', label: 'Bad', amountCents: 100 },
    ];
    const command = new RecordAnnualChargesCommand(
      'test-id',
      'entity-1',
      'user-1',
      2025,
      charges,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'Invalid charge category',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should skip event emission when data is identical (no-op guard)', async () => {
    const aggregate = new AnnualChargesAggregate('entity1-2025');
    const charges = [
      { category: 'water', label: 'Eau', amountCents: 45000 },
    ];
    // Simulate first recording (rehydrated state)
    aggregate.record('entity-1', 'user-1', 2025, charges);
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new RecordAnnualChargesCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      charges,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    // No new events should be emitted (no-op guard)
    expect(savedAggregate.getUncommittedEvents()).toHaveLength(0);
  });
});
