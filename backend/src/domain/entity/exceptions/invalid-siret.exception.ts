import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidSiretException extends DomainException {
  private constructor() {
    super('SIRET must be 14 digits', 'INVALID_SIRET_FORMAT', 400);
  }

  static invalidFormat(): InvalidSiretException {
    return new InvalidSiretException();
  }
}
