import { RentCallLineItem } from '../rent-call-line-item';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('RentCallLineItem', () => {
  it('should create from valid primitives', () => {
    const item = RentCallLineItem.fromPrimitives({
      label: 'Provisions sur charges',
      amountCents: 5000,
      type: 'provision',
    });
    expect(item.label).toBe('Provisions sur charges');
    expect(item.amountCents).toBe(5000);
    expect(item.type).toBe('provision');
  });

  it('should round-trip via toPrimitives', () => {
    const primitives = { label: 'Garage', amountCents: 3000, type: 'option' };
    const item = RentCallLineItem.fromPrimitives(primitives);
    expect(item.toPrimitives()).toEqual(primitives);
  });

  it('should reject empty label', () => {
    expect(() =>
      RentCallLineItem.fromPrimitives({ label: '', amountCents: 100, type: 'provision' }),
    ).toThrow(DomainException);
  });

  it('should reject negative amountCents', () => {
    expect(() =>
      RentCallLineItem.fromPrimitives({ label: 'Test', amountCents: -1, type: 'provision' }),
    ).toThrow(DomainException);
  });

  it('should reject empty type', () => {
    expect(() =>
      RentCallLineItem.fromPrimitives({ label: 'Test', amountCents: 100, type: '' }),
    ).toThrow(DomainException);
  });

  it('should accept zero amountCents', () => {
    const item = RentCallLineItem.fromPrimitives({
      label: 'Test',
      amountCents: 0,
      type: 'provision',
    });
    expect(item.amountCents).toBe(0);
  });
});
