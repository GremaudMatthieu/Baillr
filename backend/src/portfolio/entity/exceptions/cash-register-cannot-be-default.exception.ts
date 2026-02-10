import { DomainException } from '@shared/exceptions/domain.exception.js';

export class CashRegisterCannotBeDefaultException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static create(): CashRegisterCannotBeDefaultException {
    return new CashRegisterCannotBeDefaultException(
      'Cash register cannot be set as default account',
      'CASH_REGISTER_CANNOT_BE_DEFAULT',
    );
  }
}
