import { InvalidIndexValueException } from './exceptions/invalid-index-value.exception.js';

export class IndexValue {
  private constructor(private readonly _value: number) {}

  static create(value: number): IndexValue {
    if (value <= 0) {
      throw InvalidIndexValueException.mustBePositive();
    }
    // Use multiplication-based check to handle floating-point edge cases
    const scaled = value * 1000;
    if (Math.abs(scaled - Math.round(scaled)) > 1e-9) {
      throw InvalidIndexValueException.tooManyDecimals();
    }
    if (value < 50 || value > 500) {
      throw InvalidIndexValueException.outOfRange(value);
    }
    return new IndexValue(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: IndexValue): boolean {
    return this._value === other._value;
  }
}
