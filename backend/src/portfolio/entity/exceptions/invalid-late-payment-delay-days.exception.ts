import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidLatePaymentDelayDaysException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static notInteger(): InvalidLatePaymentDelayDaysException {
    return new InvalidLatePaymentDelayDaysException(
      'Late payment delay days must be an integer',
      'LATE_PAYMENT_DELAY_NOT_INTEGER',
    );
  }

  static tooLow(): InvalidLatePaymentDelayDaysException {
    return new InvalidLatePaymentDelayDaysException(
      'Late payment delay days must be at least 0',
      'LATE_PAYMENT_DELAY_TOO_LOW',
    );
  }

  static tooHigh(): InvalidLatePaymentDelayDaysException {
    return new InvalidLatePaymentDelayDaysException(
      'Late payment delay days must be at most 90',
      'LATE_PAYMENT_DELAY_TOO_HIGH',
    );
  }
}
