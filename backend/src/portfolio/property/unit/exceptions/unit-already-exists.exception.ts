import { DomainException } from '@shared/exceptions/domain.exception.js';

export class UnitAlreadyExistsException extends DomainException {
  private constructor() {
    super('Unit already exists', 'UNIT_ALREADY_EXISTS', 409);
  }

  static create(): UnitAlreadyExistsException {
    return new UnitAlreadyExistsException();
  }
}
