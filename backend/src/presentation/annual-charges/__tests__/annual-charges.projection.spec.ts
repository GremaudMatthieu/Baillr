import { AnnualChargesProjection } from '../projections/annual-charges.projection';

describe('AnnualChargesProjection', () => {
  let projection: AnnualChargesProjection;
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };
  let mockPrisma: {
    annualCharges: {
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
      annualCharges: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    projection = new AnnualChargesProjection(
      mockKurrentDb as never,
      mockPrisma as never,
    );
  });

  describe('onModuleInit', () => {
    it('should subscribe to event stream on init', () => {
      projection.onModuleInit();
      expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalled();
    });
  });

  describe('handleEvent (via private method access)', () => {
    const handle = (p: AnnualChargesProjection, type: string, data: Record<string, unknown>) =>
      (p as unknown as { handleEvent: (t: string, d: Record<string, unknown>) => Promise<void> })
        .handleEvent(type, data);

    const validData = {
      annualChargesId: 'entity1-2025',
      entityId: 'entity-1',
      userId: 'user-1',
      fiscalYear: 2025,
      charges: [
        { category: 'water', label: 'Eau', amountCents: 45000 },
        { category: 'electricity', label: 'Électricité', amountCents: 30000 },
      ],
      totalAmountCents: 75000,
      recordedAt: '2026-02-14T10:00:00Z',
    };

    it('should upsert AnnualCharges on AnnualChargesRecorded event', async () => {
      await handle(projection, 'AnnualChargesRecorded', validData);

      expect(mockPrisma.annualCharges.upsert).toHaveBeenCalledWith({
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
          charges: validData.charges,
          totalAmountCents: 75000,
        },
        update: {
          charges: validData.charges,
          totalAmountCents: 75000,
        },
      });
    });

    it('should handle overwrite (upsert updates existing)', async () => {
      const updatedData = {
        ...validData,
        charges: [{ category: 'water', label: 'Eau', amountCents: 50000 }],
        totalAmountCents: 50000,
      };

      await handle(projection, 'AnnualChargesRecorded', updatedData);

      expect(mockPrisma.annualCharges.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            charges: updatedData.charges,
            totalAmountCents: 50000,
          },
        }),
      );
    });

    it('should skip invalid event data', async () => {
      const invalidData = { annualChargesId: 'test-id' };

      await handle(projection, 'AnnualChargesRecorded', invalidData);

      expect(mockPrisma.annualCharges.upsert).not.toHaveBeenCalled();
    });

    it('should ignore unknown event types', async () => {
      await handle(projection, 'UnknownEvent', {});

      expect(mockPrisma.annualCharges.upsert).not.toHaveBeenCalled();
    });
  });
});
