import { InvalidReferenceQuarterException } from './exceptions/invalid-reference-quarter.exception.js';

const ALLOWED_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
export type ReferenceQuarterValue = (typeof ALLOWED_QUARTERS)[number];

export class ReferenceQuarter {
  private constructor(private readonly _value: ReferenceQuarterValue) {}

  static fromString(value: string): ReferenceQuarter {
    const trimmed = value.trim() as ReferenceQuarterValue;
    if (!ALLOWED_QUARTERS.includes(trimmed)) {
      throw InvalidReferenceQuarterException.invalidQuarter(value);
    }
    return new ReferenceQuarter(trimmed);
  }

  get value(): ReferenceQuarterValue {
    return this._value;
  }

  equals(other: ReferenceQuarter): boolean {
    return this._value === other._value;
  }
}
