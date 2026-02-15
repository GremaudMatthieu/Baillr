import { UnauthorizedException } from '@nestjs/common';
import { GetChargeCategoriesHandler } from '../queries/get-charge-categories.handler';
import { GetChargeCategoriesQuery } from '../queries/get-charge-categories.query';

describe('GetChargeCategoriesHandler', () => {
  let handler: GetChargeCategoriesHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockFinder: { findByEntityId: jest.Mock };
  let mockSeeder: { ensureStandardCategories: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockFinder = { findByEntityId: jest.fn() };
    mockSeeder = { ensureStandardCategories: jest.fn() };
    handler = new GetChargeCategoriesHandler(
      mockEntityFinder as never,
      mockFinder as never,
      mockSeeder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetChargeCategoriesQuery('entity-1', 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should seed standard categories and return all', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockSeeder.ensureStandardCategories.mockResolvedValue(undefined);
    const categories = [
      { id: '1', slug: 'water', label: 'Eau', isStandard: true },
      { id: '2', slug: 'parking', label: 'Parking', isStandard: false },
    ];
    mockFinder.findByEntityId.mockResolvedValue(categories);

    const result = await handler.execute(new GetChargeCategoriesQuery('entity-1', 'user-1'));

    expect(result).toEqual(categories);
    expect(mockSeeder.ensureStandardCategories).toHaveBeenCalledWith('entity-1');
    expect(mockFinder.findByEntityId).toHaveBeenCalledWith('entity-1');
  });
});
