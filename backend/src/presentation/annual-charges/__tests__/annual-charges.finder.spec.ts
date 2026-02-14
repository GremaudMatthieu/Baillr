import { AnnualChargesFinder } from '../finders/annual-charges.finder';

describe('AnnualChargesFinder', () => {
  let finder: AnnualChargesFinder;
  let mockPrisma: {
    annualCharges: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      annualCharges: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    finder = new AnnualChargesFinder(mockPrisma as never);
  });

  describe('findByEntityAndYear', () => {
    it('should query by entityId and fiscalYear', async () => {
      const expected = { id: 'e1-2025', fiscalYear: 2025 };
      mockPrisma.annualCharges.findUnique.mockResolvedValue(expected);

      const result = await finder.findByEntityAndYear('entity-1', 2025);

      expect(result).toEqual(expected);
      expect(mockPrisma.annualCharges.findUnique).toHaveBeenCalledWith({
        where: {
          entityId_fiscalYear: { entityId: 'entity-1', fiscalYear: 2025 },
        },
      });
    });

    it('should return null when not found', async () => {
      mockPrisma.annualCharges.findUnique.mockResolvedValue(null);

      const result = await finder.findByEntityAndYear('entity-1', 2025);

      expect(result).toBeNull();
    });
  });

  describe('findAllByEntity', () => {
    it('should return all years ordered by fiscal year desc', async () => {
      const expected = [
        { id: 'e1-2025', fiscalYear: 2025 },
        { id: 'e1-2024', fiscalYear: 2024 },
      ];
      mockPrisma.annualCharges.findMany.mockResolvedValue(expected);

      const result = await finder.findAllByEntity('entity-1');

      expect(result).toEqual(expected);
      expect(mockPrisma.annualCharges.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-1' },
        orderBy: { fiscalYear: 'desc' },
      });
    });

    it('should return empty array when no charges', async () => {
      mockPrisma.annualCharges.findMany.mockResolvedValue([]);

      const result = await finder.findAllByEntity('entity-1');

      expect(result).toEqual([]);
    });
  });
});
