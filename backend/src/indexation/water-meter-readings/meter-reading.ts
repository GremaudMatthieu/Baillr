import { InvalidMeterReadingException } from './exceptions/invalid-meter-reading.exception.js';

export interface MeterReadingPrimitives {
  unitId: string;
  previousReading: number;
  currentReading: number;
  readingDate: string;
}

export class MeterReading {
  private constructor(
    private readonly _unitId: string,
    private readonly _previousReading: number,
    private readonly _currentReading: number,
    private readonly _readingDate: string,
  ) {}

  static fromPrimitives(data: MeterReadingPrimitives): MeterReading {
    const unitId = data.unitId?.trim() ?? '';
    if (!unitId) {
      throw InvalidMeterReadingException.missingUnitId();
    }

    if (
      data.previousReading === undefined ||
      data.previousReading === null ||
      !Number.isInteger(data.previousReading) ||
      data.previousReading < 0
    ) {
      throw InvalidMeterReadingException.readingMustBeNonNegativeInteger();
    }
    if (data.previousReading > 99_999_999) {
      throw InvalidMeterReadingException.readingTooLarge();
    }

    if (
      data.currentReading === undefined ||
      data.currentReading === null ||
      !Number.isInteger(data.currentReading) ||
      data.currentReading < 0
    ) {
      throw InvalidMeterReadingException.readingMustBeNonNegativeInteger();
    }
    if (data.currentReading > 99_999_999) {
      throw InvalidMeterReadingException.readingTooLarge();
    }

    if (data.currentReading < data.previousReading) {
      throw InvalidMeterReadingException.currentReadingBelowPrevious(
        unitId,
        data.previousReading,
        data.currentReading,
      );
    }

    const readingDate = data.readingDate?.trim() ?? '';
    if (!readingDate || isNaN(new Date(readingDate).getTime())) {
      throw InvalidMeterReadingException.invalidReadingDate();
    }

    return new MeterReading(unitId, data.previousReading, data.currentReading, readingDate);
  }

  toPrimitives(): MeterReadingPrimitives {
    return {
      unitId: this._unitId,
      previousReading: this._previousReading,
      currentReading: this._currentReading,
      readingDate: this._readingDate,
    };
  }

  get unitId(): string {
    return this._unitId;
  }

  get consumption(): number {
    return this._currentReading - this._previousReading;
  }

  equals(other: MeterReading): boolean {
    return (
      this._unitId === other._unitId &&
      this._previousReading === other._previousReading &&
      this._currentReading === other._currentReading &&
      this._readingDate === other._readingDate
    );
  }
}
