import { BillingLineType } from '../billing-line-type';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('BillingLineType', () => {
  it('should create from valid type "provision"', () => {
    const type = BillingLineType.fromString('provision');
    expect(type.value).toBe('provision');
  });

  it('should create from valid type "option"', () => {
    const type = BillingLineType.fromString('option');
    expect(type.value).toBe('option');
  });

  it('should reject "rent" type (rent is derived, not stored)', () => {
    expect(() => BillingLineType.fromString('rent')).toThrow(DomainException);
  });

  it('should reject invalid type', () => {
    expect(() => BillingLineType.fromString('invalid')).toThrow(DomainException);
  });

  it('should reject empty string', () => {
    expect(() => BillingLineType.fromString('')).toThrow(DomainException);
  });
});
