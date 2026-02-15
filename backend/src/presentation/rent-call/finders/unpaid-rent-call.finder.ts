import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

export interface UnpaidRentCallResult {
  id: string;
  entityId: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  month: string;
  totalAmountCents: number;
  paidAmountCents: number | null;
  remainingBalanceCents: number | null;
  paymentStatus: string | null;
  sentAt: Date;
  tenantFirstName: string;
  tenantLastName: string;
  tenantCompanyName: string | null;
  tenantType: string;
  unitIdentifier: string;
  dueDate: Date;
  daysLate: number;
}

@Injectable()
export class UnpaidRentCallFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEntity(entityId: string, userId: string): Promise<UnpaidRentCallResult[]> {
    const entity = await this.prisma.ownershipEntity.findFirst({
      where: { id: entityId, userId },
      select: { latePaymentDelayDays: true },
    });

    if (!entity) return [];

    const delayDays = entity.latePaymentDelayDays;

    // Fetch rent calls that are sent but not fully paid
    const rentCalls = await this.prisma.rentCall.findMany({
      where: {
        entityId,
        userId,
        sentAt: { not: null },
        OR: [{ paymentStatus: null }, { paymentStatus: 'partial' }],
      },
      include: {
        tenant: true,
        unit: true,
        lease: { select: { monthlyDueDate: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Normalize to start-of-day to avoid timezone-dependent hour boundary issues.
    // Both dueDate and today are midnight-aligned, so daysLate is consistent
    // regardless of server timezone or time-of-day.
    const realNow = new Date();
    const today = new Date(realNow.getFullYear(), realNow.getMonth(), realNow.getDate());
    const results: UnpaidRentCallResult[] = [];

    for (const rc of rentCalls) {
      // Compute due date from month + lease.monthlyDueDate
      const [yearStr, monthStr] = rc.month.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed
      const dueDay = rc.lease.monthlyDueDate;
      const dueDate = new Date(year, monthIndex, dueDay);

      // lateAfterDate = dueDate + delayDays
      const lateAfterDate = new Date(dueDate);
      lateAfterDate.setDate(lateAfterDate.getDate() + delayDays);

      // daysLate = diff between today (start-of-day) and lateAfterDate (midnight)
      const diffMs = today.getTime() - lateAfterDate.getTime();
      const daysLate = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      if (daysLate > 0) {
        results.push({
          id: rc.id,
          entityId: rc.entityId,
          leaseId: rc.leaseId,
          tenantId: rc.tenantId,
          unitId: rc.unitId,
          month: rc.month,
          totalAmountCents: rc.totalAmountCents,
          paidAmountCents: rc.paidAmountCents,
          remainingBalanceCents: rc.remainingBalanceCents,
          paymentStatus: rc.paymentStatus,
          sentAt: rc.sentAt!,
          tenantFirstName: rc.tenant.firstName,
          tenantLastName: rc.tenant.lastName,
          tenantCompanyName: rc.tenant.companyName,
          tenantType: rc.tenant.type,
          unitIdentifier: rc.unit.identifier,
          dueDate,
          daysLate,
        });
      }
    }

    // Sort by daysLate descending
    results.sort((a, b) => b.daysLate - a.daysLate);

    return results;
  }
}
