import { RevisionApprovedReaction } from '../reactions/revision-approved.reaction';
import { ReviseLeaseRentCommand } from '@tenancy/lease/commands/revise-lease-rent.command';
import type { RevisionApprovedData } from '@indexation/revision/events/revision-approved.event';

describe('RevisionApprovedReaction', () => {
  let reaction: RevisionApprovedReaction;
  let mockCommandBus: { execute: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };

    reaction = new RevisionApprovedReaction(
      {} as never, // KurrentDbService not needed for unit test
      mockCommandBus as never,
    );
  });

  it('should dispatch ReviseLeaseRentCommand with correct data', async () => {
    const eventData: RevisionApprovedData = {
      revisionId: 'rev-1',
      leaseId: 'lease-1',
      entityId: 'entity-1',
      userId: 'user-1',
      newRentCents: 77097,
      previousRentCents: 75000,
      newIndexValue: 142.06,
      newIndexQuarter: 'Q2',
      newIndexYear: 2025,
      approvedAt: '2026-02-14T10:00:00.000Z',
    };

    // Access the private method via type assertion for testing
    await (
      reaction as unknown as { handleRevisionApproved(data: RevisionApprovedData): Promise<void> }
    ).handleRevisionApproved(eventData);

    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      new ReviseLeaseRentCommand('lease-1', 77097, 142.06, 'Q2', 2025, 'rev-1'),
    );
  });

  it('should log error when command dispatch fails', async () => {
    mockCommandBus.execute.mockRejectedValue(new Error('Lease not found'));

    const eventData: RevisionApprovedData = {
      revisionId: 'rev-1',
      leaseId: 'lease-1',
      entityId: 'entity-1',
      userId: 'user-1',
      newRentCents: 77097,
      previousRentCents: 75000,
      newIndexValue: 142.06,
      newIndexQuarter: 'Q2',
      newIndexYear: 2025,
      approvedAt: '2026-02-14T10:00:00.000Z',
    };

    // Should not throw — error is caught and logged
    await expect(
      (
        reaction as unknown as { handleRevisionApproved(data: RevisionApprovedData): Promise<void> }
      ).handleRevisionApproved(eventData),
    ).resolves.not.toThrow();
  });
});
