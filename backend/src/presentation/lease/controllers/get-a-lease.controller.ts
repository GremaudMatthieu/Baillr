import { Controller, Get, Param, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { LeaseFinder } from '../finders/lease.finder.js';

interface BillingLineResponse {
  chargeCategoryId: string;
  categoryLabel: string;
  categorySlug: string;
  amountCents: number;
}

@Controller('leases')
export class GetALeaseController {
  constructor(private readonly leaseFinder: LeaseFinder) {}

  @Get(':id')
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ) {
    const lease = await this.leaseFinder.findByIdAndUser(id, userId);
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Map billingLineRows relation to flat response format
    const billingLineRows = (lease as Record<string, unknown>).billingLineRows as
      | Array<{
          chargeCategoryId: string;
          amountCents: number;
          chargeCategory: { label: string; slug: string };
        }>
      | undefined;

    const billingLines: BillingLineResponse[] = (billingLineRows ?? []).map(
      (row) => ({
        chargeCategoryId: row.chargeCategoryId,
        categoryLabel: row.chargeCategory.label,
        categorySlug: row.chargeCategory.slug,
        amountCents: row.amountCents,
      }),
    );

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
