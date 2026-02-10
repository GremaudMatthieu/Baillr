import { DomainException } from '@shared/exceptions/domain.exception.js';

export class CashRegisterAlreadyExistsException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static create(): CashRegisterAlreadyExistsException {
    return new CashRegisterAlreadyExistsException(
      'Entity already has a cash register',
      'CASH_REGISTER_ALREADY_EXISTS',
    );
  }
}
