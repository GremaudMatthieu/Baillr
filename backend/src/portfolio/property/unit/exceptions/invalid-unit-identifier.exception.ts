import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidUnitIdentifierException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidUnitIdentifierException {
    return new InvalidUnitIdentifierException(
      'Unit identifier is required',
      'UNIT_IDENTIFIER_REQUIRED',
    );
  }

  static tooLong(): InvalidUnitIdentifierException {
    return new InvalidUnitIdentifierException(
      'Unit identifier exceeds 100 characters',
      'UNIT_IDENTIFIER_TOO_LONG',
    );
  }
}
