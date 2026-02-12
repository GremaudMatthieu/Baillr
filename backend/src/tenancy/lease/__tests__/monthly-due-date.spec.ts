import { MonthlyDueDate } from '../monthly-due-date.js';
import { DomainException } from '@shared/exceptions/domain.exception.js';

describe('MonthlyDueDate', () => {
  it('should create a valid due date', () => {
    const dueDate = MonthlyDueDate.fromNumber(1);
    expect(dueDate.value).toBe(1);
  });

  it('should accept day 31', () => {
    const dueDate = MonthlyDueDate.fromNumber(31);
    expect(dueDate.value).toBe(31);
  });

  it('should accept day 15', () => {
    const dueDate = MonthlyDueDate.fromNumber(15);
    expect(dueDate.value).toBe(15);
  });

  it('should reject day 0', () => {
    expect(() => MonthlyDueDate.fromNumber(0)).toThrow(DomainException);
  });

  it('should reject day 32', () => {
    expect(() => MonthlyDueDate.fromNumber(32)).toThrow(DomainException);
  });

  it('should reject negative values', () => {
    expect(() => MonthlyDueDate.fromNumber(-1)).toThrow(DomainException);
  });

  it('should reject non-integer values', () => {
    expect(() => MonthlyDueDate.fromNumber(1.5)).toThrow(DomainException);
  });

  it('should support equality comparison', () => {
    const a = MonthlyDueDate.fromNumber(5);
    const b = MonthlyDueDate.fromNumber(5);
    const c = MonthlyDueDate.fromNumber(10);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
