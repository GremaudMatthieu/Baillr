import { Injectable } from '@nestjs/common';
import type { OwnershipEntity } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class EntityRepository {
  constructor(private readonly prisma: PrismaService) {}

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
