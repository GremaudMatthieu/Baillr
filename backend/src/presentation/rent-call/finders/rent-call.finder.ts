import { Injectable } from '@nestjs/common';
import type {
  RentCall,
  Tenant,
  Unit,
  Lease,
  OwnershipEntity,
  BankAccount,
} from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

export type RentCallWithRelations = RentCall & {
  tenant: Tenant;
  unit: Unit;
  lease: Lease;
  entity: OwnershipEntity & { bankAccounts: BankAccount[] };
};

@Injectable()
export class RentCallFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntityAndMonth(
    entityId: string,
    userId: string,
    month: string,
  ): Promise<RentCall[]> {
    return this.prisma.rentCall.findMany({
      where: { entityId, month, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByEntityAndUser(
    entityId: string,
    userId: string,
    month?: string,
  ): Promise<RentCall[]> {
    return this.prisma.rentCall.findMany({
      where: {
        entityId,
        userId,
        ...(month ? { month } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndEntity(
    rentCallId: string,
    entityId: string,
    userId: string,
  ): Promise<RentCallWithRelations | null> {
    return this.prisma.rentCall.findFirst({
      where: { id: rentCallId, entityId, userId },
      include: {
        tenant: true,
        unit: true,
        lease: true,
        entity: {
          include: { bankAccounts: true },
        },
      },
    });
  }

  async findUnsentByEntityAndMonth(
    entityId: string,
    userId: string,
    month: string,
  ): Promise<RentCallWithRelations[]> {
    return this.prisma.rentCall.findMany({
      where: { entityId, userId, month, sentAt: null },
      include: {
        tenant: true,
        unit: true,
        lease: true,
        entity: {
          include: { bankAccounts: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllWithRelationsByEntityAndMonth(
    entityId: string,
    userId: string,
    month: string,
  ): Promise<RentCallWithRelations[]> {
    return this.prisma.rentCall.findMany({
      where: { entityId, month, userId },
      include: {
        tenant: true,
        unit: true,
        lease: true,
        entity: {
          include: { bankAccounts: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async existsByEntityAndMonth(
    entityId: string,
    month: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.prisma.rentCall.count({
      where: { entityId, month, userId },
    });
    return count > 0;
  }
}
