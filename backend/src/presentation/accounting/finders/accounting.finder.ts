import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import type { AccountEntry, Tenant, Prisma } from '@prisma/client';

export type AccountEntryWithTenant = AccountEntry & {
  tenant: Pick<Tenant, 'firstName' | 'lastName' | 'companyName' | 'type'>;
};

export interface AccountingFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  tenantId?: string;
}

const TENANT_SELECT = {
  tenant: {
    select: {
      firstName: true,
      lastName: true,
      companyName: true,
      type: true,
    },
  },
} as const;

@Injectable()
export class AccountingFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntity(
    entityId: string,
    filters?: AccountingFilters,
  ): Promise<AccountEntryWithTenant[]> {
    const where: Prisma.AccountEntryWhereInput = { entityId };

    if (filters?.startDate && filters?.endDate) {
      where.entryDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters?.startDate) {
      where.entryDate = { gte: new Date(filters.startDate) };
    } else if (filters?.endDate) {
      where.entryDate = { lte: new Date(filters.endDate) };
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    const entries = await this.prisma.accountEntry.findMany({
      where,
      include: TENANT_SELECT,
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
    });

    return entries as AccountEntryWithTenant[];
  }

  async getTotalBalance(
    entityId: string,
    tenantId?: string,
  ): Promise<number> {
    if (tenantId) {
      const result = await this.prisma.$queryRaw<
        { total: bigint | null }[]
      >`SELECT balance_cents as total
        FROM account_entries
        WHERE entity_id = ${entityId} AND tenant_id = ${tenantId}
        ORDER BY entry_date DESC, created_at DESC
        LIMIT 1`;

      return Number(result[0]?.total ?? 0);
    }

    const result = await this.prisma.$queryRaw<
      { total: bigint | null }[]
    >`SELECT SUM(sub.balance_cents) as total FROM (
        SELECT DISTINCT ON (tenant_id) balance_cents
        FROM account_entries
        WHERE entity_id = ${entityId}
        ORDER BY tenant_id, entry_date DESC, created_at DESC
      ) sub`;

    return Number(result[0]?.total ?? 0);
  }

  async getAvailableCategories(entityId: string): Promise<string[]> {
    const result = await this.prisma.accountEntry.groupBy({
      by: ['category'],
      where: { entityId },
    });

    return result.map((r) => r.category).sort();
  }
}
