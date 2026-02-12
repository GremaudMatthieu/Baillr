import { DomainException } from '@shared/exceptions/domain.exception.js';

export class TenantAlreadyExistsException extends DomainException {
  private constructor() {
    super('Tenant already exists', 'TENANT_ALREADY_EXISTS', 409);
  }

  static create(): TenantAlreadyExistsException {
    return new TenantAlreadyExistsException();
  }
}
