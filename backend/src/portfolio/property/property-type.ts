import { InvalidPropertyTypeException } from './exceptions/invalid-property-type.exception.js';

export class PropertyType {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): PropertyType {
    const trimmed = value.trim();
    if (!trimmed) {
      return PropertyType.empty();
    }
    if (trimmed.length > 255) {
      throw InvalidPropertyTypeException.tooLong();
    }
    return new PropertyType(trimmed);
  }

  static empty(): PropertyType {
    return new PropertyType('');
  }

  get value(): string {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === '';
  }

  equals(other: PropertyType): boolean {
    return this._value === other._value;
  }
}
