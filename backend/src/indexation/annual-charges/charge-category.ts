import { InvalidChargeCategoryException } from './exceptions/invalid-charge-category.exception.js';

const ALLOWED_CATEGORIES = [
  'water',
  'electricity',
  'teom',
  'cleaning',
  'custom',
] as const;
export type ChargeCategoryValue = (typeof ALLOWED_CATEGORIES)[number];

export class ChargeCategory {
  private constructor(private readonly _value: ChargeCategoryValue) {}

  static fromString(value: string): ChargeCategory {
    const trimmed = value.trim() as ChargeCategoryValue;
    if (!ALLOWED_CATEGORIES.includes(trimmed)) {
      throw InvalidChargeCategoryException.invalid(value);
    }
    return new ChargeCategory(trimmed);
  }

  get value(): ChargeCategoryValue {
    return this._value;
  }

  equals(other: ChargeCategory): boolean {
    return this._value === other._value;
  }
}
