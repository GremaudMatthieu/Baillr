import { InseeIndexProjection } from '../projections/insee-index.projection';

describe('InseeIndexProjection', () => {
  let projection: InseeIndexProjection;
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };
  let mockPrisma: {
    inseeIndex: {
      findUnique: jest.Mock;
      create: jest.Mock;
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
      inseeIndex: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    projection = new InseeIndexProjection(
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
    it('should create InseeIndex on IndexRecorded event', async () => {
      mockPrisma.inseeIndex.findUnique.mockResolvedValue(null);
      mockPrisma.inseeIndex.create.mockResolvedValue({});

      const data = {
        indexId: 'test-id',
        type: 'IRL',
        quarter: 'Q1',
        year: 2026,
        value: 142.06,
        entityId: 'entity-1',
        userId: 'user-1',
        recordedAt: '2026-02-14T10:00:00Z',
      };

      // Access private method via prototype
      await (projection as unknown as { handleEvent: (t: string, d: Record<string, unknown>) => Promise<void> }).handleEvent(
        'IndexRecorded',
        data as unknown as Record<string, unknown>,
      );

      expect(mockPrisma.inseeIndex.create).toHaveBeenCalledWith({
        data: {
          id: 'test-id',
          type: 'IRL',
          quarter: 'Q1',
          year: 2026,
          value: 142.06,
          entityId: 'entity-1',
          userId: 'user-1',
        },
      });
    });

    it('should skip duplicate records (idempotent)', async () => {
      mockPrisma.inseeIndex.findUnique.mockResolvedValue({ id: 'test-id' });

      const data = {
        indexId: 'test-id',
        type: 'IRL',
        quarter: 'Q1',
        year: 2026,
        value: 142.06,
        entityId: 'entity-1',
        userId: 'user-1',
        recordedAt: '2026-02-14T10:00:00Z',
      };

      await (projection as unknown as { handleEvent: (t: string, d: Record<string, unknown>) => Promise<void> }).handleEvent(
        'IndexRecorded',
        data as unknown as Record<string, unknown>,
      );

      expect(mockPrisma.inseeIndex.create).not.toHaveBeenCalled();
    });

    it('should skip invalid event data', async () => {
      const invalidData = { indexId: 'test-id' }; // Missing required fields

      await (projection as unknown as { handleEvent: (t: string, d: Record<string, unknown>) => Promise<void> }).handleEvent(
        'IndexRecorded',
        invalidData,
      );

      expect(mockPrisma.inseeIndex.create).not.toHaveBeenCalled();
    });

    it('should ignore unknown event types', async () => {
      await (projection as unknown as { handleEvent: (t: string, d: Record<string, unknown>) => Promise<void> }).handleEvent(
        'UnknownEvent',
        {},
      );

      expect(mockPrisma.inseeIndex.findUnique).not.toHaveBeenCalled();
    });
  });
});
