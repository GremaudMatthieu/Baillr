import { InvalidRevisionDayException } from './exceptions/invalid-revision-day.exception.js';

export class RevisionDay {
  private constructor(private readonly _value: number) {}

  static fromNumber(value: number): RevisionDay {
    if (!Number.isInteger(value)) {
      throw InvalidRevisionDayException.notInteger();
    }
    if (value < 1 || value > 31) {
      throw InvalidRevisionDayException.invalidDay(value);
    }
    return new RevisionDay(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: RevisionDay): boolean {
    return this._value === other._value;
  }
}
