import { NotFoundException } from '@nestjs/common';
import { GetALeaseHandler } from '../queries/get-a-lease.handler';
import { GetALeaseQuery } from '../queries/get-a-lease.query';

describe('GetALeaseHandler', () => {
  let handler: GetALeaseHandler;
  let mockLeaseFinder: { findByIdAndUser: jest.Mock };

  beforeEach(() => {
    mockLeaseFinder = { findByIdAndUser: jest.fn() };
    handler = new GetALeaseHandler(mockLeaseFinder as never);
  });

  it('should throw NotFoundException when lease not found', async () => {
    mockLeaseFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(handler.execute(new GetALeaseQuery('lease-1', 'user-1'))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return wrapped lease data with billing lines mapped', async () => {
    const mockLease = {
      id: 'lease-1',
      entityId: 'entity-1',
      userId: 'user-1',
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

    const result = await handler.execute(new GetALeaseQuery('lease-1', 'user-1'));

    expect(result.data.billingLines).toEqual([
      {
        chargeCategoryId: 'cat-water',
        categoryLabel: 'Eau',
        categorySlug: 'water',
        amountCents: 5000,
      },
    ]);
    expect(result.data.id).toBe('lease-1');
    expect(result.data.rentAmountCents).toBe(63000);
  });

  it('should return empty billing lines when no billingLineRows', async () => {
    const mockLease = {
      id: 'lease-1',
      entityId: 'entity-1',
      userId: 'user-1',
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

    const result = await handler.execute(new GetALeaseQuery('lease-1', 'user-1'));

    expect(result.data.billingLines).toEqual([]);
  });
});
