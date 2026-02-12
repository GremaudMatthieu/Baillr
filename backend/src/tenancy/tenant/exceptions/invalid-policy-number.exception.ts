import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidPolicyNumberException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static empty(): InvalidPolicyNumberException {
    return new InvalidPolicyNumberException('Policy number is required', 'POLICY_NUMBER_EMPTY');
  }

  static tooLong(): InvalidPolicyNumberException {
    return new InvalidPolicyNumberException(
      'Policy number exceeds 100 characters',
      'POLICY_NUMBER_TOO_LONG',
    );
  }
}
