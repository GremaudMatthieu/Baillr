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

  describe('onChargeRegularizationApplied', () => {
    const appliedEvent = {
      chargeRegularizationId: 'entity1-2025',
      entityId: 'entity-1',
      userId: 'user_123',
      fiscalYear: 2025,
      statements: [
        { tenantId: 'tenant-1', balanceCents: 5000 },
        { tenantId: 'tenant-2', balanceCents: -3000 },
      ],
      appliedAt: '2026-02-15T10:00:00.000Z',
    };

    it('should create debit entry for positive balance (Complément)', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null); // no existing
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -10000 }); // latest balance
      mockPrisma.accountEntry.create.mockResolvedValue({});
      // For second tenant
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null);
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -5000 });
      mockPrisma.accountEntry.create.mockResolvedValue({});

      await (projection as any).onChargeRegularizationApplied(appliedEvent);

      expect(mockPrisma.accountEntry.create).toHaveBeenCalledTimes(2);

      // First: debit for tenant-1 (positive balance = owes more)
      expect(mockPrisma.accountEntry.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          entityId: 'entity-1',
          tenantId: 'tenant-1',
          type: 'debit',
          category: 'charge_regularization',
          description: 'Régularisation des charges — 2025',
          amountCents: 5000,
          balanceCents: -15000, // -10000 - 5000
          referenceId: 'entity1-2025-tenant-1',
          referenceMonth: '2025-12',
        }),
      });
    });

    it('should create credit entry for negative balance (Trop-perçu)', async () => {
      // For first tenant (positive)
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null);
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: 0 });
      mockPrisma.accountEntry.create.mockResolvedValue({});
      // For second tenant (negative = credit)
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null);
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -20000 });
      mockPrisma.accountEntry.create.mockResolvedValue({});

      await (projection as any).onChargeRegularizationApplied(appliedEvent);

      // Second call: credit for tenant-2 (negative balance = tenant overpaid)
      expect(mockPrisma.accountEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          entityId: 'entity-1',
          tenantId: 'tenant-2',
          type: 'credit',
          category: 'charge_regularization',
          description: 'Avoir régularisation des charges — 2025',
          amountCents: 3000,
          balanceCents: -17000, // -20000 + 3000
          referenceId: 'entity1-2025-tenant-2',
          referenceMonth: '2025-12',
        }),
      });
    });

    it('should skip zero-balance statements', async () => {
      const zeroEvent = {
        ...appliedEvent,
        statements: [
          { tenantId: 'tenant-1', balanceCents: 0 },
          { tenantId: 'tenant-2', balanceCents: 5000 },
        ],
      };

      // Only for second tenant (non-zero)
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null);
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: 0 });
      mockPrisma.accountEntry.create.mockResolvedValue({});

      await (projection as any).onChargeRegularizationApplied(zeroEvent);

      expect(mockPrisma.accountEntry.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.accountEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-2',
          type: 'debit',
          amountCents: 5000,
        }),
      });
    });

    it('should be idempotent — skip if entry already exists', async () => {
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ id: 'existing-1' }); // first tenant already exists
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ id: 'existing-2' }); // second tenant already exists

      await (projection as any).onChargeRegularizationApplied(appliedEvent);

      expect(mockPrisma.accountEntry.create).not.toHaveBeenCalled();
    });

    it('should compute running balance correctly', async () => {
      const singleEvent = {
        ...appliedEvent,
        statements: [{ tenantId: 'tenant-1', balanceCents: -7500 }],
      };

      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce(null);
      mockPrisma.accountEntry.findFirst.mockResolvedValueOnce({ balanceCents: -30000 });
      mockPrisma.accountEntry.create.mockResolvedValue({});

      await (projection as any).onChargeRegularizationApplied(singleEvent);

      expect(mockPrisma.accountEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'credit',
          amountCents: 7500,
          balanceCents: -22500, // -30000 + 7500
        }),
      });
    });
  });
});
