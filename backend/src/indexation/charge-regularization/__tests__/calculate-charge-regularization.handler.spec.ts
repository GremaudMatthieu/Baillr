jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { ChargeRegularizationAggregate } from '../charge-regularization.aggregate';
import { CalculateChargeRegularizationHandler } from '../commands/calculate-charge-regularization.handler';
import { CalculateChargeRegularizationCommand } from '../commands/calculate-charge-regularization.command';
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
  ],
  totalShareCents: 60000,
  totalProvisionsPaidCents: 55000,
  balanceCents: 5000,
  ...overrides,
});

describe('CalculateChargeRegularizationHandler', () => {
  let handler: CalculateChargeRegularizationHandler;
  let mockRepository: { save: jest.Mock; load: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn(),
    };
    handler = new CalculateChargeRegularizationHandler(mockRepository as never);
  });

  it('should load aggregate by id, call calculate, then save', async () => {
    const aggregate = new ChargeRegularizationAggregate('entity1-2025');
    mockRepository.load.mockResolvedValue(aggregate);

    const statements = [makeStatement()];
    const command = new CalculateChargeRegularizationCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      statements,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    expect(savedAggregate.id).toBe('entity1-2025');

    const events = savedAggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data.entityId).toBe('entity-1');
    expect(events[0].data.userId).toBe('user-1');
    expect(events[0].data.fiscalYear).toBe(2025);
    expect(events[0].data.statements).toHaveLength(1);
    expect(events[0].data.totalBalanceCents).toBe(5000);
  });

  it('should skip event emission when data is identical (no-op guard)', async () => {
    const aggregate = new ChargeRegularizationAggregate('entity1-2025');
    const statements = [makeStatement()];
    aggregate.calculate('entity-1', 'user-1', 2025, statements);
    aggregate.commit();

    mockRepository.load.mockResolvedValue(aggregate);

    const command = new CalculateChargeRegularizationCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      statements,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    expect(savedAggregate.getUncommittedEvents()).toHaveLength(0);
  });

  it('should create new aggregate when stream does not exist', async () => {
    const streamNotFoundError = new Error('StreamNotFoundError');
    (streamNotFoundError as unknown as { type: string }).type = 'stream-not-found';
    mockRepository.load.mockRejectedValue(streamNotFoundError);

    const statements = [makeStatement()];
    const command = new CalculateChargeRegularizationCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      statements,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    expect(savedAggregate).toBeInstanceOf(ChargeRegularizationAggregate);
    expect(savedAggregate.getUncommittedEvents()).toHaveLength(1);
  });

  it('should rethrow non-stream-not-found errors', async () => {
    mockRepository.load.mockRejectedValue(new Error('Connection failed'));

    const command = new CalculateChargeRegularizationCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      [makeStatement()],
    );

    await expect(handler.execute(command)).rejects.toThrow('Connection failed');
  });

  it('should propagate fiscal year validation errors', async () => {
    const aggregate = new ChargeRegularizationAggregate('entity1-1999');
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new CalculateChargeRegularizationCommand(
      'entity1-1999',
      'entity-1',
      'user-1',
      1999,
      [makeStatement()],
    );

    await expect(handler.execute(command)).rejects.toThrow('Invalid fiscal year');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
