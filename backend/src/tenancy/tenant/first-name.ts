import { InvalidFirstNameException } from './exceptions/invalid-first-name.exception.js';

export class FirstName {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): FirstName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidFirstNameException.required();
    }
    if (trimmed.length > 100) {
      throw InvalidFirstNameException.tooLong();
    }
    return new FirstName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: FirstName): boolean {
    return this._value === other._value;
  }
}
