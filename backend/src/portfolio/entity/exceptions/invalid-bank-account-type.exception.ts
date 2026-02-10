import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBankAccountTypeException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static create(type: string): InvalidBankAccountTypeException {
    return new InvalidBankAccountTypeException(
      `Invalid bank account type: ${type}. Must be bank_account or cash_register`,
      'INVALID_BANK_ACCOUNT_TYPE',
    );
  }
}
