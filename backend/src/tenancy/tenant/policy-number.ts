import { InvalidPolicyNumberException } from './exceptions/invalid-policy-number.exception.js';

export class PolicyNumber {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): PolicyNumber {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidPolicyNumberException.empty();
    }
    if (trimmed.length > 100) {
      throw InvalidPolicyNumberException.tooLong();
    }
    return new PolicyNumber(trimmed);
  }

  static empty(): PolicyNumber {
    return new PolicyNumber('');
  }

  get value(): string {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === '';
  }

  equals(other: PolicyNumber): boolean {
    return this._value === other._value;
  }
}
