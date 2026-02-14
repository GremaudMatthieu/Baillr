// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

import { LeaseAggregate } from '../lease.aggregate';
import { LeaseCreated } from '../events/lease-created.event';
import { LeaseBillingLinesConfigured } from '../events/lease-billing-lines-configured.event';
import { LeaseRevisionParametersConfigured } from '../events/lease-revision-parameters-configured.event';
import { LeaseTerminated } from '../events/lease-terminated.event';
import { LeaseRentRevised } from '../events/lease-rent-revised.event';
import { DomainException } from '@shared/exceptions/domain.exception';

function createAggregate(id = 'lease-123'): LeaseAggregate {
  return new LeaseAggregate(id);
}

const validParams = {
  userId: 'user_abc123',
  entityId: 'entity-1',
  tenantId: 'tenant-1',
  unitId: 'unit-1',
  startDate: '2026-03-01T00:00:00.000Z',
  rentAmountCents: 63000,
  securityDepositCents: 63000,
  monthlyDueDate: 5,
  revisionIndexType: 'IRL',
};

describe('LeaseAggregate', () => {
  describe('create', () => {
    it('should create a lease with valid data', () => {
      const aggregate = createAggregate();
      aggregate.create(
        validParams.userId,
        validParams.entityId,
        validParams.tenantId,
        validParams.unitId,
        validParams.startDate,
        validParams.rentAmountCents,
        validParams.securityDepositCents,
        validParams.monthlyDueDate,
        validParams.revisionIndexType,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LeaseCreated);

      const event = events[0] as LeaseCreated;
      expect(event.data.id).toBe('lease-123');
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.userId).toBe('user_abc123');
      expect(event.data.tenantId).toBe('tenant-1');
      expect(event.data.unitId).toBe('unit-1');
      expect(event.data.startDate).toBe('2026-03-01T00:00:00.000Z');
      expect(event.data.rentAmountCents).toBe(63000);
      expect(event.data.securityDepositCents).toBe(63000);
      expect(event.data.monthlyDueDate).toBe(5);
      expect(event.data.revisionIndexType).toBe('IRL');
    });

    it('should reject duplicate create', () => {
      const aggregate = createAggregate();
      aggregate.create(
        validParams.userId,
        validParams.entityId,
        validParams.tenantId,
        validParams.unitId,
        validParams.startDate,
        validParams.rentAmountCents,
        validParams.securityDepositCents,
        validParams.monthlyDueDate,
        validParams.revisionIndexType,
      );

      expect(() =>
        aggregate.create(
          validParams.userId,
          validParams.entityId,
          validParams.tenantId,
          validParams.unitId,
          validParams.startDate,
          validParams.rentAmountCents,
          validParams.securityDepositCents,
          validParams.monthlyDueDate,
          validParams.revisionIndexType,
        ),
      ).toThrow(DomainException);
    });

    it('should reject invalid rent amount (zero)', () => {
      const aggregate = createAggregate();
      expect(() =>
        aggregate.create(
          validParams.userId,
          validParams.entityId,
          validParams.tenantId,
          validParams.unitId,
          validParams.startDate,
          0,
          validParams.securityDepositCents,
          validParams.monthlyDueDate,
          validParams.revisionIndexType,
        ),
      ).toThrow(DomainException);
    });

    it('should reject negative security deposit', () => {
      const aggregate = createAggregate();
      expect(() =>
        aggregate.create(
          validParams.userId,
          validParams.entityId,
          validParams.tenantId,
          validParams.unitId,
          validParams.startDate,
          validParams.rentAmountCents,
          -100,
          validParams.monthlyDueDate,
          validParams.revisionIndexType,
        ),
      ).toThrow(DomainException);
    });

    it('should reject invalid monthly due date (0)', () => {
      const aggregate = createAggregate();
      expect(() =>
        aggregate.create(
          validParams.userId,
          validParams.entityId,
          validParams.tenantId,
          validParams.unitId,
          validParams.startDate,
          validParams.rentAmountCents,
          validParams.securityDepositCents,
          0,
          validParams.revisionIndexType,
        ),
      ).toThrow(DomainException);
    });

    it('should reject invalid monthly due date (32)', () => {
      const aggregate = createAggregate();
      expect(() =>
        aggregate.create(
          validParams.userId,
          validParams.entityId,
          validParams.tenantId,
          validParams.unitId,
          validParams.startDate,
          validParams.rentAmountCents,
          validParams.securityDepositCents,
          32,
          validParams.revisionIndexType,
        ),
      ).toThrow(DomainException);
    });

    it('should reject invalid revision index type', () => {
      const aggregate = createAggregate();
      expect(() =>
        aggregate.create(
          validParams.userId,
          validParams.entityId,
          validParams.tenantId,
          validParams.unitId,
          validParams.startDate,
          validParams.rentAmountCents,
          validParams.securityDepositCents,
          validParams.monthlyDueDate,
          'INVALID',
        ),
      ).toThrow(DomainException);
    });

    it('should reject invalid start date', () => {
      const aggregate = createAggregate();
      expect(() =>
        aggregate.create(
          validParams.userId,
          validParams.entityId,
          validParams.tenantId,
          validParams.unitId,
          'not-a-date',
          validParams.rentAmountCents,
          validParams.securityDepositCents,
          validParams.monthlyDueDate,
          validParams.revisionIndexType,
        ),
      ).toThrow(DomainException);
    });
  });

  describe('configureBillingLines', () => {
    function createExistingLease(id = 'lease-123'): LeaseAggregate {
      const aggregate = createAggregate(id);
      aggregate.create(
        validParams.userId,
        validParams.entityId,
        validParams.tenantId,
        validParams.unitId,
        validParams.startDate,
        validParams.rentAmountCents,
        validParams.securityDepositCents,
        validParams.monthlyDueDate,
        validParams.revisionIndexType,
      );
      aggregate.commit();
      return aggregate;
    }

    it('should configure billing lines on existing lease', () => {
      const aggregate = createExistingLease();
      aggregate.configureBillingLines([
        { label: 'Provisions sur charges', amountCents: 5000, type: 'provision' },
        { label: 'Parking', amountCents: 3000, type: 'option' },
      ]);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LeaseBillingLinesConfigured);

      const event = events[0] as LeaseBillingLinesConfigured;
      expect(event.data.leaseId).toBe('lease-123');
      expect(event.data.billingLines).toHaveLength(2);
      expect(event.data.billingLines[0]).toEqual({
        label: 'Provisions sur charges',
        amountCents: 5000,
        type: 'provision',
      });
      expect(event.data.billingLines[1]).toEqual({
        label: 'Parking',
        amountCents: 3000,
        type: 'option',
      });
    });

    it('should skip event when empty billing lines on fresh lease (no-op)', () => {
      const aggregate = createExistingLease();
      aggregate.configureBillingLines([]);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should skip event when billing lines unchanged (no-op)', () => {
      const aggregate = createExistingLease();
      aggregate.configureBillingLines([
        { label: 'Provisions', amountCents: 5000, type: 'provision' },
      ]);
      aggregate.commit();

      aggregate.configureBillingLines([
        { label: 'Provisions', amountCents: 5000, type: 'provision' },
      ]);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should reject configuring billing lines before lease creation', () => {
      const aggregate = createAggregate();
      expect(() =>
        aggregate.configureBillingLines([{ label: 'Test', amountCents: 5000, type: 'provision' }]),
      ).toThrow(DomainException);
    });

    it('should reject invalid billing line data', () => {
      const aggregate = createExistingLease();
      expect(() =>
        aggregate.configureBillingLines([{ label: '', amountCents: 5000, type: 'provision' }]),
      ).toThrow(DomainException);
    });

    it('should allow reconfiguring billing lines (idempotent update)', () => {
      const aggregate = createExistingLease();

      aggregate.configureBillingLines([{ label: 'First', amountCents: 1000, type: 'provision' }]);
      aggregate.commit();

      aggregate.configureBillingLines([{ label: 'Second', amountCents: 2000, type: 'option' }]);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as LeaseBillingLinesConfigured;
      expect(event.data.billingLines).toHaveLength(1);
      expect(event.data.billingLines[0].label).toBe('Second');
    });
  });

  describe('configureRevisionParameters', () => {
    function createExistingLease(id = 'lease-123'): LeaseAggregate {
      const aggregate = createAggregate(id);
      aggregate.create(
        validParams.userId,
        validParams.entityId,
        validParams.tenantId,
        validParams.unitId,
        validParams.startDate,
        validParams.rentAmountCents,
        validParams.securityDepositCents,
        validParams.monthlyDueDate,
        validParams.revisionIndexType,
      );
      aggregate.commit();
      return aggregate;
    }

    it('should configure revision parameters on existing lease', () => {
      const aggregate = createExistingLease();
      aggregate.configureRevisionParameters(15, 3, 'Q2', 2025, 142.06);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LeaseRevisionParametersConfigured);

      const event = events[0] as LeaseRevisionParametersConfigured;
      expect(event.data.leaseId).toBe('lease-123');
      expect(event.data.revisionDay).toBe(15);
      expect(event.data.revisionMonth).toBe(3);
      expect(event.data.referenceQuarter).toBe('Q2');
      expect(event.data.referenceYear).toBe(2025);
      expect(event.data.baseIndexValue).toBe(142.06);
    });

    it('should configure with null base index value', () => {
      const aggregate = createExistingLease();
      aggregate.configureRevisionParameters(1, 1, 'Q1', 2026, null);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as LeaseRevisionParametersConfigured;
      expect(event.data.baseIndexValue).toBeNull();
    });

    it('should reject configuring before lease creation', () => {
      const aggregate = createAggregate();
      expect(() => aggregate.configureRevisionParameters(15, 3, 'Q2', 2025, 142.06)).toThrow(
        DomainException,
      );
    });

    it('should skip event when parameters unchanged (no-op)', () => {
      const aggregate = createExistingLease();
      aggregate.configureRevisionParameters(15, 3, 'Q2', 2025, 142.06);
      aggregate.commit();

      aggregate.configureRevisionParameters(15, 3, 'Q2', 2025, 142.06);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should allow updating existing revision parameters', () => {
      const aggregate = createExistingLease();
      aggregate.configureRevisionParameters(15, 3, 'Q2', 2025, 142.06);
      aggregate.commit();

      aggregate.configureRevisionParameters(1, 7, 'Q3', 2026, 143.5);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as LeaseRevisionParametersConfigured;
      expect(event.data.revisionDay).toBe(1);
      expect(event.data.revisionMonth).toBe(7);
      expect(event.data.referenceQuarter).toBe('Q3');
      expect(event.data.referenceYear).toBe(2026);
      expect(event.data.baseIndexValue).toBe(143.5);
    });

    it('should reject invalid revision day', () => {
      const aggregate = createExistingLease();
      expect(() => aggregate.configureRevisionParameters(0, 3, 'Q2', 2025, 142.06)).toThrow(
        DomainException,
      );
    });

    it('should reject invalid reference quarter', () => {
      const aggregate = createExistingLease();
      expect(() => aggregate.configureRevisionParameters(15, 3, 'Q5', 2025, 142.06)).toThrow(
        DomainException,
      );
    });

    it('should reject day 31 for month with only 30 days (April)', () => {
      const aggregate = createExistingLease();
      expect(() => aggregate.configureRevisionParameters(31, 4, 'Q2', 2025, null)).toThrow(
        'Day 31 is not valid for month 4',
      );
    });

    it('should reject day 30 for February', () => {
      const aggregate = createExistingLease();
      expect(() => aggregate.configureRevisionParameters(30, 2, 'Q1', 2025, null)).toThrow(
        'Day 30 is not valid for month 2',
      );
    });

    it('should accept day 28 for February', () => {
      const aggregate = createExistingLease();
      aggregate.configureRevisionParameters(28, 2, 'Q1', 2025, null);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });

    it('should accept day 31 for January', () => {
      const aggregate = createExistingLease();
      aggregate.configureRevisionParameters(31, 1, 'Q1', 2025, null);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });
  });

  describe('terminate', () => {
    function createExistingLease(id = 'lease-123'): LeaseAggregate {
      const aggregate = createAggregate(id);
      aggregate.create(
        validParams.userId,
        validParams.entityId,
        validParams.tenantId,
        validParams.unitId,
        validParams.startDate,
        validParams.rentAmountCents,
        validParams.securityDepositCents,
        validParams.monthlyDueDate,
        validParams.revisionIndexType,
      );
      aggregate.commit();
      return aggregate;
    }

    it('should terminate a lease with valid end date', () => {
      const aggregate = createExistingLease();
      aggregate.terminate('2026-06-15T00:00:00.000Z');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LeaseTerminated);

      const event = events[0] as LeaseTerminated;
      expect(event.data.leaseId).toBe('lease-123');
      expect(event.data.endDate).toBe('2026-06-15T00:00:00.000Z');
    });

    it('should accept end date equal to start date', () => {
      const aggregate = createExistingLease();
      aggregate.terminate(validParams.startDate);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });

    it('should reject termination before lease creation', () => {
      const aggregate = createAggregate();
      expect(() => aggregate.terminate('2026-06-15T00:00:00.000Z')).toThrow(DomainException);
      expect(() => aggregate.terminate('2026-06-15T00:00:00.000Z')).toThrow(
        'Lease has not been created yet',
      );
    });

    it('should reject termination when already terminated', () => {
      const aggregate = createExistingLease();
      aggregate.terminate('2026-06-15T00:00:00.000Z');
      aggregate.commit();

      expect(() => aggregate.terminate('2026-07-01T00:00:00.000Z')).toThrow(DomainException);
      expect(() => aggregate.terminate('2026-07-01T00:00:00.000Z')).toThrow(
        'Ce bail est déjà résilié',
      );
    });

    it('should reject end date before start date', () => {
      const aggregate = createExistingLease();
      expect(() => aggregate.terminate('2026-01-01T00:00:00.000Z')).toThrow(DomainException);
      expect(() => aggregate.terminate('2026-01-01T00:00:00.000Z')).toThrow(
        'La date de fin ne peut pas être antérieure à la date de début',
      );
    });
  });

  describe('reviseRent', () => {
    function createExistingLease(id = 'lease-123'): LeaseAggregate {
      const aggregate = createAggregate(id);
      aggregate.create(
        validParams.userId,
        validParams.entityId,
        validParams.tenantId,
        validParams.unitId,
        validParams.startDate,
        validParams.rentAmountCents,
        validParams.securityDepositCents,
        validParams.monthlyDueDate,
        validParams.revisionIndexType,
      );
      aggregate.commit();
      return aggregate;
    }

    it('should emit LeaseRentRevised event on existing lease', () => {
      const aggregate = createExistingLease();
      aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LeaseRentRevised);
    });

    it('should include correct data in LeaseRentRevised event', () => {
      const aggregate = createExistingLease();
      aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1');

      const event = aggregate.getUncommittedEvents()[0] as LeaseRentRevised;
      expect(event.data.leaseId).toBe('lease-123');
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.previousRentCents).toBe(63000);
      expect(event.data.newRentCents).toBe(65000);
      expect(event.data.newBaseIndexValue).toBe(142.06);
      expect(event.data.newReferenceQuarter).toBe('Q2');
      expect(event.data.newReferenceYear).toBe(2025);
      expect(event.data.revisionId).toBe('rev-1');
      expect(event.data.approvedAt).toBeDefined();
    });

    it('should update aggregate state after reviseRent', () => {
      const aggregate = createExistingLease();
      // Configure revision parameters first
      aggregate.configureRevisionParameters(1, 1, 'Q1', 2024, 138.19);
      aggregate.commit();

      aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1');

      // A second reviseRent should use the updated previousRentCents
      aggregate.commit();
      aggregate.reviseRent(67000, 145.0, 'Q3', 2026, 'rev-2');

      const event = aggregate.getUncommittedEvents()[0] as LeaseRentRevised;
      expect(event.data.previousRentCents).toBe(65000); // was updated by first reviseRent
      expect(event.data.newRentCents).toBe(67000);
    });

    it('should throw when lease has not been created', () => {
      const aggregate = createAggregate();
      expect(() => aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1')).toThrow(
        DomainException,
      );
      expect(() => aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1')).toThrow(
        'Lease has not been created yet',
      );
    });

    it('should throw when lease is terminated', () => {
      const aggregate = createExistingLease();
      aggregate.terminate('2027-01-01T00:00:00.000Z');
      aggregate.commit();

      expect(() => aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1')).toThrow(
        DomainException,
      );
      expect(() => aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1')).toThrow(
        'Ce bail est déjà résilié',
      );
    });

    it('should be idempotent — no-op when same revisionId applied twice', () => {
      const aggregate = createExistingLease();
      aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1');
      aggregate.commit();

      // Same revisionId again — should be a no-op
      aggregate.reviseRent(65000, 142.06, 'Q2', 2025, 'rev-1');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('streamName', () => {
    it('should have the correct stream name', () => {
      expect(LeaseAggregate.streamName).toBe('lease');
    });
  });
});
