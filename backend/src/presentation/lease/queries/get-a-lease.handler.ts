import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetALeaseQuery } from './get-a-lease.query.js';
import { LeaseFinder } from '../finders/lease.finder.js';

interface BillingLineRow {
  chargeCategoryId: string;
  amountCents: number;
  chargeCategory: { label: string; slug: string };
}

export interface BillingLineResponse {
  chargeCategoryId: string;
  categoryLabel: string;
  categorySlug: string;
  amountCents: number;
}

export interface LeaseResponse {
  data: {
    id: string;
    entityId: string;
    userId: string;
    tenantId: string;
    unitId: string;
    startDate: Date;
    rentAmountCents: number;
    securityDepositCents: number | null;
    monthlyDueDate: number;
    revisionIndexType: string | null;
    billingLines: BillingLineResponse[];
    revisionDay: number | null;
    revisionMonth: number | null;
    referenceQuarter: string | null;
    referenceYear: number | null;
    baseIndexValue: number | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

@QueryHandler(GetALeaseQuery)
export class GetALeaseHandler implements IQueryHandler<GetALeaseQuery> {
  constructor(private readonly finder: LeaseFinder) {}

  async execute(query: GetALeaseQuery): Promise<LeaseResponse> {
    const lease = await this.finder.findByIdAndUser(query.id, query.userId);
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // billingLineRows is included via Prisma relation in findByIdAndUser
    const billingLineRows: BillingLineRow[] =
      (lease as unknown as { billingLineRows?: BillingLineRow[] }).billingLineRows ?? [];

    const billingLines: BillingLineResponse[] = billingLineRows.map((row) => ({
      chargeCategoryId: row.chargeCategoryId,
      categoryLabel: row.chargeCategory.label,
      categorySlug: row.chargeCategory.slug,
      amountCents: row.amountCents,
    }));

    return {
      data: {
        id: lease.id,
        entityId: lease.entityId,
        userId: lease.userId,
        tenantId: lease.tenantId,
        unitId: lease.unitId,
        startDate: lease.startDate,
        rentAmountCents: lease.rentAmountCents,
        securityDepositCents: lease.securityDepositCents,
        monthlyDueDate: lease.monthlyDueDate,
        revisionIndexType: lease.revisionIndexType,
        billingLines,
        revisionDay: lease.revisionDay,
        revisionMonth: lease.revisionMonth,
        referenceQuarter: lease.referenceQuarter,
        referenceYear: lease.referenceYear,
        baseIndexValue: lease.baseIndexValue,
        endDate: lease.endDate,
        createdAt: lease.createdAt,
        updatedAt: lease.updatedAt,
      },
    };
  }
}
