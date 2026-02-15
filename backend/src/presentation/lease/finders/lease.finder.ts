import { Injectable } from '@nestjs/common';
import type { Lease, Tenant, Unit, ChargeCategory } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

export interface LeaseBillingLineWithCategory {
  leaseId: string;
  chargeCategoryId: string;
  amountCents: number;
  chargeCategory: ChargeCategory;
}

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
      include: {
        billingLineRows: {
          include: { chargeCategory: true },
        },
      },
    });
  }

  async findByUnitId(unitId: string, userId: string): Promise<Lease | null> {
    return this.prisma.lease.findFirst({
      where: { unitId, userId },
    });
  }

  async findAllActiveByEntityAndUser(
    entityId: string,
    userId: string,
    monthStart: Date,
  ): Promise<Lease[]> {
    return this.prisma.lease.findMany({
      where: {
        entityId,
        userId,
        OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByEntityAndFiscalYear(
    entityId: string,
    userId: string,
    fiscalYear: number,
  ): Promise<(Lease & { tenant: Tenant; unit: Unit })[]> {
    return this.prisma.lease.findMany({
      where: {
        entityId,
        userId,
        startDate: { lte: new Date(`${fiscalYear}-12-31`) },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(`${fiscalYear}-01-01`) } },
        ],
      },
      include: { tenant: true, unit: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBillingLinesByLeaseIds(
    leaseIds: string[],
    entityId: string,
  ): Promise<LeaseBillingLineWithCategory[]> {
    if (leaseIds.length === 0) return [];
    return this.prisma.leaseBillingLine.findMany({
      where: {
        leaseId: { in: leaseIds },
        lease: { entityId },
      },
      include: { chargeCategory: true },
    });
  }

  async findAllActiveWithRevisionParams(
    entityId: string,
    userId: string,
  ): Promise<(Lease & { tenant: Tenant; unit: Unit })[]> {
    return this.prisma.lease.findMany({
      where: {
        entityId,
        userId,
        endDate: null,
        revisionDay: { not: null },
      },
      include: { tenant: true, unit: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
