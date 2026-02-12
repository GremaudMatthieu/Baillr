import { InvalidInsuranceRenewalDateException } from './exceptions/invalid-insurance-renewal-date.exception.js';

export class InsuranceRenewalDate {
  private constructor(private readonly _value: Date | null) {}

  static create(value: string | null): InsuranceRenewalDate {
    if (value === null || value.trim() === '') {
      return InsuranceRenewalDate.empty();
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw InvalidInsuranceRenewalDateException.invalid();
    }
    return new InsuranceRenewalDate(date);
  }

  static empty(): InsuranceRenewalDate {
    return new InsuranceRenewalDate(null);
  }

  get value(): Date | null {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  toPrimitive(): string | null {
    return this._value ? this._value.toISOString() : null;
  }

  equals(other: InsuranceRenewalDate): boolean {
    if (this._value === null && other._value === null) return true;
    if (this._value === null || other._value === null) return false;
    return this._value.getTime() === other._value.getTime();
  }
}
