import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidSurfaceAreaException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static required(): InvalidSurfaceAreaException {
    return new InvalidSurfaceAreaException('Surface area is required', 'SURFACE_AREA_REQUIRED');
  }

  static mustBePositive(): InvalidSurfaceAreaException {
    return new InvalidSurfaceAreaException(
      'Surface area must be a positive number',
      'SURFACE_AREA_MUST_BE_POSITIVE',
    );
  }
}
