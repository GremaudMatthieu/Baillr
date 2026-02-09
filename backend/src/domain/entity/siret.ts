import { InvalidSiretException } from './exceptions/invalid-siret.exception.js';

export class Siret {
  private static readonly EMPTY = new Siret(null);

  private constructor(private readonly _value: string | null) {}

  static create(value: string): Siret {
    if (!/^\d{14}$/.test(value)) {
      throw InvalidSiretException.invalidFormat();
    }
    return new Siret(value);
  }

  static empty(): Siret {
    return Siret.EMPTY;
  }

  get value(): string | null {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  equals(other: Siret): boolean {
    return this._value === other._value;
  }
}
