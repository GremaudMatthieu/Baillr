import { InvalidReferenceYearException } from './exceptions/invalid-reference-year.exception.js';

export class ReferenceYear {
  private constructor(private readonly _value: number) {}

  static fromNumber(value: number): ReferenceYear {
    if (!Number.isInteger(value)) {
      throw InvalidReferenceYearException.notInteger();
    }
    if (value < 2000 || value > 2100) {
      throw InvalidReferenceYearException.invalidYear(value);
    }
    return new ReferenceYear(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: ReferenceYear): boolean {
    return this._value === other._value;
  }
}
