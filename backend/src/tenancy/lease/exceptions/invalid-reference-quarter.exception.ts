import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidReferenceQuarterException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_REFERENCE_QUARTER', 400);
  }

  static invalidQuarter(value: string): InvalidReferenceQuarterException {
    return new InvalidReferenceQuarterException(
      `Invalid reference quarter: ${value}. Must be one of: Q1, Q2, Q3, Q4`,
    );
  }
}
