import { LeaseProjection } from '../projections/lease.projection';

describe('LeaseProjection', () => {
  let projection: LeaseProjection;
  let mockPrisma: {
    lease: {
      upsert: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let mockKurrentDb: {
    client: {
      subscribeToAll: jest.Mock;
    };
  };
  let dataHandler: (resolved: { event: { type: string; data: unknown } | undefined }) => void;

  beforeEach(() => {
    mockPrisma = {
      lease: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const mockSubscription = {
      on: jest.fn((event: string, handler: (...args: never[]) => void) => {
        if (event === 'data') {
          dataHandler = handler as typeof dataHandler;
        }
      }),
    };

    mockKurrentDb = {
      client: {
        subscribeToAll: jest.fn().mockReturnValue(mockSubscription),
      },
    };

    projection = new LeaseProjection(mockKurrentDb as never, mockPrisma as never);
  });

  it('should subscribe to KurrentDB on module init', () => {
    projection.onModuleInit();

    expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalledTimes(1);
  });

  it('should upsert lease on LeaseCreated event', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'LeaseCreated',
        data: {
          id: 'lease-1',
          entityId: 'entity-1',
          userId: 'user_clerk_123',
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          startDate: '2026-03-01T00:00:00.000Z',
          rentAmountCents: 63000,
          securityDepositCents: 63000,
          monthlyDueDate: 5,
          revisionIndexType: 'IRL',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.upsert).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
      create: {
        id: 'lease-1',
        entityId: 'entity-1',
        userId: 'user_clerk_123',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        rentAmountCents: 63000,
        securityDepositCents: 63000,
        monthlyDueDate: 5,
        revisionIndexType: 'IRL',
      },
      update: {},
    });
  });

  it('should be idempotent (upsert with empty update)', async () => {
    projection.onModuleInit();

    const eventData = {
      id: 'lease-1',
      entityId: 'entity-1',
      userId: 'user_clerk_123',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      startDate: '2026-03-01T00:00:00.000Z',
      rentAmountCents: 63000,
      securityDepositCents: 63000,
      monthlyDueDate: 5,
      revisionIndexType: 'IRL',
    };

    dataHandler({ event: { type: 'LeaseCreated', data: eventData } });
    await new Promise((r) => setTimeout(r, 10));

    dataHandler({ event: { type: 'LeaseCreated', data: eventData } });
    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.upsert).toHaveBeenCalledTimes(2);
    // Both calls use update: {} so duplicate projection is safe
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockPrisma.lease.upsert.mock.calls[1]?.[0].update).toEqual({});
  });

  it('should ignore unknown event types', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'SomethingElse',
        data: { id: 'unknown' },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.upsert).not.toHaveBeenCalled();
  });

  it('should skip events with no event data', async () => {
    projection.onModuleInit();

    dataHandler({ event: undefined });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.upsert).not.toHaveBeenCalled();
  });

  it('should update billing lines on LeaseBillingLinesConfigured event', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'LeaseBillingLinesConfigured',
        data: {
          leaseId: 'lease-1',
          billingLines: [
            { label: 'Provisions sur charges', amountCents: 5000, type: 'provision' },
            { label: 'Parking', amountCents: 3000, type: 'option' },
          ],
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
      data: {
        billingLines: [
          { label: 'Provisions sur charges', amountCents: 5000, type: 'provision' },
          { label: 'Parking', amountCents: 3000, type: 'option' },
        ],
      },
    });
  });

  it('should skip LeaseBillingLinesConfigured when lease not found', async () => {
    mockPrisma.lease.updateMany.mockResolvedValue({ count: 0 });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'LeaseBillingLinesConfigured',
        data: {
          leaseId: 'nonexistent',
          billingLines: [{ label: 'Test', amountCents: 1000, type: 'provision' }],
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
      where: { id: 'nonexistent' },
      data: {
        billingLines: [{ label: 'Test', amountCents: 1000, type: 'provision' }],
      },
    });
  });

  it('should handle empty billing lines in LeaseBillingLinesConfigured', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'LeaseBillingLinesConfigured',
        data: {
          leaseId: 'lease-1',
          billingLines: [],
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
      data: { billingLines: [] },
    });
  });

  it('should update revision parameters on LeaseRevisionParametersConfigured event', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'LeaseRevisionParametersConfigured',
        data: {
          leaseId: 'lease-1',
          revisionDay: 15,
          revisionMonth: 3,
          referenceQuarter: 'Q2',
          referenceYear: 2025,
          baseIndexValue: 142.06,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
      data: {
        revisionDay: 15,
        revisionMonth: 3,
        referenceQuarter: 'Q2',
        referenceYear: 2025,
        baseIndexValue: 142.06,
      },
    });
  });

  it('should handle null base index value in LeaseRevisionParametersConfigured', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'LeaseRevisionParametersConfigured',
        data: {
          leaseId: 'lease-1',
          revisionDay: 1,
          revisionMonth: 1,
          referenceQuarter: 'Q1',
          referenceYear: 2026,
          baseIndexValue: null,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
      where: { id: 'lease-1' },
      data: {
        revisionDay: 1,
        revisionMonth: 1,
        referenceQuarter: 'Q1',
        referenceYear: 2026,
        baseIndexValue: null,
      },
    });
  });

  it('should skip LeaseRevisionParametersConfigured when lease not found', async () => {
    mockPrisma.lease.updateMany.mockResolvedValue({ count: 0 });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'LeaseRevisionParametersConfigured',
        data: {
          leaseId: 'nonexistent',
          revisionDay: 15,
          revisionMonth: 3,
          referenceQuarter: 'Q2',
          referenceYear: 2025,
          baseIndexValue: 142.06,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.lease.updateMany).toHaveBeenCalledWith({
      where: { id: 'nonexistent' },
      data: {
        revisionDay: 15,
        revisionMonth: 3,
        referenceQuarter: 'Q2',
        referenceYear: 2025,
        baseIndexValue: 142.06,
      },
    });
  });
});
