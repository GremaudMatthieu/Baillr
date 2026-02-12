import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidRevisionMonthException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_REVISION_MONTH', 400);
  }

  static invalidMonth(value: number): InvalidRevisionMonthException {
    return new InvalidRevisionMonthException(
      `Revision month must be between 1 and 12, got: ${value}`,
    );
  }

  static notInteger(): InvalidRevisionMonthException {
    return new InvalidRevisionMonthException('Revision month must be an integer');
  }
}
