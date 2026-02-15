import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { GenerateRentCallsForMonthController } from '../controllers/generate-rent-calls-for-month.controller';
import { GenerateRentCallsForMonthCommand } from '@billing/rent-call/commands/generate-rent-calls-for-month.command';
import type { BatchHandlerResult } from '@billing/rent-call/commands/generate-rent-calls-for-month.command';

describe('GenerateRentCallsForMonthController', () => {
  let controller: GenerateRentCallsForMonthController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockLeaseFinder: { findAllActiveByEntityAndUser: jest.Mock };
  let mockRentCallFinder: { existsByEntityAndMonth: jest.Mock };
  let mockPrisma: { leaseBillingLine: { findMany: jest.Mock } };

  const entityId = 'entity-1';
  const userId = 'user_123';

  const defaultLease = {
    id: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    rentAmountCents: 80000,
    startDate: new Date('2026-01-01'),
    endDate: null,
  };

  const defaultBillingLineRows = [
    {
      leaseId: 'lease-1',
      chargeCategoryId: 'cat-water',
      amountCents: 5000,
      chargeCategory: { label: 'Eau', slug: 'water' },
    },
  ];

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn() };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockLeaseFinder = { findAllActiveByEntityAndUser: jest.fn() };
    mockRentCallFinder = { existsByEntityAndMonth: jest.fn() };
    mockPrisma = {
      leaseBillingLine: { findMany: jest.fn().mockResolvedValue(defaultBillingLineRows) },
    };

    controller = new GenerateRentCallsForMonthController(
      mockCommandBus as any,
      mockEntityFinder as any,
      mockLeaseFinder as any,
      mockRentCallFinder as any,
      mockPrisma as any,
    );
  });

  function setupSuccess(leases: Record<string, unknown>[] = [defaultLease]) {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(false);
    mockLeaseFinder.findAllActiveByEntityAndUser.mockResolvedValue(leases);
  }

  it('should call finders and dispatch command with mapped activeLeases', async () => {
    setupSuccess();
    const handlerResult: BatchHandlerResult = {
      generated: 1,
      totalAmountCents: 85000,
      exceptions: [],
    };
    mockCommandBus.execute.mockResolvedValue(handlerResult);

    const result = await controller.handle(entityId, { month: '2026-03' }, userId);

    expect(result).toEqual(handlerResult);
    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(entityId, userId);
    expect(mockRentCallFinder.existsByEntityAndMonth).toHaveBeenCalledWith(
      entityId,
      '2026-03',
      userId,
    );
    expect(mockLeaseFinder.findAllActiveByEntityAndUser).toHaveBeenCalledWith(
      entityId,
      userId,
      new Date(Date.UTC(2026, 2, 1)),
    );

    // Verify billing line rows loaded from Prisma
    expect(mockPrisma.leaseBillingLine.findMany).toHaveBeenCalledWith({
      where: { leaseId: { in: ['lease-1'] } },
      include: { chargeCategory: true },
    });

    const command = mockCommandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(GenerateRentCallsForMonthCommand);
    expect(command.entityId).toBe(entityId);
    expect(command.userId).toBe(userId);
    expect(command.month).toBe('2026-03');
    expect(command.activeLeases).toHaveLength(1);
    expect(command.activeLeases[0]).toEqual({
      leaseId: 'lease-1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      rentAmountCents: 80000,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: null,
      billingLines: [{ chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 5000 }],
    });
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(false);

    await expect(controller.handle(entityId, { month: '2026-03' }, userId)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw ConflictException when already generated', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(true);

    await expect(controller.handle(entityId, { month: '2026-03' }, userId)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should throw BadRequestException for invalid month format', async () => {
    await expect(controller.handle(entityId, { month: 'invalid' }, userId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException when no active leases', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.existsByEntityAndMonth.mockResolvedValue(false);
    mockLeaseFinder.findAllActiveByEntityAndUser.mockResolvedValue([]);

    await expect(controller.handle(entityId, { month: '2026-03' }, userId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should propagate handler errors', async () => {
    setupSuccess();
    mockCommandBus.execute.mockRejectedValue(new Error('Handler error'));

    await expect(controller.handle(entityId, { month: '2026-03' }, userId)).rejects.toThrow(
      'Handler error',
    );
  });
});
