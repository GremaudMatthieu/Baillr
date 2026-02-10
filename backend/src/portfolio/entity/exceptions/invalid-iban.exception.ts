import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidIbanException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static invalidFormat(): InvalidIbanException {
    return new InvalidIbanException('IBAN format is invalid', 'IBAN_INVALID_FORMAT');
  }

  static requiredForBankAccount(): InvalidIbanException {
    return new InvalidIbanException(
      'IBAN is required for bank accounts',
      'IBAN_REQUIRED_FOR_BANK_ACCOUNT',
    );
  }
}
