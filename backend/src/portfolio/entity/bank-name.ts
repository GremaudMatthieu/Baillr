import { InvalidBankNameException } from './exceptions/invalid-bank-name.exception.js';

export class BankName {
  private static readonly EMPTY = new BankName(null);

  private constructor(private readonly _value: string | null) {}

  static fromString(value: string): BankName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidBankNameException.required();
    }
    if (trimmed.length > 100) {
      throw InvalidBankNameException.tooLong();
    }
    return new BankName(trimmed);
  }

  static empty(): BankName {
    return BankName.EMPTY;
  }

  get value(): string | null {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  equals(other: BankName): boolean {
    return this._value === other._value;
  }
}
