import { InvalidRentAmountException } from './exceptions/invalid-rent-amount.exception.js';

export class RentAmount {
  private constructor(private readonly _value: number) {}

  static fromNumber(value: number): RentAmount {
    if (!Number.isInteger(value)) {
      throw InvalidRentAmountException.notInteger();
    }
    if (value <= 0) {
      throw InvalidRentAmountException.notPositive();
    }
    if (value > 99999999) {
      throw InvalidRentAmountException.tooHigh();
    }
    return new RentAmount(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: RentAmount): boolean {
    return this._value === other._value;
  }
}
