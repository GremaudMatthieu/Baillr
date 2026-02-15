import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { GetChargeCategoriesController } from '../controllers/get-charge-categories.controller';
import { EntityFinder } from '../../entity/finders/entity.finder';
import { ChargeCategoryFinder } from '../finders/charge-category.finder';
import { ChargeCategorySeeder } from '../charge-category-seeder';

describe('GetChargeCategoriesController', () => {
  let controller: GetChargeCategoriesController;
  const mockEntityFinder = { findByIdAndUserId: jest.fn() };
  const mockFinder = { findByEntityId: jest.fn() };
  const mockSeeder = { ensureStandardCategories: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [GetChargeCategoriesController],
      providers: [
        { provide: EntityFinder, useValue: mockEntityFinder },
        { provide: ChargeCategoryFinder, useValue: mockFinder },
        { provide: ChargeCategorySeeder, useValue: mockSeeder },
      ],
    }).compile();

    controller = module.get(GetChargeCategoriesController);
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', 'user-1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should seed standard categories and return all', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockSeeder.ensureStandardCategories.mockResolvedValue(undefined);
    const categories = [
      { id: '1', slug: 'water', label: 'Eau', isStandard: true },
      { id: '2', slug: 'parking', label: 'Parking', isStandard: false },
    ];
    mockFinder.findByEntityId.mockResolvedValue(categories);

    const result = await controller.handle('entity-1', 'user-1');

    expect(result).toEqual({ data: categories });
    expect(mockSeeder.ensureStandardCategories).toHaveBeenCalledWith('entity-1');
    expect(mockFinder.findByEntityId).toHaveBeenCalledWith('entity-1');
  });
});
