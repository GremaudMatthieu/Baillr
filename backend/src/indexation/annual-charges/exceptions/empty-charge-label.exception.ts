import { DomainException } from '@shared/exceptions/domain.exception.js';

export class EmptyChargeLabelException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_CHARGE_LABEL', 400);
  }

  static create(): EmptyChargeLabelException {
    return new EmptyChargeLabelException('Charge label cannot be empty');
  }

  static tooLong(): EmptyChargeLabelException {
    return new EmptyChargeLabelException(
      'Charge label exceeds maximum length (100 characters)',
    );
  }
}
