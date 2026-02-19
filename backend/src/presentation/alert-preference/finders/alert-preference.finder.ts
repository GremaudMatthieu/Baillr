import { Injectable } from '@nestjs/common';
import type { AlertPreference } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class AlertPreferenceFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntityAndUser(
    entityId: string,
    userId: string,
  ): Promise<AlertPreference[]> {
    return this.prisma.alertPreference.findMany({
      where: { entityId, userId },
      orderBy: { alertType: 'asc' },
    });
  }

  async findByEntityUserAndType(
    entityId: string,
    userId: string,
    alertType: string,
  ): Promise<AlertPreference | null> {
    return this.prisma.alertPreference.findUnique({
      where: {
        entityId_userId_alertType: { entityId, userId, alertType },
      },
    });
  }
}
