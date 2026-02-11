import { DomainException } from '@shared/exceptions/domain.exception.js';

export class PropertyNotFoundException extends DomainException {
  private constructor() {
    super('Property does not exist', 'PROPERTY_NOT_FOUND', 404);
  }

  static create(): PropertyNotFoundException {
    return new PropertyNotFoundException();
  }
}
