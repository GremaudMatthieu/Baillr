// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);
jest.mock('@nestjs/cqrs', () => ({
  CommandHandler: () => () => {},
  ICommandHandler: class {},
}));

import { GenerateRentCallsForMonthHandler } from '../commands/generate-rent-calls-for-month.handler';
import { GenerateRentCallsForMonthCommand } from '../commands/generate-rent-calls-for-month.command';
import { RentCallAggregate } from '../rent-call.aggregate';

describe('GenerateRentCallsForMonthHandler', () => {
  let handler: GenerateRentCallsForMonthHandler;
  let mockRepository: { save: jest.Mock };

  beforeEach(() => {
    mockRepository = { save: jest.fn() };
    handler = new GenerateRentCallsForMonthHandler(mockRepository as any);
  });

  const makeItem = (overrides: Partial<{ id: string; leaseId: string; totalAmountCents: number }> = {}) => ({
    id: overrides.id ?? 'rc-1',
    leaseId: overrides.leaseId ?? 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    rentAmountCents: 80000,
    billingLines: [],
    totalAmountCents: overrides.totalAmountCents ?? 80000,
    isProRata: false,
    occupiedDays: 31,
    totalDaysInMonth: 31,
  });

  it('should create and save a rent call aggregate for each item via Promise.allSettled', async () => {
    const command = new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', [
      makeItem({ id: 'rc-1', leaseId: 'lease-1', totalAmountCents: 80000 }),
      makeItem({ id: 'rc-2', leaseId: 'lease-2', totalAmountCents: 63000 }),
    ]);

    const result = await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(2);
    expect(mockRepository.save.mock.calls[0][0]).toBeInstanceOf(RentCallAggregate);
    expect(mockRepository.save.mock.calls[1][0]).toBeInstanceOf(RentCallAggregate);
    expect(result).toEqual({
      generated: 2,
      totalAmountCents: 143000,
      exceptions: [],
    });
  });

  it('should handle empty rent call data', async () => {
    const command = new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', []);

    const result = await handler.execute(command);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual({ generated: 0, totalAmountCents: 0, exceptions: [] });
  });

  it('should capture per-lease exceptions without failing the batch', async () => {
    mockRepository.save
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Aggregate conflict'));

    const command = new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', [
      makeItem({ id: 'rc-1', leaseId: 'lease-1', totalAmountCents: 80000 }),
      makeItem({ id: 'rc-2', leaseId: 'lease-2', totalAmountCents: 63000 }),
    ]);

    const result = await handler.execute(command);

    expect(result.generated).toBe(1);
    expect(result.totalAmountCents).toBe(80000);
    expect(result.exceptions).toEqual(['Aggregate conflict']);
  });

  it('should capture all exceptions when all saves fail', async () => {
    mockRepository.save.mockRejectedValue(new Error('DB down'));

    const command = new GenerateRentCallsForMonthCommand('entity-1', 'user_123', '2026-03', [
      makeItem({ id: 'rc-1' }),
      makeItem({ id: 'rc-2' }),
    ]);

    const result = await handler.execute(command);

    expect(result.generated).toBe(0);
    expect(result.totalAmountCents).toBe(0);
    expect(result.exceptions).toEqual(['DB down', 'DB down']);
  });
});
