import { ReferenceYear } from '../reference-year';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('ReferenceYear', () => {
  it('should create from valid year 2025', () => {
    const year = ReferenceYear.fromNumber(2025);
    expect(year.value).toBe(2025);
  });

  it('should create from boundary year 2000', () => {
    const year = ReferenceYear.fromNumber(2000);
    expect(year.value).toBe(2000);
  });

  it('should create from boundary year 2100', () => {
    const year = ReferenceYear.fromNumber(2100);
    expect(year.value).toBe(2100);
  });

  it('should reject year 1999', () => {
    expect(() => ReferenceYear.fromNumber(1999)).toThrow(DomainException);
  });

  it('should reject year 2101', () => {
    expect(() => ReferenceYear.fromNumber(2101)).toThrow(DomainException);
  });

  it('should reject float', () => {
    expect(() => ReferenceYear.fromNumber(2025.5)).toThrow(DomainException);
  });

  it('should support equality', () => {
    const a = ReferenceYear.fromNumber(2025);
    const b = ReferenceYear.fromNumber(2025);
    const c = ReferenceYear.fromNumber(2026);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
