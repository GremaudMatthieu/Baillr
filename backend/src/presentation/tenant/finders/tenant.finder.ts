import { Injectable } from '@nestjs/common';
import type { Tenant } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class TenantFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntityAndUser(entityId: string, userId: string): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { entityId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: { id, userId },
    });
  }
}
