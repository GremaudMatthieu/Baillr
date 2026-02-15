import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidMeterReadingException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_METER_READING', 400);
  }

  static currentReadingBelowPrevious(
    unitId: string,
    previousReading: number,
    currentReading: number,
  ): InvalidMeterReadingException {
    return new InvalidMeterReadingException(
      `Current reading (${currentReading}) must be >= previous reading (${previousReading}) for unit ${unitId}`,
    );
  }

  static readingMustBeNonNegativeInteger(): InvalidMeterReadingException {
    return new InvalidMeterReadingException(
      'Meter reading must be a non-negative integer',
    );
  }

  static readingTooLarge(): InvalidMeterReadingException {
    return new InvalidMeterReadingException(
      'Meter reading must not exceed 99,999,999',
    );
  }

  static missingUnitId(): InvalidMeterReadingException {
    return new InvalidMeterReadingException('Unit ID is required');
  }

  static invalidReadingDate(): InvalidMeterReadingException {
    return new InvalidMeterReadingException(
      'Reading date must be a valid ISO date string',
    );
  }
}
