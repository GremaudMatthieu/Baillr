import { EmptyChargeLabelException } from './exceptions/empty-charge-label.exception.js';
import { InvalidChargeAmountException } from './exceptions/negative-charge-amount.exception.js';
import { MissingChargeCategoryIdException } from './exceptions/missing-charge-category-id.exception.js';

export interface ChargeEntryPrimitives {
  chargeCategoryId: string;
  label: string;
  amountCents: number;
}

export class ChargeEntry {
  private constructor(
    private readonly _chargeCategoryId: string,
    private readonly _label: string,
    private readonly _amountCents: number,
  ) {}

  static fromPrimitives(data: ChargeEntryPrimitives): ChargeEntry {
    const chargeCategoryId = data.chargeCategoryId?.trim() ?? '';
    if (!chargeCategoryId) {
      throw MissingChargeCategoryIdException.create();
    }

    const label = data.label?.trim() ?? '';
    if (!label) {
      throw EmptyChargeLabelException.create();
    }
    if (label.length > 100) {
      throw EmptyChargeLabelException.tooLong();
    }

    if (
      data.amountCents === undefined ||
      data.amountCents === null ||
      !Number.isInteger(data.amountCents)
    ) {
      throw InvalidChargeAmountException.mustBeInteger();
    }
    if (data.amountCents < 0) {
      throw InvalidChargeAmountException.negative();
    }
    if (data.amountCents > 99_999_999) {
      throw InvalidChargeAmountException.tooLarge();
    }

    return new ChargeEntry(chargeCategoryId, label, data.amountCents);
  }

  toPrimitives(): ChargeEntryPrimitives {
    return {
      chargeCategoryId: this._chargeCategoryId,
      label: this._label,
      amountCents: this._amountCents,
    };
  }

  get amountCents(): number {
    return this._amountCents;
  }

  equals(other: ChargeEntry): boolean {
    return (
      this._chargeCategoryId === other._chargeCategoryId &&
      this._label === other._label &&
      this._amountCents === other._amountCents
    );
  }
}
