import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

export interface TreasuryMonthData {
  month: string;
  calledCents: number;
  receivedCents: number;
}

@Injectable()
export class TreasuryChartFinder {
  constructor(private readonly prisma: PrismaService) {}

  async getChartData(
    entityId: string,
    userId: string,
    months: number,
  ): Promise<TreasuryMonthData[]> {
    const startMonth = this.computeStartMonth(months);

    const rows = await this.prisma.rentCall.groupBy({
      by: ['month'],
      where: {
        entityId,
        userId,
        month: { gte: startMonth },
      },
      _sum: {
        totalAmountCents: true,
        paidAmountCents: true,
      },
      orderBy: { month: 'asc' },
    });

    return rows.map((row) => ({
      month: row.month,
      calledCents: row._sum.totalAmountCents ?? 0,
      receivedCents: row._sum.paidAmountCents ?? 0,
    }));
  }

  private computeStartMonth(months: number): string {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}
