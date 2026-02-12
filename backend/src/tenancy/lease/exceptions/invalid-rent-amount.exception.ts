import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidRentAmountException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_RENT_AMOUNT', 400);
  }

  static notPositive(): InvalidRentAmountException {
    return new InvalidRentAmountException('Rent amount must be positive');
  }

  static tooHigh(): InvalidRentAmountException {
    return new InvalidRentAmountException(
      'Rent amount must not exceed 99999999 cents (999,999.99€)',
    );
  }

  static notInteger(): InvalidRentAmountException {
    return new InvalidRentAmountException('Rent amount must be an integer (cents)');
  }
}
