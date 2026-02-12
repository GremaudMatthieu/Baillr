import { PolicyNumber } from '../policy-number';

describe('PolicyNumber', () => {
  describe('fromString', () => {
    it('should create with valid policy number', () => {
      const pn = PolicyNumber.fromString('POL-2026-001');
      expect(pn.value).toBe('POL-2026-001');
      expect(pn.isEmpty).toBe(false);
    });

    it('should trim whitespace', () => {
      const pn = PolicyNumber.fromString('  POL-123  ');
      expect(pn.value).toBe('POL-123');
    });

    it('should throw on empty string', () => {
      expect(() => PolicyNumber.fromString('')).toThrow('Policy number is required');
    });

    it('should throw on whitespace-only string', () => {
      expect(() => PolicyNumber.fromString('   ')).toThrow('Policy number is required');
    });

    it('should throw when exceeding 100 characters', () => {
      expect(() => PolicyNumber.fromString('A'.repeat(101))).toThrow(
        'Policy number exceeds 100 characters',
      );
    });

    it('should accept exactly 100 characters', () => {
      const pn = PolicyNumber.fromString('A'.repeat(100));
      expect(pn.value).toBe('A'.repeat(100));
    });
  });

  describe('empty', () => {
    it('should create an empty instance', () => {
      const pn = PolicyNumber.empty();
      expect(pn.isEmpty).toBe(true);
      expect(pn.value).toBe('');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = PolicyNumber.fromString('POL-001');
      const b = PolicyNumber.fromString('POL-001');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = PolicyNumber.fromString('POL-001');
      const b = PolicyNumber.fromString('POL-002');
      expect(a.equals(b)).toBe(false);
    });

    it('should return true for two empty instances', () => {
      const a = PolicyNumber.empty();
      const b = PolicyNumber.empty();
      expect(a.equals(b)).toBe(true);
    });
  });
});
