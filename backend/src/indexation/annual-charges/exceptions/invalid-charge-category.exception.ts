import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidChargeCategoryException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_CHARGE_CATEGORY', 400);
  }

  static invalid(value: string): InvalidChargeCategoryException {
    return new InvalidChargeCategoryException(
      `Invalid charge category: ${value}. Must be one of: water, electricity, teom, cleaning, custom`,
    );
  }
}
