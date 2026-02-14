import { Injectable } from '@nestjs/common';
import type { InseeIndex } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service.js';

@Injectable()
export class InseeIndexFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntity(
    entityId: string,
    type?: string,
  ): Promise<InseeIndex[]> {
    return this.prisma.inseeIndex.findMany({
      where: {
        entityId,
        ...(type ? { type } : {}),
      },
      orderBy: [{ type: 'asc' }, { year: 'desc' }, { quarter: 'desc' }],
    });
  }

  async existsByTypeQuarterYearEntity(
    type: string,
    quarter: string,
    year: number,
    entityId: string,
  ): Promise<boolean> {
    const count = await this.prisma.inseeIndex.count({
      where: { type, quarter, year, entityId },
    });
    return count > 0;
  }
}
