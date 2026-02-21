import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidIndexValueException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_INDEX_VALUE', 400);
  }

  static mustBePositive(): InvalidIndexValueException {
    return new InvalidIndexValueException('Index value must be positive');
  }

  static tooManyDecimals(): InvalidIndexValueException {
    return new InvalidIndexValueException(
      'Index value must have at most 3 decimal places',
    );
  }

  static outOfRange(value: number): InvalidIndexValueException {
    return new InvalidIndexValueException(
      `Index value ${value} is outside plausible range (50-10000)`,
    );
  }
}
