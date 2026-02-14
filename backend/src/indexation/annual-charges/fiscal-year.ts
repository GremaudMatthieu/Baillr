import { InvalidFiscalYearException } from './exceptions/invalid-fiscal-year.exception.js';

export class FiscalYear {
  private constructor(private readonly _value: number) {}

  static create(year: number): FiscalYear {
    if (!Number.isInteger(year)) {
      throw InvalidFiscalYearException.mustBeInteger();
    }
    if (year < 2000 || year > new Date().getFullYear() + 1) {
      throw InvalidFiscalYearException.outOfRange(year);
    }
    return new FiscalYear(year);
  }

  get value(): number {
    return this._value;
  }

  equals(other: FiscalYear): boolean {
    return this._value === other._value;
  }
}
