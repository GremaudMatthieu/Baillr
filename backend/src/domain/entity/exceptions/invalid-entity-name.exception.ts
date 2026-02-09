import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidEntityNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidEntityNameException {
    return new InvalidEntityNameException('Entity name is required', 'ENTITY_NAME_REQUIRED');
  }

  static tooLong(): InvalidEntityNameException {
    return new InvalidEntityNameException(
      'Entity name exceeds 255 characters',
      'ENTITY_NAME_TOO_LONG',
    );
  }
}
