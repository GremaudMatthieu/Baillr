// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);
jest.mock('@nestjs/cqrs', () => ({
  CommandHandler: () => () => {},
  ICommandHandler: class {},
}));

import { GenerateRentCallsForMonthHandler } from '../commands/generate-rent-calls-for-month.handler';
import { GenerateRentCallsForMonthCommand } from '../commands/generate-rent-calls-for-month.command';
import type { ActiveLeaseData } from '../rent-call-calculation.service';
import { RentCallAggregate } from '../rent-call.aggregate';

describe('GenerateRentCallsForMonthHandler', () => {
  let handler: GenerateRentCallsForMonthHandler;
  let mockRepository: { save: jest.Mock };
  let mockCalculationService: { calculateForMonth: jest.Mock };

  const defaultLease: ActiveLeaseData = {
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    rentAmountCents: 80000,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: null,
    billingLines: [{ label: 'Charges', amountCents: 5000, type: 'provision' }],
  };

  const defaultCalculation = {
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    rentAmountCents: 80000,
    billingLines: [{ label: 'Charges', amountCents: 5000, type: 'provision' }],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: 31,
    totalDaysInMonth: 31,
  };

  beforeEach(() => {
    mockRepository = { save: jest.fn() };
    mockCalculationService = {
      calculateForMonth: jest.fn(() => [defaultCalculation]),
    };
    handler = new GenerateRentCallsForMonthHandler(
      mockCalculationService as any,
      mockRepository as any,
    );
  });

  it('should calculate, create and save rent call aggregates', async () => {
    const result = await handler.execute(
      new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', [defaultLease]),
    );

    expect(mockCalculationService.calculateForMonth).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.save.mock.calls[0][0]).toBeInstanceOf(RentCallAggregate);
    expect(result.generated).toBe(1);
    expect(result.totalAmountCents).toBe(85000);
    expect(result.exceptions).toEqual([]);
  });

  it('should handle multiple calculations', async () => {
    mockCalculationService.calculateForMonth.mockReturnValue([
      defaultCalculation,
      { ...defaultCalculation, leaseId: 'lease-2', totalAmountCents: 60000 },
    ]);

    const result = await handler.execute(
      new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', [
        defaultLease,
        { ...defaultLease, leaseId: 'lease-2' },
      ]),
    );

    expect(mockRepository.save).toHaveBeenCalledTimes(2);
    expect(result.generated).toBe(2);
    expect(result.totalAmountCents).toBe(145000);
  });

  it('should return zero when activeLeases is empty', async () => {
    const result = await handler.execute(
      new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', []),
    );

    expect(result).toEqual({ generated: 0, totalAmountCents: 0, exceptions: [] });
    expect(mockCalculationService.calculateForMonth).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should return zero when calculation yields no results', async () => {
    mockCalculationService.calculateForMonth.mockReturnValue([]);

    const result = await handler.execute(
      new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', [defaultLease]),
    );

    expect(result).toEqual({ generated: 0, totalAmountCents: 0, exceptions: [] });
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should capture per-item exceptions without failing the batch', async () => {
    mockCalculationService.calculateForMonth.mockReturnValue([
      defaultCalculation,
      { ...defaultCalculation, leaseId: 'lease-2' },
    ]);
    mockRepository.save
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Aggregate conflict'));

    const result = await handler.execute(
      new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', [defaultLease]),
    );

    expect(result.generated).toBe(1);
    expect(result.exceptions).toEqual(['Aggregate conflict']);
  });
});
