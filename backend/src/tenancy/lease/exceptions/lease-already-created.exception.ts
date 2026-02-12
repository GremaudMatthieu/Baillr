import { DomainException } from '@shared/exceptions/domain.exception.js';

export class LeaseAlreadyCreatedException extends DomainException {
  private constructor() {
    super('Lease already created', 'LEASE_ALREADY_CREATED', 409);
  }

  static create(): LeaseAlreadyCreatedException {
    return new LeaseAlreadyCreatedException();
  }
}
