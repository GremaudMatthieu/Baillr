import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidFiscalYearException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_FISCAL_YEAR', 400);
  }

  static outOfRange(value: number): InvalidFiscalYearException {
    return new InvalidFiscalYearException(
      `Invalid fiscal year: ${value}. Must be between 2000 and ${new Date().getFullYear() + 1}`,
    );
  }

  static mustBeInteger(): InvalidFiscalYearException {
    return new InvalidFiscalYearException('Fiscal year must be an integer');
  }
}
