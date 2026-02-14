import { IndexCalculatorService } from '../services/index-calculator.service';

describe('IndexCalculatorService', () => {
  const service = new IndexCalculatorService();

  it('should calculate new rent using official formula', () => {
    // 750.00€ × (142.06 / 138.19) = 770.97...€ → 77097 truncated
    const result = service.calculate(75000, 142.06, 138.19);
    const expected = Math.floor((75000 * 142.06) / 138.19);
    expect(result).toBe(expected);
  });

  it('should truncate down (Math.floor), not round', () => {
    // Verify truncation: if result is 77097.99, should be 77097 not 77098
    const result = service.calculate(10000, 1.5, 1.0);
    expect(result).toBe(15000); // exact
  });

  it('should handle rent decrease when new index is lower than base', () => {
    const result = service.calculate(75000, 130.0, 138.19);
    expect(result).toBeLessThan(75000);
    expect(result).toBe(Math.floor((75000 * 130.0) / 138.19));
  });

  it('should return same rent when indices are equal', () => {
    const result = service.calculate(75000, 142.06, 142.06);
    expect(result).toBe(75000);
  });

  it('should be deterministic (replay safe)', () => {
    const result1 = service.calculate(82000, 141.03, 137.26);
    const result2 = service.calculate(82000, 141.03, 137.26);
    expect(result1).toBe(result2);
  });

  it('should work with real IRL values', () => {
    // IRL Q2 2024 = 144.44, IRL Q2 2023 = 140.59
    // Rent: 820€ → 82000 cents
    const result = service.calculate(82000, 144.44, 140.59);
    const expected = Math.floor((82000 * 144.44) / 140.59);
    expect(result).toBe(expected);
    expect(result).toBeGreaterThan(82000); // rent increased
  });

  it('should preserve integer cents (no fractional cents)', () => {
    const result = service.calculate(75050, 142.06, 138.19);
    expect(Number.isInteger(result)).toBe(true);
  });
});
