import { WaterMeterReadingsProjection } from '../projections/water-meter-readings.projection';

describe('WaterMeterReadingsProjection', () => {
  let projection: WaterMeterReadingsProjection;
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };
  let mockPrisma: {
    waterMeterReadings: {
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
      waterMeterReadings: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    projection = new WaterMeterReadingsProjection(mockKurrentDb as never, mockPrisma as never);
  });

  describe('onModuleInit', () => {
    it('should subscribe to event stream on init', () => {
      projection.onModuleInit();
      expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalled();
    });
  });

  describe('handleEvent (via private method access)', () => {
    const handle = (p: WaterMeterReadingsProjection, type: string, data: Record<string, unknown>) =>
      (
        p as unknown as { handleEvent: (t: string, d: Record<string, unknown>) => Promise<void> }
      ).handleEvent(type, data);

    const validData = {
      waterMeterReadingsId: 'entity1-2025',
      entityId: 'entity-1',
      userId: 'user-1',
      fiscalYear: 2025,
      readings: [
        { unitId: 'unit-a', previousReading: 100, currentReading: 150, readingDate: '2025-12-15T00:00:00.000Z' },
        { unitId: 'unit-b', previousReading: 200, currentReading: 280, readingDate: '2025-12-15T00:00:00.000Z' },
      ],
      totalConsumption: 130,
      recordedAt: '2026-02-15T10:00:00Z',
    };

    it('should upsert WaterMeterReadings on WaterMeterReadingsEntered event', async () => {
      await handle(projection, 'WaterMeterReadingsEntered', validData);

      expect(mockPrisma.waterMeterReadings.upsert).toHaveBeenCalledWith({
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
          readings: validData.readings,
          totalConsumption: 130,
        },
        update: {
          readings: validData.readings,
          totalConsumption: 130,
        },
      });
    });

    it('should handle overwrite (upsert updates existing)', async () => {
      const updatedData = {
        ...validData,
        readings: [
          { unitId: 'unit-a', previousReading: 100, currentReading: 200, readingDate: '2025-12-20T00:00:00.000Z' },
        ],
        totalConsumption: 100,
      };

      await handle(projection, 'WaterMeterReadingsEntered', updatedData);

      expect(mockPrisma.waterMeterReadings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            readings: updatedData.readings,
            totalConsumption: 100,
          },
        }),
      );
    });

    it('should skip invalid event data', async () => {
      const invalidData = { waterMeterReadingsId: 'test-id' };

      await handle(projection, 'WaterMeterReadingsEntered', invalidData);

      expect(mockPrisma.waterMeterReadings.upsert).not.toHaveBeenCalled();
    });

    it('should ignore unknown event types', async () => {
      await handle(projection, 'UnknownEvent', {});

      expect(mockPrisma.waterMeterReadings.upsert).not.toHaveBeenCalled();
    });
  });
});
