import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidLegalInformationException extends DomainException {
  private constructor() {
    super('Legal information cannot be empty when provided', 'INVALID_LEGAL_INFORMATION', 400);
  }

  static empty(): InvalidLegalInformationException {
    return new InvalidLegalInformationException();
  }
}
