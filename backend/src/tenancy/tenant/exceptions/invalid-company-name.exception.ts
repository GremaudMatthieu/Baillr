import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidCompanyNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static tooLong(): InvalidCompanyNameException {
    return new InvalidCompanyNameException(
      'Company name exceeds 255 characters',
      'COMPANY_NAME_TOO_LONG',
    );
  }
}
