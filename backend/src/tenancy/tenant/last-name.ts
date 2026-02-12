import { InvalidLastNameException } from './exceptions/invalid-last-name.exception.js';

export class LastName {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): LastName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidLastNameException.required();
    }
    if (trimmed.length > 100) {
      throw InvalidLastNameException.tooLong();
    }
    return new LastName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: LastName): boolean {
    return this._value === other._value;
  }
}
