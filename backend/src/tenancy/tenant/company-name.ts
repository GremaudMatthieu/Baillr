import { CompanyNameRequiredException } from './exceptions/company-name-required.exception.js';
import { InvalidCompanyNameException } from './exceptions/invalid-company-name.exception.js';

export class CompanyName {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): CompanyName {
    const trimmed = value.trim();
    if (!trimmed) {
      throw CompanyNameRequiredException.create();
    }
    if (trimmed.length > 255) {
      throw InvalidCompanyNameException.tooLong();
    }
    return new CompanyName(trimmed);
  }

  static empty(): CompanyName {
    return new CompanyName('');
  }

  get value(): string {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === '';
  }

  equals(other: CompanyName): boolean {
    return this._value === other._value;
  }
}
