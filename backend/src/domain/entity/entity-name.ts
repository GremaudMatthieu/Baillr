import { InvalidEntityNameException } from './exceptions/invalid-entity-name.exception.js';

export class EntityName {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): EntityName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidEntityNameException.required();
    }
    if (trimmed.length > 255) {
      throw InvalidEntityNameException.tooLong();
    }
    return new EntityName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: EntityName): boolean {
    return this._value === other._value;
  }
}
