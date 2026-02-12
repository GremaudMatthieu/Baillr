import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidPhoneNumberException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidPhoneNumberException {
    return new InvalidPhoneNumberException(
      'Phone number is required when provided',
      'PHONE_NUMBER_REQUIRED',
    );
  }

  static invalid(): InvalidPhoneNumberException {
    return new InvalidPhoneNumberException(
      'Phone number format is invalid. Expected French format: +33XXXXXXXXX or 0XXXXXXXXX',
      'PHONE_NUMBER_INVALID',
    );
  }
}
