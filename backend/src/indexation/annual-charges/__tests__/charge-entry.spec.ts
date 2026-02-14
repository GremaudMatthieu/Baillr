import { ChargeEntry } from '../charge-entry';

describe('ChargeEntry', () => {
  const validEntry = {
    category: 'water',
    label: 'Eau',
    amountCents: 45000,
  };

  it('should create from valid primitives', () => {
    const entry = ChargeEntry.fromPrimitives(validEntry);
    const primitives = entry.toPrimitives();
    expect(primitives.category).toBe('water');
    expect(primitives.label).toBe('Eau');
    expect(primitives.amountCents).toBe(45000);
  });

  it('should trim label whitespace', () => {
    const entry = ChargeEntry.fromPrimitives({
      ...validEntry,
      label: '  Eau  ',
    });
    expect(entry.toPrimitives().label).toBe('Eau');
  });

  it('should throw for empty label', () => {
    expect(() =>
      ChargeEntry.fromPrimitives({ ...validEntry, label: '' }),
    ).toThrow('Charge label cannot be empty');
  });

  it('should throw for whitespace-only label', () => {
    expect(() =>
      ChargeEntry.fromPrimitives({ ...validEntry, label: '   ' }),
    ).toThrow('Charge label cannot be empty');
  });

  it('should throw for label exceeding 100 chars', () => {
    expect(() =>
      ChargeEntry.fromPrimitives({
        ...validEntry,
        label: 'A'.repeat(101),
      }),
    ).toThrow('exceeds maximum length');
  });

  it('should accept label of exactly 100 chars', () => {
    const entry = ChargeEntry.fromPrimitives({
      ...validEntry,
      label: 'A'.repeat(100),
    });
    expect(entry.toPrimitives().label).toBe('A'.repeat(100));
  });

  it('should throw for negative amount', () => {
    expect(() =>
      ChargeEntry.fromPrimitives({ ...validEntry, amountCents: -1 }),
    ).toThrow('non-negative');
  });

  it('should accept zero amount', () => {
    const entry = ChargeEntry.fromPrimitives({
      ...validEntry,
      amountCents: 0,
    });
    expect(entry.amountCents).toBe(0);
  });

  it('should throw for amount exceeding max', () => {
    expect(() =>
      ChargeEntry.fromPrimitives({
        ...validEntry,
        amountCents: 100_000_000,
      }),
    ).toThrow('exceeds maximum');
  });

  it('should accept max amount 99999999', () => {
    const entry = ChargeEntry.fromPrimitives({
      ...validEntry,
      amountCents: 99_999_999,
    });
    expect(entry.amountCents).toBe(99_999_999);
  });

  it('should throw for non-integer amount', () => {
    expect(() =>
      ChargeEntry.fromPrimitives({
        ...validEntry,
        amountCents: 100.5,
      }),
    ).toThrow('must be an integer');
  });

  it('should throw for invalid category', () => {
    expect(() =>
      ChargeEntry.fromPrimitives({ ...validEntry, category: 'gas' }),
    ).toThrow('Invalid charge category');
  });

  it('should compare equality', () => {
    const a = ChargeEntry.fromPrimitives(validEntry);
    const b = ChargeEntry.fromPrimitives(validEntry);
    const c = ChargeEntry.fromPrimitives({
      ...validEntry,
      amountCents: 50000,
    });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
