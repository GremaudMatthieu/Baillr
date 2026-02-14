import { IndexQuarter } from '../index-quarter';

describe('IndexQuarter', () => {
  describe('fromString', () => {
    it.each(['Q1', 'Q2', 'Q3', 'Q4'])('should create IndexQuarter for valid value: %s', (value) => {
      const quarter = IndexQuarter.fromString(value);
      expect(quarter.value).toBe(value);
    });

    it('should trim whitespace', () => {
      const quarter = IndexQuarter.fromString('  Q1  ');
      expect(quarter.value).toBe('Q1');
    });

    it('should throw for invalid value', () => {
      expect(() => IndexQuarter.fromString('Q5')).toThrow(
        'Invalid index quarter: Q5. Must be one of: Q1, Q2, Q3, Q4',
      );
    });

    it('should throw for empty string', () => {
      expect(() => IndexQuarter.fromString('')).toThrow('Invalid index quarter');
    });

    it('should throw for lowercase', () => {
      expect(() => IndexQuarter.fromString('q1')).toThrow('Invalid index quarter');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = IndexQuarter.fromString('Q1');
      const b = IndexQuarter.fromString('Q1');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = IndexQuarter.fromString('Q1');
      const b = IndexQuarter.fromString('Q2');
      expect(a.equals(b)).toBe(false);
    });
  });
});
