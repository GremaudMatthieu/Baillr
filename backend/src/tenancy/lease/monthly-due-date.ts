import { InvalidMonthlyDueDateException } from './exceptions/invalid-monthly-due-date.exception.js';

export class MonthlyDueDate {
  private constructor(private readonly _value: number) {}

  static fromNumber(value: number): MonthlyDueDate {
    if (!Number.isInteger(value)) {
      throw InvalidMonthlyDueDateException.notInteger();
    }
    if (value < 1 || value > 31) {
      throw InvalidMonthlyDueDateException.outOfRange(value);
    }
    return new MonthlyDueDate(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: MonthlyDueDate): boolean {
    return this._value === other._value;
  }
}
