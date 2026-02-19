import { Injectable } from '@nestjs/common';
import type { BankConnection } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class BankConnectionFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntityId(entityId: string): Promise<BankConnection[]> {
    return this.prisma.bankConnection.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBankAccountId(bankAccountId: string): Promise<BankConnection | null> {
    return this.prisma.bankConnection.findUnique({
      where: { bankAccountId },
    });
  }

  async findActiveByEntityId(entityId: string): Promise<BankConnection[]> {
    return this.prisma.bankConnection.findMany({
      where: { entityId, status: 'linked' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<BankConnection | null> {
    return this.prisma.bankConnection.findUnique({
      where: { id },
    });
  }

  async findAllActive(): Promise<BankConnection[]> {
    return this.prisma.bankConnection.findMany({
      where: { status: 'linked' },
    });
  }

  async findExpiring(beforeDate: Date): Promise<BankConnection[]> {
    return this.prisma.bankConnection.findMany({
      where: {
        status: 'linked',
        agreementExpiry: { lt: beforeDate },
      },
    });
  }
}
