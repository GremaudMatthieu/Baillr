export class Money {
  constructor(public readonly cents: number) {
    if (!Number.isInteger(cents)) {
      throw new Error('Money must be expressed in integer cents');
    }
  }

  static fromEuros(euros: number): Money {
    return new Money(Math.round(euros * 100));
  }

  toEuros(): number {
    return this.cents / 100;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }
}
