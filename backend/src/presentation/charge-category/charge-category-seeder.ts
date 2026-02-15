import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

const STANDARD_CATEGORIES = [
  { slug: 'water', label: 'Eau' },
  { slug: 'electricity', label: 'Électricité' },
  { slug: 'teom', label: 'TEOM' },
  { slug: 'cleaning', label: 'Nettoyage' },
] as const;

@Injectable()
export class ChargeCategorySeeder {
  constructor(private readonly prisma: PrismaService) {}

  async ensureStandardCategories(entityId: string): Promise<void> {
    await this.prisma.chargeCategory.createMany({
      data: STANDARD_CATEGORIES.map((cat) => ({
        entityId,
        slug: cat.slug,
        label: cat.label,
        isStandard: true,
      })),
      skipDuplicates: true,
    });
  }
}
