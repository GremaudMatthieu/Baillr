import { UnauthorizedException } from '@nestjs/common';
import { CalculateChargeRegularizationController } from '../controllers/calculate-charge-regularization.controller';
import { CalculateChargeRegularizationCommand } from '@indexation/charge-regularization/commands/calculate-charge-regularization.command';

describe('CalculateChargeRegularizationController', () => {
  let controller: CalculateChargeRegularizationController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockCalculationService: { calculate: jest.Mock };

  const mockStatements = [
    {
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
          chargeCategoryId: 'cat-teom',
          label: 'TEOM',
          totalChargeCents: 80000,
          tenantShareCents: 80000,
          provisionsPaidCents: 75000,
          isWaterByConsumption: false,
        },
      ],
      totalShareCents: 80000,
      totalProvisionsPaidCents: 75000,
      balanceCents: 5000,
    },
  ];

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockCalculationService = { calculate: jest.fn() };
    controller = new CalculateChargeRegularizationController(
      mockCommandBus as never,
      mockEntityFinder as never,
      mockCalculationService as never,
    );
  });

  const validDto = {
    id: 'entity1-2025',
    fiscalYear: 2025,
  };

  it('should calculate statements and dispatch command', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockCalculationService.calculate.mockResolvedValue(mockStatements);

    await controller.handle('entity-1', validDto as never, 'user-1');

    expect(mockCalculationService.calculate).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
      2025,
    );
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.any(CalculateChargeRegularizationCommand),
    );
    const command = mockCommandBus.execute.mock
      .calls[0][0] as CalculateChargeRegularizationCommand;
    expect(command.id).toBe('entity1-2025');
    expect(command.entityId).toBe('entity-1');
    expect(command.userId).toBe('user-1');
    expect(command.fiscalYear).toBe(2025);
    expect(command.statements).toEqual(mockStatements);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', validDto as never, 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should not call calculation service if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', validDto as never, 'user-1'),
    ).rejects.toThrow();

    expect(mockCalculationService.calculate).not.toHaveBeenCalled();
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should check entity ownership with userId', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockCalculationService.calculate.mockResolvedValue([]);

    await controller.handle('entity-1', validDto as never, 'user-1');

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
    );
  });
});
