import { InvalidRentCallLineItemException } from './exceptions/invalid-rent-call-line-item.exception.js';

export interface RentCallLineItemPrimitives {
  label: string;
  amountCents: number;
  type: string;
}

export class RentCallLineItem {
  private constructor(
    private readonly _label: string,
    private readonly _amountCents: number,
    private readonly _type: string,
  ) {}

  static fromPrimitives(data: RentCallLineItemPrimitives): RentCallLineItem {
    if (!data.label || data.label.trim().length === 0) {
      throw InvalidRentCallLineItemException.labelEmpty();
    }
    if (data.amountCents < 0) {
      throw InvalidRentCallLineItemException.negativeAmount();
    }
    if (!data.type || data.type.trim().length === 0) {
      throw InvalidRentCallLineItemException.typeEmpty();
    }
    return new RentCallLineItem(data.label, data.amountCents, data.type);
  }

  toPrimitives(): RentCallLineItemPrimitives {
    return {
      label: this._label,
      amountCents: this._amountCents,
      type: this._type,
    };
  }

  get label(): string {
    return this._label;
  }

  get amountCents(): number {
    return this._amountCents;
  }

  get type(): string {
    return this._type;
  }
}
