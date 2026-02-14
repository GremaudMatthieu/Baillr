import { mockCqrx } from './mock-cqrx';

jest.mock('nestjs-cqrx', () => mockCqrx);

import { RevisionAggregate } from '../revision.aggregate';
import { RentRevisionCalculated } from '../events/rent-revision-calculated.event';
import { RevisionApproved } from '../events/revision-approved.event';
import { IndexCalculatorService } from '../services/index-calculator.service';
import { DomainException } from '@shared/exceptions/domain.exception';

describe('RevisionAggregate', () => {
  const calculator = new IndexCalculatorService();
  const baseParams = {
    leaseId: 'lease-1',
    entityId: 'entity-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    tenantName: 'Dupont Jean',
    unitLabel: 'Apt A',
    currentRentCents: 75000,
    baseIndexValue: 138.19,
    baseIndexQuarter: 'Q2',
    newIndexValue: 142.06,
    newIndexQuarter: 'Q2',
    newIndexYear: 2025,
    revisionIndexType: 'IRL',
  };

  function createCalculatedAggregate(id = 'rev-1'): RevisionAggregate {
    const aggregate = new RevisionAggregate(id);
    aggregate.calculateRevision(
      baseParams.leaseId,
      baseParams.entityId,
      baseParams.userId,
      baseParams.tenantId,
      baseParams.unitId,
      baseParams.tenantName,
      baseParams.unitLabel,
      baseParams.currentRentCents,
      baseParams.baseIndexValue,
      baseParams.baseIndexQuarter,
      baseParams.newIndexValue,
      baseParams.newIndexQuarter,
      baseParams.newIndexYear,
      baseParams.revisionIndexType,
      calculator,
    );
    return aggregate;
  }

  describe('calculateRevision', () => {
    it('should emit RentRevisionCalculated event', () => {
      const aggregate = new RevisionAggregate('rev-1');
      aggregate.calculateRevision(
        baseParams.leaseId,
        baseParams.entityId,
        baseParams.userId,
        baseParams.tenantId,
        baseParams.unitId,
        baseParams.tenantName,
        baseParams.unitLabel,
        baseParams.currentRentCents,
        baseParams.baseIndexValue,
        baseParams.baseIndexQuarter,
        baseParams.newIndexValue,
        baseParams.newIndexQuarter,
        baseParams.newIndexYear,
        baseParams.revisionIndexType,
        calculator,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RentRevisionCalculated);
    });

    it('should calculate correct values using the formula', () => {
      const aggregate = new RevisionAggregate('rev-1');
      aggregate.calculateRevision(
        baseParams.leaseId,
        baseParams.entityId,
        baseParams.userId,
        baseParams.tenantId,
        baseParams.unitId,
        baseParams.tenantName,
        baseParams.unitLabel,
        baseParams.currentRentCents,
        baseParams.baseIndexValue,
        baseParams.baseIndexQuarter,
        baseParams.newIndexValue,
        baseParams.newIndexQuarter,
        baseParams.newIndexYear,
        baseParams.revisionIndexType,
        calculator,
      );

      const event = aggregate.getUncommittedEvents()[0] as RentRevisionCalculated;
      const expectedNewRent = Math.floor(
        (75000 * 142.06) / 138.19,
      );
      expect(event.data.newRentCents).toBe(expectedNewRent);
      expect(event.data.differenceCents).toBe(expectedNewRent - 75000);
      expect(event.data.revisionId).toBe('rev-1');
      expect(event.data.leaseId).toBe('lease-1');
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.tenantName).toBe('Dupont Jean');
      expect(event.data.unitLabel).toBe('Apt A');
      expect(event.data.revisionIndexType).toBe('IRL');
    });

    it('should no-op on second call (idempotency guard)', () => {
      const aggregate = new RevisionAggregate('rev-1');
      aggregate.calculateRevision(
        baseParams.leaseId,
        baseParams.entityId,
        baseParams.userId,
        baseParams.tenantId,
        baseParams.unitId,
        baseParams.tenantName,
        baseParams.unitLabel,
        baseParams.currentRentCents,
        baseParams.baseIndexValue,
        baseParams.baseIndexQuarter,
        baseParams.newIndexValue,
        baseParams.newIndexQuarter,
        baseParams.newIndexYear,
        baseParams.revisionIndexType,
        calculator,
      );

      // Second call should be no-op
      aggregate.calculateRevision(
        baseParams.leaseId,
        baseParams.entityId,
        baseParams.userId,
        baseParams.tenantId,
        baseParams.unitId,
        baseParams.tenantName,
        baseParams.unitLabel,
        99999,
        baseParams.baseIndexValue,
        baseParams.baseIndexQuarter,
        baseParams.newIndexValue,
        baseParams.newIndexQuarter,
        baseParams.newIndexYear,
        baseParams.revisionIndexType,
        calculator,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });

    it('should store audit trail data in the event', () => {
      const aggregate = new RevisionAggregate('rev-1');
      aggregate.calculateRevision(
        baseParams.leaseId,
        baseParams.entityId,
        baseParams.userId,
        baseParams.tenantId,
        baseParams.unitId,
        baseParams.tenantName,
        baseParams.unitLabel,
        baseParams.currentRentCents,
        baseParams.baseIndexValue,
        baseParams.baseIndexQuarter,
        baseParams.newIndexValue,
        baseParams.newIndexQuarter,
        baseParams.newIndexYear,
        baseParams.revisionIndexType,
        calculator,
      );

      const event = aggregate.getUncommittedEvents()[0] as RentRevisionCalculated;
      expect(event.data.baseIndexValue).toBe(138.19);
      expect(event.data.baseIndexQuarter).toBe('Q2');
      expect(event.data.newIndexValue).toBe(142.06);
      expect(event.data.newIndexQuarter).toBe('Q2');
      expect(event.data.newIndexYear).toBe(2025);
      expect(event.data.currentRentCents).toBe(75000);
      expect(event.data.calculatedAt).toBeDefined();
    });
  });

  describe('approve', () => {
    it('should emit RevisionApproved event when calculated', () => {
      const aggregate = createCalculatedAggregate();
      aggregate.approve('user-1');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(RevisionApproved);
    });

    it('should include correct data in RevisionApproved event', () => {
      const aggregate = createCalculatedAggregate();
      aggregate.approve('user-1');

      const event = aggregate.getUncommittedEvents()[1] as RevisionApproved;
      expect(event.data.revisionId).toBe('rev-1');
      expect(event.data.leaseId).toBe('lease-1');
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.userId).toBe('user-1');
      expect(event.data.newRentCents).toBe(
        Math.floor((75000 * 142.06) / 138.19),
      );
      expect(event.data.previousRentCents).toBe(75000);
      expect(event.data.newIndexValue).toBe(142.06);
      expect(event.data.newIndexQuarter).toBe('Q2');
      expect(event.data.newIndexYear).toBe(2025);
      expect(event.data.approvedAt).toBeDefined();
    });

    it('should throw when revision has not been calculated', () => {
      const aggregate = new RevisionAggregate('rev-1');
      expect(() => aggregate.approve('user-1')).toThrow(DomainException);
      expect(() => aggregate.approve('user-1')).toThrow(
        'Revision has not been calculated yet',
      );
    });

    it('should throw when revision is already approved', () => {
      const aggregate = createCalculatedAggregate();
      aggregate.approve('user-1');

      expect(() => aggregate.approve('user-1')).toThrow(DomainException);
      expect(() => aggregate.approve('user-1')).toThrow(
        'This revision has already been approved',
      );
    });

    it('should store state from RentRevisionCalculated for use by approve', () => {
      const aggregate = createCalculatedAggregate();

      expect(aggregate.revisionLeaseId).toBe('lease-1');
      expect(aggregate.revisionEntityId).toBe('entity-1');
      expect(aggregate.revisionNewRentCents).toBe(
        Math.floor((75000 * 142.06) / 138.19),
      );
      expect(aggregate.revisionCurrentRentCents).toBe(75000);
      expect(aggregate.revisionNewIndexValue).toBe(142.06);
      expect(aggregate.revisionNewIndexQuarter).toBe('Q2');
      expect(aggregate.revisionNewIndexYear).toBe(2025);
    });
  });
});
