import { UnauthorizedException } from '@nestjs/common';
import { GetRentCallPaymentsController } from '../controllers/get-rent-call-payments.controller';

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

const mockPaymentFinder = {
  findByRentCallId: jest.fn(),
};

describe('GetRentCallPaymentsController', () => {
  let controller: GetRentCallPaymentsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new GetRentCallPaymentsController(
      mockEntityFinder as any,
      mockPaymentFinder as any,
    );
  });

  it('should return payments for a valid rent call', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const payments = [
      { id: 'p-1', amountCents: 50000, payerName: 'DOS SANTOS' },
      { id: 'p-2', amountCents: 35000, payerName: 'DOS SANTOS' },
    ];
    mockPaymentFinder.findByRentCallId.mockResolvedValue(payments);

    const result = await controller.handle('entity-1', 'rc-1', 'user_123');

    expect(result).toEqual({ data: payments });
    expect(mockPaymentFinder.findByRentCallId).toHaveBeenCalledWith('rc-1', 'entity-1');
  });

  it('should throw UnauthorizedException for invalid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'rc-1', 'user_123'))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should return empty array for rent call with no payments', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPaymentFinder.findByRentCallId.mockResolvedValue([]);

    const result = await controller.handle('entity-1', 'rc-1', 'user_123');

    expect(result).toEqual({ data: [] });
  });

  it('should return multiple payments in correct order', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const payments = [
      { id: 'p-2', amountCents: 35000, recordedAt: '2026-02-15T10:00:00Z' },
      { id: 'p-1', amountCents: 50000, recordedAt: '2026-02-10T10:00:00Z' },
    ];
    mockPaymentFinder.findByRentCallId.mockResolvedValue(payments);

    const result = await controller.handle('entity-1', 'rc-1', 'user_123');

    expect(result.data).toHaveLength(2);
  });
});
