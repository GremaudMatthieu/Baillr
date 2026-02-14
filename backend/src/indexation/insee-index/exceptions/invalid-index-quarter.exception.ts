import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidIndexQuarterException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_INDEX_QUARTER', 400);
  }

  static invalid(value: string): InvalidIndexQuarterException {
    return new InvalidIndexQuarterException(
      `Invalid index quarter: ${value}. Must be one of: Q1, Q2, Q3, Q4`,
    );
  }
}
