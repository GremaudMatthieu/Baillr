import { DomainException } from '@shared/exceptions/domain.exception.js';

const VALID_STATUSES = ['linked', 'expired', 'suspended', 'disconnected'] as const;
export type BankConnectionStatusValue = (typeof VALID_STATUSES)[number];

export class InvalidBankConnectionStatusException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_BANK_CONNECTION_STATUS', 400);
  }

  static create(value: string): InvalidBankConnectionStatusException {
    return new InvalidBankConnectionStatusException(
      `Invalid bank connection status: ${value}. Must be one of: ${VALID_STATUSES.join(', ')}`,
    );
  }
}

export class BankConnectionStatus {
  private constructor(private readonly _value: BankConnectionStatusValue) {}

  static fromString(value: string): BankConnectionStatus {
    if (!VALID_STATUSES.includes(value as BankConnectionStatusValue)) {
      throw InvalidBankConnectionStatusException.create(value);
    }
    return new BankConnectionStatus(value as BankConnectionStatusValue);
  }

  static linked(): BankConnectionStatus {
    return new BankConnectionStatus('linked');
  }

  static expired(): BankConnectionStatus {
    return new BankConnectionStatus('expired');
  }

  static disconnected(): BankConnectionStatus {
    return new BankConnectionStatus('disconnected');
  }

  get value(): BankConnectionStatusValue {
    return this._value;
  }

  get isLinked(): boolean {
    return this._value === 'linked';
  }

  get isExpired(): boolean {
    return this._value === 'expired';
  }

  equals(other: BankConnectionStatus): boolean {
    return this._value === other._value;
  }
}
