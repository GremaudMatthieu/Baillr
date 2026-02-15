import { LeaseProjection } from '../lease.projection';

describe('LeaseProjection', () => {
  let projection: LeaseProjection;
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };
  let mockPrisma: {
    lease: {
      upsert: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(() => {
    mockKurrentDb = {
      client: {
        subscribeToAll: jest.fn().mockReturnValue({
          on: jest.fn(),
        }),
      },
    };
    mockPrisma = {
      lease: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    projection = new LeaseProjection(mockKurrentDb as never, mockPrisma as never);
  });

  describe('onModuleInit', () => {
    it('should subscribe to event stream on init', () => {
      projection.onModuleInit();
      expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalled();
    });
  });

  describe('handleEvent', () => {
    it('should upsert lease on LeaseCreated event', async () => {
      mockPrisma.lease.upsert.mockResolvedValue({});

      await (
        projection as unknown as {
          handleEvent: (t: string, d: Record<string, unknown>) => Promise<void>;
        }
      ).handleEvent('LeaseCreated', {
        id: 'lease-1',
        entityId: 'entity-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        startDate: '2026-03-01T00:00:00.000Z',
        rentAmountCents: 75000,
        securityDepositCents: 75000,
        monthlyDueDate: 5,
        revisionIndexType: 'IRL',
      });

      expect(mockPrisma.lease.upsert).toHaveBeenCalledWith({
        where: { id: 'lease-1' },
        create: {
          id: 'lease-1',
          entityId: 'entity-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          startDate: new Date('2026-03-01T00:00:00.000Z'),
          rentAmountCents: 75000,
          securityDepositCents: 75000,
          monthlyDueDate: 5,
          revisionIndexType: 'IRL',
        },
        update: {},
      });
    });

    it('should update rent on LeaseRentRevised event', async () => {
      mockPrisma.lease.updateMany.mockResolvedValue({ count: 1 });

      await (
        projection as unknown as {
          handleEvent: (t: string, d: Record<string, unknown>) => Promise<void>;
        }
      ).handleEvent('LeaseRentRevised', {
        leaseId: 'lease-1',
        entityId: 'entity-1',
        previousRentCents: 75000,
        newRentCents: 77097,
        previousBaseIndexValue: 138.19,
        newBaseIndexValue: 142.06,
        newReferenceQuarter: 'Q2',
        newReferenceYear: 2025,
        revisionId: 'rev-1',
        approvedAt: '2026-02-14T12:00:00Z',
      });

      expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
        where: { id: 'lease-1' },
        data: {
          rentAmountCents: 77097,
          baseIndexValue: 142.06,
          referenceQuarter: 'Q2',
          referenceYear: 2025,
        },
      });
    });

    it('should skip LeaseRentRevised when lease not found', async () => {
      mockPrisma.lease.updateMany.mockResolvedValue({ count: 0 });

      await (
        projection as unknown as {
          handleEvent: (t: string, d: Record<string, unknown>) => Promise<void>;
        }
      ).handleEvent('LeaseRentRevised', {
        leaseId: 'lease-missing',
        entityId: 'entity-1',
        previousRentCents: 75000,
        newRentCents: 77097,
        previousBaseIndexValue: 138.19,
        newBaseIndexValue: 142.06,
        newReferenceQuarter: 'Q2',
        newReferenceYear: 2025,
        revisionId: 'rev-1',
        approvedAt: '2026-02-14T12:00:00Z',
      });

      expect(mockPrisma.lease.updateMany).toHaveBeenCalled();
    });

    it('should update endDate on LeaseTerminated event', async () => {
      mockPrisma.lease.updateMany.mockResolvedValue({ count: 1 });

      await (
        projection as unknown as {
          handleEvent: (t: string, d: Record<string, unknown>) => Promise<void>;
        }
      ).handleEvent('LeaseTerminated', {
        leaseId: 'lease-1',
        endDate: '2026-12-31T00:00:00.000Z',
      });

      expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
        where: { id: 'lease-1' },
        data: {
          endDate: new Date('2026-12-31T00:00:00.000Z'),
        },
      });
    });

    it('should ignore unknown event types', async () => {
      await (
        projection as unknown as {
          handleEvent: (t: string, d: Record<string, unknown>) => Promise<void>;
        }
      ).handleEvent('UnknownEvent', {});

      expect(mockPrisma.lease.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.lease.updateMany).not.toHaveBeenCalled();
    });
  });
});
