import { LeaseStartDate } from '../lease-start-date.js';
import { DomainException } from '@shared/exceptions/domain.exception.js';

describe('LeaseStartDate', () => {
  it('should create a valid start date from ISO string', () => {
    const date = LeaseStartDate.fromString('2026-03-01T00:00:00.000Z');
    expect(date.value).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('should create a valid start date from date-only string', () => {
    const date = LeaseStartDate.fromString('2026-03-01');
    expect(date.value).toBeInstanceOf(Date);
  });

  it('should reject empty string', () => {
    expect(() => LeaseStartDate.fromString('')).toThrow(DomainException);
  });

  it('should reject whitespace-only string', () => {
    expect(() => LeaseStartDate.fromString('   ')).toThrow(DomainException);
  });

  it('should reject invalid date string', () => {
    expect(() => LeaseStartDate.fromString('not-a-date')).toThrow(DomainException);
  });

  it('should support equality comparison', () => {
    const a = LeaseStartDate.fromString('2026-03-01T00:00:00.000Z');
    const b = LeaseStartDate.fromString('2026-03-01T00:00:00.000Z');
    const c = LeaseStartDate.fromString('2026-04-01T00:00:00.000Z');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('should return ISO string via toISOString()', () => {
    const date = LeaseStartDate.fromString('2026-06-15T00:00:00.000Z');
    expect(date.toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });
});
