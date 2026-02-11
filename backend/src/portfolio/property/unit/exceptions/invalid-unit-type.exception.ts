import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidUnitTypeException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidUnitTypeException {
    return new InvalidUnitTypeException('Unit type is required', 'UNIT_TYPE_REQUIRED');
  }

  static invalidType(value: string): InvalidUnitTypeException {
    return new InvalidUnitTypeException(
      `Invalid unit type "${value}". Allowed types: apartment, parking, commercial, storage`,
      'UNIT_TYPE_INVALID',
    );
  }
}
