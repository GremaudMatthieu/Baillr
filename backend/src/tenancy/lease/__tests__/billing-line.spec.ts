import { BillingLine } from '../billing-line';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('BillingLine', () => {
  describe('fromPrimitives', () => {
    it('should create a valid billing line with chargeCategoryId', () => {
      const line = BillingLine.fromPrimitives({
        chargeCategoryId: '550e8400-e29b-41d4-a716-446655440000',
        amountCents: 5000,
      });

      const primitives = line.toPrimitives();
      expect(primitives.chargeCategoryId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(primitives.amountCents).toBe(5000);
    });

    it('should accept zero amount', () => {
      const line = BillingLine.fromPrimitives({
        chargeCategoryId: '550e8400-e29b-41d4-a716-446655440000',
        amountCents: 0,
      });

      expect(line.toPrimitives().amountCents).toBe(0);
    });

    it('should reject empty chargeCategoryId', () => {
      expect(() =>
        BillingLine.fromPrimitives({ chargeCategoryId: '', amountCents: 5000 }),
      ).toThrow(DomainException);
    });

    it('should reject negative amount', () => {
      expect(() =>
        BillingLine.fromPrimitives({
          chargeCategoryId: '550e8400-e29b-41d4-a716-446655440000',
          amountCents: -1,
        }),
      ).toThrow(DomainException);
    });

    it('should reject non-integer amount', () => {
      expect(() =>
        BillingLine.fromPrimitives({
          chargeCategoryId: '550e8400-e29b-41d4-a716-446655440000',
          amountCents: 50.5,
        }),
      ).toThrow(DomainException);
    });

    it('should reject amount exceeding maximum (99999999)', () => {
      expect(() =>
        BillingLine.fromPrimitives({
          chargeCategoryId: '550e8400-e29b-41d4-a716-446655440000',
          amountCents: 100000000,
        }),
      ).toThrow(DomainException);
    });

    it('should accept amount at exactly 99999999', () => {
      const line = BillingLine.fromPrimitives({
        chargeCategoryId: '550e8400-e29b-41d4-a716-446655440000',
        amountCents: 99999999,
      });
      expect(line.toPrimitives().amountCents).toBe(99999999);
    });
  });

  describe('equals', () => {
    it('should be equal for same data', () => {
      const a = BillingLine.fromPrimitives({ chargeCategoryId: 'cat-1', amountCents: 5000 });
      const b = BillingLine.fromPrimitives({ chargeCategoryId: 'cat-1', amountCents: 5000 });
      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal for different chargeCategoryId', () => {
      const a = BillingLine.fromPrimitives({ chargeCategoryId: 'cat-1', amountCents: 5000 });
      const b = BillingLine.fromPrimitives({ chargeCategoryId: 'cat-2', amountCents: 5000 });
      expect(a.equals(b)).toBe(false);
    });

    it('should not be equal for different amountCents', () => {
      const a = BillingLine.fromPrimitives({ chargeCategoryId: 'cat-1', amountCents: 5000 });
      const b = BillingLine.fromPrimitives({ chargeCategoryId: 'cat-1', amountCents: 6000 });
      expect(a.equals(b)).toBe(false);
    });
  });
});
