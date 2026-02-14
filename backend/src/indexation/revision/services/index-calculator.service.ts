export class IndexCalculatorService {
  calculate(
    currentRentCents: number,
    newIndexValue: number,
    baseIndexValue: number,
  ): number {
    // Official French formula: new_rent = old_rent × (new_index / base_index)
    // Multiply first to preserve precision, then floor (troncature — French law favors tenant)
    return Math.floor((currentRentCents * newIndexValue) / baseIndexValue);
  }
}
