import { IndexYear } from '../index-year';

describe('IndexYear', () => {
  describe('create', () => {
    it('should create IndexYear for valid value', () => {
      const year = IndexYear.create(2026);
      expect(year.value).toBe(2026);
    });

    it('should accept boundary value 2000', () => {
      const year = IndexYear.create(2000);
      expect(year.value).toBe(2000);
    });

    it('should accept boundary value 2100', () => {
      const year = IndexYear.create(2100);
      expect(year.value).toBe(2100);
    });

    it('should throw for non-integer', () => {
      expect(() => IndexYear.create(2026.5)).toThrow('Index year must be an integer');
    });

    it('should throw for year below 2000', () => {
      expect(() => IndexYear.create(1999)).toThrow('out of range');
    });

    it('should throw for year above 2100', () => {
      expect(() => IndexYear.create(2101)).toThrow('out of range');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = IndexYear.create(2026);
      const b = IndexYear.create(2026);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = IndexYear.create(2025);
      const b = IndexYear.create(2026);
      expect(a.equals(b)).toBe(false);
    });
  });
});
