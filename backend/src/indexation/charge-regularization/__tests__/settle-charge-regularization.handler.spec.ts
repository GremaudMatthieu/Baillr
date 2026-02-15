jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { SettleChargeRegularizationHandler } from '../commands/settle-charge-regularization.handler';
import { SettleChargeRegularizationCommand } from '../commands/settle-charge-regularization.command';

describe('SettleChargeRegularizationHandler', () => {
  let handler: SettleChargeRegularizationHandler;
  let mockRepository: {
    load: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new SettleChargeRegularizationHandler(mockRepository as never);
  });

  it('should load aggregate, call markAsSettled, and save', async () => {
    const mockAggregate = {
      markAsSettled: jest.fn(),
    };
    mockRepository.load.mockResolvedValue(mockAggregate);

    const command = new SettleChargeRegularizationCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
    );
    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(mockAggregate.markAsSettled).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
      2025,
    );
    expect(mockRepository.save).toHaveBeenCalledWith(mockAggregate);
  });

  it('should propagate error when aggregate load fails', async () => {
    mockRepository.load.mockRejectedValue(new Error('Aggregate not found'));

    const command = new SettleChargeRegularizationCommand(
      'nonexistent-id',
      'entity-1',
      'user-1',
      2025,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'Aggregate not found',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should call markAsSettled with correct parameters from command', async () => {
    const mockAggregate = {
      markAsSettled: jest.fn(),
    };
    mockRepository.load.mockResolvedValue(mockAggregate);

    const command = new SettleChargeRegularizationCommand(
      'entity2-2024',
      'entity-2',
      'user-2',
      2024,
    );
    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity2-2024');
    expect(mockAggregate.markAsSettled).toHaveBeenCalledWith(
      'entity-2',
      'user-2',
      2024,
    );
  });
});
