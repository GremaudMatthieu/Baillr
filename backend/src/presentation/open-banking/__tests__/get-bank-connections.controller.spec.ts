import { GetBankConnectionsController } from '../controllers/get-bank-connections.controller.js';
import { UnauthorizedException } from '@nestjs/common';

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

const mockBankConnectionFinder = {
  findByEntityId: jest.fn(),
};

const mockCommandBus = {
  execute: jest.fn(),
};

describe('GetBankConnectionsController', () => {
  let controller: GetBankConnectionsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new GetBankConnectionsController(
      mockEntityFinder as never,
      mockBankConnectionFinder as never,
      mockCommandBus as never,
    );
  });

  it('should return bank connections for valid entity and user', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([
      { id: 'conn-1', institutionName: 'BNP Paribas', status: 'linked', agreementExpiry: '2027-01-01' },
      { id: 'conn-2', institutionName: 'Crédit Agricole', status: 'expired', agreementExpiry: null },
    ]);

    const result = await controller.handle('entity-1', 'user-1');

    expect(result.data).toHaveLength(2);
    expect(mockBankConnectionFinder.findByEntityId).toHaveBeenCalledWith('entity-1');
  });

  it('should return empty array when no connections exist', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([]);

    const result = await controller.handle('entity-1', 'user-1');

    expect(result.data).toHaveLength(0);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'user-1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should mark expired connections on-demand', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([
      { id: 'conn-1', status: 'linked', agreementExpiry: '2020-01-01' },
      { id: 'conn-2', status: 'linked', agreementExpiry: '2030-01-01' },
    ]);
    mockCommandBus.execute.mockResolvedValue(undefined);

    const result = await controller.handle('entity-1', 'user-1');

    // Only conn-1 should be marked expired (past date)
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    const command = mockCommandBus.execute.mock.calls[0][0];
    expect(command.entityId).toBe('entity-1');
    expect(command.connectionId).toBe('conn-1');

    // Status should be updated in-place for the response
    expect(result.data[0]).toEqual(
      expect.objectContaining({ id: 'conn-1', status: 'expired' }),
    );
    expect(result.data[1]).toEqual(
      expect.objectContaining({ id: 'conn-2', status: 'linked' }),
    );
  });

  it('should not fail if marking expired connection throws', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([
      { id: 'conn-1', status: 'linked', agreementExpiry: '2020-01-01' },
    ]);
    mockCommandBus.execute.mockRejectedValue(new Error('aggregate error'));

    const result = await controller.handle('entity-1', 'user-1');

    // Should still return data, not throw
    expect(result.data).toHaveLength(1);
  });

  it('should skip connections without agreementExpiry', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockBankConnectionFinder.findByEntityId.mockResolvedValue([
      { id: 'conn-1', status: 'linked', agreementExpiry: null },
    ]);

    await controller.handle('entity-1', 'user-1');

    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });
});
