import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBillableOptionException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static labelRequired(): InvalidBillableOptionException {
    return new InvalidBillableOptionException(
      'Billable option label is required',
      'BILLABLE_OPTION_LABEL_REQUIRED',
    );
  }

  static labelTooLong(): InvalidBillableOptionException {
    return new InvalidBillableOptionException(
      'Billable option label exceeds 100 characters',
      'BILLABLE_OPTION_LABEL_TOO_LONG',
    );
  }

  static amountMustBeNonNegative(): InvalidBillableOptionException {
    return new InvalidBillableOptionException(
      'Billable option amount must be a non-negative integer',
      'BILLABLE_OPTION_AMOUNT_MUST_BE_NON_NEGATIVE',
    );
  }
}
