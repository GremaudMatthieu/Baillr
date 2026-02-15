import { Injectable } from '@nestjs/common';
import type { WaterMeterReadings } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service.js';

@Injectable()
export class WaterMeterReadingsFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntityAndYear(entityId: string, fiscalYear: number): Promise<WaterMeterReadings | null> {
    return this.prisma.waterMeterReadings.findUnique({
      where: {
        entityId_fiscalYear: { entityId, fiscalYear },
      },
    });
  }
}
