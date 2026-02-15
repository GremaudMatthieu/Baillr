import { GetRentCallPaymentsController } from '../controllers/get-rent-call-payments.controller';
import { GetRentCallPaymentsQuery } from '../queries/get-rent-call-payments.query';

describe('GetRentCallPaymentsController', () => {
  let controller: GetRentCallPaymentsController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetRentCallPaymentsController(queryBus as never);
  });

  it('should dispatch GetRentCallPaymentsQuery and return result', async () => {
    const paymentsData = { data: [{ id: 'p-1', amountCents: 50000 }] };
    queryBus.execute.mockResolvedValue(paymentsData);

    const result = await controller.handle('entity-1', 'rc-1', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetRentCallPaymentsQuery;
    expect(query).toBeInstanceOf(GetRentCallPaymentsQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.rentCallId).toBe('rc-1');
    expect(query.userId).toBe('user-1');
    expect(result).toEqual(paymentsData);
  });
});
