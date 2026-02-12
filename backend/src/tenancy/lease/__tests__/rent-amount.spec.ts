import { RentAmount } from '../rent-amount.js';
import { DomainException } from '@shared/exceptions/domain.exception.js';

describe('RentAmount', () => {
  it('should create a valid rent amount', () => {
    const rent = RentAmount.fromNumber(63000);
    expect(rent.value).toBe(63000);
  });

  it('should accept the minimum value of 1 cent', () => {
    const rent = RentAmount.fromNumber(1);
    expect(rent.value).toBe(1);
  });

  it('should accept the maximum value', () => {
    const rent = RentAmount.fromNumber(99999999);
    expect(rent.value).toBe(99999999);
  });

  it('should reject zero', () => {
    expect(() => RentAmount.fromNumber(0)).toThrow(DomainException);
    expect(() => RentAmount.fromNumber(0)).toThrow('Rent amount must be positive');
  });

  it('should reject negative values', () => {
    expect(() => RentAmount.fromNumber(-100)).toThrow(DomainException);
    expect(() => RentAmount.fromNumber(-100)).toThrow('Rent amount must be positive');
  });

  it('should reject values exceeding the maximum', () => {
    expect(() => RentAmount.fromNumber(100000000)).toThrow(DomainException);
  });

  it('should reject non-integer values', () => {
    expect(() => RentAmount.fromNumber(630.5)).toThrow(DomainException);
  });

  it('should support equality comparison', () => {
    const a = RentAmount.fromNumber(63000);
    const b = RentAmount.fromNumber(63000);
    const c = RentAmount.fromNumber(50000);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
