import { DomainException } from '@shared/exceptions/domain.exception.js';

export class UnauthorizedEntityAccessException extends DomainException {
  private constructor() {
    super('You are not authorized to modify this entity', 'UNAUTHORIZED_ENTITY_ACCESS', 403);
  }

  static create(): UnauthorizedEntityAccessException {
    return new UnauthorizedEntityAccessException();
  }
}
