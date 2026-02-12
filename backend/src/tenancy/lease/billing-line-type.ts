import { InvalidBillingLineTypeException } from './exceptions/invalid-billing-line-type.exception.js';

const ALLOWED_BILLING_LINE_TYPES = ['provision', 'option'] as const;

export type BillingLineTypeValue = (typeof ALLOWED_BILLING_LINE_TYPES)[number];

export class BillingLineType {
  private constructor(private readonly _value: BillingLineTypeValue) {}

  static fromString(value: string): BillingLineType {
    if (!ALLOWED_BILLING_LINE_TYPES.includes(value as BillingLineTypeValue)) {
      throw InvalidBillingLineTypeException.invalidType(value);
    }
    return new BillingLineType(value as BillingLineTypeValue);
  }

  get value(): BillingLineTypeValue {
    return this._value;
  }
}
