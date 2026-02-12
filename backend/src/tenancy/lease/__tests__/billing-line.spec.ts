import { BillingLine } from '../billing-line';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('BillingLine', () => {
  describe('fromPrimitives', () => {
    it('should create a valid billing line', () => {
      const line = BillingLine.fromPrimitives({
        label: 'Provisions sur charges',
        amountCents: 5000,
        type: 'provision',
      });

      const primitives = line.toPrimitives();
      expect(primitives.label).toBe('Provisions sur charges');
      expect(primitives.amountCents).toBe(5000);
      expect(primitives.type).toBe('provision');
    });

    it('should trim the label', () => {
      const line = BillingLine.fromPrimitives({
        label: '  Parking  ',
        amountCents: 3000,
        type: 'option',
      });

      expect(line.toPrimitives().label).toBe('Parking');
    });

    it('should accept zero amount', () => {
      const line = BillingLine.fromPrimitives({
        label: 'Free option',
        amountCents: 0,
        type: 'option',
      });

      expect(line.toPrimitives().amountCents).toBe(0);
    });

    it('should reject empty label', () => {
      expect(() =>
        BillingLine.fromPrimitives({ label: '', amountCents: 5000, type: 'provision' }),
      ).toThrow(DomainException);
    });

    it('should reject whitespace-only label', () => {
      expect(() =>
        BillingLine.fromPrimitives({ label: '   ', amountCents: 5000, type: 'provision' }),
      ).toThrow(DomainException);
    });

    it('should reject label exceeding 100 characters', () => {
      expect(() =>
        BillingLine.fromPrimitives({
          label: 'a'.repeat(101),
          amountCents: 5000,
          type: 'provision',
        }),
      ).toThrow(DomainException);
    });

    it('should accept label at exactly 100 characters', () => {
      const line = BillingLine.fromPrimitives({
        label: 'a'.repeat(100),
        amountCents: 5000,
        type: 'provision',
      });

      expect(line.toPrimitives().label.length).toBe(100);
    });

    it('should reject negative amount', () => {
      expect(() =>
        BillingLine.fromPrimitives({ label: 'Test', amountCents: -1, type: 'provision' }),
      ).toThrow(DomainException);
    });

    it('should reject non-integer amount', () => {
      expect(() =>
        BillingLine.fromPrimitives({ label: 'Test', amountCents: 50.5, type: 'provision' }),
      ).toThrow(DomainException);
    });

    it('should reject invalid type', () => {
      expect(() =>
        BillingLine.fromPrimitives({ label: 'Test', amountCents: 5000, type: 'invalid' }),
      ).toThrow(DomainException);
    });

    it('should accept all valid types', () => {
      for (const type of ['provision', 'option']) {
        const line = BillingLine.fromPrimitives({ label: 'Test', amountCents: 5000, type });
        expect(line.toPrimitives().type).toBe(type);
      }
    });

    it('should reject amount exceeding maximum (99999999)', () => {
      expect(() =>
        BillingLine.fromPrimitives({ label: 'Test', amountCents: 100000000, type: 'provision' }),
      ).toThrow(DomainException);
    });

    it('should accept amount at exactly 99999999', () => {
      const line = BillingLine.fromPrimitives({
        label: 'Test',
        amountCents: 99999999,
        type: 'provision',
      });
      expect(line.toPrimitives().amountCents).toBe(99999999);
    });
  });

  describe('equals', () => {
    it('should be equal for same data', () => {
      const a = BillingLine.fromPrimitives({ label: 'Test', amountCents: 5000, type: 'provision' });
      const b = BillingLine.fromPrimitives({ label: 'Test', amountCents: 5000, type: 'provision' });
      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal for different data', () => {
      const a = BillingLine.fromPrimitives({ label: 'Test', amountCents: 5000, type: 'provision' });
      const b = BillingLine.fromPrimitives({
        label: 'Other',
        amountCents: 5000,
        type: 'provision',
      });
      expect(a.equals(b)).toBe(false);
    });
  });
});
