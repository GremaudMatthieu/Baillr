import { InsuranceProvider } from '../insurance-provider';

describe('InsuranceProvider', () => {
  describe('fromString', () => {
    it('should create with valid provider name', () => {
      const provider = InsuranceProvider.fromString('MAIF');
      expect(provider.value).toBe('MAIF');
      expect(provider.isEmpty).toBe(false);
    });

    it('should trim whitespace', () => {
      const provider = InsuranceProvider.fromString('  AXA  ');
      expect(provider.value).toBe('AXA');
    });

    it('should throw on empty string', () => {
      expect(() => InsuranceProvider.fromString('')).toThrow('Insurance provider name is required');
    });

    it('should throw on whitespace-only string', () => {
      expect(() => InsuranceProvider.fromString('   ')).toThrow(
        'Insurance provider name is required',
      );
    });

    it('should throw when exceeding 255 characters', () => {
      expect(() => InsuranceProvider.fromString('A'.repeat(256))).toThrow(
        'Insurance provider name exceeds 255 characters',
      );
    });

    it('should accept exactly 255 characters', () => {
      const provider = InsuranceProvider.fromString('A'.repeat(255));
      expect(provider.value).toBe('A'.repeat(255));
    });
  });

  describe('empty', () => {
    it('should create an empty instance', () => {
      const provider = InsuranceProvider.empty();
      expect(provider.isEmpty).toBe(true);
      expect(provider.value).toBe('');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = InsuranceProvider.fromString('MAIF');
      const b = InsuranceProvider.fromString('MAIF');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = InsuranceProvider.fromString('MAIF');
      const b = InsuranceProvider.fromString('AXA');
      expect(a.equals(b)).toBe(false);
    });

    it('should return true for two empty instances', () => {
      const a = InsuranceProvider.empty();
      const b = InsuranceProvider.empty();
      expect(a.equals(b)).toBe(true);
    });
  });
});
