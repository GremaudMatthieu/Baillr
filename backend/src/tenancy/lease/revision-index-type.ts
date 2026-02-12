import { InvalidRevisionIndexTypeException } from './exceptions/invalid-revision-index-type.exception.js';

const ALLOWED_REVISION_INDEX_TYPES = ['IRL', 'ILC', 'ICC'] as const;
export type RevisionIndexTypeValue = (typeof ALLOWED_REVISION_INDEX_TYPES)[number];

export class RevisionIndexType {
  private constructor(private readonly _value: RevisionIndexTypeValue) {}

  static fromString(value: string): RevisionIndexType {
    const trimmed = value.trim() as RevisionIndexTypeValue;
    if (!ALLOWED_REVISION_INDEX_TYPES.includes(trimmed)) {
      throw InvalidRevisionIndexTypeException.invalid(value);
    }
    return new RevisionIndexType(trimmed);
  }

  get value(): RevisionIndexTypeValue {
    return this._value;
  }

  equals(other: RevisionIndexType): boolean {
    return this._value === other._value;
  }
}
