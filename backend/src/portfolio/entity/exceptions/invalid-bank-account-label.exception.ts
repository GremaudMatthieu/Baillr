import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBankAccountLabelException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidBankAccountLabelException {
    return new InvalidBankAccountLabelException(
      'Bank account label is required',
      'BANK_ACCOUNT_LABEL_REQUIRED',
    );
  }

  static tooLong(): InvalidBankAccountLabelException {
    return new InvalidBankAccountLabelException(
      'Bank account label exceeds 100 characters',
      'BANK_ACCOUNT_LABEL_TOO_LONG',
    );
  }
}
