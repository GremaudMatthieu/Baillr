import { InvalidIndexTypeException } from './exceptions/invalid-index-type.exception.js';

const ALLOWED_INDEX_TYPES = ['IRL', 'ILC', 'ICC'] as const;
export type IndexTypeValue = (typeof ALLOWED_INDEX_TYPES)[number];

export class IndexType {
  private constructor(private readonly _value: IndexTypeValue) {}

  static fromString(value: string): IndexType {
    const trimmed = value.trim() as IndexTypeValue;
    if (!ALLOWED_INDEX_TYPES.includes(trimmed)) {
      throw InvalidIndexTypeException.invalid(value);
    }
    return new IndexType(trimmed);
  }

  get value(): IndexTypeValue {
    return this._value;
  }

  equals(other: IndexType): boolean {
    return this._value === other._value;
  }
}
