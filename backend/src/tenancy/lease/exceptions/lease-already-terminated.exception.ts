import { DomainException } from '@shared/exceptions/domain.exception.js';

export class LeaseAlreadyTerminatedException extends DomainException {
  private constructor() {
    super('Ce bail est déjà résilié', 'LEASE_ALREADY_TERMINATED', 400);
  }

  static create(): LeaseAlreadyTerminatedException {
    return new LeaseAlreadyTerminatedException();
  }
}
