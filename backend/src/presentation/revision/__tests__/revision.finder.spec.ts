import { RevisionFinder } from '../finders/revision.finder';

describe('RevisionFinder', () => {
  let finder: RevisionFinder;
  let mockPrisma: {
    revision: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      revision: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    finder = new RevisionFinder(mockPrisma as never);
  });

  describe('findAllByEntity', () => {
    it('should query revisions ordered by calculatedAt desc', async () => {
      await finder.findAllByEntity('entity-1');
      expect(mockPrisma.revision.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-1' },
        orderBy: { calculatedAt: 'desc' },
      });
    });
  });

  describe('findPendingByEntity', () => {
    it('should query only pending revisions', async () => {
      await finder.findPendingByEntity('entity-1');
      expect(mockPrisma.revision.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-1', status: 'pending' },
        orderBy: { calculatedAt: 'desc' },
      });
    });
  });

  describe('findByIdAndEntity', () => {
    it('should query by id and entityId', async () => {
      const revision = { id: 'rev-1', entityId: 'entity-1', status: 'approved' };
      mockPrisma.revision.findFirst.mockResolvedValue(revision);

      const result = await finder.findByIdAndEntity('rev-1', 'entity-1');
      expect(result).toEqual(revision);
      expect(mockPrisma.revision.findFirst).toHaveBeenCalledWith({
        where: { id: 'rev-1', entityId: 'entity-1' },
      });
    });

    it('should return null when not found', async () => {
      const result = await finder.findByIdAndEntity('rev-1', 'entity-1');
      expect(result).toBeNull();
    });
  });

  describe('existsByLeaseAndPeriod', () => {
    it('should return true when revision exists', async () => {
      mockPrisma.revision.count.mockResolvedValue(1);
      const result = await finder.existsByLeaseAndPeriod('lease-1', 2025, 'Q2');
      expect(result).toBe(true);
    });

    it('should return false when no revision exists', async () => {
      const result = await finder.existsByLeaseAndPeriod('lease-1', 2025, 'Q2');
      expect(result).toBe(false);
    });
  });
});
