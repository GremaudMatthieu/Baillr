import { UnauthorizedException } from '@nestjs/common';
import { GetEscalationStatusHandler } from '../queries/get-escalation-status.handler';
import { GetEscalationStatusQuery } from '../queries/get-escalation-status.query';

describe('GetEscalationStatusHandler', () => {
  let handler: GetEscalationStatusHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockEscalationFinder: { findByRentCallId: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockEscalationFinder = { findByRentCallId: jest.fn() };
    handler = new GetEscalationStatusHandler(
      mockEntityFinder as never,
      mockEscalationFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetEscalationStatusQuery('entity-1', 'rc-1', 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return null-state when no escalation exists', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockEscalationFinder.findByRentCallId.mockResolvedValue(null);

    const result = await handler.execute(
      new GetEscalationStatusQuery('entity-1', 'rc-1', 'user-1'),
    );

    expect(result).toEqual({
      rentCallId: 'rc-1',
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: null,
      tier3SentAt: null,
    });
  });

  it('should return escalation status with ISO dates', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockEscalationFinder.findByRentCallId.mockResolvedValue({
      rentCallId: 'rc-1',
      tier1SentAt: new Date('2026-02-10T10:00:00.000Z'),
      tier1RecipientEmail: 'tenant@test.com',
      tier2SentAt: new Date('2026-02-15T10:00:00.000Z'),
      tier3SentAt: null,
    });

    const result = await handler.execute(
      new GetEscalationStatusQuery('entity-1', 'rc-1', 'user-1'),
    );

    expect(result).toEqual({
      rentCallId: 'rc-1',
      tier1SentAt: '2026-02-10T10:00:00.000Z',
      tier1RecipientEmail: 'tenant@test.com',
      tier2SentAt: '2026-02-15T10:00:00.000Z',
      tier3SentAt: null,
    });
  });
});
