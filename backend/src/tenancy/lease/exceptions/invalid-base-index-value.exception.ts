import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBaseIndexValueException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_BASE_INDEX_VALUE', 400);
  }

  static mustBePositive(): InvalidBaseIndexValueException {
    return new InvalidBaseIndexValueException('Base index value must be positive');
  }

  static tooManyDecimals(): InvalidBaseIndexValueException {
    return new InvalidBaseIndexValueException(
      'Base index value must have at most 3 decimal places',
    );
  }
}
