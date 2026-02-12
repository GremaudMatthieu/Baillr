import { InvalidSecurityDepositException } from './exceptions/invalid-security-deposit.exception.js';

export class SecurityDeposit {
  private constructor(private readonly _value: number) {}

  static fromNumber(value: number): SecurityDeposit {
    if (!Number.isInteger(value)) {
      throw InvalidSecurityDepositException.notInteger();
    }
    if (value < 0) {
      throw InvalidSecurityDepositException.negative();
    }
    if (value > 99999999) {
      throw InvalidSecurityDepositException.tooHigh();
    }
    return new SecurityDeposit(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: SecurityDeposit): boolean {
    return this._value === other._value;
  }
}
