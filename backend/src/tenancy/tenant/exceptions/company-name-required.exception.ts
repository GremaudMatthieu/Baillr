import { DomainException } from '@shared/exceptions/domain.exception.js';

export class CompanyNameRequiredException extends DomainException {
  private constructor() {
    super('Company name is required for company tenants', 'COMPANY_NAME_REQUIRED', 400);
  }

  static create(): CompanyNameRequiredException {
    return new CompanyNameRequiredException();
  }
}
