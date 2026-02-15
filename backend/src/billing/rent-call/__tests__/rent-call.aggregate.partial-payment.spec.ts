// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

import { RentCallAggregate } from '../rent-call.aggregate';
import { PaymentRecorded } from '../events/payment-recorded.event';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('RentCallAggregate — Partial Payments', () => {
  const baseArgs = {
    entityId: 'entity-1',
    userId: 'user_123',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    month: '2026-03',
    rentAmountCents: 80000,
    billingLines: [{ chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 5000 }],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: 31,
    totalDaysInMonth: 31,
  };

  const recordedAt = new Date('2026-02-14T12:00:00Z');

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

  describe('partial payment (amount < total)', () => {
    it('should accept a partial payment and NOT set paidAt', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', null, 50000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentRecorded);

      // paidAt should NOT be set (partially paid)
      expect(aggregate.isPartiallyPaid).toBe(true);
      expect(aggregate.isFullyPaid).toBe(false);
      expect(aggregate.totalPaidCents).toBe(50000);
      expect(aggregate.remainingBalanceCents).toBe(35000);
      expect(aggregate.overpaymentCents).toBe(0);
    });

    it('should allow a second payment on a partially paid rent call', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', null, 50000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');
      aggregate.commit();

      aggregate.recordPayment('tx-2', null, 35000, 'DOS SANTOS', '2026-02-15', new Date('2026-02-15T10:00:00Z'), 'user_123');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentRecorded);

      expect(aggregate.isFullyPaid).toBe(true);
      expect(aggregate.isPartiallyPaid).toBe(false);
      expect(aggregate.totalPaidCents).toBe(85000);
      expect(aggregate.remainingBalanceCents).toBe(0);
    });
  });

  describe('full payment (amount = total)', () => {
    it('should mark as fully paid when amount equals total', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', 'bs-1', 85000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');

      expect(aggregate.isFullyPaid).toBe(true);
      expect(aggregate.isPartiallyPaid).toBe(false);
      expect(aggregate.totalPaidCents).toBe(85000);
      expect(aggregate.remainingBalanceCents).toBe(0);
      expect(aggregate.overpaymentCents).toBe(0);
    });

    it('should no-op when already fully paid', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', 'bs-1', 85000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');
      aggregate.commit();

      // Second call should be a no-op
      aggregate.recordPayment('tx-2', 'bs-2', 10000, 'OTHER', '2026-02-15', new Date('2026-02-15T10:00:00Z'), 'user_123');

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('overpayment (amount > total)', () => {
    it('should mark as fully paid with overpayment', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', 'bs-1', 90000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');

      expect(aggregate.isFullyPaid).toBe(true);
      expect(aggregate.isPartiallyPaid).toBe(false);
      expect(aggregate.totalPaidCents).toBe(90000);
      expect(aggregate.remainingBalanceCents).toBe(0);
      expect(aggregate.overpaymentCents).toBe(5000);
    });
  });

  describe('multiple partial payments summing to full', () => {
    it('should accept three partial payments summing to total', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', null, 30000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');
      aggregate.commit();
      expect(aggregate.isPartiallyPaid).toBe(true);
      expect(aggregate.totalPaidCents).toBe(30000);
      expect(aggregate.remainingBalanceCents).toBe(55000);

      aggregate.recordPayment('tx-2', null, 30000, 'DOS SANTOS', '2026-02-12', new Date('2026-02-12T10:00:00Z'), 'user_123');
      aggregate.commit();
      expect(aggregate.isPartiallyPaid).toBe(true);
      expect(aggregate.totalPaidCents).toBe(60000);
      expect(aggregate.remainingBalanceCents).toBe(25000);

      aggregate.recordPayment('tx-3', null, 25000, 'DOS SANTOS', '2026-02-14', new Date('2026-02-14T10:00:00Z'), 'user_123');
      expect(aggregate.isFullyPaid).toBe(true);
      expect(aggregate.totalPaidCents).toBe(85000);
      expect(aggregate.remainingBalanceCents).toBe(0);
      expect(aggregate.overpaymentCents).toBe(0);
    });
  });

  describe('backward compatibility — legacy single-payment replay', () => {
    it('should replay legacy PaymentRecorded event and populate payments array', () => {
      const aggregate = createGeneratedAggregate();

      // Simulate replaying a legacy PaymentRecorded event (from Stories 5.3/5.4)
      aggregate.recordPayment('tx-1', 'bs-1', 85000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');

      // The payments array should have one entry
      expect(aggregate.totalPaidCents).toBe(85000);
      expect(aggregate.isFullyPaid).toBe(true);
    });

    it('should replay legacy event without paymentMethod/paymentReference (defaults)', () => {
      const aggregate = createGeneratedAggregate();

      // Legacy events may not have paymentMethod/paymentReference
      // The onPaymentRecorded handler uses ?? for defaults
      const legacyEvent = new PaymentRecorded({
        rentCallId: 'rc-1',
        entityId: 'entity-1',
        userId: 'user_123',
        transactionId: 'tx-1',
        bankStatementId: 'bs-1',
        amountCents: 85000,
        payerName: 'DOS SANTOS',
        paymentDate: '2026-02-10',
        recordedAt: '2026-02-14T12:00:00.000Z',
        // paymentMethod and paymentReference omitted (legacy)
      });

      // Manually apply to simulate replay
      (aggregate as unknown as { onPaymentRecorded(e: PaymentRecorded): void }).onPaymentRecorded(legacyEvent);

      expect(aggregate.totalPaidCents).toBe(85000);
      expect(aggregate.isFullyPaid).toBe(true);
    });
  });

  describe('computed getters', () => {
    it('should return correct initial values before any payment', () => {
      const aggregate = createGeneratedAggregate();

      expect(aggregate.totalPaidCents).toBe(0);
      expect(aggregate.isFullyPaid).toBe(false);
      expect(aggregate.isPartiallyPaid).toBe(false);
      expect(aggregate.remainingBalanceCents).toBe(85000);
      expect(aggregate.overpaymentCents).toBe(0);
    });

    it('should update correctly after partial payment', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', null, 42500, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');

      expect(aggregate.totalPaidCents).toBe(42500);
      expect(aggregate.isPartiallyPaid).toBe(true);
      expect(aggregate.isFullyPaid).toBe(false);
      expect(aggregate.remainingBalanceCents).toBe(42500);
      expect(aggregate.overpaymentCents).toBe(0);
    });

    it('should prevent additional payments when fully paid', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', null, 85000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');
      aggregate.commit();

      // Attempt another payment — should no-op
      aggregate.recordPayment('tx-2', null, 5000, 'OTHER', '2026-02-15', new Date('2026-02-15T10:00:00Z'), 'user_123');

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
      expect(aggregate.totalPaidCents).toBe(85000);
    });

    it('should prevent additional payments when overpaid', () => {
      const aggregate = createGeneratedAggregate();

      aggregate.recordPayment('tx-1', null, 90000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123');
      aggregate.commit();

      aggregate.recordPayment('tx-2', null, 5000, 'OTHER', '2026-02-15', new Date('2026-02-15T10:00:00Z'), 'user_123');

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
      expect(aggregate.totalPaidCents).toBe(90000);
    });
  });

  describe('error handling', () => {
    it('should throw when recording payment on non-created rent call', () => {
      const aggregate = new RentCallAggregate('rc-1');

      expect(() =>
        aggregate.recordPayment('tx-1', null, 50000, 'DOS SANTOS', '2026-02-10', recordedAt, 'user_123'),
      ).toThrow(DomainException);
    });
  });
});
