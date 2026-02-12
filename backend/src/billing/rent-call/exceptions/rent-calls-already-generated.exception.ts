import { DomainException } from '@shared/exceptions/domain.exception.js';

export class RentCallsAlreadyGeneratedException extends DomainException {
  private constructor(message: string) {
    super(message, 'RENT_CALLS_ALREADY_GENERATED', 409);
  }

  static forMonth(month: string): RentCallsAlreadyGeneratedException {
    return new RentCallsAlreadyGeneratedException(
      `Appels de loyer déjà générés pour ce mois (${month})`,
    );
  }
}
