import { calculateProRataAmountCents, daysInMonth, calculateOccupiedDays } from '../pro-rata';

describe('pro-rata utilities', () => {
  describe('daysInMonth', () => {
    it('should return 31 for January', () => {
      expect(daysInMonth(2026, 1)).toBe(31);
    });

    it('should return 28 for February (non-leap year)', () => {
      expect(daysInMonth(2026, 2)).toBe(28);
    });

    it('should return 29 for February (leap year)', () => {
      expect(daysInMonth(2028, 2)).toBe(29);
    });

    it('should return 30 for April', () => {
      expect(daysInMonth(2026, 4)).toBe(30);
    });

    it('should return 31 for December', () => {
      expect(daysInMonth(2026, 12)).toBe(31);
    });
  });

  describe('calculateProRataAmountCents', () => {
    it('should return full amount for full month (31/31)', () => {
      expect(calculateProRataAmountCents(63000, 31, 31)).toBe(63000);
    });

    it('should calculate pro-rata for 15 days in January (rent)', () => {
      // floor((15 * 63000) / 31) = floor(30483.87...) = 30483
      expect(calculateProRataAmountCents(63000, 15, 31)).toBe(30483);
    });

    it('should calculate pro-rata for 15 days in January (provision)', () => {
      // floor((15 * 8000) / 31) = floor(3870.96...) = 3870
      expect(calculateProRataAmountCents(8000, 15, 31)).toBe(3870);
    });

    it('should return 0 for 0 days', () => {
      expect(calculateProRataAmountCents(63000, 0, 31)).toBe(0);
    });

    it('should return 0 when totalDaysInMonth is 0 (edge case)', () => {
      expect(calculateProRataAmountCents(63000, 15, 0)).toBe(0);
    });

    it('should round DOWN (truncate), not round up', () => {
      // floor((1 * 100) / 3) = floor(33.33...) = 33 (not 34)
      expect(calculateProRataAmountCents(100, 1, 3)).toBe(33);
    });

    it('should calculate for February 28 days', () => {
      // floor((14 * 63000) / 28) = floor(31500) = 31500
      expect(calculateProRataAmountCents(63000, 14, 28)).toBe(31500);
    });

    it('should calculate for February 29 days (leap year)', () => {
      // floor((15 * 63000) / 29) = floor(32586.20...) = 32586
      expect(calculateProRataAmountCents(63000, 15, 29)).toBe(32586);
    });

    it('should use multiplication before division for precision', () => {
      // If division first: floor(63000/31) * 15 = 2032 * 15 = 30480 (wrong)
      // If multiplication first: floor((15 * 63000) / 31) = 30483 (correct)
      expect(calculateProRataAmountCents(63000, 15, 31)).toBe(30483);
    });

    it('should return 0 for negative daysInPeriod', () => {
      expect(calculateProRataAmountCents(63000, -5, 31)).toBe(0);
    });

    it('should return 0 for negative amountCents', () => {
      expect(calculateProRataAmountCents(-63000, 15, 31)).toBe(0);
    });
  });

  describe('calculateOccupiedDays', () => {
    it('should return full month when lease covers entire month', () => {
      const start = new Date(2026, 0, 1); // Jan 1
      const result = calculateOccupiedDays(start, null, 2026, 1);
      expect(result).toBe(31);
    });

    it('should calculate days when lease starts mid-month', () => {
      const start = new Date(2026, 0, 15); // Jan 15
      const result = calculateOccupiedDays(start, null, 2026, 1);
      expect(result).toBe(17); // Jan 15 to Jan 31 = 17 days
    });

    it('should calculate days when lease ends mid-month', () => {
      const start = new Date(2026, 0, 1); // Jan 1
      const end = new Date(2026, 0, 15); // Jan 15
      const result = calculateOccupiedDays(start, end, 2026, 1);
      expect(result).toBe(15); // Jan 1 to Jan 15 = 15 days
    });

    it('should calculate days when lease starts and ends in same month', () => {
      const start = new Date(2026, 0, 10); // Jan 10
      const end = new Date(2026, 0, 20); // Jan 20
      const result = calculateOccupiedDays(start, end, 2026, 1);
      expect(result).toBe(11); // Jan 10 to Jan 20 = 11 days
    });

    it('should return 0 when lease period does not overlap month', () => {
      const start = new Date(2026, 1, 1); // Feb 1
      const end = new Date(2026, 1, 28); // Feb 28
      const result = calculateOccupiedDays(start, end, 2026, 1); // January
      expect(result).toBe(0);
    });

    it('should handle February 28 days', () => {
      const start = new Date(2026, 1, 1); // Feb 1
      const result = calculateOccupiedDays(start, null, 2026, 2);
      expect(result).toBe(28);
    });

    it('should handle February 29 days (leap year)', () => {
      const start = new Date(2028, 1, 1); // Feb 1 2028 (leap year)
      const result = calculateOccupiedDays(start, null, 2028, 2);
      expect(result).toBe(29);
    });

    it('should return 1 day when start equals end', () => {
      const start = new Date(2026, 0, 15); // Jan 15
      const end = new Date(2026, 0, 15); // Jan 15
      const result = calculateOccupiedDays(start, end, 2026, 1);
      expect(result).toBe(1);
    });

    it('should return 0 when end date is before month starts', () => {
      const start = new Date(2025, 11, 1); // Dec 1
      const end = new Date(2025, 11, 31); // Dec 31
      const result = calculateOccupiedDays(start, end, 2026, 1); // January 2026
      expect(result).toBe(0);
    });
  });
});
