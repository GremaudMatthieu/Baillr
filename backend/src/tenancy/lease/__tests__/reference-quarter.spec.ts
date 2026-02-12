import { ReferenceQuarter } from '../reference-quarter';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('ReferenceQuarter', () => {
  it('should create from Q1', () => {
    const q = ReferenceQuarter.fromString('Q1');
    expect(q.value).toBe('Q1');
  });

  it('should create from Q2', () => {
    const q = ReferenceQuarter.fromString('Q2');
    expect(q.value).toBe('Q2');
  });

  it('should create from Q3', () => {
    const q = ReferenceQuarter.fromString('Q3');
    expect(q.value).toBe('Q3');
  });

  it('should create from Q4', () => {
    const q = ReferenceQuarter.fromString('Q4');
    expect(q.value).toBe('Q4');
  });

  it('should trim whitespace', () => {
    const q = ReferenceQuarter.fromString('  Q2  ');
    expect(q.value).toBe('Q2');
  });

  it('should reject invalid string', () => {
    expect(() => ReferenceQuarter.fromString('Q5')).toThrow(DomainException);
  });

  it('should reject empty string', () => {
    expect(() => ReferenceQuarter.fromString('')).toThrow(DomainException);
  });

  it('should reject lowercase', () => {
    expect(() => ReferenceQuarter.fromString('q1')).toThrow(DomainException);
  });

  it('should support equality', () => {
    const a = ReferenceQuarter.fromString('Q1');
    const b = ReferenceQuarter.fromString('Q1');
    const c = ReferenceQuarter.fromString('Q4');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
