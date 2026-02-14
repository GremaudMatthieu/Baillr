jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { RecordAnInseeIndexHandler } from '../commands/record-an-insee-index.handler';
import { RecordAnInseeIndexCommand } from '../commands/record-an-insee-index.command';

describe('RecordAnInseeIndexHandler', () => {
  let handler: RecordAnInseeIndexHandler;
  let mockRepository: { save: jest.Mock };

  beforeEach(() => {
    mockRepository = { save: jest.fn().mockResolvedValue(undefined) };
    handler = new RecordAnInseeIndexHandler(mockRepository as never);
  });

  it('should create aggregate with command id and call record then save', async () => {
    const command = new RecordAnInseeIndexCommand(
      'test-id',
      'IRL',
      'Q1',
      2026,
      142.06,
      'entity-1',
      'user-1',
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    expect(savedAggregate.id).toBe('test-id');

    const events = savedAggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data.type).toBe('IRL');
    expect(events[0].data.quarter).toBe('Q1');
    expect(events[0].data.year).toBe(2026);
    expect(events[0].data.value).toBe(142.06);
    expect(events[0].data.entityId).toBe('entity-1');
    expect(events[0].data.userId).toBe('user-1');
  });

  it('should propagate VO validation errors', async () => {
    const command = new RecordAnInseeIndexCommand(
      'test-id',
      'INVALID',
      'Q1',
      2026,
      142.06,
      'entity-1',
      'user-1',
    );

    await expect(handler.execute(command)).rejects.toThrow('Invalid index type');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
