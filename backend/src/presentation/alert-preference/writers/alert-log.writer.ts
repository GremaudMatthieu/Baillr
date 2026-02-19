import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

export interface AlertLogEntry {
  entityId: string;
  userId: string;
  alertType: string;
  referenceId: string;
}

@Injectable()
export class AlertLogWriter {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(entries: AlertLogEntry[]): Promise<void> {
    if (entries.length === 0) return;
    await this.prisma.alertLog.createMany({ data: entries });
  }
}
