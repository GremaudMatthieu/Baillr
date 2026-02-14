import { mockCqrx } from '../../../indexation/revision/__tests__/mock-cqrx';

jest.mock('nestjs-cqrx', () => mockCqrx);

import { ReviseLeaseRentHandler } from '../commands/revise-lease-rent.handler';
import { ReviseLeaseRentCommand } from '../commands/revise-lease-rent.command';
import { LeaseAggregate } from '../lease.aggregate';

function createExistingLeaseAggregate(id: string): LeaseAggregate {
  const aggregate = new LeaseAggregate(id);
  aggregate.create(
    'user_abc123',
    'entity-1',
    'tenant-1',
    'unit-1',
    '2026-03-01T00:00:00.000Z',
    75000,
    75000,
    5,
    'IRL',
  );
  aggregate.commit();
  return aggregate;
}

describe('ReviseLeaseRentHandler', () => {
  let handler: ReviseLeaseRentHandler;
  let mockLoad: jest.Mock;
  let mockSave: jest.Mock;

  beforeEach(() => {
    mockLoad = jest.fn();
    mockSave = jest.fn().mockResolvedValue(undefined);

    handler = new ReviseLeaseRentHandler(
      { load: mockLoad, save: mockSave } as never,
    );
  });

  it('should load lease, revise rent, and save', async () => {
    const lease = createExistingLeaseAggregate('lease-1');
    mockLoad.mockResolvedValue(lease);

    const command = new ReviseLeaseRentCommand(
      'lease-1',
      77097,
      142.06,
      'Q2',
      2025,
      'rev-1',
    );
    await handler.execute(command);

    expect(mockLoad).toHaveBeenCalledWith('lease-1');
    expect(mockSave).toHaveBeenCalledTimes(1);

    const savedLease = mockSave.mock.calls[0][0] as LeaseAggregate;
    const leaseEvents = savedLease.getUncommittedEvents();
    expect(leaseEvents).toHaveLength(1);
    expect(leaseEvents[0].constructor.name).toBe('LeaseRentRevised');
  });

  it('should pass correct data to lease reviseRent', async () => {
    const lease = createExistingLeaseAggregate('lease-1');
    mockLoad.mockResolvedValue(lease);

    const command = new ReviseLeaseRentCommand(
      'lease-1',
      77097,
      142.06,
      'Q2',
      2025,
      'rev-1',
    );
    await handler.execute(command);

    const savedLease = mockSave.mock.calls[0][0] as LeaseAggregate;
    const leaseEvent = savedLease.getUncommittedEvents()[0];
    const eventData = (leaseEvent as { data: Record<string, unknown> }).data;
    expect(eventData.newRentCents).toBe(77097);
    expect(eventData.newBaseIndexValue).toBe(142.06);
    expect(eventData.newReferenceQuarter).toBe('Q2');
    expect(eventData.newReferenceYear).toBe(2025);
    expect(eventData.revisionId).toBe('rev-1');
  });
});
