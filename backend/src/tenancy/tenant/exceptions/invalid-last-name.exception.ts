import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidLastNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidLastNameException {
    return new InvalidLastNameException('Last name is required', 'LAST_NAME_REQUIRED');
  }

  static tooLong(): InvalidLastNameException {
    return new InvalidLastNameException('Last name exceeds 100 characters', 'LAST_NAME_TOO_LONG');
  }
}
