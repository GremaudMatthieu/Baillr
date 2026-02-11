import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidPropertyTypeException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static tooLong(): InvalidPropertyTypeException {
    return new InvalidPropertyTypeException(
      'Property type exceeds 255 characters',
      'PROPERTY_TYPE_TOO_LONG',
    );
  }
}
