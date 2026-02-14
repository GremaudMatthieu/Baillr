import { Injectable } from '@nestjs/common';
import type { AnnualCharges } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service.js';

@Injectable()
export class AnnualChargesFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntityAndYear(
    entityId: string,
    fiscalYear: number,
  ): Promise<AnnualCharges | null> {
    return this.prisma.annualCharges.findUnique({
      where: {
        entityId_fiscalYear: { entityId, fiscalYear },
      },
    });
  }

  async findAllByEntity(entityId: string): Promise<AnnualCharges[]> {
    return this.prisma.annualCharges.findMany({
      where: { entityId },
      orderBy: { fiscalYear: 'desc' },
    });
  }
}
