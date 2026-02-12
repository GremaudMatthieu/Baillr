import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidTenantTypeException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static invalid(value: string): InvalidTenantTypeException {
    return new InvalidTenantTypeException(
      `Invalid tenant type: '${value}'. Allowed values: individual, company`,
      'TENANT_TYPE_INVALID',
    );
  }
}
