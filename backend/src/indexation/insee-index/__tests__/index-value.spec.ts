import { IndexValue } from '../index-value';

describe('IndexValue', () => {
  describe('create', () => {
    it('should create IndexValue for valid value', () => {
      const value = IndexValue.create(142.06);
      expect(value.value).toBe(142.06);
    });

    it('should accept integer values', () => {
      const value = IndexValue.create(100);
      expect(value.value).toBe(100);
    });

    it('should accept boundary value 50', () => {
      const value = IndexValue.create(50);
      expect(value.value).toBe(50);
    });

    it('should accept boundary value 10000', () => {
      const value = IndexValue.create(10000);
      expect(value.value).toBe(10000);
    });

    it('should accept ICC-range values (e.g. 2056)', () => {
      const value = IndexValue.create(2056);
      expect(value.value).toBe(2056);
    });

    it('should accept 3 decimal places', () => {
      const value = IndexValue.create(142.123);
      expect(value.value).toBe(142.123);
    });

    it('should throw for zero', () => {
      expect(() => IndexValue.create(0)).toThrow('must be positive');
    });

    it('should throw for negative', () => {
      expect(() => IndexValue.create(-1)).toThrow('must be positive');
    });

    it('should throw for more than 3 decimals', () => {
      expect(() => IndexValue.create(142.1234)).toThrow('at most 3 decimal places');
    });

    it('should throw for value below 50', () => {
      expect(() => IndexValue.create(49.99)).toThrow('outside plausible range');
    });

    it('should throw for value above 10000', () => {
      expect(() => IndexValue.create(10000.01)).toThrow('outside plausible range');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = IndexValue.create(142.06);
      const b = IndexValue.create(142.06);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = IndexValue.create(142.06);
      const b = IndexValue.create(143.46);
      expect(a.equals(b)).toBe(false);
    });
  });
});
