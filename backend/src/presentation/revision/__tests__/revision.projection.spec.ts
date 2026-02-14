import { RevisionProjection } from '../projections/revision.projection';

describe('RevisionProjection', () => {
  let projection: RevisionProjection;
  let mockKurrentDb: { client: { subscribeToAll: jest.Mock } };
  let mockPrisma: {
    revision: {
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
      revision: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    projection = new RevisionProjection(
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

  describe('handleEvent', () => {
    const validData = {
      revisionId: 'rev-1',
      leaseId: 'lease-1',
      entityId: 'entity-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      tenantName: 'Dupont Jean',
      unitLabel: 'Apt A',
      currentRentCents: 75000,
      newRentCents: 77097,
      differenceCents: 2097,
      baseIndexValue: 138.19,
      baseIndexQuarter: 'Q2',
      newIndexValue: 142.06,
      newIndexQuarter: 'Q2',
      newIndexYear: 2025,
      revisionIndexType: 'IRL',
      calculatedAt: '2026-02-14T10:00:00Z',
    };

    it('should create Revision on RentRevisionCalculated event', async () => {
      mockPrisma.revision.findUnique.mockResolvedValue(null);
      mockPrisma.revision.create.mockResolvedValue({});

      await (
        projection as unknown as {
          handleEvent: (
            t: string,
            d: Record<string, unknown>,
          ) => Promise<void>;
        }
      ).handleEvent(
        'RentRevisionCalculated',
        validData as unknown as Record<string, unknown>,
      );

      expect(mockPrisma.revision.create).toHaveBeenCalledWith({
        data: {
          id: 'rev-1',
          leaseId: 'lease-1',
          entityId: 'entity-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          tenantName: 'Dupont Jean',
          unitLabel: 'Apt A',
          currentRentCents: 75000,
          newRentCents: 77097,
          differenceCents: 2097,
          baseIndexValue: 138.19,
          baseIndexQuarter: 'Q2',
          newIndexValue: 142.06,
          newIndexQuarter: 'Q2',
          newIndexYear: 2025,
          revisionIndexType: 'IRL',
          calculatedAt: new Date('2026-02-14T10:00:00Z'),
        },
      });
    });

    it('should skip duplicate records (idempotent)', async () => {
      mockPrisma.revision.findUnique.mockResolvedValue({ id: 'rev-1' });

      await (
        projection as unknown as {
          handleEvent: (
            t: string,
            d: Record<string, unknown>,
          ) => Promise<void>;
        }
      ).handleEvent(
        'RentRevisionCalculated',
        validData as unknown as Record<string, unknown>,
      );

      expect(mockPrisma.revision.create).not.toHaveBeenCalled();
    });

    it('should skip invalid event data', async () => {
      const invalidData = { revisionId: 'rev-1' };

      await (
        projection as unknown as {
          handleEvent: (
            t: string,
            d: Record<string, unknown>,
          ) => Promise<void>;
        }
      ).handleEvent('RentRevisionCalculated', invalidData);

      expect(mockPrisma.revision.create).not.toHaveBeenCalled();
    });

    it('should ignore unknown event types', async () => {
      await (
        projection as unknown as {
          handleEvent: (
            t: string,
            d: Record<string, unknown>,
          ) => Promise<void>;
        }
      ).handleEvent('UnknownEvent', {});

      expect(mockPrisma.revision.findUnique).not.toHaveBeenCalled();
    });
  });
});
