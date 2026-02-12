import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidFirstNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidFirstNameException {
    return new InvalidFirstNameException('First name is required', 'FIRST_NAME_REQUIRED');
  }

  static tooLong(): InvalidFirstNameException {
    return new InvalidFirstNameException(
      'First name exceeds 100 characters',
      'FIRST_NAME_TOO_LONG',
    );
  }
}
