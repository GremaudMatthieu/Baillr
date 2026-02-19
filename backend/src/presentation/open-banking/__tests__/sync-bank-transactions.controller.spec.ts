import { SyncBankTransactionsController } from '../controllers/sync-bank-transactions.controller.js';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

const mockBankConnectionFinder = {
  findById: jest.fn(),
};

const mockSyncService = {
  syncConnection: jest.fn(),
};

describe('SyncBankTransactionsController', () => {
  let controller: SyncBankTransactionsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SyncBankTransactionsController(
      mockEntityFinder as never,
      mockBankConnectionFinder as never,
      mockSyncService as never,
    );
  });

  it('should trigger sync and return result', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue({
      id: 'conn-1',
      entityId: 'entity-1',
      status: 'linked',
    });
    mockSyncService.syncConnection.mockResolvedValue({
      imported: 5,
    });

    const result = await controller.handle('entity-1', 'conn-1', 'user-1');

    expect(result).toEqual({ imported: 5 });
    expect(mockSyncService.syncConnection).toHaveBeenCalledTimes(1);
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

  it('should throw NotFoundException when connection is not linked', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue({
      id: 'conn-1',
      entityId: 'entity-1',
      status: 'expired',
    });

    await expect(
      controller.handle('entity-1', 'conn-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should pass since and until to sync service', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue({
      id: 'conn-1',
      entityId: 'entity-1',
      status: 'linked',
    });
    mockSyncService.syncConnection.mockResolvedValue({ imported: 3 });

    await controller.handle('entity-1', 'conn-1', 'user-1', '2026-01-01', '2026-01-31');

    expect(mockSyncService.syncConnection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conn-1' }),
      'user-1',
      { since: '2026-01-01', until: '2026-01-31' },
    );
  });

  it('should reject invalid since format', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await expect(
      controller.handle('entity-1', 'conn-1', 'user-1', 'invalid-date'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid until format', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await expect(
      controller.handle('entity-1', 'conn-1', 'user-1', '2026-01-01', 'bad'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should pass empty options when no dates provided', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findById.mockResolvedValue({
      id: 'conn-1',
      entityId: 'entity-1',
      status: 'linked',
    });
    mockSyncService.syncConnection.mockResolvedValue({ imported: 0 });

    await controller.handle('entity-1', 'conn-1', 'user-1');

    expect(mockSyncService.syncConnection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conn-1' }),
      'user-1',
      {},
    );
  });
});
