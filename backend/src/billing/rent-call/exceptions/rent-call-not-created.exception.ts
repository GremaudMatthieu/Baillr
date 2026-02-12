import { DomainException } from '@shared/exceptions/domain.exception.js';

export class RentCallNotCreatedException extends DomainException {
  private constructor() {
    super('Rent call has not been created yet', 'RENT_CALL_NOT_CREATED', 400);
  }

  static create(): RentCallNotCreatedException {
    return new RentCallNotCreatedException();
  }
}
