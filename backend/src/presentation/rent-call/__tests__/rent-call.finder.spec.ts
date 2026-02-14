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
      mockPrisma.rentCall.findMany.mockResolvedValue([
        { id: 'rc-1' },
        { id: 'rc-3' },
      ]);

      const result = await finder.findPaidRentCallIds(
        'entity-1',
        'user_123',
        '2026-02',
      );

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

      const result = await finder.findPaidRentCallIds(
        'entity-1',
        'user_123',
        '2026-02',
      );

      expect(result).toEqual([]);
    });
  });
});
