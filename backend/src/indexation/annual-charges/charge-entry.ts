import { ChargeCategory } from './charge-category.js';
import { EmptyChargeLabelException } from './exceptions/empty-charge-label.exception.js';
import { InvalidChargeAmountException } from './exceptions/negative-charge-amount.exception.js';

export interface ChargeEntryPrimitives {
  category: string;
  label: string;
  amountCents: number;
}

export class ChargeEntry {
  private constructor(
    private readonly _category: ChargeCategory,
    private readonly _label: string,
    private readonly _amountCents: number,
  ) {}

  static fromPrimitives(data: ChargeEntryPrimitives): ChargeEntry {
    const category = ChargeCategory.fromString(data.category);

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

    return new ChargeEntry(category, label, data.amountCents);
  }

  toPrimitives(): ChargeEntryPrimitives {
    return {
      category: this._category.value,
      label: this._label,
      amountCents: this._amountCents,
    };
  }

  get amountCents(): number {
    return this._amountCents;
  }

  equals(other: ChargeEntry): boolean {
    return (
      this._category.value === other._category.value &&
      this._label === other._label &&
      this._amountCents === other._amountCents
    );
  }
}
