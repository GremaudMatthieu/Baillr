import { Injectable } from '@nestjs/common';
import type { BankStatement, BankTransaction } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

export type BankStatementWithTransactions = BankStatement & {
  transactions: BankTransaction[];
};

@Injectable()
export class BankStatementFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntity(entityId: string, userId: string): Promise<BankStatement[]> {
    return this.prisma.bankStatement.findMany({
      where: { entityId, userId },
      orderBy: { importedAt: 'desc' },
    });
  }

  async findTransactions(
    bankStatementId: string,
    entityId: string,
    userId: string,
  ): Promise<BankTransaction[]> {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: bankStatementId, entityId, userId },
    });
    if (!statement) return [];

    return this.prisma.bankTransaction.findMany({
      where: { bankStatementId },
      orderBy: { date: 'desc' },
    });
  }

  async existsByEntity(entityId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.bankStatement.count({
      where: { entityId, userId },
    });
    return count > 0;
  }
}
