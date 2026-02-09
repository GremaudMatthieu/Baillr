import { DomainException } from '@shared/exceptions/domain.exception.js';

export class EntityAlreadyExistsException extends DomainException {
  private constructor() {
    super('Entity already exists', 'ENTITY_ALREADY_EXISTS', 409);
  }

  static create(): EntityAlreadyExistsException {
    return new EntityAlreadyExistsException();
  }
}
