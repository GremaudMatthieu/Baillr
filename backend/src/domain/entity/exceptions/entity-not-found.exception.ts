import { DomainException } from '@shared/exceptions/domain.exception.js';

export class EntityNotFoundException extends DomainException {
  private constructor() {
    super('Entity does not exist', 'ENTITY_NOT_FOUND', 404);
  }

  static create(): EntityNotFoundException {
    return new EntityNotFoundException();
  }
}
