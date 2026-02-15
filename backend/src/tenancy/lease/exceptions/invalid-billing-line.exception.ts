import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBillingLineException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static categoryRequired(): InvalidBillingLineException {
    return new InvalidBillingLineException(
      'Billing line charge category is required',
      'BILLING_LINE_CATEGORY_REQUIRED',
    );
  }

  static amountMustBeNonNegative(): InvalidBillingLineException {
    return new InvalidBillingLineException(
      'Billing line amount must be a non-negative integer',
      'BILLING_LINE_AMOUNT_MUST_BE_NON_NEGATIVE',
    );
  }

  static amountMustBeInteger(): InvalidBillingLineException {
    return new InvalidBillingLineException(
      'Billing line amount must be an integer',
      'BILLING_LINE_AMOUNT_MUST_BE_INTEGER',
    );
  }

  static amountTooLarge(): InvalidBillingLineException {
    return new InvalidBillingLineException(
      'Billing line amount exceeds maximum (99999999)',
      'BILLING_LINE_AMOUNT_TOO_LARGE',
    );
  }
}
