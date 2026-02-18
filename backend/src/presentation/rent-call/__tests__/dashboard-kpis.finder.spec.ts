import { DashboardKpisFinder } from '../finders/dashboard-kpis.finder';

function createMockPrisma() {
  const aggregateImpl = jest.fn();
  const countImpl = jest.fn();

  return {
    rentCall: {
      aggregate: aggregateImpl,
      count: countImpl,
    },
    // Helpers for setting up mocks by argument matching
    setupMonthAggregation(month: string, totalCalled: number | null, totalReceived: number | null) {
      aggregateImpl.mockImplementation((args: any) => {
        if (args.where.month === month && args._sum?.totalAmountCents && args._sum?.paidAmountCents) {
          return Promise.resolve({
            _sum: { totalAmountCents: totalCalled, paidAmountCents: totalReceived },
            _count: totalCalled !== null ? 1 : 0,
          });
        }
        // Fallback for outstanding debt queries (no month in where)
        if (!args.where.month && args.where.paymentStatus === null && args._sum?.totalAmountCents) {
          return Promise.resolve({ _sum: { totalAmountCents: null } });
        }
        if (!args.where.month && args.where.paymentStatus === 'partial' && args._sum?.remainingBalanceCents) {
          return Promise.resolve({ _sum: { remainingBalanceCents: null } });
        }
        return Promise.resolve({
          _sum: { totalAmountCents: null, paidAmountCents: null, remainingBalanceCents: null },
          _count: 0,
        });
      });
    },
  };
}

describe('DashboardKpisFinder', () => {
  let finder: DashboardKpisFinder;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    finder = new DashboardKpisFinder(mockPrisma as any);
  });

  it('should return zeros when no rent calls exist', async () => {
    mockPrisma.rentCall.aggregate.mockResolvedValue({
      _sum: { totalAmountCents: null, paidAmountCents: null, remainingBalanceCents: null },
      _count: 0,
    });
    mockPrisma.rentCall.count.mockResolvedValue(0);

    const result = await finder.getKpis('entity-1', 'user_123', '2026-02');

    expect(result.currentMonth).toEqual({
      collectionRatePercent: 0,
      totalCalledCents: 0,
      totalReceivedCents: 0,
      unpaidCount: 0,
      outstandingDebtCents: 0,
    });
    expect(result.previousMonth).toEqual({
      collectionRatePercent: 0,
      totalCalledCents: 0,
      totalReceivedCents: 0,
      unpaidCount: 0,
      outstandingDebtCents: 0,
    });
  });

  it('should compute 100% collection rate when all paid', async () => {
    mockPrisma.rentCall.aggregate.mockImplementation((args: any) => {
      // Month aggregation queries
      if (args.where.month === '2026-02' && args._sum?.paidAmountCents) {
        return Promise.resolve({
          _sum: { totalAmountCents: 200000, paidAmountCents: 200000 },
          _count: 2,
        });
      }
      if (args.where.month === '2026-01' && args._sum?.paidAmountCents) {
        return Promise.resolve({
          _sum: { totalAmountCents: 180000, paidAmountCents: 180000 },
          _count: 2,
        });
      }
      // Outstanding debt queries
      if (args.where.paymentStatus === null && args.where.sentAt) {
        return Promise.resolve({ _sum: { totalAmountCents: null } });
      }
      if (args.where.paymentStatus === 'partial' && args.where.sentAt) {
        return Promise.resolve({ _sum: { remainingBalanceCents: null } });
      }
      return Promise.resolve({ _sum: {}, _count: 0 });
    });
    mockPrisma.rentCall.count.mockResolvedValue(0);

    const result = await finder.getKpis('entity-1', 'user_123', '2026-02');

    expect(result.currentMonth.collectionRatePercent).toBe(100);
    expect(result.currentMonth.totalCalledCents).toBe(200000);
    expect(result.currentMonth.totalReceivedCents).toBe(200000);
    expect(result.currentMonth.unpaidCount).toBe(0);
    expect(result.currentMonth.outstandingDebtCents).toBe(0);
    expect(result.previousMonth.collectionRatePercent).toBe(100);
  });

  it('should compute partial collection rate correctly', async () => {
    mockPrisma.rentCall.aggregate.mockImplementation((args: any) => {
      if (args.where.month === '2026-02' && args._sum?.paidAmountCents) {
        return Promise.resolve({
          _sum: { totalAmountCents: 100000, paidAmountCents: 60000 },
          _count: 2,
        });
      }
      if (args.where.month === '2026-01' && args._sum?.paidAmountCents) {
        return Promise.resolve({
          _sum: { totalAmountCents: null, paidAmountCents: null },
          _count: 0,
        });
      }
      if (args.where.paymentStatus === null && args.where.sentAt) {
        return Promise.resolve({ _sum: { totalAmountCents: 40000 } });
      }
      if (args.where.paymentStatus === 'partial' && args.where.sentAt) {
        return Promise.resolve({ _sum: { remainingBalanceCents: null } });
      }
      return Promise.resolve({ _sum: {}, _count: 0 });
    });

    mockPrisma.rentCall.count.mockImplementation((args: any) => {
      if (args.where.month === '2026-02') return Promise.resolve(1);
      return Promise.resolve(0);
    });

    const result = await finder.getKpis('entity-1', 'user_123', '2026-02');

    expect(result.currentMonth.collectionRatePercent).toBe(60);
    expect(result.currentMonth.unpaidCount).toBe(1);
    expect(result.currentMonth.outstandingDebtCents).toBe(40000);
    expect(result.previousMonth.totalCalledCents).toBe(0);
    expect(result.previousMonth.collectionRatePercent).toBe(0);

    // Verify unpaid count query filters by sentAt (only sent rent calls count as unpaid)
    const countCalls = mockPrisma.rentCall.count.mock.calls;
    for (const call of countCalls) {
      expect(call[0].where.sentAt).toEqual({ not: null });
    }
  });

  it('should compute previous month for January correctly', async () => {
    mockPrisma.rentCall.aggregate.mockResolvedValue({
      _sum: { totalAmountCents: null, paidAmountCents: null, remainingBalanceCents: null },
      _count: 0,
    });
    mockPrisma.rentCall.count.mockResolvedValue(0);

    await finder.getKpis('entity-1', 'user_123', '2026-01');

    // Check that previous month query was for 2025-12
    const aggregateCalls = mockPrisma.rentCall.aggregate.mock.calls;
    const monthArgs = aggregateCalls
      .filter((call: any) => call[0].where.month)
      .map((call: any) => call[0].where.month);
    expect(monthArgs).toContain('2025-12');
  });

  it('should compute outstanding debt across multiple months', async () => {
    mockPrisma.rentCall.aggregate.mockImplementation((args: any) => {
      if (args.where.month === '2026-02' && args._sum?.paidAmountCents) {
        return Promise.resolve({
          _sum: { totalAmountCents: 100000, paidAmountCents: 50000 },
          _count: 2,
        });
      }
      if (args.where.month === '2026-01' && args._sum?.paidAmountCents) {
        return Promise.resolve({
          _sum: { totalAmountCents: 100000, paidAmountCents: 80000 },
          _count: 2,
        });
      }
      if (args.where.paymentStatus === null && args.where.sentAt) {
        return Promise.resolve({ _sum: { totalAmountCents: 80000 } });
      }
      if (args.where.paymentStatus === 'partial' && args.where.sentAt) {
        return Promise.resolve({ _sum: { remainingBalanceCents: 20000 } });
      }
      return Promise.resolve({ _sum: {}, _count: 0 });
    });

    mockPrisma.rentCall.count.mockResolvedValue(1);

    const result = await finder.getKpis('entity-1', 'user_123', '2026-02');

    expect(result.currentMonth.outstandingDebtCents).toBe(100000); // 80000 + 20000
    expect(result.previousMonth.outstandingDebtCents).toBe(0);
  });
});
