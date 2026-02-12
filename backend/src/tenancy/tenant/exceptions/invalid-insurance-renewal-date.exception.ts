import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidInsuranceRenewalDateException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static invalid(): InvalidInsuranceRenewalDateException {
    return new InvalidInsuranceRenewalDateException(
      'Insurance renewal date is not a valid date',
      'INSURANCE_RENEWAL_DATE_INVALID',
    );
  }
}
