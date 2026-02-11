import { DomainException } from '@shared/exceptions/domain.exception.js';

export class PropertyAlreadyExistsException extends DomainException {
  private constructor() {
    super('Property already exists', 'PROPERTY_ALREADY_EXISTS', 409);
  }

  static create(): PropertyAlreadyExistsException {
    return new PropertyAlreadyExistsException();
  }
}
