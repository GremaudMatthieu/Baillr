import { InvalidPhoneNumberException } from './exceptions/invalid-phone-number.exception.js';

const FRENCH_PHONE_REGEX = /^(\+33|0)[1-9]\d{8}$/;

export class PhoneNumber {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): PhoneNumber {
    const trimmed = value.trim().replace(/\s/g, '');
    if (!trimmed) {
      throw InvalidPhoneNumberException.required();
    }
    if (!FRENCH_PHONE_REGEX.test(trimmed)) {
      throw InvalidPhoneNumberException.invalid();
    }
    return new PhoneNumber(trimmed);
  }

  static empty(): PhoneNumber {
    return new PhoneNumber('');
  }

  get value(): string {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === '';
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }
}
