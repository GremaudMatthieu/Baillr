import { InvalidRentCallMonthException } from './exceptions/invalid-rent-call-month.exception.js';

const MONTH_REGEX = /^\d{4}-\d{2}$/;

export class RentCallMonth {
  private constructor(
    private readonly _year: number,
    private readonly _month: number,
  ) {}

  static fromYearMonth(year: number, month: number): RentCallMonth {
    if (month < 1 || month > 12) {
      throw InvalidRentCallMonthException.monthOutOfRange();
    }
    if (year < 2020) {
      throw InvalidRentCallMonthException.yearTooLow();
    }
    return new RentCallMonth(year, month);
  }

  static fromString(value: string): RentCallMonth {
    if (!MONTH_REGEX.test(value)) {
      throw InvalidRentCallMonthException.invalidFormat();
    }
    const [yearStr, monthStr] = value.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (month < 1 || month > 12) {
      throw InvalidRentCallMonthException.monthOutOfRange();
    }
    if (year < 2020) {
      throw InvalidRentCallMonthException.yearTooLow();
    }
    return new RentCallMonth(year, month);
  }

  get year(): number {
    return this._year;
  }

  get month(): number {
    return this._month;
  }

  toString(): string {
    return `${this._year}-${String(this._month).padStart(2, '0')}`;
  }

  equals(other: RentCallMonth): boolean {
    return this._year === other._year && this._month === other._month;
  }
}
