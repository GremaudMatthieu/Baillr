import { ChargeRegularizationProjection } from '../projections/charge-regularization.projection';

describe('ChargeRegularizationProjection', () => {
  let projection: ChargeRegularizationProjection;
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };
  let mockPrisma: {
    chargeRegularization: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
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
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
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
            provisionsPaidCents: 75000,
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

    it('should update appliedAt on ChargeRegularizationApplied event', async () => {
      const appliedData = {
        chargeRegularizationId: 'entity1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        statements: validStatements,
        appliedAt: '2026-02-15T14:00:00.000Z',
      };

      mockPrisma.chargeRegularization.findUnique.mockResolvedValue({
        id: 'entity1-2025',
      });

      await handle(projection, 'ChargeRegularizationApplied', appliedData);

      expect(mockPrisma.chargeRegularization.update).toHaveBeenCalledWith({
        where: { id: 'entity1-2025' },
        data: { appliedAt: new Date('2026-02-15T14:00:00.000Z') },
      });
    });

    it('should skip applied event if regularization not found', async () => {
      const appliedData = {
        chargeRegularizationId: 'entity1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        statements: [],
        appliedAt: '2026-02-15T14:00:00.000Z',
      };

      mockPrisma.chargeRegularization.findUnique.mockResolvedValue(null);

      await handle(projection, 'ChargeRegularizationApplied', appliedData);

      expect(mockPrisma.chargeRegularization.update).not.toHaveBeenCalled();
    });

    it('should skip applied event with invalid data', async () => {
      const invalidApplied = { chargeRegularizationId: 'test-id' };

      await handle(projection, 'ChargeRegularizationApplied', invalidApplied);

      expect(mockPrisma.chargeRegularization.findUnique).not.toHaveBeenCalled();
    });

    it('should update sentAt on ChargeRegularizationSent event', async () => {
      const sentData = {
        chargeRegularizationId: 'entity1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        sentCount: 2,
        sentAt: '2026-02-16T10:00:00.000Z',
      };

      mockPrisma.chargeRegularization.findUnique.mockResolvedValue({
        id: 'entity1-2025',
      });

      await handle(projection, 'ChargeRegularizationSent', sentData);

      expect(mockPrisma.chargeRegularization.update).toHaveBeenCalledWith({
        where: { id: 'entity1-2025' },
        data: { sentAt: new Date('2026-02-16T10:00:00.000Z') },
      });
    });

    it('should skip sent event if regularization not found', async () => {
      const sentData = {
        chargeRegularizationId: 'entity1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        sentCount: 2,
        sentAt: '2026-02-16T10:00:00.000Z',
      };

      mockPrisma.chargeRegularization.findUnique.mockResolvedValue(null);

      await handle(projection, 'ChargeRegularizationSent', sentData);

      expect(mockPrisma.chargeRegularization.update).not.toHaveBeenCalled();
    });

    it('should skip sent event with invalid data', async () => {
      const invalidSent = { chargeRegularizationId: 'test-id' };

      await handle(projection, 'ChargeRegularizationSent', invalidSent);

      expect(mockPrisma.chargeRegularization.findUnique).not.toHaveBeenCalled();
    });

    it('should update settledAt on ChargeRegularizationSettled event', async () => {
      const settledData = {
        chargeRegularizationId: 'entity1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        settledAt: '2026-02-16T12:00:00.000Z',
      };

      mockPrisma.chargeRegularization.findUnique.mockResolvedValue({
        id: 'entity1-2025',
      });

      await handle(projection, 'ChargeRegularizationSettled', settledData);

      expect(mockPrisma.chargeRegularization.update).toHaveBeenCalledWith({
        where: { id: 'entity1-2025' },
        data: { settledAt: new Date('2026-02-16T12:00:00.000Z') },
      });
    });

    it('should skip settled event if regularization not found', async () => {
      const settledData = {
        chargeRegularizationId: 'entity1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        settledAt: '2026-02-16T12:00:00.000Z',
      };

      mockPrisma.chargeRegularization.findUnique.mockResolvedValue(null);

      await handle(projection, 'ChargeRegularizationSettled', settledData);

      expect(mockPrisma.chargeRegularization.update).not.toHaveBeenCalled();
    });

    it('should skip settled event with invalid data', async () => {
      const invalidSettled = { chargeRegularizationId: 'test-id' };

      await handle(projection, 'ChargeRegularizationSettled', invalidSettled);

      expect(mockPrisma.chargeRegularization.findUnique).not.toHaveBeenCalled();
    });
  });
});
