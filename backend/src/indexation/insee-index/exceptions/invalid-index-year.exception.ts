import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidIndexYearException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_INDEX_YEAR', 400);
  }

  static mustBeInteger(): InvalidIndexYearException {
    return new InvalidIndexYearException('Index year must be an integer');
  }

  static outOfRange(value: number): InvalidIndexYearException {
    return new InvalidIndexYearException(
      `Index year ${value} is out of range. Must be between 2000 and 2100`,
    );
  }
}
