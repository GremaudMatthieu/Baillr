import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidRentCallMonthException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_RENT_CALL_MONTH', 400);
  }

  static invalidFormat(): InvalidRentCallMonthException {
    return new InvalidRentCallMonthException(
      'Rent call month must be in YYYY-MM format',
    );
  }

  static monthOutOfRange(): InvalidRentCallMonthException {
    return new InvalidRentCallMonthException(
      'Month must be between 1 and 12',
    );
  }

  static yearTooLow(): InvalidRentCallMonthException {
    return new InvalidRentCallMonthException(
      'Year must be 2020 or later',
    );
  }
}
