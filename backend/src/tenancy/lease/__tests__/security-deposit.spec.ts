import { SecurityDeposit } from '../security-deposit.js';
import { DomainException } from '@shared/exceptions/domain.exception.js';

describe('SecurityDeposit', () => {
  it('should create a valid security deposit', () => {
    const deposit = SecurityDeposit.fromNumber(63000);
    expect(deposit.value).toBe(63000);
  });

  it('should accept zero (no deposit required)', () => {
    const deposit = SecurityDeposit.fromNumber(0);
    expect(deposit.value).toBe(0);
  });

  it('should accept the maximum value', () => {
    const deposit = SecurityDeposit.fromNumber(99999999);
    expect(deposit.value).toBe(99999999);
  });

  it('should reject negative values', () => {
    expect(() => SecurityDeposit.fromNumber(-1)).toThrow(DomainException);
    expect(() => SecurityDeposit.fromNumber(-1)).toThrow('Security deposit must not be negative');
  });

  it('should reject values exceeding the maximum', () => {
    expect(() => SecurityDeposit.fromNumber(100000000)).toThrow(DomainException);
  });

  it('should reject non-integer values', () => {
    expect(() => SecurityDeposit.fromNumber(630.5)).toThrow(DomainException);
  });

  it('should support equality comparison', () => {
    const a = SecurityDeposit.fromNumber(63000);
    const b = SecurityDeposit.fromNumber(63000);
    const c = SecurityDeposit.fromNumber(50000);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
