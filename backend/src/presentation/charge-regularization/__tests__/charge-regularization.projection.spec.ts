import { ChargeRegularizationProjection } from '../projections/charge-regularization.projection';

describe('ChargeRegularizationProjection', () => {
  let projection: ChargeRegularizationProjection;
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };
  let mockPrisma: {
    chargeRegularization: {
      upsert: jest.Mock;
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
      chargeRegularization: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    projection = new ChargeRegularizationProjection(mockKurrentDb as never, mockPrisma as never);
  });

  describe('onModuleInit', () => {
    it('should subscribe to event stream on init', () => {
      projection.onModuleInit();
      expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalled();
    });
  });

  describe('handleEvent (via private method access)', () => {
    const handle = (
      p: ChargeRegularizationProjection,
      type: string,
      data: Record<string, unknown>,
    ) =>
      (
        p as unknown as {
          handleEvent: (t: string, d: Record<string, unknown>) => Promise<void>;
        }
      ).handleEvent(type, data);

    const validStatements = [
      {
        leaseId: 'lease-1',
        tenantId: 'tenant-1',
        tenantName: 'Dupont',
        unitId: 'unit-1',
        unitIdentifier: 'Apt A',
        occupancyStart: '2025-01-01',
        occupancyEnd: '2025-12-31',
        occupiedDays: 365,
        daysInYear: 365,
        charges: [
          {
            chargeCategoryId: 'cat-teom',
            label: 'TEOM',
            totalChargeCents: 80000,
            tenantShareCents: 80000,
            isWaterByConsumption: false,
          },
        ],
        totalShareCents: 80000,
        totalProvisionsPaidCents: 75000,
        balanceCents: 5000,
      },
    ];

    const validData = {
      chargeRegularizationId: 'entity1-2025',
      entityId: 'entity-1',
      userId: 'user-1',
      fiscalYear: 2025,
      statements: validStatements,
      totalBalanceCents: 5000,
      calculatedAt: '2026-02-15T10:00:00Z',
    };

    it('should upsert ChargeRegularization on ChargeRegularizationCalculated event', async () => {
      await handle(projection, 'ChargeRegularizationCalculated', validData);

      expect(mockPrisma.chargeRegularization.upsert).toHaveBeenCalledWith({
        where: {
          entityId_fiscalYear: {
            entityId: 'entity-1',
            fiscalYear: 2025,
          },
        },
        create: {
          id: 'entity1-2025',
          entityId: 'entity-1',
          userId: 'user-1',
          fiscalYear: 2025,
          statements: validStatements,
          totalBalanceCents: 5000,
        },
        update: {
          statements: validStatements,
          totalBalanceCents: 5000,
        },
      });
    });

    it('should handle overwrite (upsert updates existing)', async () => {
      const updatedData = {
        ...validData,
        totalBalanceCents: -3000,
      };

      await handle(projection, 'ChargeRegularizationCalculated', updatedData);

      expect(mockPrisma.chargeRegularization.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            statements: validStatements,
            totalBalanceCents: -3000,
          },
        }),
      );
    });

    it('should skip invalid event data', async () => {
      const invalidData = { chargeRegularizationId: 'test-id' };

      await handle(projection, 'ChargeRegularizationCalculated', invalidData);

      expect(mockPrisma.chargeRegularization.upsert).not.toHaveBeenCalled();
    });

    it('should ignore unknown event types', async () => {
      await handle(projection, 'UnknownEvent', {});

      expect(mockPrisma.chargeRegularization.upsert).not.toHaveBeenCalled();
    });
  });
});
