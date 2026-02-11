import { PropertyProjection } from '../projections/property.projection';

describe('PropertyProjection', () => {
  let projection: PropertyProjection;
  let mockPrisma: {
    property: {
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
      property: {
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

    projection = new PropertyProjection(mockKurrentDb as never, mockPrisma as never);
  });

  it('should subscribe to KurrentDB on module init', () => {
    projection.onModuleInit();

    expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalledTimes(1);
  });

  it('should upsert property on PropertyCreated event', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'PropertyCreated',
        data: {
          id: 'prop-1',
          entityId: 'entity-1',
          userId: 'user_clerk_123',
          name: 'Résidence A',
          type: 'Immeuble',
          address: {
            street: '1 rue Test',
            postalCode: '75001',
            city: 'Paris',
            country: 'France',
            complement: null,
          },
        },
      },
    });

    // Allow async handler to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.property.upsert).toHaveBeenCalledWith({
      where: { id: 'prop-1' },
      create: {
        id: 'prop-1',
        entityId: 'entity-1',
        userId: 'user_clerk_123',
        name: 'Résidence A',
        type: 'Immeuble',
        addressStreet: '1 rue Test',
        addressPostalCode: '75001',
        addressCity: 'Paris',
        addressCountry: 'France',
        addressComplement: null,
      },
      update: {},
    });
  });

  it('should update property on PropertyUpdated event when exists', async () => {
    mockPrisma.property.findUnique.mockResolvedValue({ id: 'prop-1' });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'PropertyUpdated',
        data: {
          id: 'prop-1',
          name: 'Updated Name',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.property.findUnique).toHaveBeenCalledWith({
      where: { id: 'prop-1' },
      select: { id: true },
    });
    expect(mockPrisma.property.update).toHaveBeenCalledWith({
      where: { id: 'prop-1' },
      data: { name: 'Updated Name' },
    });
  });

  it('should warn and skip when PropertyUpdated for missing read model', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(null);
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'PropertyUpdated',
        data: {
          id: 'missing-prop',
          name: 'Updated Name',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.property.update).not.toHaveBeenCalled();
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

    expect(mockPrisma.property.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.property.update).not.toHaveBeenCalled();
  });

  it('should skip events with no event data', async () => {
    projection.onModuleInit();

    dataHandler({ event: undefined });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.property.upsert).not.toHaveBeenCalled();
  });
});
