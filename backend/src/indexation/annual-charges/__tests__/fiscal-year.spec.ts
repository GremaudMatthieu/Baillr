import { FiscalYear } from '../fiscal-year';

describe('FiscalYear', () => {
  it('should create a valid fiscal year', () => {
    const year = FiscalYear.create(2025);
    expect(year.value).toBe(2025);
  });

  it('should accept year 2000 (lower bound)', () => {
    const year = FiscalYear.create(2000);
    expect(year.value).toBe(2000);
  });

  it('should accept current year + 1 (upper bound)', () => {
    const nextYear = new Date().getFullYear() + 1;
    const year = FiscalYear.create(nextYear);
    expect(year.value).toBe(nextYear);
  });

  it('should throw for year below 2000', () => {
    expect(() => FiscalYear.create(1999)).toThrow('Invalid fiscal year');
  });

  it('should throw for year too far in the future', () => {
    const tooFar = new Date().getFullYear() + 2;
    expect(() => FiscalYear.create(tooFar)).toThrow('Invalid fiscal year');
  });

  it('should throw for non-integer', () => {
    expect(() => FiscalYear.create(2025.5)).toThrow('must be an integer');
  });

  it('should compare equality', () => {
    const a = FiscalYear.create(2025);
    const b = FiscalYear.create(2025);
    const c = FiscalYear.create(2024);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
