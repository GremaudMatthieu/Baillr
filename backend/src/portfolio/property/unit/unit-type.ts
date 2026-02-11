import { InvalidUnitTypeException } from './exceptions/invalid-unit-type.exception.js';

const ALLOWED_UNIT_TYPES = ['apartment', 'parking', 'commercial', 'storage'] as const;

export class UnitType {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): UnitType {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidUnitTypeException.required();
    }
    if (!ALLOWED_UNIT_TYPES.includes(trimmed as (typeof ALLOWED_UNIT_TYPES)[number])) {
      throw InvalidUnitTypeException.invalidType(trimmed);
    }
    return new UnitType(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UnitType): boolean {
    return this._value === other._value;
  }
}
