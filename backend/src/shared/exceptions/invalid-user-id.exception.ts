import { DomainException } from './domain.exception.js';

export class InvalidUserIdException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidUserIdException {
    return new InvalidUserIdException('User ID is required', 'USER_ID_REQUIRED');
  }

  static invalidFormat(): InvalidUserIdException {
    return new InvalidUserIdException(
      'User ID must start with user_ prefix',
      'USER_ID_INVALID_FORMAT',
    );
  }
}
