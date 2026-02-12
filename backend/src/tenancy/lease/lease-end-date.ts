import { InvalidLeaseEndDateException } from './exceptions/invalid-lease-end-date.exception.js';

export class LeaseEndDate {
  private constructor(private readonly _value: Date) {}

  static fromString(value: string): LeaseEndDate {
    if (!value || !value.trim()) {
      throw InvalidLeaseEndDateException.required();
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw InvalidLeaseEndDateException.invalid();
    }
    return new LeaseEndDate(date);
  }

  static empty(): LeaseEndDate {
    return new LeaseEndDate(new Date(0));
  }

  get isEmpty(): boolean {
    return this._value.getTime() === 0;
  }

  get value(): Date {
    return this._value;
  }

  toISOString(): string {
    return this._value.toISOString();
  }

  equals(other: LeaseEndDate): boolean {
    return this._value.getTime() === other._value.getTime();
  }
}
