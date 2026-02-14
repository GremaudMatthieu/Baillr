import { UnauthorizedException } from '@nestjs/common';
import { GetTenantAccountController } from '../controllers/get-tenant-account.controller';

const mockEntityFinder = {
  findByIdAndUserId: jest.fn(),
};

const mockAccountEntryFinder = {
  findByTenantAndEntity: jest.fn(),
  getBalance: jest.fn(),
};

describe('GetTenantAccountController', () => {
  let controller: GetTenantAccountController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new GetTenantAccountController(
      mockEntityFinder as any,
      mockAccountEntryFinder as any,
    );
  });

  it('should return entries and balance for valid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const entries = [
      { id: 'ae-1', type: 'debit', amountCents: 85000, balanceCents: -85000 },
      { id: 'ae-2', type: 'credit', amountCents: 85000, balanceCents: 0 },
    ];
    mockAccountEntryFinder.findByTenantAndEntity.mockResolvedValue(entries);
    mockAccountEntryFinder.getBalance.mockResolvedValue({ balanceCents: 0, entryCount: 2 });

    const result = await controller.handle('entity-1', 'tenant-1', 'user_123');

    expect(result).toEqual({ entries, balanceCents: 0 });
    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user_123');
    expect(mockAccountEntryFinder.findByTenantAndEntity).toHaveBeenCalledWith('tenant-1', 'entity-1');
  });

  it('should throw UnauthorizedException for invalid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'tenant-1', 'user_123'))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should return empty entries and zero balance for tenant with no activity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAccountEntryFinder.findByTenantAndEntity.mockResolvedValue([]);
    mockAccountEntryFinder.getBalance.mockResolvedValue({ balanceCents: 0, entryCount: 0 });

    const result = await controller.handle('entity-1', 'tenant-1', 'user_123');

    expect(result).toEqual({ entries: [], balanceCents: 0 });
  });

  it('should return negative balance for tenant owing money', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAccountEntryFinder.findByTenantAndEntity.mockResolvedValue([
      { id: 'ae-1', type: 'debit', amountCents: 85000, balanceCents: -85000 },
    ]);
    mockAccountEntryFinder.getBalance.mockResolvedValue({ balanceCents: -85000, entryCount: 1 });

    const result = await controller.handle('entity-1', 'tenant-1', 'user_123');

    expect(result.balanceCents).toBe(-85000);
  });
});
