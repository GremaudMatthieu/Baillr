import { DomainException } from '@shared/exceptions/domain.exception.js';

export class BankAccountNotFoundException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 404);
  }

  static create(accountId: string): BankAccountNotFoundException {
    return new BankAccountNotFoundException(
      `Bank account ${accountId} not found`,
      'BANK_ACCOUNT_NOT_FOUND',
    );
  }
}
