import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidFloorException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static notAnInteger(): InvalidFloorException {
    return new InvalidFloorException('Floor must be an integer', 'FLOOR_NOT_AN_INTEGER');
  }
}
