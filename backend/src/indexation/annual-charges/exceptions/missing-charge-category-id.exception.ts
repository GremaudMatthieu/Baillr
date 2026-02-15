import { DomainException } from '@shared/exceptions/domain.exception.js';

export class MissingChargeCategoryIdException extends DomainException {
  private constructor(message: string) {
    super(message, 'MISSING_CHARGE_CATEGORY_ID', 400);
  }

  static create(): MissingChargeCategoryIdException {
    return new MissingChargeCategoryIdException(
      'Charge category ID is required',
    );
  }
}
