import { DomainException } from '@shared/exceptions/domain.exception.js';

export class SiretRequiredForSciException extends DomainException {
  private constructor() {
    super('SIRET is required for SCI entities', 'SIRET_REQUIRED_FOR_SCI', 400);
  }

  static create(): SiretRequiredForSciException {
    return new SiretRequiredForSciException();
  }
}
