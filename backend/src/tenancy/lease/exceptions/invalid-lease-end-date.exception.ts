import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidLeaseEndDateException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_LEASE_END_DATE', 400);
  }

  static required(): InvalidLeaseEndDateException {
    return new InvalidLeaseEndDateException('La date de fin est requise');
  }

  static invalid(): InvalidLeaseEndDateException {
    return new InvalidLeaseEndDateException('La date de fin est invalide');
  }

  static beforeStartDate(): InvalidLeaseEndDateException {
    return new InvalidLeaseEndDateException('La date de fin ne peut pas être antérieure à la date de début');
  }
}
