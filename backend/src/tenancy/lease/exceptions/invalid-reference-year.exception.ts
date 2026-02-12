import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidReferenceYearException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_REFERENCE_YEAR', 400);
  }

  static invalidYear(value: number): InvalidReferenceYearException {
    return new InvalidReferenceYearException(
      `Reference year must be between 2000 and 2100, got: ${value}`,
    );
  }

  static notInteger(): InvalidReferenceYearException {
    return new InvalidReferenceYearException('Reference year must be an integer');
  }
}
