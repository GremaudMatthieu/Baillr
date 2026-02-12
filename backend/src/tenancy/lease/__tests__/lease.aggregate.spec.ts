// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

import { LeaseAggregate } from '../lease.aggregate';
import { LeaseCreated } from '../events/lease-created.event';
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

  describe('streamName', () => {
    it('should have the correct stream name', () => {
      expect(LeaseAggregate.streamName).toBe('lease');
    });
  });
});
