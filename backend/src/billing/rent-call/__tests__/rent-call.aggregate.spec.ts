// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

import { RentCallAggregate } from '../rent-call.aggregate';
import { RentCallGenerated } from '../events/rent-call-generated.event';
import { RentCallSent } from '../events/rent-call-sent.event';
import { DomainException } from '@shared/exceptions/domain.exception';

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

  function createGeneratedAggregate(): RentCallAggregate {
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
    aggregate.commit();
    return aggregate;
  }

  describe('markAsSent', () => {
    it('should emit RentCallSent event on a generated rent call', () => {
      const aggregate = createGeneratedAggregate();
      const sentAt = new Date('2026-02-13T10:00:00Z');

      aggregate.markAsSent(sentAt, 'tenant@example.com');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RentCallSent);
      expect((events[0] as RentCallSent).data).toEqual({
        rentCallId: 'rc-1',
        sentAt: '2026-02-13T10:00:00.000Z',
        recipientEmail: 'tenant@example.com',
        entityId: baseArgs.entityId,
        tenantId: baseArgs.tenantId,
      });
    });

    it('should throw DomainException when rent call not yet created', () => {
      const aggregate = new RentCallAggregate('rc-1');

      expect(() =>
        aggregate.markAsSent(new Date(), 'tenant@example.com'),
      ).toThrow(DomainException);
    });

    it('should no-op when already sent (idempotent)', () => {
      const aggregate = createGeneratedAggregate();
      const sentAt = new Date('2026-02-13T10:00:00Z');

      aggregate.markAsSent(sentAt, 'tenant@example.com');
      aggregate.commit();

      // Second call should be a no-op
      aggregate.markAsSent(new Date('2026-02-14T10:00:00Z'), 'other@example.com');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should apply sent state from RentCallSent event', () => {
      const aggregate = createGeneratedAggregate();
      const sentAt = new Date('2026-02-13T10:00:00Z');

      aggregate.markAsSent(sentAt, 'tenant@example.com');
      aggregate.commit();

      // Verify state is applied by checking idempotent no-op
      aggregate.markAsSent(new Date(), 'different@example.com');
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
