import { DomainException } from '@shared/exceptions/domain.exception.js';

export class BankConnectionNotFoundException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 404);
  }

  static create(connectionId: string): BankConnectionNotFoundException {
    return new BankConnectionNotFoundException(
      `Bank connection ${connectionId} not found`,
      'BANK_CONNECTION_NOT_FOUND',
    );
  }
}
