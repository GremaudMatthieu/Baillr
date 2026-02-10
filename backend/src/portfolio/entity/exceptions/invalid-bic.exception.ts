import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidBicException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static invalidFormat(): InvalidBicException {
    return new InvalidBicException('BIC format is invalid', 'BIC_INVALID_FORMAT');
  }
}
