import { UnauthorizedException } from '@nestjs/common';
import { ApplyChargeRegularizationController } from '../controllers/apply-charge-regularization.controller';
import { ApplyChargeRegularizationCommand } from '@indexation/charge-regularization/commands/apply-charge-regularization.command';

describe('ApplyChargeRegularizationController', () => {
  let controller: ApplyChargeRegularizationController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    controller = new ApplyChargeRegularizationController(
      mockCommandBus as never,
      mockEntityFinder as never,
    );
  });

  it('should dispatch ApplyChargeRegularizationCommand', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await controller.handle('entity-1', 2025, 'user-1');

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.any(ApplyChargeRegularizationCommand),
    );
    const command = mockCommandBus.execute.mock
      .calls[0][0] as ApplyChargeRegularizationCommand;
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
