import { Injectable } from '@nestjs/common';
import type { Lease } from '@prisma/client';
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
}
