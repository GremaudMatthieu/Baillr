import { WaterConsumption } from '../water-consumption';

describe('WaterConsumption', () => {
  it('should create a valid consumption', () => {
    const consumption = WaterConsumption.create(50);
    expect(consumption.value).toBe(50);
  });

  it('should accept zero consumption', () => {
    const consumption = WaterConsumption.create(0);
    expect(consumption.value).toBe(0);
  });

  it('should throw for negative value', () => {
    expect(() => WaterConsumption.create(-1)).toThrow('non-negative integer');
  });

  it('should throw for non-integer value', () => {
    expect(() => WaterConsumption.create(10.5)).toThrow('non-negative integer');
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = WaterConsumption.create(50);
      const b = WaterConsumption.create(50);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = WaterConsumption.create(50);
      const b = WaterConsumption.create(80);
      expect(a.equals(b)).toBe(false);
    });
  });
});
