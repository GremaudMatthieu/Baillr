import { AccountingFinder } from '../finders/accounting.finder';

describe('AccountingFinder', () => {
  let finder: AccountingFinder;
  let mockPrisma: {
    accountEntry: {
      findMany: jest.Mock;
      groupBy: jest.Mock;
    };
    $queryRaw: jest.Mock;
  };

  const tenantInclude = {
    tenant: {
      select: {
        firstName: true,
        lastName: true,
        companyName: true,
        type: true,
      },
    },
  };

  beforeEach(() => {
    mockPrisma = {
      accountEntry: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ total: BigInt(0) }]),
    };
    finder = new AccountingFinder(mockPrisma as never);
  });

  describe('findByEntity', () => {
    it('should query entries for entityId with tenant include and correct ordering', async () => {
      await finder.findByEntity('entity-1');

      expect(mockPrisma.accountEntry.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-1' },
        include: tenantInclude,
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should apply startDate filter', async () => {
      await finder.findByEntity('entity-1', { startDate: '2026-01-01' });

      const call = mockPrisma.accountEntry.findMany.mock.calls[0][0];
      expect(call.where.entityId).toBe('entity-1');
      expect(call.where.entryDate).toEqual({ gte: new Date('2026-01-01') });
    });

    it('should apply endDate filter', async () => {
      await finder.findByEntity('entity-1', { endDate: '2026-01-31' });

      const call = mockPrisma.accountEntry.findMany.mock.calls[0][0];
      expect(call.where.entryDate).toEqual({ lte: new Date('2026-01-31') });
    });

    it('should apply both startDate and endDate filters', async () => {
      await finder.findByEntity('entity-1', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      const call = mockPrisma.accountEntry.findMany.mock.calls[0][0];
      expect(call.where.entryDate).toEqual({
        gte: new Date('2026-01-01'),
        lte: new Date('2026-01-31'),
      });
    });

    it('should apply category filter', async () => {
      await finder.findByEntity('entity-1', { category: 'payment' });

      const call = mockPrisma.accountEntry.findMany.mock.calls[0][0];
      expect(call.where.category).toBe('payment');
    });

    it('should apply tenantId filter', async () => {
      await finder.findByEntity('entity-1', { tenantId: 'tenant-1' });

      const call = mockPrisma.accountEntry.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe('tenant-1');
    });

    it('should apply all filters simultaneously', async () => {
      await finder.findByEntity('entity-1', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        category: 'rent_call',
        tenantId: 'tenant-1',
      });

      const call = mockPrisma.accountEntry.findMany.mock.calls[0][0];
      expect(call.where).toEqual({
        entityId: 'entity-1',
        entryDate: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
        category: 'rent_call',
        tenantId: 'tenant-1',
      });
    });

    it('should return entries with tenant data', async () => {
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
      mockPrisma.accountEntry.findMany.mockResolvedValue(entries);

      const result = await finder.findByEntity('entity-1');
      expect(result).toEqual(entries);
    });
  });

  describe('getTotalBalance', () => {
    it('should return the sum of latest balances per tenant', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ total: BigInt(150000) }]);

      const result = await finder.getTotalBalance('entity-1');

      expect(result).toBe(150000);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no entries exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ total: null }]);

      const result = await finder.getTotalBalance('entity-1');

      expect(result).toBe(0);
    });

    it('should query entity-wide balance using DISTINCT ON subquery', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ total: BigInt(100000) }]);

      await finder.getTotalBalance('entity-1');

      // Verify the tagged template was called (entityId interpolated)
      const call = mockPrisma.$queryRaw.mock.calls[0];
      // Tagged template: first arg is string[] array, second is entityId
      expect(call[0]).toBeDefined();
      expect(call[1]).toBe('entity-1');
    });

    it('should return single tenant balance when tenantId is provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ total: BigInt(80000) }]);

      const result = await finder.getTotalBalance('entity-1', 'tenant-1');

      expect(result).toBe(80000);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      // Verify tenantId was passed (third arg in tagged template)
      const call = mockPrisma.$queryRaw.mock.calls[0];
      expect(call[1]).toBe('entity-1');
      expect(call[2]).toBe('tenant-1');
    });

    it('should return 0 when tenant has no entries', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ total: null }]);

      const result = await finder.getTotalBalance('entity-1', 'tenant-1');

      expect(result).toBe(0);
    });
  });

  describe('getAvailableCategories', () => {
    it('should return sorted unique categories for entity', async () => {
      mockPrisma.accountEntry.groupBy.mockResolvedValue([
        { category: 'rent_call' },
        { category: 'payment' },
        { category: 'charge_regularization' },
      ]);

      const result = await finder.getAvailableCategories('entity-1');

      expect(result).toEqual([
        'charge_regularization',
        'payment',
        'rent_call',
      ]);
      expect(mockPrisma.accountEntry.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        where: { entityId: 'entity-1' },
      });
    });

    it('should return empty array when no entries exist', async () => {
      mockPrisma.accountEntry.groupBy.mockResolvedValue([]);

      const result = await finder.getAvailableCategories('entity-1');

      expect(result).toEqual([]);
    });
  });
});
