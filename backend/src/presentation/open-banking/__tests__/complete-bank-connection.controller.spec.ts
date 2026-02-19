import { CompleteBankConnectionController } from '../controllers/complete-bank-connection.controller.js';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

const mockCommandBus = {
  execute: jest.fn(),
};

const mockBridge = {
  getItems: jest.fn(),
  getBank: jest.fn(),
  getAccounts: jest.fn(),
};

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

const mockBankConnectionFinder = {
  findByBankAccountId: jest.fn(),
  findByEntityId: jest.fn(),
};

describe('CompleteBankConnectionController', () => {
  let controller: CompleteBankConnectionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CompleteBankConnectionController(
      mockCommandBus as never,
      mockBridge as never,
      mockEntityFinder as never,
      mockBankConnectionFinder as never,
    );
  });

  it('should complete bank connection when new item found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByBankAccountId.mockResolvedValue(null);
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([]);
    mockBridge.getItems.mockResolvedValue([
      {
        id: 100,
        status: 0,
        provider_id: 6,
        authentication_expires_at: '2026-08-19T00:00:00.000Z',
      },
    ]);
    mockBridge.getBank.mockResolvedValue({
      id: 6,
      name: 'BNP Paribas',
      country_code: 'fr',
      logo_url: null,
    });
    mockBridge.getAccounts.mockResolvedValue([
      { id: 200, name: 'Compte courant' },
      { id: 201, name: 'Livret A' },
    ]);
    mockCommandBus.execute.mockResolvedValue(undefined);

    const result = await controller.handle(
      'entity-1',
      'user-1',
      'ba-1',
    );

    expect(result.status).toBe('linked');
    expect(result.connectionId).toBeDefined();
    expect(mockBridge.getItems).toHaveBeenCalledWith('entity-1');
    expect(mockBridge.getBank).toHaveBeenCalledWith(6);
    expect(mockBridge.getAccounts).toHaveBeenCalledWith(100, 'entity-1');
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);

    const command = mockCommandBus.execute.mock.calls[0][0];
    expect(command.institutionName).toBe('BNP Paribas');
    expect(command.agreementExpiry).toBe('2026-08-19T00:00:00.000Z');
    expect(command.accountIds).toEqual(['200', '201']);
  });

  it('should return existing connection if already linked (idempotency)', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByBankAccountId.mockResolvedValue({
      id: 'existing-conn',
      entityId: 'entity-1',
    });

    const result = await controller.handle(
      'entity-1',
      'user-1',
      'ba-1',
    );

    expect(result.status).toBe('linked');
    expect(result.connectionId).toBe('existing-conn');
    expect(mockBridge.getItems).not.toHaveBeenCalled();
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should skip already linked items', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByBankAccountId.mockResolvedValue(null);
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([
      { id: 'conn-old', requisitionId: '50' },
    ]);
    mockBridge.getItems.mockResolvedValue([
      { id: 50, status: 0, provider_id: 6, authentication_expires_at: null },
      { id: 100, status: 0, provider_id: 7, authentication_expires_at: null },
    ]);
    mockBridge.getBank.mockResolvedValue({ id: 7, name: 'Crédit Agricole' });
    mockBridge.getAccounts.mockResolvedValue([{ id: 300 }]);
    mockCommandBus.execute.mockResolvedValue(undefined);

    const result = await controller.handle('entity-1', 'user-1', 'ba-1');

    expect(result.status).toBe('linked');
    // Should have used item 100 (not 50 which is already linked)
    expect(mockBridge.getBank).toHaveBeenCalledWith(7);
  });

  it('should fall back to provider_id string when getBank fails', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByBankAccountId.mockResolvedValue(null);
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([]);
    mockBridge.getItems.mockResolvedValue([
      { id: 100, status: 0, provider_id: 999, authentication_expires_at: null },
    ]);
    mockBridge.getBank.mockRejectedValue(new Error('Not found'));
    mockBridge.getAccounts.mockResolvedValue([{ id: 200 }]);
    mockCommandBus.execute.mockResolvedValue(undefined);

    const result = await controller.handle('entity-1', 'user-1', 'ba-1');

    expect(result.status).toBe('linked');
    const command = mockCommandBus.execute.mock.calls[0][0];
    expect(command.institutionName).toBe('999');
  });

  it('should throw BadRequestException when no new item found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByBankAccountId.mockResolvedValue(null);
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([]);
    mockBridge.getItems.mockResolvedValue([]);

    await expect(
      controller.handle('entity-1', 'user-1', 'ba-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'user-1', 'ba-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException when bankAccountId is missing', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await expect(
      controller.handle('entity-1', 'user-1', ''),
    ).rejects.toThrow(BadRequestException);
  });
});
