import { InsuranceRenewalDate } from '../insurance-renewal-date';

describe('InsuranceRenewalDate', () => {
  describe('create', () => {
    it('should create with valid ISO date string', () => {
      const date = InsuranceRenewalDate.create('2026-12-31T00:00:00.000Z');
      expect(date.isEmpty).toBe(false);
      expect(date.value).toBeInstanceOf(Date);
      expect(date.value!.getFullYear()).toBe(2026);
    });

    it('should return empty for null', () => {
      const date = InsuranceRenewalDate.create(null);
      expect(date.isEmpty).toBe(true);
      expect(date.value).toBeNull();
    });

    it('should return empty for empty string', () => {
      const date = InsuranceRenewalDate.create('');
      expect(date.isEmpty).toBe(true);
    });

    it('should return empty for whitespace-only string', () => {
      const date = InsuranceRenewalDate.create('   ');
      expect(date.isEmpty).toBe(true);
    });

    it('should throw for invalid date string', () => {
      expect(() => InsuranceRenewalDate.create('not-a-date')).toThrow(
        'Insurance renewal date is not a valid date',
      );
    });
  });

  describe('toPrimitive', () => {
    it('should return ISO string for valid date', () => {
      const date = InsuranceRenewalDate.create('2026-12-31T00:00:00.000Z');
      expect(date.toPrimitive()).toBe('2026-12-31T00:00:00.000Z');
    });

    it('should return null for empty date', () => {
      const date = InsuranceRenewalDate.create(null);
      expect(date.toPrimitive()).toBeNull();
    });
  });

  describe('empty', () => {
    it('should create an empty instance', () => {
      const date = InsuranceRenewalDate.empty();
      expect(date.isEmpty).toBe(true);
      expect(date.value).toBeNull();
      expect(date.toPrimitive()).toBeNull();
    });
  });

  describe('equals', () => {
    it('should return true for same date', () => {
      const a = InsuranceRenewalDate.create('2026-12-31T00:00:00.000Z');
      const b = InsuranceRenewalDate.create('2026-12-31T00:00:00.000Z');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different dates', () => {
      const a = InsuranceRenewalDate.create('2026-12-31T00:00:00.000Z');
      const b = InsuranceRenewalDate.create('2027-01-15T00:00:00.000Z');
      expect(a.equals(b)).toBe(false);
    });

    it('should return true for two empty instances', () => {
      const a = InsuranceRenewalDate.empty();
      const b = InsuranceRenewalDate.create(null);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false when one is empty and other is not', () => {
      const a = InsuranceRenewalDate.create('2026-12-31T00:00:00.000Z');
      const b = InsuranceRenewalDate.empty();
      expect(a.equals(b)).toBe(false);
    });
  });
});
