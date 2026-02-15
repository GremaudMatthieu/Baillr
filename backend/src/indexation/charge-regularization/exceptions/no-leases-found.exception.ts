import { DomainException } from '@shared/exceptions/domain.exception.js';

export class NoLeasesFoundException extends DomainException {
  private constructor(message: string) {
    super(message, 'NO_LEASES_FOUND', 400);
  }

  static forYear(fiscalYear: number): NoLeasesFoundException {
    return new NoLeasesFoundException(
      `No leases found for fiscal year ${fiscalYear}`,
    );
  }
}
