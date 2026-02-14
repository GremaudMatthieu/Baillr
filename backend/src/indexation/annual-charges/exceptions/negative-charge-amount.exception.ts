import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidChargeAmountException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_CHARGE_AMOUNT', 400);
  }

  static negative(): InvalidChargeAmountException {
    return new InvalidChargeAmountException(
      'Charge amount must be a non-negative integer',
    );
  }

  static tooLarge(): InvalidChargeAmountException {
    return new InvalidChargeAmountException(
      'Charge amount exceeds maximum allowed value (99999999)',
    );
  }

  static mustBeInteger(): InvalidChargeAmountException {
    return new InvalidChargeAmountException(
      'Charge amount must be an integer (cents)',
    );
  }
}

/** @deprecated Use InvalidChargeAmountException instead */
export const NegativeChargeAmountException = InvalidChargeAmountException;
