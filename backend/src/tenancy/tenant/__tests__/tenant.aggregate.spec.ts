import { TenantAggregate } from '../tenant.aggregate';
import { TenantRegistered } from '../events/tenant-registered.event';
import { TenantUpdated } from '../events/tenant-updated.event';
import { DomainException } from '../../../shared/exceptions/domain.exception';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

interface CreateParams {
  userId: string;
  entityId: string;
  type: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  siret: string | null;
  email: string;
  phoneNumber: string | null;
  address: {
    street: string | null;
    postalCode: string | null;
    city: string | null;
    complement: string | null;
  };
  insuranceProvider: string | null;
  policyNumber: string | null;
  renewalDate: string | null;
}

function validCreateParams(): CreateParams {
  return {
    userId: 'user_clerk_123',
    entityId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'individual',
    firstName: 'Jean',
    lastName: 'Dupont',
    companyName: null,
    siret: null,
    email: 'jean.dupont@example.com',
    phoneNumber: '0612345678',
    address: {
      street: '15 rue de la Paix',
      postalCode: '75002',
      city: 'Paris',
      complement: null,
    },
    insuranceProvider: null,
    policyNumber: null,
    renewalDate: null,
  };
}

function callCreate(aggregate: TenantAggregate, overrides: Partial<CreateParams> = {}) {
  const d = { ...validCreateParams(), ...overrides };
  aggregate.create(
    d.userId,
    d.entityId,
    d.type,
    d.firstName,
    d.lastName,
    d.companyName,
    d.siret,
    d.email,
    d.phoneNumber,
    d.address,
    d.insuranceProvider,
    d.policyNumber,
    d.renewalDate,
  );
}

describe('TenantAggregate', () => {
  let aggregate: TenantAggregate;

  beforeEach(() => {
    aggregate = new TenantAggregate('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('create — individual', () => {
    it('should create an individual tenant with valid data', () => {
      callCreate(aggregate);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TenantRegistered);
      expect((events[0] as TenantRegistered).data).toMatchObject({
        userId: 'user_clerk_123',
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'individual',
        firstName: 'Jean',
        lastName: 'Dupont',
        companyName: null,
        siret: null,
        email: 'jean.dupont@example.com',
        phoneNumber: '0612345678',
        insuranceProvider: null,
        policyNumber: null,
        renewalDate: null,
      });
    });

    it('should trim first name and last name', () => {
      callCreate(aggregate, { firstName: '  Jean  ', lastName: '  Dupont  ' });

      const events = aggregate.getUncommittedEvents();
      const data = (events[0] as TenantRegistered).data;
      expect(data.firstName).toBe('Jean');
      expect(data.lastName).toBe('Dupont');
    });

    it('should normalize email to lowercase', () => {
      callCreate(aggregate, { email: '  Jean.Dupont@Example.COM  ' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.email).toBe('jean.dupont@example.com');
    });

    it('should include postal address in event', () => {
      callCreate(aggregate, {
        address: {
          street: '10 avenue Foch',
          postalCode: '31000',
          city: 'Toulouse',
          complement: 'Bâtiment A',
        },
      });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.address).toEqual({
        street: '10 avenue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        complement: 'Bâtiment A',
      });
    });

    it('should create tenant with empty address', () => {
      callCreate(aggregate, {
        address: { street: null, postalCode: null, city: null, complement: null },
      });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.address).toEqual({
        street: null,
        postalCode: null,
        city: null,
        complement: null,
      });
    });

    it('should create tenant without phone number', () => {
      callCreate(aggregate, { phoneNumber: null });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.phoneNumber).toBeNull();
    });
  });

  describe('create — company', () => {
    it('should create a company tenant with companyName and SIRET', () => {
      callCreate(aggregate, {
        type: 'company',
        companyName: 'SCI Les Oliviers',
        siret: '12345678901234',
      });

      const events = aggregate.getUncommittedEvents();
      const data = (events[0] as TenantRegistered).data;
      expect(data.type).toBe('company');
      expect(data.companyName).toBe('SCI Les Oliviers');
      expect(data.siret).toBe('12345678901234');
    });

    it('should create a company tenant without SIRET', () => {
      callCreate(aggregate, {
        type: 'company',
        companyName: 'SCI Les Oliviers',
        siret: null,
      });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.siret).toBeNull();
    });

    it('should throw when company type has no companyName', () => {
      expect(() => callCreate(aggregate, { type: 'company', companyName: null })).toThrow(
        'Company name is required for company tenants',
      );
    });

    it('should throw when company type has empty companyName', () => {
      expect(() => callCreate(aggregate, { type: 'company', companyName: '  ' })).toThrow(
        'Company name is required for company tenants',
      );
    });
  });

  describe('create — validation errors', () => {
    it('should throw when type is invalid', () => {
      expect(() => callCreate(aggregate, { type: 'unknown' })).toThrow(DomainException);
      expect(() => callCreate(aggregate, { type: 'unknown' })).toThrow(
        "Invalid tenant type: 'unknown'",
      );
    });

    it('should throw when first name is empty', () => {
      expect(() => callCreate(aggregate, { firstName: '' })).toThrow('First name is required');
    });

    it('should throw when first name exceeds 100 characters', () => {
      expect(() => callCreate(aggregate, { firstName: 'A'.repeat(101) })).toThrow(
        'First name exceeds 100 characters',
      );
    });

    it('should throw when last name is empty', () => {
      expect(() => callCreate(aggregate, { lastName: '' })).toThrow('Last name is required');
    });

    it('should throw when last name exceeds 100 characters', () => {
      expect(() => callCreate(aggregate, { lastName: 'A'.repeat(101) })).toThrow(
        'Last name exceeds 100 characters',
      );
    });

    it('should throw when email is empty', () => {
      expect(() => callCreate(aggregate, { email: '' })).toThrow('Email is required');
    });

    it('should throw when email format is invalid', () => {
      expect(() => callCreate(aggregate, { email: 'invalid' })).toThrow('Email format is invalid');
    });

    it('should throw when phone number format is invalid', () => {
      expect(() => callCreate(aggregate, { phoneNumber: '123' })).toThrow(
        'Phone number format is invalid',
      );
    });

    it('should throw when SIRET is not 14 digits', () => {
      expect(() => callCreate(aggregate, { siret: '1234' })).toThrow(
        'SIRET must be exactly 14 digits',
      );
    });

    it('should throw when userId is invalid', () => {
      expect(() => callCreate(aggregate, { userId: 'invalid' })).toThrow(DomainException);
    });

    it('should throw when creating twice', () => {
      callCreate(aggregate);
      expect(() => callCreate(aggregate)).toThrow('Tenant already exists');
    });

    it('should throw when postal code is invalid', () => {
      expect(() =>
        callCreate(aggregate, {
          address: { street: '1 rue Test', postalCode: 'ABC', city: 'Paris', complement: null },
        }),
      ).toThrow('Postal code must be 5 digits');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.commit();
    });

    it('should update first name', () => {
      aggregate.update('user_clerk_123', { firstName: 'Pierre' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TenantUpdated);
      expect((events[0] as TenantUpdated).data.firstName).toBe('Pierre');
    });

    it('should update last name', () => {
      aggregate.update('user_clerk_123', { lastName: 'Martin' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.lastName).toBe('Martin');
    });

    it('should update email', () => {
      aggregate.update('user_clerk_123', { email: 'new@example.com' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.email).toBe('new@example.com');
    });

    it('should update phone number', () => {
      aggregate.update('user_clerk_123', { phoneNumber: '0698765432' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.phoneNumber).toBe('0698765432');
    });

    it('should clear phone number when set to null', () => {
      aggregate.update('user_clerk_123', { phoneNumber: null });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.phoneNumber).toBeNull();
    });

    it('should update company name', () => {
      aggregate.update('user_clerk_123', { companyName: 'SCI Nouvelle' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.companyName).toBe('SCI Nouvelle');
    });

    it('should update postal address', () => {
      const newAddress = {
        street: '20 avenue Foch',
        postalCode: '31000' as string | null,
        city: 'Toulouse' as string | null,
        complement: 'Appt 5' as string | null,
      };
      aggregate.update('user_clerk_123', { address: newAddress });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.address).toEqual(newAddress);
    });

    it('should not emit event when no fields change (no-op guard)', () => {
      aggregate.update('user_clerk_123', {});

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should throw when user does not own the tenant', () => {
      expect(() => aggregate.update('user_another', { firstName: 'Hacked' })).toThrow(
        'You are not authorized to access this tenant',
      );
    });

    it('should throw when first name is empty on update', () => {
      expect(() => aggregate.update('user_clerk_123', { firstName: '' })).toThrow(
        'First name is required',
      );
    });

    it('should throw when email is invalid on update', () => {
      expect(() => aggregate.update('user_clerk_123', { email: 'bad' })).toThrow(
        'Email format is invalid',
      );
    });

    it('should throw when clearing companyName on a company tenant', () => {
      const companyAggregate = new TenantAggregate('550e8400-e29b-41d4-a716-446655440099');
      callCreate(companyAggregate, {
        type: 'company',
        companyName: 'SCI Les Oliviers',
      });
      companyAggregate.commit();

      expect(() => companyAggregate.update('user_clerk_123', { companyName: null })).toThrow(
        'Company name is required for company tenants',
      );
    });

    it('should allow clearing companyName on an individual tenant', () => {
      aggregate.update('user_clerk_123', { companyName: null });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as TenantUpdated).data.companyName).toBeNull();
    });
  });

  describe('create — with insurance', () => {
    it('should create tenant with insurance fields', () => {
      callCreate(aggregate, {
        insuranceProvider: 'MAIF',
        policyNumber: 'POL-2026-001',
        renewalDate: '2026-12-31T00:00:00.000Z',
      });

      const events = aggregate.getUncommittedEvents();
      const data = (events[0] as TenantRegistered).data;
      expect(data.insuranceProvider).toBe('MAIF');
      expect(data.policyNumber).toBe('POL-2026-001');
      expect(data.renewalDate).toBe('2026-12-31T00:00:00.000Z');
    });

    it('should create tenant without insurance (null fields)', () => {
      callCreate(aggregate);

      const events = aggregate.getUncommittedEvents();
      const data = (events[0] as TenantRegistered).data;
      expect(data.insuranceProvider).toBeNull();
      expect(data.policyNumber).toBeNull();
      expect(data.renewalDate).toBeNull();
    });

    it('should trim insurance provider name', () => {
      callCreate(aggregate, { insuranceProvider: '  MAIF  ' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.insuranceProvider).toBe('MAIF');
    });

    it('should throw when insurance provider exceeds 255 characters', () => {
      expect(() => callCreate(aggregate, { insuranceProvider: 'A'.repeat(256) })).toThrow(
        'Insurance provider name exceeds 255 characters',
      );
    });

    it('should throw when policy number exceeds 100 characters', () => {
      expect(() => callCreate(aggregate, { policyNumber: 'A'.repeat(101) })).toThrow(
        'Policy number exceeds 100 characters',
      );
    });

    it('should throw when renewal date is invalid', () => {
      expect(() => callCreate(aggregate, { renewalDate: 'not-a-date' })).toThrow(
        'Insurance renewal date is not a valid date',
      );
    });

    it('should treat whitespace-only insurance provider as null', () => {
      callCreate(aggregate, { insuranceProvider: '   ' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.insuranceProvider).toBeNull();
    });

    it('should treat whitespace-only policy number as null', () => {
      callCreate(aggregate, { policyNumber: '   ' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantRegistered).data.policyNumber).toBeNull();
    });
  });

  describe('update — insurance fields', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.commit();
    });

    it('should update insurance provider', () => {
      aggregate.update('user_clerk_123', { insuranceProvider: 'AXA' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as TenantUpdated).data.insuranceProvider).toBe('AXA');
    });

    it('should update policy number', () => {
      aggregate.update('user_clerk_123', { policyNumber: 'NEW-POL-123' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.policyNumber).toBe('NEW-POL-123');
    });

    it('should update renewal date', () => {
      aggregate.update('user_clerk_123', { renewalDate: '2027-06-15T00:00:00.000Z' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.renewalDate).toBe('2027-06-15T00:00:00.000Z');
    });

    it('should clear insurance provider when set to null', () => {
      // First set it
      aggregate.update('user_clerk_123', { insuranceProvider: 'MAIF' });
      aggregate.commit();

      // Then clear it
      aggregate.update('user_clerk_123', { insuranceProvider: null });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.insuranceProvider).toBeNull();
    });

    it('should clear renewal date when set to null', () => {
      aggregate.update('user_clerk_123', { renewalDate: null });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.renewalDate).toBeNull();
    });
  });

  describe('event handlers', () => {
    it('should rebuild state from TenantRegistered event', () => {
      callCreate(aggregate);
      aggregate.commit();

      // Verify state rebuilt by performing a successful update
      aggregate.update('user_clerk_123', { firstName: 'Updated After Replay' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as TenantUpdated).data.firstName).toBe('Updated After Replay');
    });

    it('should rebuild state from TenantUpdated event', () => {
      callCreate(aggregate);
      aggregate.commit();
      aggregate.update('user_clerk_123', { firstName: 'First Update' });
      aggregate.commit();

      // After updating, second update should work
      aggregate.update('user_clerk_123', { firstName: 'Second Update' });
      const events = aggregate.getUncommittedEvents();
      expect((events[0] as TenantUpdated).data.firstName).toBe('Second Update');
    });
  });
});
