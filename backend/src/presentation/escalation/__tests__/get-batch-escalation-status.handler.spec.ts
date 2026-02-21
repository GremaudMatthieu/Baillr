import { UnauthorizedException } from '@nestjs/common';
import { GetBatchEscalationStatusHandler } from '../queries/get-batch-escalation-status.handler';
import { GetBatchEscalationStatusQuery } from '../queries/get-batch-escalation-status.query';

describe('GetBatchEscalationStatusHandler', () => {
  let handler: GetBatchEscalationStatusHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockEscalationFinder: { findAllByRentCallIds: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockEscalationFinder = { findAllByRentCallIds: jest.fn() };
    handler = new GetBatchEscalationStatusHandler(
      mockEntityFinder as never,
      mockEscalationFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetBatchEscalationStatusQuery('entity-1', ['rc-1'], 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return empty array when rentCallIds is empty', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    const result = await handler.execute(
      new GetBatchEscalationStatusQuery('entity-1', [], 'user-1'),
    );

    expect(result).toEqual([]);
  });

  it('should return null-state for rent calls with no escalation', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockEscalationFinder.findAllByRentCallIds.mockResolvedValue([]);

    const result = await handler.execute(
      new GetBatchEscalationStatusQuery('entity-1', ['rc-1', 'rc-2'], 'user-1'),
    );

    expect(result).toEqual([
      {
        rentCallId: 'rc-1',
        tier1SentAt: null,
        tier1RecipientEmail: null,
        tier2SentAt: null,
        tier3SentAt: null,
        registeredMailTrackingId: null,
        registeredMailProvider: null,
        registeredMailCostCents: null,
        registeredMailDispatchedAt: null,
        registeredMailStatus: null,
        registeredMailProofUrl: null,
      },
      {
        rentCallId: 'rc-2',
        tier1SentAt: null,
        tier1RecipientEmail: null,
        tier2SentAt: null,
        tier3SentAt: null,
        registeredMailTrackingId: null,
        registeredMailProvider: null,
        registeredMailCostCents: null,
        registeredMailDispatchedAt: null,
        registeredMailStatus: null,
        registeredMailProofUrl: null,
      },
    ]);
  });

  it('should return escalation status for matching rent calls', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockEscalationFinder.findAllByRentCallIds.mockResolvedValue([
      {
        rentCallId: 'rc-1',
        tier1SentAt: new Date('2026-02-10T10:00:00.000Z'),
        tier1RecipientEmail: 'tenant@test.com',
        tier2SentAt: null,
        tier3SentAt: null,
        registeredMailTrackingId: null,
        registeredMailProvider: null,
        registeredMailCostCents: null,
        registeredMailDispatchedAt: null,
        registeredMailStatus: null,
        registeredMailProofUrl: null,
      },
    ]);

    const result = await handler.execute(
      new GetBatchEscalationStatusQuery('entity-1', ['rc-1', 'rc-2'], 'user-1'),
    );

    expect(result).toEqual([
      {
        rentCallId: 'rc-1',
        tier1SentAt: '2026-02-10T10:00:00.000Z',
        tier1RecipientEmail: 'tenant@test.com',
        tier2SentAt: null,
        tier3SentAt: null,
        registeredMailTrackingId: null,
        registeredMailProvider: null,
        registeredMailCostCents: null,
        registeredMailDispatchedAt: null,
        registeredMailStatus: null,
        registeredMailProofUrl: null,
      },
      {
        rentCallId: 'rc-2',
        tier1SentAt: null,
        tier1RecipientEmail: null,
        tier2SentAt: null,
        tier3SentAt: null,
        registeredMailTrackingId: null,
        registeredMailProvider: null,
        registeredMailCostCents: null,
        registeredMailDispatchedAt: null,
        registeredMailStatus: null,
        registeredMailProofUrl: null,
      },
    ]);
  });
});
