import { InvalidIbanException } from './exceptions/invalid-iban.exception.js';

export class Iban {
  private static readonly EMPTY = new Iban(null);
  private static readonly FORMAT = /^FR\d{2}[A-Z0-9]{23}$/;

  private constructor(private readonly _value: string | null) {}

  static fromString(value: string): Iban {
    const normalized = value.replace(/\s/g, '').toUpperCase();
    if (!Iban.FORMAT.test(normalized)) {
      throw InvalidIbanException.invalidFormat();
    }
    return new Iban(normalized);
  }

  static empty(): Iban {
    return Iban.EMPTY;
  }

  get value(): string | null {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  equals(other: Iban): boolean {
    return this._value === other._value;
  }
}
