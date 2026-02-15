import { InvalidBillingLineException } from './exceptions/invalid-billing-line.exception.js';

export interface BillingLinePrimitives {
  chargeCategoryId: string;
  amountCents: number;
}

export class BillingLine {
  private constructor(
    private readonly _chargeCategoryId: string,
    private readonly _amountCents: number,
  ) {}

  static fromPrimitives(data: BillingLinePrimitives): BillingLine {
    if (!data.chargeCategoryId || typeof data.chargeCategoryId !== 'string') {
      throw InvalidBillingLineException.categoryRequired();
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
    return new BillingLine(data.chargeCategoryId, data.amountCents);
  }

  toPrimitives(): BillingLinePrimitives {
    return {
      chargeCategoryId: this._chargeCategoryId,
      amountCents: this._amountCents,
    };
  }

  equals(other: BillingLine): boolean {
    return (
      this._chargeCategoryId === other._chargeCategoryId &&
      this._amountCents === other._amountCents
    );
  }
}
