import { Injectable } from '@nestjs/common';
import type { Lease, Tenant, Unit } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class LeaseFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntityAndUser(entityId: string, userId: string): Promise<Lease[]> {
    return this.prisma.lease.findMany({
      where: { entityId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Lease | null> {
    return this.prisma.lease.findFirst({
      where: { id, userId },
    });
  }

  async findByUnitId(unitId: string, userId: string): Promise<Lease | null> {
    return this.prisma.lease.findFirst({
      where: { unitId, userId },
    });
  }

  async findAllActiveByEntityAndUser(
    entityId: string,
    userId: string,
    monthStart: Date,
  ): Promise<Lease[]> {
    return this.prisma.lease.findMany({
      where: {
        entityId,
        userId,
        OR: [
          { endDate: null },
          { endDate: { gte: monthStart } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllActiveWithRevisionParams(
    entityId: string,
    userId: string,
  ): Promise<(Lease & { tenant: Tenant; unit: Unit })[]> {
    return this.prisma.lease.findMany({
      where: {
        entityId,
        userId,
        endDate: null,
        revisionDay: { not: null },
      },
      include: { tenant: true, unit: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
