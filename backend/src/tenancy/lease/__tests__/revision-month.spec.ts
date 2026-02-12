import { RevisionMonth } from '../revision-month';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('RevisionMonth', () => {
  it('should create from valid month 1', () => {
    const month = RevisionMonth.fromNumber(1);
    expect(month.value).toBe(1);
  });

  it('should create from valid month 12', () => {
    const month = RevisionMonth.fromNumber(12);
    expect(month.value).toBe(12);
  });

  it('should create from valid month 6', () => {
    const month = RevisionMonth.fromNumber(6);
    expect(month.value).toBe(6);
  });

  it('should reject month 0', () => {
    expect(() => RevisionMonth.fromNumber(0)).toThrow(DomainException);
  });

  it('should reject month 13', () => {
    expect(() => RevisionMonth.fromNumber(13)).toThrow(DomainException);
  });

  it('should reject negative month', () => {
    expect(() => RevisionMonth.fromNumber(-1)).toThrow(DomainException);
  });

  it('should reject float', () => {
    expect(() => RevisionMonth.fromNumber(1.5)).toThrow(DomainException);
  });

  it('should support equality', () => {
    const a = RevisionMonth.fromNumber(6);
    const b = RevisionMonth.fromNumber(6);
    const c = RevisionMonth.fromNumber(9);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
