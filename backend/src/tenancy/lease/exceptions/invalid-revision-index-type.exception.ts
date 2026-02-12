import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidRevisionIndexTypeException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_REVISION_INDEX_TYPE', 400);
  }

  static invalid(value: string): InvalidRevisionIndexTypeException {
    return new InvalidRevisionIndexTypeException(
      `Invalid revision index type: ${value}. Must be one of: IRL, ILC, ICC`,
    );
  }
}
