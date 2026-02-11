import { InvalidFloorException } from './exceptions/invalid-floor.exception.js';

export class Floor {
  private constructor(private readonly _value: number | null) {}

  static fromNumber(value: number): Floor {
    if (!Number.isInteger(value)) {
      throw InvalidFloorException.notAnInteger();
    }
    return new Floor(value);
  }

  static empty(): Floor {
    return new Floor(null);
  }

  get value(): number | null {
    return this._value;
  }

  get isEmpty(): boolean {
    return this._value === null;
  }

  equals(other: Floor): boolean {
    return this._value === other._value;
  }
}
