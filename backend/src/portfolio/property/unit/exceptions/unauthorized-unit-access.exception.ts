import { DomainException } from '@shared/exceptions/domain.exception.js';

export class UnauthorizedUnitAccessException extends DomainException {
  private constructor(message: string) {
    super(message, 'UNAUTHORIZED_UNIT_ACCESS', 403);
  }

  static create(): UnauthorizedUnitAccessException {
    return new UnauthorizedUnitAccessException('You are not authorized to access this unit');
  }
}
