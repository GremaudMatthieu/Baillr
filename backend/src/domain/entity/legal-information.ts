import { InvalidLegalInformationException } from './exceptions/invalid-legal-information.exception.js';

export class LegalInformation {
  private static readonly EMPTY = new LegalInformation(null);

  private constructor(private readonly _value: string | null) {}

  static create(value: string): LegalInformation {
    if (!value.trim()) {
      throw InvalidLegalInformationException.empty();
    }
    return new LegalInformation(value.trim());
  }

  static empty(): LegalInformation {
    return LegalInformation.EMPTY;
  }

  get value(): string | null {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  equals(other: LegalInformation): boolean {
    return this._value === other._value;
  }
}
