import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidEntityTypeException extends DomainException {
  private constructor() {
    super('Entity type must be sci or nom_propre', 'INVALID_ENTITY_TYPE', 400);
  }

  static invalid(): InvalidEntityTypeException {
    return new InvalidEntityTypeException();
  }
}
