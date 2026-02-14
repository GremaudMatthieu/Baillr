import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidIndexTypeException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_INDEX_TYPE', 400);
  }

  static invalid(value: string): InvalidIndexTypeException {
    return new InvalidIndexTypeException(
      `Invalid index type: ${value}. Must be one of: IRL, ILC, ICC`,
    );
  }
}
