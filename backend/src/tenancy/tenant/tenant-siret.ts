import { InvalidTenantSiretException } from './exceptions/invalid-tenant-siret.exception.js';

export class TenantSiret {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): TenantSiret {
    const trimmed = value.trim();
    if (!/^\d{14}$/.test(trimmed)) {
      throw InvalidTenantSiretException.invalid();
    }
    return new TenantSiret(trimmed);
  }

  static empty(): TenantSiret {
    return new TenantSiret('');
  }

  get value(): string {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === '';
  }

  equals(other: TenantSiret): boolean {
    return this._value === other._value;
  }
}
