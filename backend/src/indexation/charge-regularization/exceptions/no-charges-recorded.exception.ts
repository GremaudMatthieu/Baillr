import { DomainException } from '@shared/exceptions/domain.exception.js';

export class NoChargesRecordedException extends DomainException {
  private constructor(message: string) {
    super(message, 'NO_CHARGES_RECORDED', 400);
  }

  static forYear(fiscalYear: number): NoChargesRecordedException {
    return new NoChargesRecordedException(
      `No annual charges recorded for fiscal year ${fiscalYear}`,
    );
  }
}
