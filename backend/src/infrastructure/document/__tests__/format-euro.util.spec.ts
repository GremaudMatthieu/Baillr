import { formatEuroCents, formatMonthLabel } from '../format-euro.util';

describe('formatEuroCents', () => {
  it('should format a standard amount', () => {
    expect(formatEuroCents(75000)).toMatch(/750,00.€/);
  });

  it('should format zero', () => {
    expect(formatEuroCents(0)).toMatch(/0,00.€/);
  });

  it('should format a large number with thousand separators', () => {
    const result = formatEuroCents(1234567);
    // 12345.67 → "12 345,67 €" (with possible narrow no-break space)
    expect(result).toMatch(/12.345,67.€/);
  });

  it('should preserve cents precision', () => {
    expect(formatEuroCents(1)).toMatch(/0,01.€/);
    expect(formatEuroCents(99)).toMatch(/0,99.€/);
  });

  it('should format negative amounts', () => {
    expect(formatEuroCents(-5000)).toMatch(/-50,00.€/);
  });
});

describe('formatMonthLabel', () => {
  it('should format a valid month', () => {
    expect(formatMonthLabel('2026-02')).toBe('Février 2026');
  });

  it('should format January correctly', () => {
    expect(formatMonthLabel('2026-01')).toBe('Janvier 2026');
  });

  it('should format December correctly', () => {
    expect(formatMonthLabel('2025-12')).toBe('Décembre 2025');
  });

  it('should return raw string for invalid input', () => {
    expect(formatMonthLabel('garbage')).toBe('garbage');
    expect(formatMonthLabel('2026')).toBe('2026');
  });
});
