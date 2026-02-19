import { DisconnectBankConnectionController } from '../controllers/disconnect-bank-connection.controller.js';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

const mockCommandBus = {
  execute: jest.fn(),
};

const mockBridge = {
  deleteItem: jest.fn(),
};

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

const mockBankConnectionFinder = {
  findById: jest.fn(),
};

describe('DisconnectBankConnectionController', () => {
  let controller: DisconnectBankConnectionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DisconnectBankConnectionController(
      mockCommandBus as never,
      mockBridge as never,
      mockEntityFinder as never,
      mockBankConnectionFinder as never,
    );
  });

  it('should delete Bridge item and dispatch disconnect command', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue({
      id: 'conn-1',
      entityId: 'entity-1',
      requisitionId: '100',
    });
    mockBridge.deleteItem.mockResolvedValue(undefined);
    mockCommandBus.execute.mockResolvedValue(undefined);

    await controller.handle('entity-1', 'conn-1', 'user-1');

    expect(mockBridge.deleteItem).toHaveBeenCalledWith(100, 'entity-1');
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should skip deleteItem when requisitionId is not a number', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue({
      id: 'conn-1',
      entityId: 'entity-1',
      requisitionId: 'not-a-number',
    });
    mockCommandBus.execute.mockResolvedValue(undefined);

    await controller.handle('entity-1', 'conn-1', 'user-1');

    expect(mockBridge.deleteItem).not.toHaveBeenCalled();
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'conn-1', 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw NotFoundException when connection not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'conn-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when connection belongs to different entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue({
      id: 'conn-1',
      entityId: 'entity-other',
      requisitionId: '100',
    });

    await expect(
      controller.handle('entity-1', 'conn-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
