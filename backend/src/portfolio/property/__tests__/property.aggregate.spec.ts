import { PropertyAggregate } from '../property.aggregate';
import { PropertyCreated } from '../events/property-created.event';
import { PropertyUpdated } from '../events/property-updated.event';
import { DomainException } from '../../../shared/exceptions/domain.exception';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

interface CreateParams {
  userId: string;
  entityId: string;
  name: string;
  type: string | null;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string | null;
  };
}

function validCreateParams(): CreateParams {
  return {
    userId: 'user_clerk_123',
    entityId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Résidence Les Oliviers',
    type: 'Immeuble',
    address: {
      street: '52 rue de la Résistance',
      postalCode: '82000',
      city: 'Montauban',
      country: 'France',
      complement: null,
    },
  };
}

function callCreate(aggregate: PropertyAggregate, overrides: Partial<CreateParams> = {}) {
  const d = { ...validCreateParams(), ...overrides };
  aggregate.create(d.userId, d.entityId, d.name, d.type, d.address);
}

describe('PropertyAggregate', () => {
  let aggregate: PropertyAggregate;

  beforeEach(() => {
    aggregate = new PropertyAggregate('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('create', () => {
    it('should create a property with valid data', () => {
      callCreate(aggregate);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PropertyCreated);
      expect((events[0] as PropertyCreated).data).toMatchObject({
        userId: 'user_clerk_123',
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Résidence Les Oliviers',
        type: 'Immeuble',
      });
    });

    it('should create a property without type', () => {
      callCreate(aggregate, { type: null });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as PropertyCreated).data.type).toBeNull();
    });

    it('should trim property name', () => {
      callCreate(aggregate, { name: '  Résidence Trimmed  ' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as PropertyCreated).data.name).toBe('Résidence Trimmed');
    });

    it('should include address in event', () => {
      callCreate(aggregate, {
        address: {
          street: '10 rue Neuve',
          postalCode: '31000',
          city: 'Toulouse',
          country: 'France',
          complement: 'Bâtiment A',
        },
      });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as PropertyCreated).data.address).toEqual({
        street: '10 rue Neuve',
        postalCode: '31000',
        city: 'Toulouse',
        country: 'France',
        complement: 'Bâtiment A',
      });
    });

    it('should throw when name is empty', () => {
      expect(() => callCreate(aggregate, { name: '' })).toThrow(DomainException);
      expect(() => callCreate(aggregate, { name: '' })).toThrow('Property name is required');
    });

    it('should throw when name is whitespace only', () => {
      expect(() => callCreate(aggregate, { name: '   ' })).toThrow(DomainException);
    });

    it('should throw when name exceeds 255 characters', () => {
      expect(() => callCreate(aggregate, { name: 'A'.repeat(256) })).toThrow(
        'Property name exceeds 255 characters',
      );
    });

    it('should throw when address is missing street', () => {
      expect(() =>
        callCreate(aggregate, {
          address: {
            street: '',
            postalCode: '82000',
            city: 'Montauban',
            country: 'France',
            complement: null,
          },
        }),
      ).toThrow('Property address street is required');
    });

    it('should throw when address postal code is invalid', () => {
      expect(() =>
        callCreate(aggregate, {
          address: {
            street: '1 rue Test',
            postalCode: '1234',
            city: 'Montauban',
            country: 'France',
            complement: null,
          },
        }),
      ).toThrow('Property address postal code must be 5 digits');
    });

    it('should throw when address is missing city', () => {
      expect(() =>
        callCreate(aggregate, {
          address: {
            street: '1 rue Test',
            postalCode: '82000',
            city: '',
            country: 'France',
            complement: null,
          },
        }),
      ).toThrow('Property address city is required');
    });

    it('should throw when userId is invalid', () => {
      expect(() => callCreate(aggregate, { userId: 'invalid' })).toThrow(DomainException);
    });

    it('should throw when creating twice', () => {
      callCreate(aggregate);
      expect(() => callCreate(aggregate)).toThrow('Property already exists');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.commit();
    });

    it('should update property name', () => {
      aggregate.update('user_clerk_123', { name: 'Nouveau Nom' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PropertyUpdated);
      expect((events[0] as PropertyUpdated).data.name).toBe('Nouveau Nom');
    });

    it('should update property type', () => {
      aggregate.update('user_clerk_123', { type: 'Maison' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as PropertyUpdated).data.type).toBe('Maison');
    });

    it('should clear property type when set to null', () => {
      aggregate.update('user_clerk_123', { type: null });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as PropertyUpdated).data.type).toBeNull();
    });

    it('should update property address', () => {
      const newAddress = {
        street: '20 avenue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        country: 'France',
        complement: 'Appt 5',
      };
      aggregate.update('user_clerk_123', { address: newAddress });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as PropertyUpdated).data.address).toEqual(newAddress);
    });

    it('should throw when user does not own the property', () => {
      expect(() => aggregate.update('user_another', { name: 'Hacked' })).toThrow(DomainException);
      expect(() => aggregate.update('user_another', { name: 'Hacked' })).toThrow(
        'You are not authorized to access this property',
      );
    });

    it('should throw when name is empty', () => {
      expect(() => aggregate.update('user_clerk_123', { name: '' })).toThrow(
        'Property name is required',
      );
    });

    it('should throw when address has invalid postal code', () => {
      expect(() =>
        aggregate.update('user_clerk_123', {
          address: {
            street: '1 rue Test',
            postalCode: 'ABCDE',
            city: 'Paris',
            country: 'France',
            complement: null,
          },
        }),
      ).toThrow('Property address postal code must be 5 digits');
    });
  });

  describe('event handlers', () => {
    it('should rebuild state from PropertyCreated event', () => {
      callCreate(aggregate);

      // State is rebuilt via onPropertyCreated — verify by updating successfully
      aggregate.commit();
      aggregate.update('user_clerk_123', { name: 'Updated After Replay' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as PropertyUpdated).data.name).toBe('Updated After Replay');
    });

    it('should rebuild state from PropertyUpdated event', () => {
      callCreate(aggregate);
      aggregate.commit();
      aggregate.update('user_clerk_123', { name: 'First Update' });
      aggregate.commit();

      // After updating name, updating again should work
      aggregate.update('user_clerk_123', { name: 'Second Update' });
      const events = aggregate.getUncommittedEvents();
      expect((events[0] as PropertyUpdated).data.name).toBe('Second Update');
    });
  });
});
