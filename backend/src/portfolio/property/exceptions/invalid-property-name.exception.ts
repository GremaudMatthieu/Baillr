import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidPropertyNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidPropertyNameException {
    return new InvalidPropertyNameException('Property name is required', 'PROPERTY_NAME_REQUIRED');
  }

  static tooLong(): InvalidPropertyNameException {
    return new InvalidPropertyNameException(
      'Property name exceeds 255 characters',
      'PROPERTY_NAME_TOO_LONG',
    );
  }
}
