import { UnauthorizedException } from '@nestjs/common';
import { SendChargeRegularizationController } from '../controllers/send-charge-regularization.controller';
import { SendChargeRegularizationCommand } from '@indexation/charge-regularization/commands/send-charge-regularization.command';

describe('SendChargeRegularizationController', () => {
  let controller: SendChargeRegularizationController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(() => {
    mockCommandBus = {
      execute: jest.fn().mockResolvedValue({ sent: 2, failed: 0, failures: [] }),
    };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    controller = new SendChargeRegularizationController(
      mockCommandBus as never,
      mockEntityFinder as never,
    );
  });

  it('should dispatch SendChargeRegularizationCommand', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    const result = await controller.handle('entity-1', 2025, 'user-1');

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.any(SendChargeRegularizationCommand),
    );
    const command = mockCommandBus.execute.mock
      .calls[0][0] as SendChargeRegularizationCommand;
    expect(command.chargeRegularizationId).toBe('entity-1-2025');
    expect(command.entityId).toBe('entity-1');
    expect(command.userId).toBe('user-1');
    expect(command.fiscalYear).toBe(2025);
    expect(result).toEqual({ sent: 2, failed: 0, failures: [] });
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 2025, 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should not dispatch command if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 2025, 'user-1'),
    ).rejects.toThrow();

    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should check entity ownership with userId', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await controller.handle('entity-1', 2025, 'user-1');

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
    );
  });
});
