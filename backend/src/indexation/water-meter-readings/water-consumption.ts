import { InvalidWaterConsumptionException } from './exceptions/invalid-water-consumption.exception.js';

export class WaterConsumption {
  private constructor(private readonly _value: number) {}

  static create(value: number): WaterConsumption {
    if (!Number.isInteger(value) || value < 0) {
      throw InvalidWaterConsumptionException.mustBeNonNegativeInteger();
    }
    return new WaterConsumption(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: WaterConsumption): boolean {
    return this._value === other._value;
  }
}
