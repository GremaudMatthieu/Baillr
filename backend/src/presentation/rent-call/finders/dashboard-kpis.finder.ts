import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

export interface MonthKpis {
  collectionRatePercent: number;
  totalCalledCents: number;
  totalReceivedCents: number;
  unpaidCount: number;
  outstandingDebtCents: number;
}

export interface DashboardKpisResult {
  currentMonth: MonthKpis;
  previousMonth: MonthKpis;
}

function getPreviousMonth(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  if (m === 1) {
    return `${y - 1}-12`;
  }
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function computeCollectionRate(totalCalled: number, totalReceived: number): number {
  if (totalCalled === 0) return 0;
  return Math.round((totalReceived / totalCalled) * 10000) / 100;
}

@Injectable()
export class DashboardKpisFinder {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(entityId: string, userId: string, month: string): Promise<DashboardKpisResult> {
    const previousMonth = getPreviousMonth(month);

    const [currentMonthData, previousMonthData, outstandingDebt] = await Promise.all([
      this.getMonthAggregation(entityId, userId, month),
      this.getMonthAggregation(entityId, userId, previousMonth),
      this.getOutstandingDebt(entityId, userId),
    ]);

    return {
      currentMonth: {
        ...currentMonthData,
        outstandingDebtCents: outstandingDebt,
      },
      previousMonth: {
        ...previousMonthData,
        // Outstanding debt is a cross-month total (not month-specific), so
        // previous-month comparison is not meaningful. Always 0.
        outstandingDebtCents: 0,
      },
    };
  }

  private async getMonthAggregation(
    entityId: string,
    userId: string,
    month: string,
  ): Promise<Omit<MonthKpis, 'outstandingDebtCents'>> {
    const [result, unpaidCount] = await Promise.all([
      this.prisma.rentCall.aggregate({
        where: { entityId, userId, month },
        _sum: {
          totalAmountCents: true,
          paidAmountCents: true,
        },
        _count: true,
      }),
      this.prisma.rentCall.count({
        where: {
          entityId,
          userId,
          month,
          sentAt: { not: null },
          OR: [
            { paymentStatus: null },
            { paymentStatus: 'partial' },
          ],
        },
      }),
    ]);

    const totalCalled = result._sum.totalAmountCents ?? 0;
    const totalReceived = result._sum.paidAmountCents ?? 0;

    return {
      collectionRatePercent: computeCollectionRate(totalCalled, totalReceived),
      totalCalledCents: totalCalled,
      totalReceivedCents: totalReceived,
      unpaidCount,
    };
  }

  private async getOutstandingDebt(entityId: string, userId: string): Promise<number> {
    const [unpaidNoPayment, partialPayment] = await Promise.all([
      this.prisma.rentCall.aggregate({
        where: {
          entityId,
          userId,
          sentAt: { not: null },
          paymentStatus: null,
        },
        _sum: {
          totalAmountCents: true,
        },
      }),
      this.prisma.rentCall.aggregate({
        where: {
          entityId,
          userId,
          sentAt: { not: null },
          paymentStatus: 'partial',
        },
        _sum: {
          remainingBalanceCents: true,
        },
      }),
    ]);

    const unpaidTotal = unpaidNoPayment._sum.totalAmountCents ?? 0;
    const partialRemaining = partialPayment._sum.remainingBalanceCents ?? 0;

    return unpaidTotal + partialRemaining;
  }
}
