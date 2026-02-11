import { Injectable } from '@nestjs/common';
import type { Unit } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service.js';

@Injectable()
export class UnitFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByPropertyAndUser(propertyId: string, userId: string): Promise<Unit[]> {
    return this.prisma.unit.findMany({
      where: { propertyId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Unit | null> {
    return this.prisma.unit.findFirst({
      where: { id, userId },
    });
  }

  async findAllByEntityAndUser(
    entityId: string,
    userId: string,
  ): Promise<(Unit & { property: { name: string } })[]> {
    return this.prisma.unit.findMany({
      where: {
        userId,
        property: { entityId, userId },
      },
      include: { property: { select: { name: true } } },
      orderBy: [{ property: { name: 'asc' } }, { identifier: 'asc' }],
    });
  }
}
