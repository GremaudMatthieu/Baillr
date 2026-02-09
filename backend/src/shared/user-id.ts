import { InvalidUserIdException } from './exceptions/invalid-user-id.exception.js';

export class UserId {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): UserId {
    if (!value || !value.trim()) {
      throw InvalidUserIdException.required();
    }
    const trimmed = value.trim();
    if (!trimmed.startsWith('user_')) {
      throw InvalidUserIdException.invalidFormat();
    }
    return new UserId(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }
}
