import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import type { Payment } from '@prisma/client';

@Injectable()
export class PaymentFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByRentCallId(rentCallId: string, entityId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { rentCallId, entityId },
      orderBy: { recordedAt: 'desc' },
    });
  }
}
