import { RentCallProjection } from '../projections/rent-call.projection';

jest.mock('@kurrent/kurrentdb-client', () => ({
  START: 'start',
  streamNameFilter: jest.fn(() => 'filter'),
}));

const mockPrisma = {
  rentCall: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockKurrentDb = {
  client: {
    subscribeToAll: jest.fn(() => ({
      on: jest.fn(),
    })),
  },
};

describe('RentCallProjection', () => {
  let projection: RentCallProjection;

  beforeEach(() => {
    jest.clearAllMocks();
    projection = new RentCallProjection(
      mockKurrentDb as any,
      mockPrisma as any,
    );
  });

  const baseEvent = {
    rentCallId: 'rc-1',
    entityId: 'entity-1',
    userId: 'user_123',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    month: '2026-03',
    rentAmountCents: 80000,
    billingLines: [{ label: 'Charges', amountCents: 5000, type: 'provision' }],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: 31,
    totalDaysInMonth: 31,
  };

  it('should insert rent call on RentCallGenerated', async () => {
    mockPrisma.rentCall.findUnique.mockResolvedValue(null);
    mockPrisma.rentCall.create.mockResolvedValue({});

    await (projection as any).onRentCallGenerated(baseEvent);

    expect(mockPrisma.rentCall.findUnique).toHaveBeenCalledWith({
      where: { id: 'rc-1' },
    });
    expect(mockPrisma.rentCall.create).toHaveBeenCalledWith({
      data: {
        id: 'rc-1',
        entityId: 'entity-1',
        userId: 'user_123',
        leaseId: 'lease-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        month: '2026-03',
        rentAmountCents: 80000,
        billingLines: [{ label: 'Charges', amountCents: 5000, type: 'provision' }],
        totalAmountCents: 85000,
        isProRata: false,
        occupiedDays: 31,
        totalDaysInMonth: 31,
      },
    });
  });

  it('should skip insert if rent call already exists (idempotent)', async () => {
    mockPrisma.rentCall.findUnique.mockResolvedValue({ id: 'rc-1' });

    await (projection as any).onRentCallGenerated(baseEvent);

    expect(mockPrisma.rentCall.create).not.toHaveBeenCalled();
  });

  it('should subscribe to rent-call_ stream prefixes on init', () => {
    projection.onModuleInit();

    expect(mockKurrentDb.client.subscribeToAll).toHaveBeenCalled();
  });
});
