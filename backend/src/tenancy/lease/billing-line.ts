import { InvalidBillingLineException } from './exceptions/invalid-billing-line.exception.js';
import { BillingLineType } from './billing-line-type.js';

export interface BillingLinePrimitives {
  label: string;
  amountCents: number;
  type: string;
}

export class BillingLine {
  private constructor(
    private readonly _label: string,
    private readonly _amountCents: number,
    private readonly _type: BillingLineType,
  ) {}

  static fromPrimitives(data: BillingLinePrimitives): BillingLine {
    const label = data.label?.trim() ?? '';
    if (!label) {
      throw InvalidBillingLineException.labelRequired();
    }
    if (label.length > 100) {
      throw InvalidBillingLineException.labelTooLong();
    }
    if (
      data.amountCents === undefined ||
      data.amountCents === null ||
      !Number.isInteger(data.amountCents)
    ) {
      throw InvalidBillingLineException.amountMustBeInteger();
    }
    if (data.amountCents < 0) {
      throw InvalidBillingLineException.amountMustBeNonNegative();
    }
    if (data.amountCents > 99999999) {
      throw InvalidBillingLineException.amountTooLarge();
    }
    const type = BillingLineType.fromString(data.type);
    return new BillingLine(label, data.amountCents, type);
  }

  toPrimitives(): BillingLinePrimitives {
    return {
      label: this._label,
      amountCents: this._amountCents,
      type: this._type.value,
    };
  }

  equals(other: BillingLine): boolean {
    return (
      this._label === other._label &&
      this._amountCents === other._amountCents &&
      this._type.value === other._type.value
    );
  }
}
