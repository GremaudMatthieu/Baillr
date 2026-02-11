import { InvalidSurfaceAreaException } from './exceptions/invalid-surface-area.exception.js';

export class SurfaceArea {
  private constructor(private readonly _value: number) {}

  static fromNumber(value: number): SurfaceArea {
    if (value === undefined || value === null || Number.isNaN(value)) {
      throw InvalidSurfaceAreaException.required();
    }
    if (value <= 0) {
      throw InvalidSurfaceAreaException.mustBePositive();
    }
    return new SurfaceArea(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: SurfaceArea): boolean {
    return this._value === other._value;
  }
}
