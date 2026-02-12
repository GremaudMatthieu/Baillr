import { InvalidTenantTypeException } from './exceptions/invalid-tenant-type.exception.js';

const ALLOWED_TENANT_TYPES = ['individual', 'company'] as const;
export type TenantTypeValue = (typeof ALLOWED_TENANT_TYPES)[number];

export class TenantType {
  private constructor(private readonly _value: TenantTypeValue) {}

  static fromString(value: string): TenantType {
    const trimmed = value.trim() as TenantTypeValue;
    if (!ALLOWED_TENANT_TYPES.includes(trimmed)) {
      throw InvalidTenantTypeException.invalid(value);
    }
    return new TenantType(trimmed);
  }

  get value(): TenantTypeValue {
    return this._value;
  }

  get isCompany(): boolean {
    return this._value === 'company';
  }

  equals(other: TenantType): boolean {
    return this._value === other._value;
  }
}
