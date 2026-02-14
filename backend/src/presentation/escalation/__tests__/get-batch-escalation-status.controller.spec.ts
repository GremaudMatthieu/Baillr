import { GetBatchEscalationStatusController } from '../controllers/get-batch-escalation-status.controller';

describe('GetBatchEscalationStatusController', () => {
  let controller: GetBatchEscalationStatusController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockEscalationFinder: { findAllByRentCallIds: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockEscalationFinder = { findAllByRentCallIds: jest.fn() };
    controller = new GetBatchEscalationStatusController(
      mockEntityFinder as never,
      mockEscalationFinder as never,
    );
  });

  it('should return null-state for rent calls with no escalation', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockEscalationFinder.findAllByRentCallIds.mockResolvedValue([]);

    const result = await controller.handle('entity-1', 'rc-1,rc-2', 'user-1');

    expect(result).toEqual([
      {
        rentCallId: 'rc-1',
        tier1SentAt: null,
        tier1RecipientEmail: null,
        tier2SentAt: null,
        tier3SentAt: null,
      },
      {
        rentCallId: 'rc-2',
        tier1SentAt: null,
        tier1RecipientEmail: null,
        tier2SentAt: null,
        tier3SentAt: null,
      },
    ]);
    expect(mockEscalationFinder.findAllByRentCallIds).toHaveBeenCalledWith(
      ['rc-1', 'rc-2'],
      'user-1',
    );
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
      },
    ]);

    const result = await controller.handle('entity-1', 'rc-1,rc-2', 'user-1');

    expect(result).toEqual([
      {
        rentCallId: 'rc-1',
        tier1SentAt: '2026-02-10T10:00:00.000Z',
        tier1RecipientEmail: 'tenant@test.com',
        tier2SentAt: null,
        tier3SentAt: null,
      },
      {
        rentCallId: 'rc-2',
        tier1SentAt: null,
        tier1RecipientEmail: null,
        tier2SentAt: null,
        tier3SentAt: null,
      },
    ]);
  });

  it('should return empty array when no rentCallIds provided', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    const result = await controller.handle('entity-1', '', 'user-1');

    expect(result).toEqual([]);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'rc-1', 'user-1')).rejects.toThrow();
  });
});
