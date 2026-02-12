import { BaseIndexValue } from '../base-index-value';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('BaseIndexValue', () => {
  it('should create from valid value 142.06', () => {
    const index = BaseIndexValue.create(142.06);
    expect(index.value).toBe(142.06);
    expect(index.isEmpty).toBe(false);
  });

  it('should create from integer value', () => {
    const index = BaseIndexValue.create(142);
    expect(index.value).toBe(142);
    expect(index.isEmpty).toBe(false);
  });

  it('should create from value with 3 decimal places', () => {
    const index = BaseIndexValue.create(142.123);
    expect(index.value).toBe(142.123);
  });

  it('should create empty (Null Object)', () => {
    const index = BaseIndexValue.empty();
    expect(index.value).toBeNull();
    expect(index.isEmpty).toBe(true);
  });

  it('should reject zero', () => {
    expect(() => BaseIndexValue.create(0)).toThrow(DomainException);
  });

  it('should reject negative value', () => {
    expect(() => BaseIndexValue.create(-1)).toThrow(DomainException);
  });

  it('should reject more than 3 decimal places', () => {
    expect(() => BaseIndexValue.create(142.1234)).toThrow(DomainException);
  });

  it('should support equality', () => {
    const a = BaseIndexValue.create(142.06);
    const b = BaseIndexValue.create(142.06);
    const c = BaseIndexValue.create(143);
    const d = BaseIndexValue.empty();
    const e = BaseIndexValue.empty();
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(d.equals(e)).toBe(true);
    expect(a.equals(d)).toBe(false);
  });
});
