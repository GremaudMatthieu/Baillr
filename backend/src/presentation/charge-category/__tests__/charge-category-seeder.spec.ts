import { Test } from '@nestjs/testing';
import { ChargeCategorySeeder } from '../charge-category-seeder';
import { PrismaService } from '@infrastructure/database/prisma.service';

describe('ChargeCategorySeeder', () => {
  let seeder: ChargeCategorySeeder;
  const mockPrisma = {
    chargeCategory: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ChargeCategorySeeder, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    seeder = module.get(ChargeCategorySeeder);
    jest.clearAllMocks();
  });

  it('should batch-create 4 standard categories with skipDuplicates', async () => {
    mockPrisma.chargeCategory.createMany.mockResolvedValue({ count: 4 });

    await seeder.ensureStandardCategories('entity-1');

    expect(mockPrisma.chargeCategory.createMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.chargeCategory.createMany).toHaveBeenCalledWith({
      data: [
        { entityId: 'entity-1', slug: 'water', label: 'Eau', isStandard: true },
        { entityId: 'entity-1', slug: 'electricity', label: 'Électricité', isStandard: true },
        { entityId: 'entity-1', slug: 'teom', label: 'TEOM', isStandard: true },
        { entityId: 'entity-1', slug: 'cleaning', label: 'Nettoyage', isStandard: true },
      ],
      skipDuplicates: true,
    });
  });

  it('should set isStandard: true for all seeded categories', async () => {
    mockPrisma.chargeCategory.createMany.mockResolvedValue({ count: 4 });

    await seeder.ensureStandardCategories('entity-1');

    const { data } = mockPrisma.chargeCategory.createMany.mock.calls[0][0] as {
      data: { isStandard: boolean }[];
    };
    for (const entry of data) {
      expect(entry.isStandard).toBe(true);
    }
  });
});
