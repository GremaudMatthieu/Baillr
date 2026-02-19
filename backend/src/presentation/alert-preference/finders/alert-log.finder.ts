import { Injectable } from '@nestjs/common';
import type { AlertLog } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class AlertLogFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntityUserTypeAndReference(
    entityId: string,
    userId: string,
    alertType: string,
    referenceId: string,
  ): Promise<AlertLog | null> {
    return this.prisma.alertLog.findUnique({
      where: {
        entityId_userId_alertType_referenceId: {
          entityId,
          userId,
          alertType,
          referenceId,
        },
      },
    });
  }

  async findSentReferenceIds(
    entityId: string,
    userId: string,
    alertType: string,
    referenceIds: string[],
  ): Promise<Set<string>> {
    if (referenceIds.length === 0) return new Set();
    const logs = await this.prisma.alertLog.findMany({
      where: {
        entityId,
        userId,
        alertType,
        referenceId: { in: referenceIds },
      },
      select: { referenceId: true },
    });
    return new Set(logs.map((l) => l.referenceId));
  }

  async findAllByEntityAndUser(
    entityId: string,
    userId: string,
  ): Promise<AlertLog[]> {
    return this.prisma.alertLog.findMany({
      where: { entityId, userId },
      orderBy: { sentAt: 'desc' },
    });
  }
}
