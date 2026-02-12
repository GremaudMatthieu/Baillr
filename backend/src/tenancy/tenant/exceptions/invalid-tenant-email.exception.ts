import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidTenantEmailException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidTenantEmailException {
    return new InvalidTenantEmailException('Email is required', 'TENANT_EMAIL_REQUIRED');
  }

  static invalid(): InvalidTenantEmailException {
    return new InvalidTenantEmailException('Email format is invalid', 'TENANT_EMAIL_INVALID');
  }

  static tooLong(): InvalidTenantEmailException {
    return new InvalidTenantEmailException('Email exceeds 255 characters', 'TENANT_EMAIL_TOO_LONG');
  }
}
