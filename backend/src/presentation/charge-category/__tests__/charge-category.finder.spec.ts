import { Test } from '@nestjs/testing';
import { ChargeCategoryFinder } from '../finders/charge-category.finder';
import { PrismaService } from '@infrastructure/database/prisma.service';

describe('ChargeCategoryFinder', () => {
  let finder: ChargeCategoryFinder;
  const mockPrisma = {
    chargeCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ChargeCategoryFinder, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    finder = module.get(ChargeCategoryFinder);
    jest.clearAllMocks();
  });

  describe('findByEntityId', () => {
    it('should return categories ordered by isStandard desc, label asc', async () => {
      const categories = [
        { id: '1', slug: 'cleaning', label: 'Nettoyage', isStandard: true },
        { id: '2', slug: 'custom', label: 'Parking', isStandard: false },
      ];
      mockPrisma.chargeCategory.findMany.mockResolvedValue(categories);

      const result = await finder.findByEntityId('entity-1');

      expect(result).toEqual(categories);
      expect(mockPrisma.chargeCategory.findMany).toHaveBeenCalledWith({
        where: { entityId: 'entity-1' },
        orderBy: [{ isStandard: 'desc' }, { label: 'asc' }],
      });
    });
  });

  describe('findBySlug', () => {
    it('should find by entityId + slug composite key', async () => {
      const cat = { id: '1', slug: 'water', label: 'Eau', isStandard: true };
      mockPrisma.chargeCategory.findUnique.mockResolvedValue(cat);

      const result = await finder.findBySlug('entity-1', 'water');

      expect(result).toEqual(cat);
      expect(mockPrisma.chargeCategory.findUnique).toHaveBeenCalledWith({
        where: { entityId_slug: { entityId: 'entity-1', slug: 'water' } },
      });
    });

    it('should return null when not found', async () => {
      mockPrisma.chargeCategory.findUnique.mockResolvedValue(null);

      const result = await finder.findBySlug('entity-1', 'unknown');
      expect(result).toBeNull();
    });
  });

  describe('findByIdsAndEntity', () => {
    it('should find categories by ids scoped to entity', async () => {
      const categories = [{ id: '1', slug: 'water', label: 'Eau' }];
      mockPrisma.chargeCategory.findMany.mockResolvedValue(categories);

      const result = await finder.findByIdsAndEntity(['1'], 'entity-1');

      expect(result).toEqual(categories);
      expect(mockPrisma.chargeCategory.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['1'] }, entityId: 'entity-1' },
      });
    });
  });
});
