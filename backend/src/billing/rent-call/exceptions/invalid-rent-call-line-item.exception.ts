import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidRentCallLineItemException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_RENT_CALL_LINE_ITEM', 400);
  }

  static labelEmpty(): InvalidRentCallLineItemException {
    return new InvalidRentCallLineItemException(
      'RentCallLineItem label must not be empty',
    );
  }

  static negativeAmount(): InvalidRentCallLineItemException {
    return new InvalidRentCallLineItemException(
      'RentCallLineItem amountCents must be >= 0',
    );
  }

  static typeEmpty(): InvalidRentCallLineItemException {
    return new InvalidRentCallLineItemException(
      'RentCallLineItem type must not be empty',
    );
  }
}
