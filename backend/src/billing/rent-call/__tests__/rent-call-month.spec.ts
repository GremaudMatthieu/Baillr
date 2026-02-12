import { RentCallMonth } from '../rent-call-month';
import { InvalidRentCallMonthException } from '../exceptions/invalid-rent-call-month.exception';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('RentCallMonth', () => {
  describe('fromString', () => {
    it('should create from valid YYYY-MM string', () => {
      const month = RentCallMonth.fromString('2026-03');
      expect(month.year).toBe(2026);
      expect(month.month).toBe(3);
      expect(month.toString()).toBe('2026-03');
    });

    it('should reject invalid format', () => {
      expect(() => RentCallMonth.fromString('2026/03')).toThrow(DomainException);
      expect(() => RentCallMonth.fromString('03-2026')).toThrow(DomainException);
      expect(() => RentCallMonth.fromString('invalid')).toThrow(DomainException);
    });

    it('should reject month out of range', () => {
      expect(() => RentCallMonth.fromString('2026-00')).toThrow('Month must be between 1 and 12');
      expect(() => RentCallMonth.fromString('2026-13')).toThrow('Month must be between 1 and 12');
    });

    it('should reject year before 2020', () => {
      expect(() => RentCallMonth.fromString('2019-06')).toThrow('Year must be 2020 or later');
    });
  });

  describe('fromYearMonth', () => {
    it('should create from valid year and month', () => {
      const month = RentCallMonth.fromYearMonth(2026, 1);
      expect(month.year).toBe(2026);
      expect(month.month).toBe(1);
      expect(month.toString()).toBe('2026-01');
    });

    it('should reject month out of range', () => {
      expect(() => RentCallMonth.fromYearMonth(2026, 0)).toThrow(DomainException);
      expect(() => RentCallMonth.fromYearMonth(2026, 13)).toThrow(DomainException);
    });

    it('should reject year before 2020', () => {
      expect(() => RentCallMonth.fromYearMonth(2019, 6)).toThrow(DomainException);
    });
  });

  describe('equals', () => {
    it('should return true for same year and month', () => {
      const a = RentCallMonth.fromString('2026-03');
      const b = RentCallMonth.fromYearMonth(2026, 3);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different months', () => {
      const a = RentCallMonth.fromString('2026-03');
      const b = RentCallMonth.fromString('2026-04');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should pad single-digit months', () => {
      expect(RentCallMonth.fromYearMonth(2026, 1).toString()).toBe('2026-01');
      expect(RentCallMonth.fromYearMonth(2026, 12).toString()).toBe('2026-12');
    });
  });
});
