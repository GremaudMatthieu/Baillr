// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

import { RentCallAggregate } from '../rent-call.aggregate';
import { RentCallGenerated } from '../events/rent-call-generated.event';
import { RentCallSent } from '../events/rent-call-sent.event';
import { PaymentRecorded } from '../events/payment-recorded.event';
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

  describe('recordPayment', () => {
    const recordedAt = new Date('2026-02-14T12:00:00Z');
    const paymentArgs = {
      transactionId: 'tx-1',
      bankStatementId: 'bs-1',
      amountCents: 85000,
      payerName: 'DOS SANTOS',
      paymentDate: '2026-02-10',
      recordedAt,
      userId: 'user_123',
    };

    it('should emit PaymentRecorded event on a generated rent call', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment(
        paymentArgs.transactionId,
        paymentArgs.bankStatementId,
        paymentArgs.amountCents,
        paymentArgs.payerName,
        paymentArgs.paymentDate,
        paymentArgs.recordedAt,
        paymentArgs.userId,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentRecorded);
      const eventData = (events[0] as PaymentRecorded).data;
      expect(eventData.rentCallId).toBe('rc-1');
      expect(eventData.entityId).toBe(baseArgs.entityId);
      expect(eventData.userId).toBe('user_123');
      expect(eventData.transactionId).toBe('tx-1');
      expect(eventData.bankStatementId).toBe('bs-1');
      expect(eventData.amountCents).toBe(85000);
      expect(eventData.payerName).toBe('DOS SANTOS');
      expect(eventData.paymentDate).toBe('2026-02-10');
      expect(eventData.recordedAt).toBe('2026-02-14T12:00:00.000Z');
    });

    it('should accept null bankStatementId for manual payments', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment(
        'tx-1',
        null,
        85000,
        'DOS SANTOS',
        '2026-02-10',
        recordedAt,
        'user_123',
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as PaymentRecorded).data.bankStatementId).toBeNull();
    });

    it('should throw DomainException when rent call not yet created', () => {
      const aggregate = new RentCallAggregate('rc-1');

      expect(() =>
        aggregate.recordPayment(
          paymentArgs.transactionId,
          paymentArgs.bankStatementId,
          paymentArgs.amountCents,
          paymentArgs.payerName,
          paymentArgs.paymentDate,
          paymentArgs.recordedAt,
          paymentArgs.userId,
        ),
      ).toThrow(DomainException);
    });

    it('should emit PaymentRecorded with paymentMethod and paymentReference', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment(
        'tx-1',
        null,
        85000,
        'DOS SANTOS',
        '2026-02-10',
        recordedAt,
        'user_123',
        'check',
        'CHK-789',
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      const eventData = (events[0] as PaymentRecorded).data;
      expect(eventData.paymentMethod).toBe('check');
      expect(eventData.paymentReference).toBe('CHK-789');
      expect(eventData.bankStatementId).toBeNull();
    });

    it('should default paymentMethod to bank_transfer when not specified', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment(
        'tx-1',
        'bs-1',
        85000,
        'DOS SANTOS',
        '2026-02-10',
        recordedAt,
        'user_123',
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      const eventData = (events[0] as PaymentRecorded).data;
      expect(eventData.paymentMethod).toBe('bank_transfer');
      expect(eventData.paymentReference).toBeNull();
    });

    it('should no-op when already fully paid', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment(
        paymentArgs.transactionId,
        paymentArgs.bankStatementId,
        paymentArgs.amountCents,
        paymentArgs.payerName,
        paymentArgs.paymentDate,
        paymentArgs.recordedAt,
        paymentArgs.userId,
      );
      aggregate.commit();

      // Second call should be a no-op (already fully paid)
      aggregate.recordPayment(
        'tx-2',
        'bs-2',
        90000,
        'DIFFERENT PAYER',
        '2026-02-15',
        new Date('2026-02-15T10:00:00Z'),
        'user_123',
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });
  });
});
