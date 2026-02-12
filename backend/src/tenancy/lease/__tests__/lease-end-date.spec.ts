import { LeaseEndDate } from '../lease-end-date';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('LeaseEndDate', () => {
  it('should create from valid ISO date string', () => {
    const endDate = LeaseEndDate.fromString('2026-06-15T00:00:00.000Z');
    expect(endDate.value).toBeInstanceOf(Date);
    expect(endDate.toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  it('should reject empty string', () => {
    expect(() => LeaseEndDate.fromString('')).toThrow(DomainException);
    expect(() => LeaseEndDate.fromString('')).toThrow('La date de fin est requise');
  });

  it('should reject whitespace-only string', () => {
    expect(() => LeaseEndDate.fromString('   ')).toThrow(DomainException);
  });

  it('should reject invalid date string', () => {
    expect(() => LeaseEndDate.fromString('not-a-date')).toThrow(DomainException);
    expect(() => LeaseEndDate.fromString('not-a-date')).toThrow('La date de fin est invalide');
  });

  describe('Null Object pattern', () => {
    it('should create empty instance', () => {
      const endDate = LeaseEndDate.empty();
      expect(endDate.isEmpty).toBe(true);
    });

    it('should report non-empty for valid date', () => {
      const endDate = LeaseEndDate.fromString('2026-06-15T00:00:00.000Z');
      expect(endDate.isEmpty).toBe(false);
    });
  });

  it('should compare equality', () => {
    const a = LeaseEndDate.fromString('2026-06-15T00:00:00.000Z');
    const b = LeaseEndDate.fromString('2026-06-15T00:00:00.000Z');
    const c = LeaseEndDate.fromString('2026-07-01T00:00:00.000Z');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
