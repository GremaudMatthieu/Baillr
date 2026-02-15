import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GetProvisionsCollectedController } from '../controllers/get-provisions-collected.controller';

describe('GetProvisionsCollectedController', () => {
  let controller: GetProvisionsCollectedController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockPrisma: { rentCall: { findMany: jest.Mock } };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockPrisma = { rentCall: { findMany: jest.fn() } };
    controller = new GetProvisionsCollectedController(
      mockEntityFinder as never,
      mockPrisma as never,
    );
  });

  it('should aggregate billing lines by chargeCategoryId from paid rent calls', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.rentCall.findMany.mockResolvedValue([
      {
        billingLines: [
          { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 3000 },
          { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 1500 },
          { chargeCategoryId: 'cat-parking', categoryLabel: 'Parking', amountCents: 5000 },
        ],
      },
      {
        billingLines: [
          { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 3000 },
          { chargeCategoryId: 'cat-teom', categoryLabel: 'TEOM', amountCents: 2000 },
        ],
      },
    ]);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(result.data.totalProvisionsCents).toBe(14500);
    expect(result.data.details).toEqual(
      expect.arrayContaining([
        { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', totalCents: 7500 },
        { chargeCategoryId: 'cat-parking', categoryLabel: 'Parking', totalCents: 5000 },
        { chargeCategoryId: 'cat-teom', categoryLabel: 'TEOM', totalCents: 2000 },
      ]),
    );
    expect(result.data.details).toHaveLength(3);
  });

  it('should handle legacy provision format (backward compat)', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.rentCall.findMany.mockResolvedValue([
      {
        billingLines: [
          { label: 'Legacy provision', amountCents: 2000, type: 'provision', category: null },
        ],
      },
      {
        billingLines: [
          { label: 'Legacy provision', amountCents: 3000, type: 'provision', category: null },
        ],
      },
    ]);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(result.data.totalProvisionsCents).toBe(5000);
    expect(result.data.details).toEqual([
      { chargeCategoryId: null, categoryLabel: 'Legacy provision', totalCents: 5000 },
    ]);
  });

  it('should filter by entityId and fiscal year month prefix', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.rentCall.findMany.mockResolvedValue([]);

    await controller.handle('entity-1', '2025', 'user-1');

    expect(mockPrisma.rentCall.findMany).toHaveBeenCalledWith({
      where: {
        entityId: 'entity-1',
        month: { startsWith: '2025-' },
        paidAt: { not: null },
      },
      select: { billingLines: true },
    });
  });

  it('should return zero totals when no paid rent calls', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.rentCall.findMany.mockResolvedValue([]);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(result.data.totalProvisionsCents).toBe(0);
    expect(result.data.details).toEqual([]);
  });

  it('should throw BadRequestException when fiscalYear missing', async () => {
    await expect(
      controller.handle('entity-1', undefined, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when fiscalYear is invalid', async () => {
    await expect(
      controller.handle('entity-1', 'abc', 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', '2025', 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should skip legacy option-type billing lines', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.rentCall.findMany.mockResolvedValue([
      {
        billingLines: [
          { label: 'Parking', amountCents: 5000, type: 'option', category: null },
        ],
      },
    ]);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(result.data.totalProvisionsCents).toBe(0);
    expect(result.data.details).toEqual([]);
  });
});
