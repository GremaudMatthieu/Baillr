import { WaterMeterReadingsFinder } from '../finders/water-meter-readings.finder';

describe('WaterMeterReadingsFinder', () => {
  let finder: WaterMeterReadingsFinder;
  let mockPrisma: {
    waterMeterReadings: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      waterMeterReadings: {
        findUnique: jest.fn(),
      },
    };
    finder = new WaterMeterReadingsFinder(mockPrisma as never);
  });

  describe('findByEntityAndYear', () => {
    it('should query by entityId and fiscalYear', async () => {
      const expected = { id: 'e1-2025', fiscalYear: 2025, readings: [] };
      mockPrisma.waterMeterReadings.findUnique.mockResolvedValue(expected);

      const result = await finder.findByEntityAndYear('entity-1', 2025);

      expect(result).toEqual(expected);
      expect(mockPrisma.waterMeterReadings.findUnique).toHaveBeenCalledWith({
        where: {
          entityId_fiscalYear: { entityId: 'entity-1', fiscalYear: 2025 },
        },
      });
    });

    it('should return null when not found', async () => {
      mockPrisma.waterMeterReadings.findUnique.mockResolvedValue(null);

      const result = await finder.findByEntityAndYear('entity-1', 2025);

      expect(result).toBeNull();
    });
  });
});
