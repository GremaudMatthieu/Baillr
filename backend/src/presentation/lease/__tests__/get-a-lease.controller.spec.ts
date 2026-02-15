import { NotFoundException } from '@nestjs/common';
import { GetALeaseController } from '../controllers/get-a-lease.controller';

describe('GetALeaseController', () => {
  let controller: GetALeaseController;
  let mockLeaseFinder: { findByIdAndUser: jest.Mock };

  beforeEach(() => {
    mockLeaseFinder = { findByIdAndUser: jest.fn() };
    controller = new GetALeaseController(mockLeaseFinder as any);
  });

  it('should return wrapped lease data with billing lines mapped', async () => {
    const mockLease = {
      id: 'lease-1',
      entityId: 'entity-1',
      userId: 'user_clerk_123',
      tenantId: 't1',
      unitId: 'u1',
      startDate: new Date('2026-03-01'),
      rentAmountCents: 63000,
      securityDepositCents: 63000,
      monthlyDueDate: 5,
      revisionIndexType: 'IRL',
      revisionDay: null,
      revisionMonth: null,
      referenceQuarter: null,
      referenceYear: null,
      baseIndexValue: null,
      endDate: null,
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
      billingLineRows: [
        {
          chargeCategoryId: 'cat-water',
          amountCents: 5000,
          chargeCategory: { label: 'Eau', slug: 'water' },
        },
      ],
    };
    mockLeaseFinder.findByIdAndUser.mockResolvedValue(mockLease);

    const result = await controller.handle('lease-1', 'user_clerk_123');

    expect(mockLeaseFinder.findByIdAndUser).toHaveBeenCalledWith('lease-1', 'user_clerk_123');
    expect(result.data.billingLines).toEqual([
      {
        chargeCategoryId: 'cat-water',
        categoryLabel: 'Eau',
        categorySlug: 'water',
        amountCents: 5000,
      },
    ]);
  });

  it('should throw NotFoundException when lease not found', async () => {
    mockLeaseFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(controller.handle('missing-id', 'user_clerk_123')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return empty billing lines when no billingLineRows', async () => {
    const mockLease = {
      id: 'lease-1',
      entityId: 'entity-1',
      userId: 'user_clerk_123',
      tenantId: 't1',
      unitId: 'u1',
      startDate: new Date('2026-03-01'),
      rentAmountCents: 63000,
      securityDepositCents: 63000,
      monthlyDueDate: 5,
      revisionIndexType: 'IRL',
      revisionDay: null,
      revisionMonth: null,
      referenceQuarter: null,
      referenceYear: null,
      baseIndexValue: null,
      endDate: null,
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
    };
    mockLeaseFinder.findByIdAndUser.mockResolvedValue(mockLease);

    const result = await controller.handle('lease-1', 'user_clerk_123');

    expect(result.data.billingLines).toEqual([]);
  });
});
