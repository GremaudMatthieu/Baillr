import { ChargeCategory } from '../charge-category';

describe('ChargeCategory', () => {
  it.each(['water', 'electricity', 'teom', 'cleaning', 'custom'])(
    'should create from valid category "%s"',
    (value) => {
      const category = ChargeCategory.fromString(value);
      expect(category.value).toBe(value);
    },
  );

  it('should trim whitespace', () => {
    const category = ChargeCategory.fromString('  water  ');
    expect(category.value).toBe('water');
  });

  it('should throw for invalid category', () => {
    expect(() => ChargeCategory.fromString('gas')).toThrow(
      'Invalid charge category',
    );
  });

  it('should throw for empty string', () => {
    expect(() => ChargeCategory.fromString('')).toThrow(
      'Invalid charge category',
    );
  });

  it('should compare equality', () => {
    const a = ChargeCategory.fromString('water');
    const b = ChargeCategory.fromString('water');
    const c = ChargeCategory.fromString('teom');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
