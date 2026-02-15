import { UnauthorizedException } from '@nestjs/common';
import { GetTenantAccountHandler } from '../queries/get-tenant-account.handler';
import { GetTenantAccountQuery } from '../queries/get-tenant-account.query';

describe('GetTenantAccountHandler', () => {
  let handler: GetTenantAccountHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockAccountEntryFinder: {
    findByTenantAndEntity: jest.Mock;
    getBalance: jest.Mock;
  };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockAccountEntryFinder = {
      findByTenantAndEntity: jest.fn(),
      getBalance: jest.fn(),
    };
    handler = new GetTenantAccountHandler(
      mockEntityFinder as never,
      mockAccountEntryFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetTenantAccountQuery('entity-1', 'tenant-1', 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return entries and balance for valid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const entries = [
      { id: 'ae-1', type: 'debit', amountCents: 85000 },
      { id: 'ae-2', type: 'credit', amountCents: 85000 },
    ];
    mockAccountEntryFinder.findByTenantAndEntity.mockResolvedValue(entries);
    mockAccountEntryFinder.getBalance.mockResolvedValue({ balanceCents: 0 });

    const result = await handler.execute(
      new GetTenantAccountQuery('entity-1', 'tenant-1', 'user-1'),
    );

    expect(result).toEqual({ entries, balanceCents: 0 });
    expect(mockAccountEntryFinder.findByTenantAndEntity).toHaveBeenCalledWith(
      'tenant-1',
      'entity-1',
    );
    expect(mockAccountEntryFinder.getBalance).toHaveBeenCalledWith('tenant-1', 'entity-1');
  });
});
