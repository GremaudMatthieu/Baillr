jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { ApplyChargeRegularizationHandler } from '../commands/apply-charge-regularization.handler';
import { ApplyChargeRegularizationCommand } from '../commands/apply-charge-regularization.command';
import { ChargeRegularizationAggregate } from '../charge-regularization.aggregate';
import { ChargeRegularizationApplied } from '../events/charge-regularization-applied.event';
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
  charges: [],
  totalShareCents: 140000,
  totalProvisionsPaidCents: 135000,
  balanceCents: 5000,
  ...overrides,
});

describe('ApplyChargeRegularizationHandler', () => {
  let handler: ApplyChargeRegularizationHandler;
  const mockSave = jest.fn();
  const mockLoad = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ApplyChargeRegularizationHandler({
      save: mockSave,
      load: mockLoad,
    } as never);
  });

  it('should load aggregate and call applyRegularization', async () => {
    const aggregate = new ChargeRegularizationAggregate('entity1-2025');
    aggregate.calculate('entity-1', 'user-1', 2025, [makeStatement()]);
    aggregate.commit();
    mockLoad.mockResolvedValue(aggregate);

    const command = new ApplyChargeRegularizationCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
    );
    await handler.execute(command);

    expect(mockLoad).toHaveBeenCalledWith('entity1-2025');
    expect(mockSave).toHaveBeenCalledWith(aggregate);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ChargeRegularizationApplied);
  });

  it('should be idempotent on re-apply', async () => {
    const aggregate = new ChargeRegularizationAggregate('entity1-2025');
    aggregate.calculate('entity-1', 'user-1', 2025, [makeStatement()]);
    aggregate.commit();
    aggregate.applyRegularization('entity-1', 'user-1', 2025);
    aggregate.commit();
    mockLoad.mockResolvedValue(aggregate);

    const command = new ApplyChargeRegularizationCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
    );
    await handler.execute(command);

    expect(mockSave).toHaveBeenCalledWith(aggregate);
    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
  });
});
