import { DomainException } from '@shared/exceptions/domain.exception.js';

export class LeaseNotCreatedException extends DomainException {
  private constructor() {
    super('Lease has not been created yet', 'LEASE_NOT_CREATED', 400);
  }

  static create(): LeaseNotCreatedException {
    return new LeaseNotCreatedException();
  }
}
