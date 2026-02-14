import { InvalidIndexYearException } from './exceptions/invalid-index-year.exception.js';

export class IndexYear {
  private constructor(private readonly _value: number) {}

  static create(value: number): IndexYear {
    if (!Number.isInteger(value)) {
      throw InvalidIndexYearException.mustBeInteger();
    }
    if (value < 2000 || value > 2100) {
      throw InvalidIndexYearException.outOfRange(value);
    }
    return new IndexYear(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: IndexYear): boolean {
    return this._value === other._value;
  }
}
