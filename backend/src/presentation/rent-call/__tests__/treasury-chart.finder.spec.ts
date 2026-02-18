import { TreasuryChartFinder } from '../finders/treasury-chart.finder';

function createMockPrisma() {
  return {
    rentCall: {
      groupBy: jest.fn(),
    },
  };
}

describe('TreasuryChartFinder', () => {
  let finder: TreasuryChartFinder;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    finder = new TreasuryChartFinder(mockPrisma as any);
  });

  it('should return empty array when no rent calls exist', async () => {
    mockPrisma.rentCall.groupBy.mockResolvedValue([]);

    const result = await finder.getChartData('entity-1', 'user_123', 12);

    expect(result).toEqual([]);
    expect(mockPrisma.rentCall.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['month'],
        where: expect.objectContaining({
          entityId: 'entity-1',
          userId: 'user_123',
        }),
        _sum: {
          totalAmountCents: true,
          paidAmountCents: true,
        },
        orderBy: { month: 'asc' },
      }),
    );
  });

  it('should return aggregated data for a single month', async () => {
    mockPrisma.rentCall.groupBy.mockResolvedValue([
      {
        month: '2026-02',
        _sum: { totalAmountCents: 150000, paidAmountCents: 120000 },
      },
    ]);

    const result = await finder.getChartData('entity-1', 'user_123', 1);

    expect(result).toEqual([
      { month: '2026-02', calledCents: 150000, receivedCents: 120000 },
    ]);
  });

  it('should return aggregated data for 12 months', async () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      return {
        month: `2025-${m}`,
        _sum: { totalAmountCents: 100000 + i * 10000, paidAmountCents: 90000 + i * 5000 },
      };
    });
    mockPrisma.rentCall.groupBy.mockResolvedValue(months);

    const result = await finder.getChartData('entity-1', 'user_123', 12);

    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({
      month: '2025-01',
      calledCents: 100000,
      receivedCents: 90000,
    });
    expect(result[11]).toEqual({
      month: '2025-12',
      calledCents: 210000,
      receivedCents: 145000,
    });
  });

  it('should handle partial payments with null paidAmountCents', async () => {
    mockPrisma.rentCall.groupBy.mockResolvedValue([
      {
        month: '2026-01',
        _sum: { totalAmountCents: 100000, paidAmountCents: null },
      },
    ]);

    const result = await finder.getChartData('entity-1', 'user_123', 1);

    expect(result).toEqual([
      { month: '2026-01', calledCents: 100000, receivedCents: 0 },
    ]);
  });

  it('should scope query by entityId and userId', async () => {
    mockPrisma.rentCall.groupBy.mockResolvedValue([]);

    await finder.getChartData('entity-abc', 'user_xyz', 6);

    expect(mockPrisma.rentCall.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityId: 'entity-abc',
          userId: 'user_xyz',
        }),
      }),
    );
  });

  it('should compute correct start month for months parameter', async () => {
    mockPrisma.rentCall.groupBy.mockResolvedValue([]);

    await finder.getChartData('entity-1', 'user_123', 6);

    const call = mockPrisma.rentCall.groupBy.mock.calls[0][0];
    // Compute expected start month (6 months ago + 1 = 5 months back from now)
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + 1, 1);
    const expectedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    expect(call.where.month.gte).toBe(expectedMonth);
  });
});
