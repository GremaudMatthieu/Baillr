import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidTenantSiretException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static invalid(): InvalidTenantSiretException {
    return new InvalidTenantSiretException(
      'SIRET must be exactly 14 digits',
      'TENANT_SIRET_INVALID',
    );
  }
}
