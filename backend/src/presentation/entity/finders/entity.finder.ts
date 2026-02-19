import { Injectable } from '@nestjs/common';
import type { OwnershipEntity } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class EntityFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OwnershipEntity[]> {
    return this.prisma.ownershipEntity.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUserId(userId: string): Promise<OwnershipEntity[]> {
    return this.prisma.ownershipEntity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<OwnershipEntity | null> {
    return this.prisma.ownershipEntity.findFirst({
      where: { id, userId },
    });
  }
}
