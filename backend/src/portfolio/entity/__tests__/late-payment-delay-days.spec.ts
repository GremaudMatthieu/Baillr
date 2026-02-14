import { LatePaymentDelayDays } from '../late-payment-delay-days';
import { DomainException } from '../../../shared/exceptions/domain.exception';

describe('LatePaymentDelayDays', () => {
  describe('create', () => {
    it('should create with valid value', () => {
      const vo = LatePaymentDelayDays.create(10);
      expect(vo.value).toBe(10);
    });

    it('should accept 0', () => {
      const vo = LatePaymentDelayDays.create(0);
      expect(vo.value).toBe(0);
    });

    it('should accept 90', () => {
      const vo = LatePaymentDelayDays.create(90);
      expect(vo.value).toBe(90);
    });

    it('should reject non-integer', () => {
      expect(() => LatePaymentDelayDays.create(5.5)).toThrow(DomainException);
      expect(() => LatePaymentDelayDays.create(5.5)).toThrow(
        'Late payment delay days must be an integer',
      );
    });

    it('should reject negative values', () => {
      expect(() => LatePaymentDelayDays.create(-1)).toThrow(DomainException);
      expect(() => LatePaymentDelayDays.create(-1)).toThrow(
        'Late payment delay days must be at least 0',
      );
    });

    it('should reject values above 90', () => {
      expect(() => LatePaymentDelayDays.create(91)).toThrow(DomainException);
      expect(() => LatePaymentDelayDays.create(91)).toThrow(
        'Late payment delay days must be at most 90',
      );
    });
  });

  describe('default', () => {
    it('should return default value of 5', () => {
      const vo = LatePaymentDelayDays.default();
      expect(vo.value).toBe(5);
    });
  });

  describe('equals', () => {
    it('should return true for equal values', () => {
      const a = LatePaymentDelayDays.create(10);
      const b = LatePaymentDelayDays.create(10);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = LatePaymentDelayDays.create(10);
      const b = LatePaymentDelayDays.create(20);
      expect(a.equals(b)).toBe(false);
    });
  });
});
