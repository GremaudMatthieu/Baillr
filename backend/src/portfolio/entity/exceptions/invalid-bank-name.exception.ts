import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBankNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidBankNameException {
    return new InvalidBankNameException('Bank name is required', 'BANK_NAME_REQUIRED');
  }

  static tooLong(): InvalidBankNameException {
    return new InvalidBankNameException('Bank name exceeds 100 characters', 'BANK_NAME_TOO_LONG');
  }
}
