import { Injectable } from '@nestjs/common';
import type { Escalation } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class EscalationFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByRentCallId(rentCallId: string, userId: string): Promise<Escalation | null> {
    return this.prisma.escalation.findFirst({
      where: { rentCallId, userId },
    });
  }

  async findAllByEntity(entityId: string, userId: string): Promise<Escalation[]> {
    return this.prisma.escalation.findMany({
      where: { entityId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByRentCallIds(rentCallIds: string[], userId: string): Promise<Escalation[]> {
    if (rentCallIds.length === 0) return [];
    return this.prisma.escalation.findMany({
      where: { rentCallId: { in: rentCallIds }, userId },
    });
  }
}
