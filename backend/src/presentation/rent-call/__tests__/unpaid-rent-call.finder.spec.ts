import { UnpaidRentCallFinder } from '../finders/unpaid-rent-call.finder';

const mockPrisma = {
  ownershipEntity: {
    findFirst: jest.fn(),
  },
  rentCall: {
    findMany: jest.fn(),
  },
};

function createRentCall(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rc-1',
    entityId: 'entity-1',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    month: '2026-01',
    totalAmountCents: 80000,
    paidAmountCents: null,
    remainingBalanceCents: null,
    paymentStatus: null,
    sentAt: new Date('2026-01-01'),
    tenant: {
      firstName: 'Jean',
      lastName: 'Dupont',
      companyName: null,
      type: 'individual',
    },
    unit: { identifier: 'A1' },
    lease: { monthlyDueDate: 5 },
    ...overrides,
  };
}

describe('UnpaidRentCallFinder', () => {
  let finder: UnpaidRentCallFinder;
  const NOW = new Date('2026-02-15');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    finder = new UnpaidRentCallFinder(mockPrisma as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return empty array when entity not found', async () => {
    mockPrisma.ownershipEntity.findFirst.mockResolvedValue(null);

    const result = await finder.findAllByEntity('entity-1', 'user_123');

    expect(result).toEqual([]);
  });

  it('should compute daysLate correctly for late rent calls', async () => {
    mockPrisma.ownershipEntity.findFirst.mockResolvedValue({
      latePaymentDelayDays: 5,
    });

    // month=2026-01, due day=5 → dueDate=Jan 5
    // lateAfterDate = Jan 5 + 5 = Jan 10
    // now = Feb 15 → daysLate = 36
    mockPrisma.rentCall.findMany.mockResolvedValue([createRentCall()]);

    const result = await finder.findAllByEntity('entity-1', 'user_123');

    expect(result).toHaveLength(1);
    expect(result[0].daysLate).toBe(36);
    expect(result[0].tenantLastName).toBe('Dupont');
    expect(result[0].unitIdentifier).toBe('A1');
  });

  it('should exclude rent calls within delay threshold', async () => {
    mockPrisma.ownershipEntity.findFirst.mockResolvedValue({
      latePaymentDelayDays: 5,
    });

    // month=2026-02, due day=15 → dueDate=Feb 15
    // lateAfterDate = Feb 15 + 5 = Feb 20
    // now = Feb 15 → daysLate = 0 → excluded
    mockPrisma.rentCall.findMany.mockResolvedValue([
      createRentCall({ month: '2026-02', lease: { monthlyDueDate: 15 } }),
    ]);

    const result = await finder.findAllByEntity('entity-1', 'user_123');

    expect(result).toHaveLength(0);
  });

  it('should use entity latePaymentDelayDays of 0 for immediate detection', async () => {
    mockPrisma.ownershipEntity.findFirst.mockResolvedValue({
      latePaymentDelayDays: 0,
    });

    // month=2026-02, due day=14 → dueDate=Feb 14
    // lateAfterDate = Feb 14 + 0 = Feb 14
    // now = Feb 15 → daysLate = 1
    mockPrisma.rentCall.findMany.mockResolvedValue([
      createRentCall({ month: '2026-02', lease: { monthlyDueDate: 14 } }),
    ]);

    const result = await finder.findAllByEntity('entity-1', 'user_123');

    expect(result).toHaveLength(1);
    expect(result[0].daysLate).toBe(1);
  });

  it('should include partially paid rent calls', async () => {
    mockPrisma.ownershipEntity.findFirst.mockResolvedValue({
      latePaymentDelayDays: 5,
    });

    mockPrisma.rentCall.findMany.mockResolvedValue([
      createRentCall({
        paymentStatus: 'partial',
        paidAmountCents: 40000,
        remainingBalanceCents: 40000,
      }),
    ]);

    const result = await finder.findAllByEntity('entity-1', 'user_123');

    expect(result).toHaveLength(1);
    expect(result[0].paymentStatus).toBe('partial');
  });

  it('should sort by daysLate descending', async () => {
    mockPrisma.ownershipEntity.findFirst.mockResolvedValue({
      latePaymentDelayDays: 5,
    });

    mockPrisma.rentCall.findMany.mockResolvedValue([
      createRentCall({ id: 'rc-recent', month: '2026-01', lease: { monthlyDueDate: 20 } }),
      createRentCall({ id: 'rc-old', month: '2025-12', lease: { monthlyDueDate: 5 } }),
    ]);

    const result = await finder.findAllByEntity('entity-1', 'user_123');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('rc-old');
    expect(result[1].id).toBe('rc-recent');
    expect(result[0].daysLate).toBeGreaterThan(result[1].daysLate);
  });
});
