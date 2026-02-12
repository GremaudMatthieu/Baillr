import { InvalidInsuranceProviderException } from './exceptions/invalid-insurance-provider.exception.js';

export class InsuranceProvider {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): InsuranceProvider {
    const trimmed = value.trim();
    if (!trimmed) {
      throw InvalidInsuranceProviderException.empty();
    }
    if (trimmed.length > 255) {
      throw InvalidInsuranceProviderException.tooLong();
    }
    return new InsuranceProvider(trimmed);
  }

  static empty(): InsuranceProvider {
    return new InsuranceProvider('');
  }

  get value(): string {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === '';
  }

  equals(other: InsuranceProvider): boolean {
    return this._value === other._value;
  }
}
