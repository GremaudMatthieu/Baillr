import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import type { AccountEntry } from '@prisma/client';

@Injectable()
export class AccountEntryFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantAndEntity(
    tenantId: string,
    entityId: string,
  ): Promise<AccountEntry[]> {
    return this.prisma.accountEntry.findMany({
      where: { tenantId, entityId },
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getBalance(
    tenantId: string,
    entityId: string,
  ): Promise<{ balanceCents: number; entryCount: number }> {
    const latest = await this.prisma.accountEntry.findFirst({
      where: { tenantId, entityId },
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      select: { balanceCents: true },
    });

    const count = await this.prisma.accountEntry.count({
      where: { tenantId, entityId },
    });

    return {
      balanceCents: latest?.balanceCents ?? 0,
      entryCount: count,
    };
  }
}
