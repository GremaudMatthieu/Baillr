import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidWaterConsumptionException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_WATER_CONSUMPTION', 400);
  }

  static mustBeNonNegativeInteger(): InvalidWaterConsumptionException {
    return new InvalidWaterConsumptionException(
      'Water consumption must be a non-negative integer',
    );
  }
}
