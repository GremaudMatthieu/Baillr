import { Injectable } from '@nestjs/common';
import type { Revision } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service.js';

@Injectable()
export class RevisionFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntity(entityId: string): Promise<Revision[]> {
    return this.prisma.revision.findMany({
      where: { entityId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async findPendingByEntity(entityId: string): Promise<Revision[]> {
    return this.prisma.revision.findMany({
      where: { entityId, status: 'pending' },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async existsByLeaseAndPeriod(
    leaseId: string,
    newIndexYear: number,
    newIndexQuarter: string,
  ): Promise<boolean> {
    const count = await this.prisma.revision.count({
      where: { leaseId, newIndexYear, newIndexQuarter },
    });
    return count > 0;
  }
}
