jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { ChargeRegularizationAggregate } from '../charge-regularization.aggregate';
import { ChargeRegularizationCalculated } from '../events/charge-regularization-calculated.event';
import type { StatementPrimitives } from '../regularization-statement';

const makeStatement = (
  overrides: Partial<StatementPrimitives> = {},
): StatementPrimitives => ({
  leaseId: 'lease-1',
  tenantId: 'tenant-1',
  tenantName: 'Dupont',
  unitId: 'unit-1',
  unitIdentifier: 'Apt A',
  occupancyStart: '2025-01-01',
  occupancyEnd: '2025-12-31',
  occupiedDays: 365,
  daysInYear: 365,
  charges: [
    {
      chargeCategoryId: 'cat-water',
      label: 'Eau',
      totalChargeCents: 60000,
      tenantShareCents: 60000,
      isWaterByConsumption: true,
    },
    {
      chargeCategoryId: 'cat-teom',
      label: 'TEOM',
      totalChargeCents: 80000,
      tenantShareCents: 80000,
      isWaterByConsumption: false,
    },
  ],
  totalShareCents: 140000,
  totalProvisionsPaidCents: 135000,
  balanceCents: 5000,
  ...overrides,
});

describe('ChargeRegularizationAggregate', () => {
  describe('calculate', () => {
    it('should emit ChargeRegularizationCalculated event with valid data', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-2025');
      const statements = [makeStatement()];

      aggregate.calculate('entity-1', 'user-1', 2025, statements);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ChargeRegularizationCalculated);

      const event = events[0] as ChargeRegularizationCalculated;
      expect(event.data.chargeRegularizationId).toBe('entity1-2025');
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.userId).toBe('user-1');
      expect(event.data.fiscalYear).toBe(2025);
      expect(event.data.statements).toHaveLength(1);
      expect(event.data.totalBalanceCents).toBe(5000);
      expect(event.data.calculatedAt).toBeDefined();
    });

    it('should calculate total balance from multiple statements', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-2025');
      const statements = [
        makeStatement({ leaseId: 'lease-1', balanceCents: 5000 }),
        makeStatement({ leaseId: 'lease-2', balanceCents: -3000, tenantName: 'Martin' }),
      ];

      aggregate.calculate('entity-1', 'user-1', 2025, statements);

      const event = aggregate.getUncommittedEvents()[0] as ChargeRegularizationCalculated;
      expect(event.data.totalBalanceCents).toBe(2000);
    });

    it('should allow overwrite with different statements (emits new event)', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-2025');
      aggregate.calculate('entity-1', 'user-1', 2025, [makeStatement()]);
      aggregate.commit();

      const updatedStatements = [makeStatement({ balanceCents: 10000, totalShareCents: 145000 })];
      aggregate.calculate('entity-1', 'user-1', 2025, updatedStatements);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as ChargeRegularizationCalculated;
      expect(event.data.totalBalanceCents).toBe(10000);
    });

    it('should be no-op when calculating identical data', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-2025');
      const statements = [makeStatement()];
      aggregate.calculate('entity-1', 'user-1', 2025, statements);
      aggregate.commit();

      aggregate.calculate('entity-1', 'user-1', 2025, statements);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should throw for invalid fiscal year', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-1999');
      expect(() =>
        aggregate.calculate('entity-1', 'user-1', 1999, [makeStatement()]),
      ).toThrow('Invalid fiscal year');
    });

    it('should emit event for empty statements array', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-2025');
      aggregate.calculate('entity-1', 'user-1', 2025, []);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as ChargeRegularizationCalculated;
      expect(event.data.statements).toHaveLength(0);
      expect(event.data.totalBalanceCents).toBe(0);
    });

    it('should handle negative balance (trop-perçu)', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-2025');
      const statements = [
        makeStatement({ balanceCents: -4674, totalShareCents: 65328, totalProvisionsPaidCents: 70002 }),
      ];

      aggregate.calculate('entity-1', 'user-1', 2025, statements);

      const event = aggregate.getUncommittedEvents()[0] as ChargeRegularizationCalculated;
      expect(event.data.totalBalanceCents).toBe(-4674);
    });

    it('should detect data change when charge count differs', () => {
      const aggregate = new ChargeRegularizationAggregate('entity1-2025');
      aggregate.calculate('entity-1', 'user-1', 2025, [makeStatement()]);
      aggregate.commit();

      const updatedStatement = makeStatement({
        charges: [
          { chargeCategoryId: 'cat-water', label: 'Eau', totalChargeCents: 60000, tenantShareCents: 60000, isWaterByConsumption: true },
        ],
        totalShareCents: 60000,
        balanceCents: -75000,
      });
      aggregate.calculate('entity-1', 'user-1', 2025, [updatedStatement]);

      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
    });
  });

  describe('streamName', () => {
    it('should use charge-regularization as stream name', () => {
      expect(ChargeRegularizationAggregate.streamName).toBe('charge-regularization');
    });
  });
});
