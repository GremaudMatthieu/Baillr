import { InvalidBankAccountLabelException } from './exceptions/invalid-bank-account-label.exception.js';

export class BankAccountLabel {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): BankAccountLabel {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidBankAccountLabelException.required();
    }
    if (trimmed.length > 100) {
      throw InvalidBankAccountLabelException.tooLong();
    }
    return new BankAccountLabel(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: BankAccountLabel): boolean {
    return this._value === other._value;
  }
}
