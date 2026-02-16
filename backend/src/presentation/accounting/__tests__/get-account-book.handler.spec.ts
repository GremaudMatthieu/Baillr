import { UnauthorizedException } from '@nestjs/common';
import { GetAccountBookHandler } from '../queries/get-account-book.handler';
import { GetAccountBookQuery } from '../queries/get-account-book.query';

describe('GetAccountBookHandler', () => {
  let handler: GetAccountBookHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockAccountingFinder: {
    findByEntity: jest.Mock;
    getTotalBalance: jest.Mock;
    getAvailableCategories: jest.Mock;
  };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockAccountingFinder = {
      findByEntity: jest.fn(),
      getTotalBalance: jest.fn(),
      getAvailableCategories: jest.fn(),
    };
    handler = new GetAccountBookHandler(
      mockEntityFinder as never,
      mockAccountingFinder as never,
    );
  });

  it('should return entries, total balance, and available categories', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const entries = [
      {
        id: 'ae-1',
        entityId: 'entity-1',
        tenantId: 'tenant-1',
        type: 'debit',
        category: 'rent_call',
        description: 'Appel de loyer - 2026-01',
        amountCents: 80000,
        balanceCents: 80000,
        tenant: { firstName: 'Jean', lastName: 'Dupont', companyName: null, type: 'individual' },
      },
    ];
    mockAccountingFinder.findByEntity.mockResolvedValue(entries);
    mockAccountingFinder.getTotalBalance.mockResolvedValue(80000);
    mockAccountingFinder.getAvailableCategories.mockResolvedValue(['rent_call']);

    const result = await handler.execute(
      new GetAccountBookQuery('entity-1', 'user-1'),
    );

    expect(result).toEqual({
      entries,
      totalBalanceCents: 80000,
      availableCategories: ['rent_call'],
    });
    expect(mockAccountingFinder.findByEntity).toHaveBeenCalledWith('entity-1', {
      startDate: undefined,
      endDate: undefined,
      category: undefined,
      tenantId: undefined,
    });
    expect(mockAccountingFinder.getTotalBalance).toHaveBeenCalledWith(
      'entity-1',
      undefined,
    );
    expect(mockAccountingFinder.getAvailableCategories).toHaveBeenCalledWith(
      'entity-1',
    );
  });

  it('should forward filters to the finder and tenantId to getTotalBalance', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAccountingFinder.findByEntity.mockResolvedValue([]);
    mockAccountingFinder.getTotalBalance.mockResolvedValue(0);
    mockAccountingFinder.getAvailableCategories.mockResolvedValue([]);

    await handler.execute(
      new GetAccountBookQuery(
        'entity-1',
        'user-1',
        '2026-01-01',
        '2026-01-31',
        'payment',
        'tenant-1',
      ),
    );

    expect(mockAccountingFinder.findByEntity).toHaveBeenCalledWith('entity-1', {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      category: 'payment',
      tenantId: 'tenant-1',
    });
    expect(mockAccountingFinder.getTotalBalance).toHaveBeenCalledWith(
      'entity-1',
      'tenant-1',
    );
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetAccountBookQuery('entity-1', 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should execute all three queries in parallel', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAccountingFinder.findByEntity.mockResolvedValue([]);
    mockAccountingFinder.getTotalBalance.mockResolvedValue(0);
    mockAccountingFinder.getAvailableCategories.mockResolvedValue([]);

    await handler.execute(new GetAccountBookQuery('entity-1', 'user-1'));

    expect(mockAccountingFinder.findByEntity).toHaveBeenCalledTimes(1);
    expect(mockAccountingFinder.getTotalBalance).toHaveBeenCalledTimes(1);
    expect(mockAccountingFinder.getAvailableCategories).toHaveBeenCalledTimes(1);
  });
});
