import { InvalidIndexQuarterException } from './exceptions/invalid-index-quarter.exception.js';

const ALLOWED_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
export type IndexQuarterValue = (typeof ALLOWED_QUARTERS)[number];

export class IndexQuarter {
  private constructor(private readonly _value: IndexQuarterValue) {}

  static fromString(value: string): IndexQuarter {
    const trimmed = value.trim() as IndexQuarterValue;
    if (!ALLOWED_QUARTERS.includes(trimmed)) {
      throw InvalidIndexQuarterException.invalid(value);
    }
    return new IndexQuarter(trimmed);
  }

  get value(): IndexQuarterValue {
    return this._value;
  }

  equals(other: IndexQuarter): boolean {
    return this._value === other._value;
  }
}
