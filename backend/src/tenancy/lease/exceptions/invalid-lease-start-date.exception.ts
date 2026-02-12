import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidLeaseStartDateException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_LEASE_START_DATE', 400);
  }

  static invalid(): InvalidLeaseStartDateException {
    return new InvalidLeaseStartDateException('Lease start date is invalid');
  }

  static required(): InvalidLeaseStartDateException {
    return new InvalidLeaseStartDateException('Lease start date is required');
  }
}
