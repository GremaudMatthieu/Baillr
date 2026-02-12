import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidInsuranceProviderException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static empty(): InvalidInsuranceProviderException {
    return new InvalidInsuranceProviderException(
      'Insurance provider name is required',
      'INSURANCE_PROVIDER_EMPTY',
    );
  }

  static tooLong(): InvalidInsuranceProviderException {
    return new InvalidInsuranceProviderException(
      'Insurance provider name exceeds 255 characters',
      'INSURANCE_PROVIDER_TOO_LONG',
    );
  }
}
