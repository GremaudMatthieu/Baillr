import { TenantProjection } from '../projections/tenant.projection';

describe('TenantProjection', () => {
  let projection: TenantProjection;
  let mockPrisma: {
    tenant: {
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
      tenant: {
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

    projection = new TenantProjection(mockKurrentDb as never, mockPrisma as never);
  });

  it('should subscribe to KurrentDB on module init', () => {
    projection.onModuleInit();

    expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalledTimes(1);
  });

  it('should upsert tenant on TenantRegistered event', async () => {
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'TenantRegistered',
        data: {
          id: 'tenant-1',
          entityId: 'entity-1',
          userId: 'user_clerk_123',
          type: 'individual',
          firstName: 'Jean',
          lastName: 'Dupont',
          companyName: null,
          siret: null,
          email: 'jean@example.com',
          phoneNumber: '+33612345678',
          address: {
            street: '1 rue Test',
            postalCode: '75001',
            city: 'Paris',
            complement: null,
          },
          insuranceProvider: 'MAIF',
          policyNumber: 'POL-2026-001',
          renewalDate: '2026-12-31T00:00:00.000Z',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.tenant.upsert).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      create: {
        id: 'tenant-1',
        entityId: 'entity-1',
        userId: 'user_clerk_123',
        type: 'individual',
        firstName: 'Jean',
        lastName: 'Dupont',
        companyName: null,
        siret: null,
        email: 'jean@example.com',
        phoneNumber: '+33612345678',
        addressStreet: '1 rue Test',
        addressPostalCode: '75001',
        addressCity: 'Paris',
        addressComplement: null,
        insuranceProvider: 'MAIF',
        policyNumber: 'POL-2026-001',
        renewalDate: new Date('2026-12-31T00:00:00.000Z'),
      },
      update: {},
    });
  });

  it('should update tenant on TenantUpdated event when exists', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'TenantUpdated',
        data: {
          id: 'tenant-1',
          firstName: 'Jean-Pierre',
          email: 'jp@example.com',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      select: { id: true },
    });
    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { firstName: 'Jean-Pierre', email: 'jp@example.com' },
    });
  });

  it('should update address fields on TenantUpdated event', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'TenantUpdated',
        data: {
          id: 'tenant-1',
          address: {
            street: '5 avenue Foch',
            postalCode: '31000',
            city: 'Toulouse',
            complement: 'Bâtiment B',
          },
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: {
        addressStreet: '5 avenue Foch',
        addressPostalCode: '31000',
        addressCity: 'Toulouse',
        addressComplement: 'Bâtiment B',
      },
    });
  });

  it('should update insurance fields on TenantUpdated event', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'TenantUpdated',
        data: {
          id: 'tenant-1',
          insuranceProvider: 'AXA',
          policyNumber: 'AXA-123',
          renewalDate: '2027-06-15T00:00:00.000Z',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: {
        insuranceProvider: 'AXA',
        policyNumber: 'AXA-123',
        renewalDate: new Date('2027-06-15T00:00:00.000Z'),
      },
    });
  });

  it('should clear insurance fields when set to null on TenantUpdated', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'TenantUpdated',
        data: {
          id: 'tenant-1',
          insuranceProvider: null,
          policyNumber: null,
          renewalDate: null,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: {
        insuranceProvider: null,
        policyNumber: null,
        renewalDate: null,
      },
    });
  });

  it('should warn and skip when TenantUpdated for missing read model', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    projection.onModuleInit();

    dataHandler({
      event: {
        type: 'TenantUpdated',
        data: {
          id: 'missing-tenant',
          firstName: 'Updated Name',
        },
      },
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
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

    expect(mockPrisma.tenant.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
  });

  it('should skip events with no event data', async () => {
    projection.onModuleInit();

    dataHandler({ event: undefined });

    await new Promise((r) => setTimeout(r, 10));

    expect(mockPrisma.tenant.upsert).not.toHaveBeenCalled();
  });
});
