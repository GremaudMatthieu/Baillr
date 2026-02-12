import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBillingLineTypeException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static invalidType(value: string): InvalidBillingLineTypeException {
    return new InvalidBillingLineTypeException(
      `Invalid billing line type: "${value}". Allowed: provision, option`,
      'BILLING_LINE_TYPE_INVALID',
    );
  }
}
