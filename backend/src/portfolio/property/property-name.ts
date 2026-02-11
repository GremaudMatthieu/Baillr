import { InvalidPropertyNameException } from './exceptions/invalid-property-name.exception.js';

export class PropertyName {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): PropertyName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidPropertyNameException.required();
    }
    if (trimmed.length > 255) {
      throw InvalidPropertyNameException.tooLong();
    }
    return new PropertyName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PropertyName): boolean {
    return this._value === other._value;
  }
}
