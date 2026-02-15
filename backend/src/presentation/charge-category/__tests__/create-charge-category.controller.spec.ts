import { Test } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { CreateChargeCategoryController } from '../controllers/create-charge-category.controller';
import { EntityFinder } from '../../entity/finders/entity.finder';
import { PrismaService } from '@infrastructure/database/prisma.service';

describe('CreateChargeCategoryController', () => {
  let controller: CreateChargeCategoryController;
  const mockEntityFinder = { findByIdAndUserId: jest.fn() };
  const mockPrisma = {
    chargeCategory: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CreateChargeCategoryController],
      providers: [
        { provide: EntityFinder, useValue: mockEntityFinder },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get(CreateChargeCategoryController);
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', { label: 'Parking' }, 'user-1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw ConflictException when slug already exists', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findUnique.mockResolvedValue({
      id: '1',
      slug: 'parking',
    });

    await expect(controller.handle('entity-1', { label: 'Parking' }, 'user-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should create a custom category with auto-generated slug', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findUnique.mockResolvedValue(null);
    const created = {
      id: 'new-id',
      entityId: 'entity-1',
      slug: 'parking',
      label: 'Parking',
      isStandard: false,
    };
    mockPrisma.chargeCategory.create.mockResolvedValue(created);

    const result = await controller.handle('entity-1', { label: 'Parking' }, 'user-1');

    expect(result).toEqual({ data: created });
    expect(mockPrisma.chargeCategory.create).toHaveBeenCalledWith({
      data: {
        entityId: 'entity-1',
        slug: 'parking',
        label: 'Parking',
        isStandard: false,
      },
    });
  });

  it('should slugify labels with accents and special characters', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockPrisma.chargeCategory.findUnique.mockResolvedValue(null);
    mockPrisma.chargeCategory.create.mockResolvedValue({
      id: 'id',
      slug: 'electricite_commune',
    });

    await controller.handle('entity-1', { label: 'Électricité commune' }, 'user-1');

    expect(mockPrisma.chargeCategory.findUnique).toHaveBeenCalledWith({
      where: {
        entityId_slug: { entityId: 'entity-1', slug: 'electricite_commune' },
      },
    });
  });
});
