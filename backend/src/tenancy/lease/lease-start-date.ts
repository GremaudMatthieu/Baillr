import { InvalidLeaseStartDateException } from './exceptions/invalid-lease-start-date.exception.js';

export class LeaseStartDate {
  private constructor(private readonly _value: Date) {}

  static fromString(value: string): LeaseStartDate {
    if (!value || !value.trim()) {
      throw InvalidLeaseStartDateException.required();
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw InvalidLeaseStartDateException.invalid();
    }
    return new LeaseStartDate(date);
  }

  get value(): Date {
    return this._value;
  }

  toISOString(): string {
    return this._value.toISOString();
  }

  equals(other: LeaseStartDate): boolean {
    return this._value.getTime() === other._value.getTime();
  }
}
