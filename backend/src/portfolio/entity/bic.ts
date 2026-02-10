import { InvalidBicException } from './exceptions/invalid-bic.exception.js';

export class Bic {
  private static readonly EMPTY = new Bic(null);
  private static readonly FORMAT = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

  private constructor(private readonly _value: string | null) {}

  static fromString(value: string): Bic {
    const normalized = value.replace(/\s/g, '').toUpperCase();
    if (!Bic.FORMAT.test(normalized)) {
      throw InvalidBicException.invalidFormat();
    }
    return new Bic(normalized);
  }

  static empty(): Bic {
    return Bic.EMPTY;
  }

  get value(): string | null {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  equals(other: Bic): boolean {
    return this._value === other._value;
  }
}
