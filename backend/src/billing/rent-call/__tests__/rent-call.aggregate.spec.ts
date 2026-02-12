// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

import { RentCallAggregate } from '../rent-call.aggregate';
import { RentCallGenerated } from '../events/rent-call-generated.event';

describe('RentCallAggregate', () => {
  const baseArgs = {
    entityId: 'entity-1',
    userId: 'user_123',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    month: '2026-03',
    rentAmountCents: 80000,
    billingLines: [{ label: 'Provisions', amountCents: 5000, type: 'provision' }],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: 31,
    totalDaysInMonth: 31,
  };

  it('should generate a rent call and emit RentCallGenerated event', () => {
    const aggregate = new RentCallAggregate('rc-1');
    aggregate.generate(
      baseArgs.entityId,
      baseArgs.userId,
      baseArgs.leaseId,
      baseArgs.tenantId,
      baseArgs.unitId,
      baseArgs.month,
      baseArgs.rentAmountCents,
      baseArgs.billingLines,
      baseArgs.totalAmountCents,
      baseArgs.isProRata,
      baseArgs.occupiedDays,
      baseArgs.totalDaysInMonth,
    );

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(RentCallGenerated);
    expect((events[0] as RentCallGenerated).data).toEqual({
      rentCallId: 'rc-1',
      ...baseArgs,
    });
  });

  it('should no-op if already generated (replay guard)', () => {
    const aggregate = new RentCallAggregate('rc-1');
    aggregate.generate(
      baseArgs.entityId,
      baseArgs.userId,
      baseArgs.leaseId,
      baseArgs.tenantId,
      baseArgs.unitId,
      baseArgs.month,
      baseArgs.rentAmountCents,
      baseArgs.billingLines,
      baseArgs.totalAmountCents,
      baseArgs.isProRata,
      baseArgs.occupiedDays,
      baseArgs.totalDaysInMonth,
    );

    // Simulate commit
    aggregate.commit();

    // Second call should be a no-op
    aggregate.generate(
      baseArgs.entityId,
      baseArgs.userId,
      baseArgs.leaseId,
      baseArgs.tenantId,
      baseArgs.unitId,
      baseArgs.month,
      baseArgs.rentAmountCents,
      baseArgs.billingLines,
      baseArgs.totalAmountCents,
      baseArgs.isProRata,
      baseArgs.occupiedDays,
      baseArgs.totalDaysInMonth,
    );

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(0);
  });

  it('should replay state from RentCallGenerated event', () => {
    const aggregate = new RentCallAggregate('rc-1');
    aggregate.generate(
      baseArgs.entityId,
      baseArgs.userId,
      baseArgs.leaseId,
      baseArgs.tenantId,
      baseArgs.unitId,
      baseArgs.month,
      baseArgs.rentAmountCents,
      baseArgs.billingLines,
      baseArgs.totalAmountCents,
      baseArgs.isProRata,
      baseArgs.occupiedDays,
      baseArgs.totalDaysInMonth,
    );

    // After apply, internal state should be set (verified by no-op on second call)
    aggregate.commit();
    aggregate.generate(
      baseArgs.entityId,
      baseArgs.userId,
      baseArgs.leaseId,
      baseArgs.tenantId,
      baseArgs.unitId,
      baseArgs.month,
      baseArgs.rentAmountCents,
      baseArgs.billingLines,
      baseArgs.totalAmountCents,
      baseArgs.isProRata,
      baseArgs.occupiedDays,
      baseArgs.totalDaysInMonth,
    );
    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
  });
});
