import { RentCallFinder } from '../finders/rent-call.finder';

const mockPrisma = {
  rentCall: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('RentCallFinder', () => {
  let finder: RentCallFinder;

  beforeEach(() => {
    jest.clearAllMocks();
    finder = new RentCallFinder(mockPrisma as any);
  });

  describe('findPaidRentCallIds', () => {
    it('should return only IDs of paid rent calls', async () => {
      mockPrisma.rentCall.findMany.mockResolvedValue([{ id: 'rc-1' }, { id: 'rc-3' }]);

      const result = await finder.findPaidRentCallIds('entity-1', 'user_123', '2026-02');

      expect(result).toEqual(['rc-1', 'rc-3']);
      expect(mockPrisma.rentCall.findMany).toHaveBeenCalledWith({
        where: {
          entityId: 'entity-1',
          userId: 'user_123',
          month: '2026-02',
          paidAt: { not: null },
        },
        select: { id: true },
      });
    });

    it('should return empty array when no paid rent calls', async () => {
      mockPrisma.rentCall.findMany.mockResolvedValue([]);

      const result = await finder.findPaidRentCallIds('entity-1', 'user_123', '2026-02');

      expect(result).toEqual([]);
    });
  });

  describe('findAllByEntityAndUser', () => {
    it('should include tenant data in results', async () => {
      const mockResult = [
        {
          id: 'rc-1',
          entityId: 'entity-1',
          tenant: { firstName: 'Jean', lastName: 'Dupont', companyName: null, type: 'individual' },
        },
      ];
      mockPrisma.rentCall.findMany.mockResolvedValue(mockResult);

      const result = await finder.findAllByEntityAndUser('entity-1', 'user_123', '2026-02');

      expect(result).toEqual(mockResult);
      expect(mockPrisma.rentCall.findMany).toHaveBeenCalledWith({
        where: {
          entityId: 'entity-1',
          userId: 'user_123',
          month: '2026-02',
        },
        include: {
          tenant: {
            select: { firstName: true, lastName: true, companyName: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should not filter by month when month is undefined', async () => {
      mockPrisma.rentCall.findMany.mockResolvedValue([]);

      await finder.findAllByEntityAndUser('entity-1', 'user_123');

      expect(mockPrisma.rentCall.findMany).toHaveBeenCalledWith({
        where: {
          entityId: 'entity-1',
          userId: 'user_123',
        },
        include: {
          tenant: {
            select: { firstName: true, lastName: true, companyName: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
