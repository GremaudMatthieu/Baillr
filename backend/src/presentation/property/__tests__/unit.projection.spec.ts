import { UnitProjection } from '../projections/unit.projection';

describe('UnitProjection', () => {
  let projection: UnitProjection;
  let mockPrisma: {
    unit: {
      upsert: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
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
      unit: {
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
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

    projection = new UnitProjection(mockKurrentDb as never, mockPrisma as never);
  });

  it('should subscribe to KurrentDB on module init', () => {
    projection.onModuleInit();

    expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalledTimes(1);
  });

  it('should upsert unit on UnitCreated event', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'UnitCreated',
        data: {
          id: 'unit-1',
          propertyId: 'property-1',
          userId: 'user_clerk_123',
          identifier: 'Apt 3B',
          type: 'apartment',
          floor: 3,
          surfaceArea: 65.5,
          billableOptions: [{ label: 'Entretien chaudière', amountCents: 1500 }],
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.unit.upsert).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      create: {
        id: 'unit-1',
        propertyId: 'property-1',
        userId: 'user_clerk_123',
        identifier: 'Apt 3B',
        type: 'apartment',
        floor: 3,
        surfaceArea: 65.5,
        billableOptions: [{ label: 'Entretien chaudière', amountCents: 1500 }],
      },
      update: {},
    });
  });

  it('should update unit on UnitUpdated event when exists', async () => {
    mockPrisma.unit.findUnique.mockResolvedValue({ id: 'unit-1' });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'UnitUpdated',
        data: {
          id: 'unit-1',
          identifier: 'Apt 4A',
          surfaceArea: 80,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.unit.findUnique).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      select: { id: true },
    });
    expect(mockPrisma.unit.update).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      data: { identifier: 'Apt 4A', surfaceArea: 80 },
    });
  });

  it('should warn and skip when UnitUpdated for missing read model', async () => {
    mockPrisma.unit.findUnique.mockResolvedValue(null);
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'UnitUpdated',
        data: {
          id: 'missing-unit',
          identifier: 'Updated',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.unit.update).not.toHaveBeenCalled();
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

    expect(mockPrisma.unit.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.unit.update).not.toHaveBeenCalled();
  });

  it('should skip events with no event data', async () => {
    projection.onModuleInit();

    dataHandler({ event: undefined });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.unit.upsert).not.toHaveBeenCalled();
  });
});
