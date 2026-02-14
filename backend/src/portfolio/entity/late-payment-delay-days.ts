import { InvalidLatePaymentDelayDaysException } from './exceptions/invalid-late-payment-delay-days.exception.js';

export class LatePaymentDelayDays {
  static readonly DEFAULT = 5;

  private constructor(private readonly _value: number) {}

  static create(value: number): LatePaymentDelayDays {
    if (!Number.isInteger(value)) {
      throw InvalidLatePaymentDelayDaysException.notInteger();
    }
    if (value < 0) {
      throw InvalidLatePaymentDelayDaysException.tooLow();
    }
    if (value > 90) {
      throw InvalidLatePaymentDelayDaysException.tooHigh();
    }
    return new LatePaymentDelayDays(value);
  }

  static default(): LatePaymentDelayDays {
    return new LatePaymentDelayDays(LatePaymentDelayDays.DEFAULT);
  }

  get value(): number {
    return this._value;
  }

  equals(other: LatePaymentDelayDays): boolean {
    return this._value === other._value;
  }
}
