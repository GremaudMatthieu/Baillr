import { InvalidBaseIndexValueException } from './exceptions/invalid-base-index-value.exception.js';

export class BaseIndexValue {
  private constructor(private readonly _value: number | null) {}

  static create(value: number): BaseIndexValue {
    if (value <= 0) {
      throw InvalidBaseIndexValueException.mustBePositive();
    }
    const parts = value.toString().split('.');
    if (parts[1] && parts[1].length > 3) {
      throw InvalidBaseIndexValueException.tooManyDecimals();
    }
    return new BaseIndexValue(value);
  }

  static empty(): BaseIndexValue {
    return new BaseIndexValue(null);
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  get value(): number | null {
    return this._value;
  }

  equals(other: BaseIndexValue): boolean {
    return this._value === other._value;
  }
}
