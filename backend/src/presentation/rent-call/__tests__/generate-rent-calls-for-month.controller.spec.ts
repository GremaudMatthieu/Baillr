import { GenerateRentCallsForMonthController } from '../controllers/generate-rent-calls-for-month.controller';
import { RentCallCalculationService } from '@billing/rent-call/rent-call-calculation.service';
import type { BatchHandlerResult } from '@billing/rent-call/commands/generate-rent-calls-for-month.command';

describe('GenerateRentCallsForMonthController', () => {
  let controller: GenerateRentCallsForMonthController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockLeaseFinder: { findAllActiveByEntityAndUser: jest.Mock };
  let mockRentCallFinder: { existsByEntityAndMonth: jest.Mock };
  let calculationService: RentCallCalculationService;

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn() };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockLeaseFinder = { findAllActiveByEntityAndUser: jest.fn() };
    mockRentCallFinder = { existsByEntityAndMonth: jest.fn() };
    calculationService = new RentCallCalculationService();

    controller = new GenerateRentCallsForMonthController(
      mockCommandBus as any,
      mockEntityFinder as any,
      mockLeaseFinder as any,
      mockRentCallFinder as any,
      calculationService,
    );
  });

  const entityId = 'entity-1';
  const userId = 'user_123';

  it('should dispatch a single command and return handler result', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(false);
    mockLeaseFinder.findAllActiveByEntityAndUser.mockResolvedValue([
      {
        id: 'lease-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        rentAmountCents: 80000,
        startDate: new Date('2026-01-01'),
        endDate: null,
        billingLines: [{ label: 'Charges', amountCents: 5000, type: 'provision' }],
      },
    ]);
    const handlerResult: BatchHandlerResult = {
      generated: 1,
      totalAmountCents: 85000,
      exceptions: [],
    };
    mockCommandBus.execute.mockResolvedValue(handlerResult);

    const result = await controller.handle(entityId, { month: '2026-03' }, userId);

    expect(result).toEqual(handlerResult);
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    // Verify monthStart is passed to LeaseFinder (March 1, 2026)
    expect(mockLeaseFinder.findAllActiveByEntityAndUser).toHaveBeenCalledWith(
      entityId,
      userId,
      new Date(Date.UTC(2026, 2, 1)),
    );
  });

  it('should reject when entity not found (unauthorized)', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle(entityId, { month: '2026-03' }, userId),
    ).rejects.toThrow('Unauthorized');
  });

  it('should reject when no active leases', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(false);
    mockLeaseFinder.findAllActiveByEntityAndUser.mockResolvedValue([]);

    await expect(
      controller.handle(entityId, { month: '2026-03' }, userId),
    ).rejects.toThrow('Aucun bail actif');
  });

  it('should reject when already generated for month', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(true);

    await expect(
      controller.handle(entityId, { month: '2026-03' }, userId),
    ).rejects.toThrow('Appels de loyer déjà générés pour ce mois');
  });

  it('should reject invalid month format', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });

    await expect(
      controller.handle(entityId, { month: 'invalid' }, userId),
    ).rejects.toThrow('Invalid month format');
  });

  it('should dispatch single command for multiple leases', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(false);
    mockLeaseFinder.findAllActiveByEntityAndUser.mockResolvedValue([
      {
        id: 'lease-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        rentAmountCents: 80000,
        startDate: new Date('2026-01-01'),
        endDate: null,
        billingLines: [],
      },
      {
        id: 'lease-2',
        tenantId: 'tenant-2',
        unitId: 'unit-2',
        rentAmountCents: 60000,
        startDate: new Date('2026-01-01'),
        endDate: null,
        billingLines: [{ label: 'Parking', amountCents: 3000, type: 'option' }],
      },
    ]);
    const handlerResult: BatchHandlerResult = {
      generated: 2,
      totalAmountCents: 143000,
      exceptions: [],
    };
    mockCommandBus.execute.mockResolvedValue(handlerResult);

    const result = await controller.handle(entityId, { month: '2026-03' }, userId);

    expect(result).toEqual(handlerResult);
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
  });
});
