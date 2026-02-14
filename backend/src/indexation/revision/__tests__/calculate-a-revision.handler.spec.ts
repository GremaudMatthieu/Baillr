import { mockCqrx } from './mock-cqrx';

jest.mock('nestjs-cqrx', () => mockCqrx);

import { CalculateARevisionHandler } from '../commands/calculate-a-revision.handler';
import { CalculateARevisionCommand } from '../commands/calculate-a-revision.command';
import { RentRevisionCalculated } from '../events/rent-revision-calculated.event';

describe('CalculateARevisionHandler', () => {
  let handler: CalculateARevisionHandler;
  let mockSave: jest.Mock;

  beforeEach(() => {
    mockSave = jest.fn().mockResolvedValue(undefined);
    handler = new CalculateARevisionHandler({
      save: mockSave,
    } as never);
  });

  it('should create aggregate, calculate revision, and save', async () => {
    const command = new CalculateARevisionCommand(
      'rev-1',
      'lease-1',
      'entity-1',
      'user-1',
      'tenant-1',
      'unit-1',
      'Dupont Jean',
      'Apt A',
      75000,
      138.19,
      'Q2',
      142.06,
      'Q2',
      2025,
      'IRL',
    );

    await handler.execute(command);

    expect(mockSave).toHaveBeenCalledTimes(1);
    const savedAggregate = mockSave.mock.calls[0][0];
    const events = savedAggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(RentRevisionCalculated);
    expect(events[0].data.leaseId).toBe('lease-1');
    expect(events[0].data.newRentCents).toBe(
      Math.floor((75000 * 142.06) / 138.19),
    );
  });
});
