import { InvalidBillableOptionException } from './exceptions/invalid-billable-option.exception.js';

export interface BillableOptionPrimitives {
  label: string;
  amountCents: number;
}

export class BillableOption {
  private constructor(
    private readonly _label: string,
    private readonly _amountCents: number,
  ) {}

  static fromPrimitives(data: BillableOptionPrimitives): BillableOption {
    const label = data.label?.trim() ?? '';
    if (!label) {
      throw InvalidBillableOptionException.labelRequired();
    }
    if (label.length > 100) {
      throw InvalidBillableOptionException.labelTooLong();
    }
    if (
      data.amountCents === undefined ||
      data.amountCents === null ||
      !Number.isInteger(data.amountCents) ||
      data.amountCents < 0
    ) {
      throw InvalidBillableOptionException.amountMustBeNonNegative();
    }
    return new BillableOption(label, data.amountCents);
  }

  static empty(): BillableOption {
    return new BillableOption('', 0);
  }

  get isEmpty(): boolean {
    return this._label === '';
  }

  toPrimitives(): BillableOptionPrimitives {
    return {
      label: this._label,
      amountCents: this._amountCents,
    };
  }

  equals(other: BillableOption): boolean {
    return this._label === other._label && this._amountCents === other._amountCents;
  }
}
