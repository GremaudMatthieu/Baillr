import { WaterDistributionService } from '../services/water-distribution.service';

describe('WaterDistributionService', () => {
  let service: WaterDistributionService;

  beforeEach(() => {
    service = new WaterDistributionService();
  });

  describe('Scenario 1: All units metered', () => {
    it('should distribute proportionally by consumption', () => {
      const waterReadings = {
        id: 'e1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        readings: [
          { unitId: 'unit-a', previousReading: 100, currentReading: 150, readingDate: '2025-12-15' },
          { unitId: 'unit-b', previousReading: 200, currentReading: 280, readingDate: '2025-12-15' },
          { unitId: 'unit-c', previousReading: 150, currentReading: 180, readingDate: '2025-12-15' },
        ],
        totalConsumption: 160,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.compute(waterReadings, 60000, ['unit-a', 'unit-b', 'unit-c']);

      expect(result.totalWaterCents).toBe(60000);
      expect(result.totalConsumption).toBe(160);
      expect(result.distributions).toHaveLength(3);

      // A: floor(50/160 * 60000) = floor(18750) = 18750
      // B: floor(80/160 * 60000) = floor(30000) = 30000
      // C: floor(30/160 * 60000) = floor(11250) = 11250
      // Sum = 60000 → remainder = 0
      const a = result.distributions.find((d) => d.unitId === 'unit-a')!;
      const b = result.distributions.find((d) => d.unitId === 'unit-b')!;
      const c = result.distributions.find((d) => d.unitId === 'unit-c')!;

      expect(a.consumption).toBe(50);
      expect(a.isMetered).toBe(true);
      expect(b.consumption).toBe(80);
      expect(c.consumption).toBe(30);

      // Total must equal waterTotalCents exactly
      const total = a.amountCents + b.amountCents + c.amountCents;
      expect(total).toBe(60000);
    });
  });

  describe('Scenario 2: Rounding remainder distributed to first unit', () => {
    it('should distribute remainder to first metered unit', () => {
      const waterReadings = {
        id: 'e1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        readings: [
          { unitId: 'unit-a', previousReading: 0, currentReading: 1, readingDate: '2025-12-15' },
          { unitId: 'unit-b', previousReading: 0, currentReading: 1, readingDate: '2025-12-15' },
          { unitId: 'unit-c', previousReading: 0, currentReading: 1, readingDate: '2025-12-15' },
        ],
        totalConsumption: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.compute(waterReadings, 10000, ['unit-a', 'unit-b', 'unit-c']);

      // floor(1/3 * 10000) = 3333 each, sum = 9999, remainder = 1 → first unit gets 3334
      const a = result.distributions.find((d) => d.unitId === 'unit-a')!;
      const b = result.distributions.find((d) => d.unitId === 'unit-b')!;
      const c = result.distributions.find((d) => d.unitId === 'unit-c')!;

      expect(a.amountCents).toBe(3334);
      expect(b.amountCents).toBe(3333);
      expect(c.amountCents).toBe(3333);
      expect(a.amountCents + b.amountCents + c.amountCents).toBe(10000);
    });
  });

  describe('Scenario 3: No readings', () => {
    it('should return null distributions when no readings', () => {
      const result = service.compute(null, 60000, ['unit-a', 'unit-b']);

      expect(result.distributions).toHaveLength(2);
      // No readings → equal split
      expect(result.distributions[0].amountCents).toBe(30000);
      expect(result.distributions[1].amountCents).toBe(30000);
      expect(result.distributions[0].isMetered).toBe(false);
    });
  });

  describe('Scenario 4: Zero total consumption', () => {
    it('should equal split when total consumption is zero', () => {
      const waterReadings = {
        id: 'e1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        readings: [
          { unitId: 'unit-a', previousReading: 100, currentReading: 100, readingDate: '2025-12-15' },
          { unitId: 'unit-b', previousReading: 200, currentReading: 200, readingDate: '2025-12-15' },
        ],
        totalConsumption: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.compute(waterReadings, 10000, ['unit-a', 'unit-b']);

      expect(result.distributions[0].amountCents).toBe(5000);
      expect(result.distributions[1].amountCents).toBe(5000);
    });
  });

  describe('Scenario 5: No water charges', () => {
    it('should return zero amounts when water total is 0', () => {
      const result = service.compute(null, 0, ['unit-a', 'unit-b']);

      expect(result.distributions.every((d) => d.amountCents === 0)).toBe(true);
    });
  });

  describe('Scenario 6: Empty unit list', () => {
    it('should return empty distributions', () => {
      const result = service.compute(null, 60000, []);

      expect(result.distributions).toHaveLength(0);
    });
  });

  describe('Scenario 7: Unmetered units get 0', () => {
    it('should give unmetered units 0 cents', () => {
      const waterReadings = {
        id: 'e1-2025',
        entityId: 'entity-1',
        userId: 'user-1',
        fiscalYear: 2025,
        readings: [
          { unitId: 'unit-a', previousReading: 100, currentReading: 150, readingDate: '2025-12-15' },
        ],
        totalConsumption: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.compute(waterReadings, 60000, ['unit-a', 'unit-b']);

      const a = result.distributions.find((d) => d.unitId === 'unit-a')!;
      const b = result.distributions.find((d) => d.unitId === 'unit-b')!;

      expect(a.amountCents).toBe(60000);
      expect(a.isMetered).toBe(true);
      expect(b.amountCents).toBe(0);
      expect(b.isMetered).toBe(false);
    });
  });
});
