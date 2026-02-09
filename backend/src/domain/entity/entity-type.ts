import { InvalidEntityTypeException } from './exceptions/invalid-entity-type.exception.js';

const VALID_TYPES = ['sci', 'nom_propre'] as const;
export type EntityTypeValue = (typeof VALID_TYPES)[number];

export class EntityType {
  private constructor(private readonly _value: EntityTypeValue) {}

  static fromString(value: string): EntityType {
    if (!VALID_TYPES.includes(value as EntityTypeValue)) {
      throw InvalidEntityTypeException.invalid();
    }
    return new EntityType(value as EntityTypeValue);
  }

  get value(): EntityTypeValue {
    return this._value;
  }

  get isSci(): boolean {
    return this._value === 'sci';
  }

  equals(other: EntityType): boolean {
    return this._value === other._value;
  }
}
