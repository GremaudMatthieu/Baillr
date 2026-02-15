import { MeterReading } from '../meter-reading';
import { InvalidMeterReadingException } from '../exceptions/invalid-meter-reading.exception';

describe('MeterReading', () => {
  const validData = {
    unitId: 'unit-1',
    previousReading: 100,
    currentReading: 150,
    readingDate: '2025-12-15T00:00:00.000Z',
  };

  describe('fromPrimitives', () => {
    it('should create a valid meter reading', () => {
      const reading = MeterReading.fromPrimitives(validData);
      const primitives = reading.toPrimitives();

      expect(primitives.unitId).toBe('unit-1');
      expect(primitives.previousReading).toBe(100);
      expect(primitives.currentReading).toBe(150);
      expect(primitives.readingDate).toBe('2025-12-15T00:00:00.000Z');
    });

    it('should compute consumption as currentReading - previousReading', () => {
      const reading = MeterReading.fromPrimitives(validData);
      expect(reading.consumption).toBe(50);
    });

    it('should accept zero consumption (same readings)', () => {
      const reading = MeterReading.fromPrimitives({
        ...validData,
        previousReading: 100,
        currentReading: 100,
      });
      expect(reading.consumption).toBe(0);
    });

    it('should throw for missing unitId', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, unitId: '' }),
      ).toThrow('Unit ID is required');
    });

    it('should throw for negative previousReading', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, previousReading: -1 }),
      ).toThrow('non-negative integer');
    });

    it('should throw for non-integer previousReading', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, previousReading: 10.5 }),
      ).toThrow('non-negative integer');
    });

    it('should throw for negative currentReading', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, currentReading: -1 }),
      ).toThrow('non-negative integer');
    });

    it('should throw for non-integer currentReading', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, currentReading: 10.5 }),
      ).toThrow('non-negative integer');
    });

    it('should throw when currentReading < previousReading', () => {
      expect(() =>
        MeterReading.fromPrimitives({
          ...validData,
          previousReading: 200,
          currentReading: 100,
        }),
      ).toThrow('must be >= previous reading');
    });

    it('should throw for reading > 99,999,999', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, currentReading: 100_000_000 }),
      ).toThrow('must not exceed');
    });

    it('should throw for previousReading > 99,999,999', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, previousReading: 100_000_000 }),
      ).toThrow('must not exceed');
    });

    it('should throw for invalid reading date', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, readingDate: 'not-a-date' }),
      ).toThrow('valid ISO date');
    });

    it('should throw for empty reading date', () => {
      expect(() =>
        MeterReading.fromPrimitives({ ...validData, readingDate: '' }),
      ).toThrow('valid ISO date');
    });
  });

  describe('equals', () => {
    it('should return true for identical readings', () => {
      const a = MeterReading.fromPrimitives(validData);
      const b = MeterReading.fromPrimitives(validData);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different readings', () => {
      const a = MeterReading.fromPrimitives(validData);
      const b = MeterReading.fromPrimitives({ ...validData, currentReading: 200 });
      expect(a.equals(b)).toBe(false);
    });
  });
});
