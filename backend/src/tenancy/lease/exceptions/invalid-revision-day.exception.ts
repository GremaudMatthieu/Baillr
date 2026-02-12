import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidRevisionDayException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_REVISION_DAY', 400);
  }

  static invalidDay(value: number): InvalidRevisionDayException {
    return new InvalidRevisionDayException(`Revision day must be between 1 and 31, got: ${value}`);
  }

  static notInteger(): InvalidRevisionDayException {
    return new InvalidRevisionDayException('Revision day must be an integer');
  }

  static invalidDayForMonth(day: number, month: number): InvalidRevisionDayException {
    return new InvalidRevisionDayException(`Day ${day} is not valid for month ${month}`);
  }
}
