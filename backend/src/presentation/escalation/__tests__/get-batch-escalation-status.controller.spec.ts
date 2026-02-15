import { GetBatchEscalationStatusController } from '../controllers/get-batch-escalation-status.controller';
import { GetBatchEscalationStatusQuery } from '../queries/get-batch-escalation-status.query';

describe('GetBatchEscalationStatusController', () => {
  let controller: GetBatchEscalationStatusController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetBatchEscalationStatusController(queryBus as never);
  });

  it('should return empty array when no rentCallIds provided', async () => {
    const result = await controller.handle('entity-1', '', 'user-1');

    expect(result).toEqual([]);
    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('should parse comma-separated ids and dispatch query', async () => {
    const statuses = [
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
    ];
    queryBus.execute.mockResolvedValue(statuses);

    const result = await controller.handle('entity-1', 'rc-1,rc-2', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetBatchEscalationStatusQuery;
    expect(query).toBeInstanceOf(GetBatchEscalationStatusQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.rentCallIds).toEqual(['rc-1', 'rc-2']);
    expect(query.userId).toBe('user-1');
    expect(result).toEqual(statuses);
  });
});
