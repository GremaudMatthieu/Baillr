import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidMonthlyDueDateException extends DomainException {
  private constructor(message: string) {
    super(message, 'INVALID_MONTHLY_DUE_DATE', 400);
  }

  static outOfRange(value: number): InvalidMonthlyDueDateException {
    return new InvalidMonthlyDueDateException(
      `Monthly due date must be between 1 and 31, got: ${value}`,
    );
  }

  static notInteger(): InvalidMonthlyDueDateException {
    return new InvalidMonthlyDueDateException('Monthly due date must be an integer');
  }
}
