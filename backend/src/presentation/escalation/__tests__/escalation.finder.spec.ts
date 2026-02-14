import { EscalationFinder } from '../finders/escalation.finder';

describe('EscalationFinder', () => {
  let finder: EscalationFinder;
  let mockPrisma: {
    escalation: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      escalation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    finder = new EscalationFinder(mockPrisma as never);
  });

  describe('findByRentCallId', () => {
    it('should find escalation by rentCallId and userId', async () => {
      const expected = { id: 'esc-1', rentCallId: 'rc-1', userId: 'user-1' };
      mockPrisma.escalation.findFirst.mockResolvedValue(expected);

      const result = await finder.findByRentCallId('rc-1', 'user-1');

      expect(mockPrisma.escalation.findFirst).toHaveBeenCalledWith({
        where: { rentCallId: 'rc-1', userId: 'user-1' },
      });
      expect(result).toBe(expected);
    });

    it('should return null when not found', async () => {
      mockPrisma.escalation.findFirst.mockResolvedValue(null);

      const result = await finder.findByRentCallId('rc-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('findAllByEntity', () => {
    it('should find all escalations for an entity', async () => {
      const expected = [{ id: 'esc-1' }, { id: 'esc-2' }];
      mockPrisma.escalation.findMany.mockResolvedValue(expected);

      const result = await finder.findAllByEntity('entity-1', 'user-1');

      expect(mockPrisma.escalation.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-1', userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(expected);
    });
  });

  describe('findAllByRentCallIds', () => {
    it('should find escalations for given rent call IDs', async () => {
      const expected = [{ id: 'esc-1', rentCallId: 'rc-1' }];
      mockPrisma.escalation.findMany.mockResolvedValue(expected);

      const result = await finder.findAllByRentCallIds(['rc-1', 'rc-2'], 'user-1');

      expect(mockPrisma.escalation.findMany).toHaveBeenCalledWith({
        where: { rentCallId: { in: ['rc-1', 'rc-2'] }, userId: 'user-1' },
      });
      expect(result).toBe(expected);
    });

    it('should return empty array for empty input', async () => {
      const result = await finder.findAllByRentCallIds([], 'user-1');

      expect(result).toEqual([]);
      expect(mockPrisma.escalation.findMany).not.toHaveBeenCalled();
    });
  });
});
