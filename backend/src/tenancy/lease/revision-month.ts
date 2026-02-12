import { InvalidRevisionMonthException } from './exceptions/invalid-revision-month.exception.js';

export class RevisionMonth {
  private constructor(private readonly _value: number) {}

  static fromNumber(value: number): RevisionMonth {
    if (!Number.isInteger(value)) {
      throw InvalidRevisionMonthException.notInteger();
    }
    if (value < 1 || value > 12) {
      throw InvalidRevisionMonthException.invalidMonth(value);
    }
    return new RevisionMonth(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: RevisionMonth): boolean {
    return this._value === other._value;
  }
}
