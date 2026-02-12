import { DomainException } from '@shared/exceptions/domain.exception.js';

export class LeaseNotCreatedException extends DomainException {
  private constructor() {
    super('Lease must be created before configuring billing lines', 'LEASE_NOT_CREATED', 400);
  }

  static create(): LeaseNotCreatedException {
    return new LeaseNotCreatedException();
  }
}
