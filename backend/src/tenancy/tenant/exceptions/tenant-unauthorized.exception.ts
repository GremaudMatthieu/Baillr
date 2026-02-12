import { DomainException } from '@shared/exceptions/domain.exception.js';

export class TenantUnauthorizedException extends DomainException {
  private constructor() {
    super('You are not authorized to access this tenant', 'TENANT_UNAUTHORIZED', 403);
  }

  static create(): TenantUnauthorizedException {
    return new TenantUnauthorizedException();
  }
}
