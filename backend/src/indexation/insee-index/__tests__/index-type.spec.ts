import { IndexType } from '../index-type';

describe('IndexType', () => {
  describe('fromString', () => {
    it.each(['IRL', 'ILC', 'ICC'])('should create IndexType for valid value: %s', (value) => {
      const indexType = IndexType.fromString(value);
      expect(indexType.value).toBe(value);
    });

    it('should trim whitespace', () => {
      const indexType = IndexType.fromString('  IRL  ');
      expect(indexType.value).toBe('IRL');
    });

    it('should throw for invalid value', () => {
      expect(() => IndexType.fromString('INVALID')).toThrow(
        'Invalid index type: INVALID. Must be one of: IRL, ILC, ICC',
      );
    });

    it('should throw for empty string', () => {
      expect(() => IndexType.fromString('')).toThrow('Invalid index type');
    });

    it('should throw for lowercase', () => {
      expect(() => IndexType.fromString('irl')).toThrow('Invalid index type');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = IndexType.fromString('IRL');
      const b = IndexType.fromString('IRL');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = IndexType.fromString('IRL');
      const b = IndexType.fromString('ILC');
      expect(a.equals(b)).toBe(false);
    });
  });
});
