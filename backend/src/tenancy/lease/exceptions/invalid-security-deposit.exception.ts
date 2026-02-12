import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidSecurityDepositException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_SECURITY_DEPOSIT', 400);
  }

  static negative(): InvalidSecurityDepositException {
    return new InvalidSecurityDepositException('Security deposit must not be negative');
  }

  static tooHigh(): InvalidSecurityDepositException {
    return new InvalidSecurityDepositException(
      'Security deposit must not exceed 99999999 cents (999,999.99€)',
    );
  }

  static notInteger(): InvalidSecurityDepositException {
    return new InvalidSecurityDepositException('Security deposit must be an integer (cents)');
  }
}
