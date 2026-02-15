import { Injectable } from '@nestjs/common';
import type { ChargeRegularization } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service.js';

@Injectable()
export class ChargeRegularizationFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntityAndYear(
    entityId: string,
    fiscalYear: number,
  ): Promise<ChargeRegularization | null> {
    return this.prisma.chargeRegularization.findUnique({
      where: {
        entityId_fiscalYear: { entityId, fiscalYear },
      },
    });
  }

  async findAllByEntity(entityId: string): Promise<ChargeRegularization[]> {
    return this.prisma.chargeRegularization.findMany({
      where: { entityId },
      orderBy: { fiscalYear: 'desc' },
    });
  }
}
