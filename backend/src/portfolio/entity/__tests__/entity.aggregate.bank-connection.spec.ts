import { EntityAggregate } from '../entity.aggregate';
import { BankConnectionLinked } from '../events/bank-connection-linked.event';
import { BankConnectionDisconnected } from '../events/bank-connection-disconnected.event';
import { BankConnectionExpired } from '../events/bank-connection-expired.event';
import { BankConnectionSynced } from '../events/bank-connection-synced.event';
import { DomainException } from '../../../shared/exceptions/domain.exception';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

function createEntity(): EntityAggregate {
  const aggregate = new EntityAggregate('entity-1');
  aggregate.create(
    'user_clerk_123',
    'sci',
    'SCI TEST',
    'test@example.com',
    '12345678901234',
    {
      street: '1 rue Test',
      postalCode: '75001',
      city: 'Paris',
      country: 'France',
      complement: null,
    },
    null,
  );
  aggregate.addBankAccount(
    'user_clerk_123',
    'bank-account-1',
    'bank_account',
    'Compte BNP',
    'FR7630004000031234567890143',
    'BNPAFRPP',
    'BNP Paribas',
    true,
  );
  aggregate.commit();
  return aggregate;
}

describe('EntityAggregate — BankConnection', () => {
  let entity: EntityAggregate;

  beforeEach(() => {
    entity = createEntity();
  });

  describe('linkBankConnection', () => {
    it('should emit BankConnectionLinked event with all fields', () => {
      entity.linkBankConnection(
        'user_clerk_123',
        'conn-1',
        'bank-account-1',
        'bridge',
        'BNP_BNPAFRPP',
        'BNP Paribas',
        'req-123',
        'agreement-456',
        '2026-05-20T00:00:00.000Z',
        ['gc-account-1', 'gc-account-2'],
      );

      const events = entity.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankConnectionLinked);

      const data = (events[0] as BankConnectionLinked).data;
      expect(data).toMatchObject({
        entityId: 'entity-1',
        connectionId: 'conn-1',
        bankAccountId: 'bank-account-1',
        provider: 'bridge',
        institutionId: 'BNP_BNPAFRPP',
        institutionName: 'BNP Paribas',
        requisitionId: 'req-123',
        agreementId: 'agreement-456',
        agreementExpiry: '2026-05-20T00:00:00.000Z',
        accountIds: ['gc-account-1', 'gc-account-2'],
        status: 'linked',
      });
    });

    it('should throw if entity not created', () => {
      const fresh = new EntityAggregate('entity-2');
      expect(() =>
        fresh.linkBankConnection(
          'user_clerk_123',
          'conn-1',
          'bank-account-1',
          'bridge',
          'BNP_BNPAFRPP',
          'BNP Paribas',
          'req-123',
          'agreement-456',
          '2026-05-20T00:00:00.000Z',
          [],
        ),
      ).toThrow(DomainException);
    });

    it('should throw if unauthorized user', () => {
      expect(() =>
        entity.linkBankConnection(
          'user_wrong',
          'conn-1',
          'bank-account-1',
          'bridge',
          'BNP_BNPAFRPP',
          'BNP Paribas',
          'req-123',
          'agreement-456',
          '2026-05-20T00:00:00.000Z',
          [],
        ),
      ).toThrow('You are not authorized to modify this entity');
    });

    it('should no-op if bank account already has a connection', () => {
      entity.linkBankConnection(
        'user_clerk_123',
        'conn-1',
        'bank-account-1',
        'bridge',
        'BNP_BNPAFRPP',
        'BNP Paribas',
        'req-123',
        'agreement-456',
        '2026-05-20T00:00:00.000Z',
        ['gc-account-1'],
      );
      entity.commit();

      // Second link for same bank account should be a no-op
      entity.linkBankConnection(
        'user_clerk_123',
        'conn-2',
        'bank-account-1',
        'bridge',
        'BNP_BNPAFRPP',
        'BNP Paribas',
        'req-456',
        'agreement-789',
        '2026-08-20T00:00:00.000Z',
        ['gc-account-2'],
      );

      expect(entity.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw if bank account does not exist', () => {
      expect(() =>
        entity.linkBankConnection(
          'user_clerk_123',
          'conn-1',
          'nonexistent-account',
          'bridge',
          'BNP_BNPAFRPP',
          'BNP Paribas',
          'req-123',
          'agreement-456',
          '2026-05-20T00:00:00.000Z',
          [],
        ),
      ).toThrow('Bank account nonexistent-account not found');
    });
  });

  describe('disconnectBankConnection', () => {
    beforeEach(() => {
      entity.linkBankConnection(
        'user_clerk_123',
        'conn-1',
        'bank-account-1',
        'bridge',
        'BNP_BNPAFRPP',
        'BNP Paribas',
        'req-123',
        'agreement-456',
        '2026-05-20T00:00:00.000Z',
        ['gc-account-1'],
      );
      entity.commit();
    });

    it('should emit BankConnectionDisconnected event', () => {
      entity.disconnectBankConnection('user_clerk_123', 'conn-1');

      const events = entity.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankConnectionDisconnected);
      expect((events[0] as BankConnectionDisconnected).data).toMatchObject({
        entityId: 'entity-1',
        connectionId: 'conn-1',
      });
    });

    it('should throw if connection not found', () => {
      expect(() =>
        entity.disconnectBankConnection('user_clerk_123', 'nonexistent'),
      ).toThrow('Bank connection nonexistent not found');
    });

    it('should throw if unauthorized user', () => {
      expect(() =>
        entity.disconnectBankConnection('user_wrong', 'conn-1'),
      ).toThrow('You are not authorized to modify this entity');
    });
  });

  describe('markBankConnectionExpired', () => {
    beforeEach(() => {
      entity.linkBankConnection(
        'user_clerk_123',
        'conn-1',
        'bank-account-1',
        'bridge',
        'BNP_BNPAFRPP',
        'BNP Paribas',
        'req-123',
        'agreement-456',
        '2026-05-20T00:00:00.000Z',
        ['gc-account-1'],
      );
      entity.commit();
    });

    it('should emit BankConnectionExpired event', () => {
      entity.markBankConnectionExpired('conn-1');

      const events = entity.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankConnectionExpired);
    });

    it('should no-op if already expired', () => {
      entity.markBankConnectionExpired('conn-1');
      entity.commit();

      entity.markBankConnectionExpired('conn-1');
      expect(entity.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw if connection not found', () => {
      expect(() =>
        entity.markBankConnectionExpired('nonexistent'),
      ).toThrow('Bank connection nonexistent not found');
    });
  });

  describe('markBankConnectionSynced', () => {
    beforeEach(() => {
      entity.linkBankConnection(
        'user_clerk_123',
        'conn-1',
        'bank-account-1',
        'bridge',
        'BNP_BNPAFRPP',
        'BNP Paribas',
        'req-123',
        'agreement-456',
        '2026-05-20T00:00:00.000Z',
        ['gc-account-1'],
      );
      entity.commit();
    });

    it('should emit BankConnectionSynced event', () => {
      entity.markBankConnectionSynced('conn-1', '2026-02-19T08:00:00.000Z');

      const events = entity.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BankConnectionSynced);
      expect((events[0] as BankConnectionSynced).data).toMatchObject({
        connectionId: 'conn-1',
        lastSyncedAt: '2026-02-19T08:00:00.000Z',
      });
    });

    it('should throw if connection not found', () => {
      expect(() =>
        entity.markBankConnectionSynced('nonexistent', '2026-02-19T08:00:00.000Z'),
      ).toThrow('Bank connection nonexistent not found');
    });
  });
});
