import { Money } from './money';

describe('Money', () => {
  describe('constructor', () => {
    it('should create a Money instance with integer cents', () => {
      const money = new Money(1500);
      expect(money.cents).toBe(1500);
    });

    it('should reject non-integer cents', () => {
      expect(() => new Money(15.5)).toThrow('Money must be expressed in integer cents');
    });

    it('should accept zero', () => {
      const money = new Money(0);
      expect(money.cents).toBe(0);
    });

    it('should accept negative cents', () => {
      const money = new Money(-500);
      expect(money.cents).toBe(-500);
    });
  });

  describe('fromEuros', () => {
    it('should convert euros to cents', () => {
      const money = Money.fromEuros(15.99);
      expect(money.cents).toBe(1599);
    });

    it('should round to nearest cent', () => {
      const money = Money.fromEuros(10.005);
      expect(money.cents).toBe(1001);
    });

    it('should handle zero euros', () => {
      const money = Money.fromEuros(0);
      expect(money.cents).toBe(0);
    });
  });

  describe('toEuros', () => {
    it('should convert cents to euros', () => {
      const money = new Money(1599);
      expect(money.toEuros()).toBe(15.99);
    });

    it('should handle zero', () => {
      const money = new Money(0);
      expect(money.toEuros()).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two Money values', () => {
      const a = new Money(1000);
      const b = new Money(500);
      const result = a.add(b);
      expect(result.cents).toBe(1500);
    });
  });

  describe('subtract', () => {
    it('should subtract two Money values', () => {
      const a = new Money(1000);
      const b = new Money(300);
      const result = a.subtract(b);
      expect(result.cents).toBe(700);
    });

    it('should allow negative results', () => {
      const a = new Money(300);
      const b = new Money(1000);
      const result = a.subtract(b);
      expect(result.cents).toBe(-700);
    });
  });
});
