import { Injectable } from '@nestjs/common';
import type { Property } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class PropertyFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntityAndUser(entityId: string, userId: string): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: { entityId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Property | null> {
    return this.prisma.property.findFirst({
      where: { id, userId },
    });
  }
}
