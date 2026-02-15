import { GetEscalationStatusController } from '../controllers/get-escalation-status.controller';
import { GetEscalationStatusQuery } from '../queries/get-escalation-status.query';

describe('GetEscalationStatusController', () => {
  let controller: GetEscalationStatusController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetEscalationStatusController(queryBus as never);
  });

  it('should dispatch GetEscalationStatusQuery and return result', async () => {
    const status = {
      rentCallId: 'rc-1',
      tier1SentAt: '2026-02-10T10:00:00.000Z',
      tier1RecipientEmail: 'tenant@test.com',
      tier2SentAt: null,
      tier3SentAt: null,
    };
    queryBus.execute.mockResolvedValue(status);

    const result = await controller.handle('entity-1', 'rc-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetEscalationStatusQuery;
    expect(query).toBeInstanceOf(GetEscalationStatusQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.rentCallId).toBe('rc-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual(status);
  });
});
