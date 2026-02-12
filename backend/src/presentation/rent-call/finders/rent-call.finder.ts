import { Injectable } from '@nestjs/common';
import type { RentCall } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class RentCallFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntityAndMonth(
    entityId: string,
    userId: string,
    month: string,
  ): Promise<RentCall[]> {
    return this.prisma.rentCall.findMany({
      where: { entityId, month, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByEntityAndUser(
    entityId: string,
    userId: string,
    month?: string,
  ): Promise<RentCall[]> {
    return this.prisma.rentCall.findMany({
      where: {
        entityId,
        userId,
        ...(month ? { month } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsByEntityAndMonth(
    entityId: string,
    month: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.prisma.rentCall.count({
      where: { entityId, month, userId },
    });
    return count > 0;
  }
}
