import { UnitAggregate } from '../unit.aggregate';
import { UnitCreated } from '../events/unit-created.event';
import { UnitUpdated } from '../events/unit-updated.event';
import { DomainException } from '../../../../shared/exceptions/domain.exception';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

interface CreateParams {
  userId: string;
  propertyId: string;
  identifier: string;
  type: string;
  floor: number | null;
  surfaceArea: number;
  billableOptions: Array<{ label: string; amountCents: number }>;
}

function validCreateParams(): CreateParams {
  return {
    userId: 'user_clerk_123',
    propertyId: '550e8400-e29b-41d4-a716-446655440001',
    identifier: 'Apt 3B',
    type: 'apartment',
    floor: 3,
    surfaceArea: 65.5,
    billableOptions: [{ label: 'Entretien chaudière', amountCents: 1500 }],
  };
}

function callCreate(aggregate: UnitAggregate, overrides: Partial<CreateParams> = {}) {
  const d = { ...validCreateParams(), ...overrides };
  aggregate.create(
    d.userId,
    d.propertyId,
    d.identifier,
    d.type,
    d.floor,
    d.surfaceArea,
    d.billableOptions,
  );
}

describe('UnitAggregate', () => {
  let aggregate: UnitAggregate;

  beforeEach(() => {
    aggregate = new UnitAggregate('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('create', () => {
    it('should create a unit with valid data', () => {
      callCreate(aggregate);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UnitCreated);
      expect((events[0] as UnitCreated).data).toMatchObject({
        userId: 'user_clerk_123',
        propertyId: '550e8400-e29b-41d4-a716-446655440001',
        identifier: 'Apt 3B',
        type: 'apartment',
        floor: 3,
        surfaceArea: 65.5,
      });
    });

    it('should create a unit with null floor', () => {
      callCreate(aggregate, { floor: null });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitCreated).data.floor).toBeNull();
    });

    it('should create a unit with empty billable options', () => {
      callCreate(aggregate, { billableOptions: [] });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitCreated).data.billableOptions).toEqual([]);
    });

    it('should create a unit with multiple billable options', () => {
      const options = [
        { label: 'Entretien chaudière', amountCents: 1500 },
        { label: 'Parking', amountCents: 5000 },
      ];
      callCreate(aggregate, { billableOptions: options });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitCreated).data.billableOptions).toEqual(options);
    });

    it('should trim identifier', () => {
      callCreate(aggregate, { identifier: '  Apt 3B  ' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitCreated).data.identifier).toBe('Apt 3B');
    });

    it('should throw when identifier is empty', () => {
      expect(() => callCreate(aggregate, { identifier: '' })).toThrow(DomainException);
      expect(() => callCreate(aggregate, { identifier: '' })).toThrow(
        'Unit identifier is required',
      );
    });

    it('should throw when identifier is whitespace only', () => {
      expect(() => callCreate(aggregate, { identifier: '   ' })).toThrow(DomainException);
    });

    it('should throw when identifier exceeds 100 characters', () => {
      expect(() => callCreate(aggregate, { identifier: 'A'.repeat(101) })).toThrow(
        'Unit identifier exceeds 100 characters',
      );
    });

    it('should throw when type is invalid', () => {
      expect(() => callCreate(aggregate, { type: 'villa' })).toThrow(DomainException);
      expect(() => callCreate(aggregate, { type: 'villa' })).toThrow('Invalid unit type "villa"');
    });

    it('should throw when type is empty', () => {
      expect(() => callCreate(aggregate, { type: '' })).toThrow('Unit type is required');
    });

    it('should accept all valid unit types', () => {
      for (const unitType of ['apartment', 'parking', 'commercial', 'storage']) {
        const agg = new UnitAggregate(`id-${unitType}`);
        callCreate(agg, { type: unitType });
        const events = agg.getUncommittedEvents();
        expect((events[0] as UnitCreated).data.type).toBe(unitType);
      }
    });

    it('should throw when floor is not an integer', () => {
      expect(() => callCreate(aggregate, { floor: 2.5 })).toThrow(DomainException);
      expect(() => callCreate(aggregate, { floor: 2.5 })).toThrow('Floor must be an integer');
    });

    it('should accept negative floor values', () => {
      callCreate(aggregate, { floor: -1 });
      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitCreated).data.floor).toBe(-1);
    });

    it('should throw when surface area is zero', () => {
      expect(() => callCreate(aggregate, { surfaceArea: 0 })).toThrow(
        'Surface area must be a positive number',
      );
    });

    it('should throw when surface area is negative', () => {
      expect(() => callCreate(aggregate, { surfaceArea: -10 })).toThrow(
        'Surface area must be a positive number',
      );
    });

    it('should throw when billable option label is empty', () => {
      expect(() =>
        callCreate(aggregate, { billableOptions: [{ label: '', amountCents: 100 }] }),
      ).toThrow('Billable option label is required');
    });

    it('should throw when billable option label exceeds 100 characters', () => {
      expect(() =>
        callCreate(aggregate, {
          billableOptions: [{ label: 'A'.repeat(101), amountCents: 100 }],
        }),
      ).toThrow('Billable option label exceeds 100 characters');
    });

    it('should throw when billable option amount is negative', () => {
      expect(() =>
        callCreate(aggregate, {
          billableOptions: [{ label: 'Test', amountCents: -1 }],
        }),
      ).toThrow('Billable option amount must be a non-negative integer');
    });

    it('should throw when billable option amount is not an integer', () => {
      expect(() =>
        callCreate(aggregate, {
          billableOptions: [{ label: 'Test', amountCents: 10.5 }],
        }),
      ).toThrow('Billable option amount must be a non-negative integer');
    });

    it('should throw when userId is invalid', () => {
      expect(() => callCreate(aggregate, { userId: 'invalid' })).toThrow(DomainException);
    });

    it('should throw when creating twice', () => {
      callCreate(aggregate);
      expect(() => callCreate(aggregate)).toThrow('Unit already exists');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.commit();
    });

    it('should update unit identifier', () => {
      aggregate.update('user_clerk_123', { identifier: 'Apt 4A' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UnitUpdated);
      expect((events[0] as UnitUpdated).data.identifier).toBe('Apt 4A');
    });

    it('should update unit type', () => {
      aggregate.update('user_clerk_123', { type: 'parking' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitUpdated).data.type).toBe('parking');
    });

    it('should update floor', () => {
      aggregate.update('user_clerk_123', { floor: 5 });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitUpdated).data.floor).toBe(5);
    });

    it('should clear floor when set to null', () => {
      aggregate.update('user_clerk_123', { floor: null });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitUpdated).data.floor).toBeNull();
    });

    it('should update surface area', () => {
      aggregate.update('user_clerk_123', { surfaceArea: 80.25 });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitUpdated).data.surfaceArea).toBe(80.25);
    });

    it('should update billable options', () => {
      const newOptions = [
        { label: 'Entretien chaudière', amountCents: 2000 },
        { label: 'Parking', amountCents: 5000 },
      ];
      aggregate.update('user_clerk_123', { billableOptions: newOptions });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitUpdated).data.billableOptions).toEqual(newOptions);
    });

    it('should not emit event when no fields are provided (no-op guard)', () => {
      aggregate.update('user_clerk_123', {});

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should throw when user does not own the unit', () => {
      expect(() => aggregate.update('user_another', { identifier: 'Hacked' })).toThrow(
        DomainException,
      );
      expect(() => aggregate.update('user_another', { identifier: 'Hacked' })).toThrow(
        'You are not authorized to access this unit',
      );
    });

    it('should throw when identifier is empty', () => {
      expect(() => aggregate.update('user_clerk_123', { identifier: '' })).toThrow(
        'Unit identifier is required',
      );
    });

    it('should throw when type is invalid', () => {
      expect(() => aggregate.update('user_clerk_123', { type: 'mansion' })).toThrow(
        'Invalid unit type "mansion"',
      );
    });

    it('should throw when surface area is zero', () => {
      expect(() => aggregate.update('user_clerk_123', { surfaceArea: 0 })).toThrow(
        'Surface area must be a positive number',
      );
    });

    it('should throw when updating a non-created unit', () => {
      const freshAggregate = new UnitAggregate('new-id');
      expect(() => freshAggregate.update('user_clerk_123', { identifier: 'Test' })).toThrow(
        'Unit does not exist',
      );
    });
  });

  describe('event handlers', () => {
    it('should rebuild state from UnitCreated event', () => {
      callCreate(aggregate);
      aggregate.commit();

      // Verify state rebuilt — update should work
      aggregate.update('user_clerk_123', { identifier: 'Updated' });
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as UnitUpdated).data.identifier).toBe('Updated');
    });

    it('should rebuild state from UnitUpdated event', () => {
      callCreate(aggregate);
      aggregate.commit();
      aggregate.update('user_clerk_123', { identifier: 'First Update' });
      aggregate.commit();

      // After updating, updating again should work
      aggregate.update('user_clerk_123', { identifier: 'Second Update' });
      const events = aggregate.getUncommittedEvents();
      expect((events[0] as UnitUpdated).data.identifier).toBe('Second Update');
    });
  });
});
