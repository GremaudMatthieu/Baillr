import { UnauthorizedException } from '@nestjs/common';
import { SettleChargeRegularizationController } from '../controllers/settle-charge-regularization.controller';
import { SettleChargeRegularizationCommand } from '@indexation/charge-regularization/commands/settle-charge-regularization.command';

describe('SettleChargeRegularizationController', () => {
  let controller: SettleChargeRegularizationController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    controller = new SettleChargeRegularizationController(
      mockCommandBus as never,
      mockEntityFinder as never,
    );
  });

  it('should dispatch SettleChargeRegularizationCommand', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await controller.handle('entity-1', 2025, 'user-1');

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.any(SettleChargeRegularizationCommand),
    );
    const command = mockCommandBus.execute.mock.calls[0][0] as SettleChargeRegularizationCommand;
    expect(command.id).toBe('entity-1-2025');
    expect(command.entityId).toBe('entity-1');
    expect(command.userId).toBe('user-1');
    expect(command.fiscalYear).toBe(2025);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 2025, 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should not dispatch command when unauthorized', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    try {
      await controller.handle('entity-1', 2025, 'user-1');
    } catch {
      // expected
    }

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
