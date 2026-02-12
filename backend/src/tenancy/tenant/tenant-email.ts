import { InvalidTenantEmailException } from './exceptions/invalid-tenant-email.exception.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class TenantEmail {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): TenantEmail {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      throw InvalidTenantEmailException.required();
    }
    if (trimmed.length > 255) {
      throw InvalidTenantEmailException.tooLong();
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      throw InvalidTenantEmailException.invalid();
    }
    return new TenantEmail(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: TenantEmail): boolean {
    return this._value === other._value;
  }
}
