import { DomainException } from '@shared/exceptions/domain.exception.js';

export class UnitNotFoundException extends DomainException {
  private constructor() {
    super('Unit does not exist', 'UNIT_NOT_FOUND', 404);
  }

  static create(): UnitNotFoundException {
    return new UnitNotFoundException();
  }
}
