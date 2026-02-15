import { Prisma } from '@prisma/client';
import { RentCallProjection } from '../projections/rent-call.projection';

jest.mock('@kurrent/kurrentdb-client', () => ({
  START: 'start',
  streamNameFilter: jest.fn(() => 'filter'),
}));

const mockPrisma = {
  rentCall: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  payment: {
    create: jest.fn(),
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

describe('RentCallProjection', () => {
  let projection: RentCallProjection;

  beforeEach(() => {
    jest.clearAllMocks();
    projection = new RentCallProjection(mockKurrentDb as any, mockPrisma as any);
  });

  const baseEvent = {
    rentCallId: 'rc-1',
    entityId: 'entity-1',
    userId: 'user_123',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    month: '2026-03',
    rentAmountCents: 80000,
    billingLines: [{ chargeCategoryId: 'cat-1', categoryLabel: 'Charges', amountCents: 5000 }],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: 31,
    totalDaysInMonth: 31,
  };

  it('should insert rent call on RentCallGenerated', async () => {
    mockPrisma.rentCall.findUnique.mockResolvedValue(null);
    mockPrisma.rentCall.create.mockResolvedValue({});

    await (projection as any).onRentCallGenerated(baseEvent);

    expect(mockPrisma.rentCall.findUnique).toHaveBeenCalledWith({
      where: { id: 'rc-1' },
    });
    expect(mockPrisma.rentCall.create).toHaveBeenCalledWith({
      data: {
        id: 'rc-1',
        entityId: 'entity-1',
        userId: 'user_123',
        leaseId: 'lease-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        month: '2026-03',
        rentAmountCents: 80000,
        billingLines: [{ chargeCategoryId: 'cat-1', categoryLabel: 'Charges', amountCents: 5000 }],
        totalAmountCents: 85000,
        isProRata: false,
        occupiedDays: 31,
        totalDaysInMonth: 31,
      },
    });
  });

  it('should skip insert if rent call already exists (idempotent)', async () => {
    mockPrisma.rentCall.findUnique.mockResolvedValue({ id: 'rc-1' });

    await (projection as any).onRentCallGenerated(baseEvent);

    expect(mockPrisma.rentCall.create).not.toHaveBeenCalled();
  });

  it('should subscribe to rent-call_ stream prefixes on init', () => {
    projection.onModuleInit();

    expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalled();
  });

  describe('RentCallSent projection', () => {
    const sentEvent = {
      rentCallId: 'rc-1',
      sentAt: '2026-02-13T10:00:00.000Z',
      recipientEmail: 'tenant@example.com',
      entityId: 'entity-1',
      tenantId: 'tenant-1',
    };

    it('should update sentAt and recipientEmail on RentCallSent', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue({ id: 'rc-1' });
      mockPrisma.rentCall.update.mockResolvedValue({});

      await (projection as any).onRentCallSent(sentEvent);

      expect(mockPrisma.rentCall.update).toHaveBeenCalledWith({
        where: { id: 'rc-1' },
        data: {
          sentAt: new Date('2026-02-13T10:00:00.000Z'),
          recipientEmail: 'tenant@example.com',
        },
      });
    });

    it('should skip update for non-existent rent call', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue(null);

      await (projection as any).onRentCallSent(sentEvent);

      expect(mockPrisma.rentCall.update).not.toHaveBeenCalled();
    });
  });

  describe('PaymentRecorded projection', () => {
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

    beforeEach(() => {
      // Default: full payment scenario
      mockPrisma.payment.create.mockResolvedValue({});
      mockPrisma.payment.findMany.mockResolvedValue([{ amountCents: 85000 }]);
    });

    it('should create Payment row and update rent call with paid status on full payment', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        id: 'rc-1',
        totalAmountCents: 85000,
        paidAt: null,
      });
      mockPrisma.rentCall.update.mockResolvedValue({});

      await (projection as any).onPaymentRecorded(paymentEvent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rentCallId: 'rc-1',
          entityId: 'entity-1',
          transactionId: 'tx-1',
          amountCents: 85000,
          payerName: 'DOS SANTOS',
          paymentMethod: 'bank_transfer',
        }),
      });

      expect(mockPrisma.rentCall.update).toHaveBeenCalledWith({
        where: { id: 'rc-1' },
        data: expect.objectContaining({
          paidAt: new Date('2026-02-14T12:00:00.000Z'),
          paidAmountCents: 85000,
          paymentStatus: 'paid',
          remainingBalanceCents: 0,
          overpaymentCents: 0,
        }),
      });
    });

    it('should set partial status when payment is less than total', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        id: 'rc-1',
        totalAmountCents: 85000,
        paidAt: null,
      });
      mockPrisma.rentCall.update.mockResolvedValue({});
      mockPrisma.payment.findMany.mockResolvedValue([{ amountCents: 50000 }]);

      const partialEvent = { ...paymentEvent, amountCents: 50000 };
      await (projection as any).onPaymentRecorded(partialEvent);

      const updateCall = mockPrisma.rentCall.update.mock.calls[0][0];
      expect(updateCall.data.paidAt).toBeNull();
      expect(updateCall.data.paidAmountCents).toBe(50000);
      expect(updateCall.data.paymentStatus).toBe('partial');
      expect(updateCall.data.remainingBalanceCents).toBe(35000);
      expect(updateCall.data.overpaymentCents).toBe(0);
      // Scalar fields should NOT be present for partial payments
      expect(updateCall.data.transactionId).toBeUndefined();
      expect(updateCall.data.paymentMethod).toBeUndefined();
    });

    it('should set overpaid status when payment exceeds total', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        id: 'rc-1',
        totalAmountCents: 85000,
        paidAt: null,
      });
      mockPrisma.rentCall.update.mockResolvedValue({});
      mockPrisma.payment.findMany.mockResolvedValue([{ amountCents: 90000 }]);

      const overpaidEvent = { ...paymentEvent, amountCents: 90000 };
      await (projection as any).onPaymentRecorded(overpaidEvent);

      expect(mockPrisma.rentCall.update).toHaveBeenCalledWith({
        where: { id: 'rc-1' },
        data: expect.objectContaining({
          paidAt: new Date('2026-02-14T12:00:00.000Z'),
          paidAmountCents: 90000,
          paymentStatus: 'overpaid',
          remainingBalanceCents: 0,
          overpaymentCents: 5000,
        }),
      });
    });

    it('should skip update for non-existent rent call', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue(null);

      await (projection as any).onPaymentRecorded(paymentEvent);

      expect(mockPrisma.rentCall.update).not.toHaveBeenCalled();
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('should skip Payment creation if transaction already exists (P2002 idempotent)', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        id: 'rc-1',
        totalAmountCents: 85000,
        paidAt: null,
      });
      mockPrisma.rentCall.update.mockResolvedValue({});
      mockPrisma.payment.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.0.0',
        }),
      );
      mockPrisma.payment.findMany.mockResolvedValue([{ amountCents: 85000 }]);

      await (projection as any).onPaymentRecorded(paymentEvent);

      expect(mockPrisma.payment.create).toHaveBeenCalled();
      // Rent call update still happens (recompute status from all payments)
      expect(mockPrisma.rentCall.update).toHaveBeenCalled();
    });

    it('should persist paymentMethod and paymentReference for manual payment', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        id: 'rc-1',
        totalAmountCents: 85000,
        paidAt: null,
      });
      mockPrisma.rentCall.update.mockResolvedValue({});

      const manualPaymentEvent = {
        ...paymentEvent,
        bankStatementId: null,
        paymentMethod: 'cash',
        paymentReference: null,
      };

      await (projection as any).onPaymentRecorded(manualPaymentEvent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentMethod: 'cash',
          paymentReference: null,
          bankStatementId: null,
        }),
      });
    });

    it('should default paymentMethod to bank_transfer for old events without field', async () => {
      mockPrisma.rentCall.findUnique.mockResolvedValue({
        id: 'rc-1',
        totalAmountCents: 85000,
        paidAt: null,
      });
      mockPrisma.rentCall.update.mockResolvedValue({});

      const oldEvent = {
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

      await (projection as any).onPaymentRecorded(oldEvent);

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentMethod: 'bank_transfer',
          paymentReference: null,
        }),
      });
    });
  });
});
