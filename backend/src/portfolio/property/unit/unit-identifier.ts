import { InvalidUnitIdentifierException } from './exceptions/invalid-unit-identifier.exception.js';

export class UnitIdentifier {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): UnitIdentifier {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidUnitIdentifierException.required();
    }
    if (trimmed.length > 100) {
      throw InvalidUnitIdentifierException.tooLong();
    }
    return new UnitIdentifier(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UnitIdentifier): boolean {
    return this._value === other._value;
  }
}
