import { DomainException } from '@shared/exceptions/domain.exception.js';

export class UnauthorizedPropertyAccessException extends DomainException {
  private constructor(message: string) {
    super(message, 'UNAUTHORIZED_PROPERTY_ACCESS', 403);
  }

  static create(): UnauthorizedPropertyAccessException {
    return new UnauthorizedPropertyAccessException(
      'You are not authorized to access this property',
    );
  }
}
