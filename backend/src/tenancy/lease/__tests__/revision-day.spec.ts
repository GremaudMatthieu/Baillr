import { RevisionDay } from '../revision-day';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('RevisionDay', () => {
  it('should create from valid day 1', () => {
    const day = RevisionDay.fromNumber(1);
    expect(day.value).toBe(1);
  });

  it('should create from valid day 31', () => {
    const day = RevisionDay.fromNumber(31);
    expect(day.value).toBe(31);
  });

  it('should create from valid day 15', () => {
    const day = RevisionDay.fromNumber(15);
    expect(day.value).toBe(15);
  });

  it('should reject day 0', () => {
    expect(() => RevisionDay.fromNumber(0)).toThrow(DomainException);
  });

  it('should reject day 32', () => {
    expect(() => RevisionDay.fromNumber(32)).toThrow(DomainException);
  });

  it('should reject negative day', () => {
    expect(() => RevisionDay.fromNumber(-1)).toThrow(DomainException);
  });

  it('should reject float', () => {
    expect(() => RevisionDay.fromNumber(1.5)).toThrow(DomainException);
  });

  it('should support equality', () => {
    const a = RevisionDay.fromNumber(15);
    const b = RevisionDay.fromNumber(15);
    const c = RevisionDay.fromNumber(20);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
