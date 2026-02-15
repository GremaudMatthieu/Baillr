import {
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DeleteChargeCategoryController } from '../controllers/delete-charge-category.controller';

describe('DeleteChargeCategoryController', () => {
  let controller: DeleteChargeCategoryController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockPrisma: {
    chargeCategory: { findFirst: jest.Mock; delete: jest.Mock };
    leaseBillingLine: { count: jest.Mock };
  };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockPrisma = {
      chargeCategory: {
        findFirst: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
      leaseBillingLine: { count: jest.fn() },
    };
    controller = new DeleteChargeCategoryController(
      mockEntityFinder as never,
      mockPrisma as never,
    );
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'cat-1', 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw NotFoundException if category not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findFirst.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'cat-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException for standard categories', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findFirst.mockResolvedValue({
      id: 'cat-1',
      entityId: 'entity-1',
      isStandard: true,
      label: 'Eau',
      slug: 'eau',
    });

    await expect(
      controller.handle('entity-1', 'cat-1', 'user-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should delete non-standard category successfully', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findFirst.mockResolvedValue({
      id: 'cat-1',
      entityId: 'entity-1',
      isStandard: false,
      label: 'Custom',
      slug: 'custom',
    });

    await controller.handle('entity-1', 'cat-1', 'user-1');

    expect(mockPrisma.chargeCategory.delete).toHaveBeenCalledWith({
      where: { id: 'cat-1', entityId: 'entity-1' },
    });
  });

  it('should throw ConflictException when category is referenced by billing lines', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findFirst.mockResolvedValue({
      id: 'cat-1',
      entityId: 'entity-1',
      isStandard: false,
      label: 'Custom',
      slug: 'custom',
    });
    mockPrisma.chargeCategory.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('FK constraint', {
        code: 'P2003',
        clientVersion: '7.0.0',
      }),
    );
    mockPrisma.leaseBillingLine.count.mockResolvedValue(3);

    await expect(
      controller.handle('entity-1', 'cat-1', 'user-1'),
    ).rejects.toThrow(ConflictException);

    try {
      await controller.handle('entity-1', 'cat-1', 'user-1');
    } catch (e) {
      expect((e as ConflictException).message).toBe(
        'Cette catégorie est utilisée par 3 baux',
      );
    }
  });

  it('should show singular form for single usage', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findFirst.mockResolvedValue({
      id: 'cat-1',
      entityId: 'entity-1',
      isStandard: false,
    });
    mockPrisma.chargeCategory.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('FK constraint', {
        code: 'P2003',
        clientVersion: '7.0.0',
      }),
    );
    mockPrisma.leaseBillingLine.count.mockResolvedValue(1);

    try {
      await controller.handle('entity-1', 'cat-1', 'user-1');
    } catch (e) {
      expect((e as ConflictException).message).toBe(
        'Cette catégorie est utilisée par 1 bail',
      );
    }
  });

  it('should re-throw non-P2003 errors', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findFirst.mockResolvedValue({
      id: 'cat-1',
      entityId: 'entity-1',
      isStandard: false,
    });
    mockPrisma.chargeCategory.delete.mockRejectedValue(new Error('DB down'));

    await expect(
      controller.handle('entity-1', 'cat-1', 'user-1'),
    ).rejects.toThrow('DB down');
  });

  it('should check entity ownership with userId', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findFirst.mockResolvedValue({
      id: 'cat-1',
      entityId: 'entity-1',
      isStandard: false,
    });

    await controller.handle('entity-1', 'cat-1', 'user-1');

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
    );
  });
});
