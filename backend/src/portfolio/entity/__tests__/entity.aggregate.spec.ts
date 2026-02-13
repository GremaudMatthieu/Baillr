import { EntityAggregate } from '../entity.aggregate';
import { EntityCreated } from '../events/entity-created.event';
import { EntityUpdated } from '../events/entity-updated.event';
import { BankAccountAdded } from '../events/bank-account-added.event';
import { BankAccountUpdated } from '../events/bank-account-updated.event';
import { BankAccountRemoved } from '../events/bank-account-removed.event';
import { DomainException } from '../../../shared/exceptions/domain.exception';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

interface CreateParams {
  userId: string;
  type: string;
  name: string;
  email: string;
  siret: string | null;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string | null;
  };
  legalInformation: string | null;
}

function validCreateParams(): CreateParams {
  return {
    userId: 'user_clerk_123',
    type: 'sci',
    name: 'SCI SIRIUS WAT',
    email: 'test@example.com',
    siret: '12345678901234',
    address: {
      street: '52 rue de la Résistance',
      postalCode: '82000',
      city: 'Montauban',
      country: 'France',
      complement: null,
    },
    legalInformation: 'Capital social: 1000€',
  };
}

function callCreate(aggregate: EntityAggregate, overrides: Partial<CreateParams> = {}) {
  const d = { ...validCreateParams(), ...overrides };
  aggregate.create(d.userId, d.type, d.name, d.email, d.siret, d.address, d.legalInformation);
}

describe('EntityAggregate', () => {
  let aggregate: EntityAggregate;

  beforeEach(() => {
    aggregate = new EntityAggregate('550e8400-e29b-41d4-a716-446655440000');
  });

  describe('create', () => {
    it('should create an entity with valid SCI data', () => {
      callCreate(aggregate);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EntityCreated);
      expect((events[0] as EntityCreated).data).toMatchObject({
        userId: 'user_clerk_123',
        type: 'sci',
        name: 'SCI SIRIUS WAT',
        siret: '12345678901234',
      });
    });

    it('should create an entity with nom_propre type without SIRET', () => {
      callCreate(aggregate, { type: 'nom_propre', siret: null });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as EntityCreated).data.type).toBe('nom_propre');
    });

    it('should trim entity name', () => {
      callCreate(aggregate, { name: '  SCI Trimmed  ' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as EntityCreated).data.name).toBe('SCI Trimmed');
    });

    it('should throw when name is empty', () => {
      expect(() => callCreate(aggregate, { name: '' })).toThrow(DomainException);
      expect(() => callCreate(aggregate, { name: '' })).toThrow('Entity name is required');
    });

    it('should throw when name is whitespace only', () => {
      expect(() => callCreate(aggregate, { name: '   ' })).toThrow(DomainException);
    });

    it('should throw for invalid entity type', () => {
      expect(() => callCreate(aggregate, { type: 'invalid' })).toThrow(
        'Entity type must be sci or nom_propre',
      );
    });

    it('should throw when SCI has no SIRET', () => {
      expect(() => callCreate(aggregate, { type: 'sci', siret: null })).toThrow(
        'SIRET is required for SCI entities',
      );
    });

    it('should throw for invalid SIRET format', () => {
      expect(() => callCreate(aggregate, { siret: '1234' })).toThrow('SIRET must be 14 digits');
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
      ).toThrow('Street is required');
    });

    it('should throw for invalid postal code format', () => {
      expect(() =>
        callCreate(aggregate, {
          address: {
            street: '1 rue Test',
            postalCode: 'ABCDE',
            city: 'Paris',
            country: 'France',
            complement: null,
          },
        }),
      ).toThrow('Postal code must be 5 digits');
    });

    it('should throw when creating entity twice', () => {
      callCreate(aggregate);
      expect(() => callCreate(aggregate)).toThrow('Entity already exists');
    });

    it('should set the stream name to entity', () => {
      expect(aggregate.streamId).toBe('entity_550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.commit();
    });

    it('should update entity name', () => {
      aggregate.update('user_clerk_123', { name: 'SCI UPDATED' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EntityUpdated);
      expect((events[0] as EntityUpdated).data.name).toBe('SCI UPDATED');
    });

    it('should update entity address', () => {
      const newAddress = {
        street: '10 rue du Nouveau',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: 'Bât. A',
      };
      aggregate.update('user_clerk_123', { address: newAddress });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as EntityUpdated).data.address).toEqual(newAddress);
    });

    it('should update legal information', () => {
      aggregate.update('user_clerk_123', { legalInformation: 'Capital: 5000€' });

      const events = aggregate.getUncommittedEvents();
      expect((events[0] as EntityUpdated).data.legalInformation).toBe('Capital: 5000€');
    });

    it('should throw when updating non-existent entity', () => {
      const freshAggregate = new EntityAggregate('new-id');
      expect(() => freshAggregate.update('user_clerk_123', { name: 'test' })).toThrow(
        'Entity does not exist',
      );
    });

    it('should throw when updating name to empty', () => {
      expect(() => aggregate.update('user_clerk_123', { name: '' })).toThrow(
        'Entity name is required',
      );
    });

    it('should throw for invalid SIRET on update', () => {
      expect(() => aggregate.update('user_clerk_123', { siret: 'abc' })).toThrow(
        'SIRET must be 14 digits',
      );
    });

    it('should throw for incomplete address on update', () => {
      expect(() =>
        aggregate.update('user_clerk_123', {
          address: {
            street: '',
            postalCode: '75001',
            city: 'Paris',
            country: 'France',
            complement: null,
          },
        }),
      ).toThrow('Street is required');
    });

    it('should allow setting siret to null on nom_propre entity', () => {
      const nomPropreAggregate = new EntityAggregate('nom-propre-id');
      callCreate(nomPropreAggregate, { type: 'nom_propre', siret: null });
      nomPropreAggregate.commit();

      nomPropreAggregate.update('user_clerk_123', { siret: null });

      const events = nomPropreAggregate.getUncommittedEvents();
      expect((events[0] as EntityUpdated).data.siret).toBeNull();
    });

    it('should throw when removing SIRET from SCI entity', () => {
      // aggregate is an SCI with SIRET (from beforeEach)
      expect(() => aggregate.update('user_clerk_123', { siret: null })).toThrow(
        'SIRET is required for SCI entities',
      );
    });

    it('should throw when user does not own the entity', () => {
      expect(() => aggregate.update('user_another', { name: 'Hacked' })).toThrow(
        'You are not authorized to modify this entity',
      );
    });
  });

  describe('event handlers', () => {
    it('should apply EntityCreated and set state', () => {
      callCreate(aggregate);

      // After applying, the aggregate should be created (no error on update)
      aggregate.commit();
      aggregate.update('user_clerk_123', { name: 'Updated Name' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });

    it('should apply EntityUpdated and update state', () => {
      callCreate(aggregate);
      aggregate.commit();

      aggregate.update('user_clerk_123', { name: 'First Update' });
      aggregate.commit();

      // Should still be able to update again
      aggregate.update('user_clerk_123', { name: 'Second Update' });
      const events = aggregate.getUncommittedEvents();
      expect((events[0] as EntityUpdated).data.name).toBe('Second Update');
    });
  });

  describe('addBankAccount', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.commit();
    });

    it('should add a bank account with valid data', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'bank_account',
        'Compte LCL',
        'FR7630002005500000157845Z02',
        'CRLYFRPP',
        'LCL',
        true,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankAccountAdded);
      expect((events[0] as BankAccountAdded).data).toMatchObject({
        accountId: 'acc-1',
        type: 'bank_account',
        label: 'Compte LCL',
        iban: 'FR7630002005500000157845Z02',
        bic: 'CRLYFRPP',
        bankName: 'LCL',
        isDefault: true,
      });
    });

    it('should add a cash register', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'cash_register',
        'Caisse',
        null,
        null,
        null,
        false,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as BankAccountAdded).data.type).toBe('cash_register');
    });

    it('should throw when entity does not exist', () => {
      const fresh = new EntityAggregate('new-id');
      expect(() =>
        fresh.addBankAccount(
          'user_clerk_123',
          'acc-1',
          'bank_account',
          'Test',
          'FR7630002005500000157845Z02',
          null,
          null,
          false,
        ),
      ).toThrow('Entity does not exist');
    });

    it('should throw when user does not own entity', () => {
      expect(() =>
        aggregate.addBankAccount(
          'user_wrong',
          'acc-1',
          'bank_account',
          'Test',
          'FR7630002005500000157845Z02',
          null,
          null,
          false,
        ),
      ).toThrow('You are not authorized to modify this entity');
    });

    it('should throw when bank account has no IBAN', () => {
      expect(() =>
        aggregate.addBankAccount(
          'user_clerk_123',
          'acc-1',
          'bank_account',
          'Test',
          null,
          null,
          null,
          false,
        ),
      ).toThrow('IBAN is required for bank accounts');
    });

    it('should throw for invalid IBAN format', () => {
      expect(() =>
        aggregate.addBankAccount(
          'user_clerk_123',
          'acc-1',
          'bank_account',
          'Test',
          'INVALID',
          null,
          null,
          false,
        ),
      ).toThrow('IBAN format is invalid');
    });

    it('should throw for invalid BIC format', () => {
      expect(() =>
        aggregate.addBankAccount(
          'user_clerk_123',
          'acc-1',
          'bank_account',
          'Test',
          'FR7630002005500000157845Z02',
          'XX',
          null,
          false,
        ),
      ).toThrow('BIC format is invalid');
    });

    it('should throw for empty label', () => {
      expect(() =>
        aggregate.addBankAccount(
          'user_clerk_123',
          'acc-1',
          'bank_account',
          '',
          'FR7630002005500000157845Z02',
          null,
          null,
          false,
        ),
      ).toThrow('Bank account label is required');
    });

    it('should throw for invalid bank account type', () => {
      expect(() =>
        aggregate.addBankAccount(
          'user_clerk_123',
          'acc-1',
          'invalid_type',
          'Test',
          'FR7630002005500000157845Z02',
          null,
          null,
          false,
        ),
      ).toThrow('Invalid bank account type: invalid_type');
    });

    it('should throw when cash register is set as default', () => {
      expect(() =>
        aggregate.addBankAccount(
          'user_clerk_123',
          'acc-1',
          'cash_register',
          'Caisse',
          null,
          null,
          null,
          true,
        ),
      ).toThrow('Cash register cannot be set as default account');
    });

    it('should enforce single cash register per entity', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'cash_register',
        'Caisse',
        null,
        null,
        null,
        false,
      );
      aggregate.commit();

      expect(() =>
        aggregate.addBankAccount(
          'user_clerk_123',
          'acc-2',
          'cash_register',
          'Caisse 2',
          null,
          null,
          null,
          false,
        ),
      ).toThrow('Entity already has a cash register');
    });

    it('should unset previous default when adding new default', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'bank_account',
        'Compte 1',
        'FR7630002005500000157845Z02',
        null,
        null,
        true,
      );
      aggregate.commit();

      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-2',
        'bank_account',
        'Compte 2',
        'FR7612345678901234567890123',
        null,
        null,
        true,
      );

      const events = aggregate.getUncommittedEvents();
      // First event: unset previous default, second: add new
      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(BankAccountUpdated);
      expect((events[0] as BankAccountUpdated).data).toMatchObject({
        accountId: 'acc-1',
        isDefault: false,
      });
      expect(events[1]).toBeInstanceOf(BankAccountAdded);
      expect((events[1] as BankAccountAdded).data.isDefault).toBe(true);
    });
  });

  describe('updateBankAccount', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'bank_account',
        'Compte LCL',
        'FR7630002005500000157845Z02',
        'CRLYFRPP',
        'LCL',
        true,
      );
      aggregate.commit();
    });

    it('should update bank account label', () => {
      aggregate.updateBankAccount('user_clerk_123', 'acc-1', { label: 'Nouveau nom' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankAccountUpdated);
      expect((events[0] as BankAccountUpdated).data.label).toBe('Nouveau nom');
    });

    it('should throw for non-existent account', () => {
      expect(() =>
        aggregate.updateBankAccount('user_clerk_123', 'non-existent', { label: 'Test' }),
      ).toThrow('Bank account non-existent not found');
    });

    it('should throw when user does not own entity', () => {
      expect(() => aggregate.updateBankAccount('user_wrong', 'acc-1', { label: 'Hacked' })).toThrow(
        'You are not authorized to modify this entity',
      );
    });

    it('should throw when cash register is set as default', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-cash',
        'cash_register',
        'Caisse',
        null,
        null,
        null,
        false,
      );
      aggregate.commit();

      expect(() =>
        aggregate.updateBankAccount('user_clerk_123', 'acc-cash', { isDefault: true }),
      ).toThrow('Cash register cannot be set as default account');
    });

    it('should throw when removing IBAN from bank account', () => {
      expect(() => aggregate.updateBankAccount('user_clerk_123', 'acc-1', { iban: null })).toThrow(
        'IBAN is required for bank accounts',
      );
    });

    it('should unset previous default when setting new default', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-2',
        'bank_account',
        'Compte 2',
        'FR7612345678901234567890123',
        null,
        null,
        false,
      );
      aggregate.commit();

      aggregate.updateBankAccount('user_clerk_123', 'acc-2', { isDefault: true });

      const events = aggregate.getUncommittedEvents();
      // First: unset acc-1 default, second: update acc-2
      expect(events).toHaveLength(2);
      expect((events[0] as BankAccountUpdated).data).toMatchObject({
        accountId: 'acc-1',
        isDefault: false,
      });
      expect((events[1] as BankAccountUpdated).data).toMatchObject({
        accountId: 'acc-2',
        isDefault: true,
      });
    });
  });

  describe('removeBankAccount', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'bank_account',
        'Compte LCL',
        'FR7630002005500000157845Z02',
        null,
        null,
        true,
      );
      aggregate.commit();
    });

    it('should remove bank account', () => {
      aggregate.removeBankAccount('user_clerk_123', 'acc-1');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankAccountRemoved);
      expect((events[0] as BankAccountRemoved).data.accountId).toBe('acc-1');
    });

    it('should throw for non-existent account', () => {
      expect(() => aggregate.removeBankAccount('user_clerk_123', 'non-existent')).toThrow(
        'Bank account non-existent not found',
      );
    });

    it('should throw when user does not own entity', () => {
      expect(() => aggregate.removeBankAccount('user_wrong', 'acc-1')).toThrow(
        'You are not authorized to modify this entity',
      );
    });

    it('should not auto-reassign default after removal', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-2',
        'bank_account',
        'Compte 2',
        'FR7612345678901234567890123',
        null,
        null,
        false,
      );
      aggregate.commit();

      aggregate.removeBankAccount('user_clerk_123', 'acc-1');

      const events = aggregate.getUncommittedEvents();
      // Only remove event, no auto-reassign
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankAccountRemoved);
    });
  });

  describe('bank account event handlers', () => {
    beforeEach(() => {
      callCreate(aggregate);
      aggregate.commit();
    });

    it('should apply BankAccountAdded and track state', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'bank_account',
        'Compte 1',
        'FR7630002005500000157845Z02',
        null,
        null,
        false,
      );
      aggregate.commit();

      // Should be able to update the added account
      aggregate.updateBankAccount('user_clerk_123', 'acc-1', { label: 'Updated' });
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
    });

    it('should apply BankAccountRemoved and clean state', () => {
      aggregate.addBankAccount(
        'user_clerk_123',
        'acc-1',
        'bank_account',
        'Compte 1',
        'FR7630002005500000157845Z02',
        null,
        null,
        false,
      );
      aggregate.commit();

      aggregate.removeBankAccount('user_clerk_123', 'acc-1');
      aggregate.commit();

      // Should throw when trying to update removed account
      expect(() =>
        aggregate.updateBankAccount('user_clerk_123', 'acc-1', { label: 'Test' }),
      ).toThrow('Bank account acc-1 not found');
    });
  });
});
