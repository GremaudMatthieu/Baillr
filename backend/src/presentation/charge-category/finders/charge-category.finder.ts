import { Injectable } from '@nestjs/common';
import type { ChargeCategory } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class ChargeCategoryFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntityId(entityId: string): Promise<ChargeCategory[]> {
    return this.prisma.chargeCategory.findMany({
      where: { entityId },
      orderBy: [{ isStandard: 'desc' }, { label: 'asc' }],
    });
  }

  async findBySlug(entityId: string, slug: string): Promise<ChargeCategory | null> {
    return this.prisma.chargeCategory.findUnique({
      where: { entityId_slug: { entityId, slug } },
    });
  }

  async findByIdsAndEntity(ids: string[], entityId: string): Promise<ChargeCategory[]> {
    return this.prisma.chargeCategory.findMany({
      where: { id: { in: ids }, entityId },
    });
  }
}
