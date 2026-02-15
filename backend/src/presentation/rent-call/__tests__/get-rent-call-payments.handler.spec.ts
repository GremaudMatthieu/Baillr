import { UnauthorizedException } from '@nestjs/common';
import { GetRentCallPaymentsHandler } from '../queries/get-rent-call-payments.handler';
import { GetRentCallPaymentsQuery } from '../queries/get-rent-call-payments.query';

describe('GetRentCallPaymentsHandler', () => {
  let handler: GetRentCallPaymentsHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockPaymentFinder: { findByRentCallId: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockPaymentFinder = { findByRentCallId: jest.fn() };
    handler = new GetRentCallPaymentsHandler(mockEntityFinder as never, mockPaymentFinder as never);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetRentCallPaymentsQuery('entity-1', 'rc-1', 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return payments for valid rent call', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const payments = [
      { id: 'p-1', amountCents: 50000 },
      { id: 'p-2', amountCents: 35000 },
    ];
    mockPaymentFinder.findByRentCallId.mockResolvedValue(payments);

    const result = await handler.execute(
      new GetRentCallPaymentsQuery('entity-1', 'rc-1', 'user-1'),
    );

    expect(result).toEqual(payments);
    expect(mockPaymentFinder.findByRentCallId).toHaveBeenCalledWith('rc-1', 'entity-1');
  });
});
