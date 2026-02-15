import { AccountEntryProjection } from '../projections/account-entry.projection';

jest.mock('@kurrent/kurrentdb-client', () => ({
  START: 'start',
  streamNameFilter: jest.fn(() => 'filter'),
}));

const mockPrisma = {
  accountEntry: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  rentCall: {
    findUnique: jest.fn(),
  },
  payment: {
    findMany: jest.fn(),
  },
};

const mockKurrentDb = {
  client: {
    subscribeToAll: jest.fn(() => ({
      on: jest.fn(),
    })),
  },
};

describe('AccountEntryProjection', () => {
  let projection: AccountEntryProjection;

  beforeEach(() => {
    jest.clearAllMocks();
    projection = new AccountEntryProjection(mockKurrentDb as any, mockPrisma as any);
  });

  describe('onRentCallGenerated (debit entry)', () => {
    const rentCallEvent = {
      rentCallId: 'rc-1',
      entityId: 'entity-1',
      userId: 'user_123',
      leaseId: 'lease-1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      month: '2026-03',
      rentAmountCents: 80000,
      billingLines: [],
      totalAmountCents: 85000,
      isProRata: false,
      occupiedDays: 31,
      totalDaysInMonth: 31,
    };

    it('should create a debit AccountEntry on rent call generation', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null); // no existing debit
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null); // no latest balance
      mockPrisma.accountEntry.create.mockResolvedValue({});

      await (projection as any).onRentCallGenerated(rentCallEvent);

      expect(mockPrisma.accountEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityId: 'entity-1',
          tenantId: 'tenant-1',
          type: 'debit',
          category: 'rent_call',
          description: 'Appel de loyer 2026-03',
          amountCents: 85000,
          balanceCents: -85000,
          referenceId: 'rc-1',
          referenceMonth: '2026-03',
        }),
      });
    });

    it('should be idempotent — skip if debit entry already exists', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValue({ id: 'ae-existing' });

      await (projection as any).onRentCallGenerated(rentCallEvent);

      expect(mockPrisma.accountEntry.create).not.toHaveBeenCalled();
    });

    it('should compute running balance from previous entries', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null); // no existing debit for this rc
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -50000 }); // previous balance
      mockPrisma.accountEntry.create.mockResolvedValue({});

      await (projection as any).onRentCallGenerated(rentCallEvent);

      expect(mockPrisma.accountEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          balanceCents: -135000, // -50000 - 85000
        }),
      });
    });
  });

  describe('onPaymentRecorded (credit entry)', () => {
    const paymentEvent = {
      rentCallId: 'rc-1',
      entityId: 'entity-1',
      userId: 'user_123',
      transactionId: 'tx-1',
      bankStatementId: 'bs-1',
      amountCents: 85000,
      payerName: 'DOS SANTOS',
      paymentDate: '2026-02-10',
      recordedAt: '2026-02-14T12:00:00.000Z',
    };

    it('should create a credit AccountEntry on payment', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null); // no existing credit
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        tenantId: 'tenant-1',
        month: '2026-03',
        totalAmountCents: 85000,
      });
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -85000 }); // previous balance
      mockPrisma.accountEntry.create.mockResolvedValue({});
      mockPrisma.payment.findMany.mockResolvedValue([{ amountCents: 85000 }]);

      await (projection as any).onPaymentRecorded(paymentEvent);

      expect(mockPrisma.accountEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityId: 'entity-1',
          tenantId: 'tenant-1',
          type: 'credit',
          category: 'payment',
          amountCents: 85000,
          balanceCents: 0, // -85000 + 85000
          referenceId: 'tx-1',
          referenceMonth: '2026-03',
        }),
      });
    });

    it('should be idempotent — skip if credit entry already exists', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValue({ id: 'ae-existing' });

      await (projection as any).onPaymentRecorded(paymentEvent);

      expect(mockPrisma.accountEntry.create).not.toHaveBeenCalled();
    });

    it('should skip if rent call not found', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValue(null);
      mockPrisma.rentCall.findUnique.mockResolvedValue(null);

      await (projection as any).onPaymentRecorded(paymentEvent);

      expect(mockPrisma.accountEntry.create).not.toHaveBeenCalled();
    });

    it('should create overpayment credit entry when payment exceeds total', async () => {
      const overpaidEvent = { ...paymentEvent, amountCents: 90000 };

      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null); // no existing credit for payment
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        tenantId: 'tenant-1',
        month: '2026-03',
        totalAmountCents: 85000,
      });
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -85000 }); // previous balance
      mockPrisma.accountEntry.create.mockResolvedValue({});
      mockPrisma.payment.findMany.mockResolvedValue([{ amountCents: 90000 }]);
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null); // no existing overpayment credit

      await (projection as any).onPaymentRecorded(overpaidEvent);

      // Should have created 2 entries: payment credit + overpayment credit
      expect(mockPrisma.accountEntry.create).toHaveBeenCalledTimes(2);

      // Second call should be overpayment credit
      expect(mockPrisma.accountEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          type: 'credit',
          category: 'overpayment_credit',
          amountCents: 5000,
          description: expect.stringContaining('Trop-perçu'),
        }),
      });
    });

    it('should NOT create overpayment entry when payment is exact', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null);
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        tenantId: 'tenant-1',
        month: '2026-03',
        totalAmountCents: 85000,
      });
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -85000 });
      mockPrisma.accountEntry.create.mockResolvedValue({});
      mockPrisma.payment.findMany.mockResolvedValue([{ amountCents: 85000 }]);

      await (projection as any).onPaymentRecorded(paymentEvent);

      // Only 1 entry (payment credit, no overpayment)
      expect(mockPrisma.accountEntry.create).toHaveBeenCalledTimes(1);
    });
  });
});
