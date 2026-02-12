import { DomainException } from '@shared/exceptions/domain.exception.js';

export class TenantNotFoundException extends DomainException {
  private constructor() {
    super('Tenant not found', 'TENANT_NOT_FOUND', 404);
  }

  static create(): TenantNotFoundException {
    return new TenantNotFoundException();
  }
}
