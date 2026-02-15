import type { StatementPrimitives, StatementChargePrimitives } from '../regularization-statement';

describe('StatementPrimitives interface', () => {
  const validCharge: StatementChargePrimitives = {
    chargeCategoryId: 'cat-water',
    label: 'Eau',
    totalChargeCents: 60000,
    tenantShareCents: 30000,
    provisionsPaidCents: 0,
    isWaterByConsumption: true,
  };

  const validStatement: StatementPrimitives = {
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    tenantName: 'Dupont',
    unitId: 'unit-1',
    unitIdentifier: 'Apt A',
    occupancyStart: '2025-01-01',
    occupancyEnd: '2025-12-31',
    occupiedDays: 365,
    daysInYear: 365,
    charges: [validCharge],
    totalShareCents: 30000,
    totalProvisionsPaidCents: 25000,
    balanceCents: 5000,
  };

  it('should have all required fields', () => {
    expect(validStatement.leaseId).toBe('lease-1');
    expect(validStatement.tenantId).toBe('tenant-1');
    expect(validStatement.tenantName).toBe('Dupont');
    expect(validStatement.unitId).toBe('unit-1');
    expect(validStatement.unitIdentifier).toBe('Apt A');
    expect(validStatement.occupancyStart).toBe('2025-01-01');
    expect(validStatement.occupancyEnd).toBe('2025-12-31');
    expect(validStatement.occupiedDays).toBe(365);
    expect(validStatement.daysInYear).toBe(365);
    expect(validStatement.charges).toHaveLength(1);
    expect(validStatement.totalShareCents).toBe(30000);
    expect(validStatement.totalProvisionsPaidCents).toBe(25000);
    expect(validStatement.balanceCents).toBe(5000);
  });

  it('should have charge primitives with all fields', () => {
    expect(validCharge.chargeCategoryId).toBe('cat-water');
    expect(validCharge.label).toBe('Eau');
    expect(validCharge.totalChargeCents).toBe(60000);
    expect(validCharge.tenantShareCents).toBe(30000);
    expect(validCharge.isWaterByConsumption).toBe(true);
  });

  it('should support positive balance (complément)', () => {
    const statement: StatementPrimitives = {
      ...validStatement,
      totalShareCents: 140000,
      totalProvisionsPaidCents: 135000,
      balanceCents: 5000,
    };
    expect(statement.balanceCents).toBeGreaterThan(0);
  });

  it('should support negative balance (trop-perçu)', () => {
    const statement: StatementPrimitives = {
      ...validStatement,
      totalShareCents: 65328,
      totalProvisionsPaidCents: 70002,
      balanceCents: -4674,
    };
    expect(statement.balanceCents).toBeLessThan(0);
  });

  it('should support zero balance (équilibré)', () => {
    const statement: StatementPrimitives = {
      ...validStatement,
      totalShareCents: 100000,
      totalProvisionsPaidCents: 100000,
      balanceCents: 0,
    };
    expect(statement.balanceCents).toBe(0);
  });
});
