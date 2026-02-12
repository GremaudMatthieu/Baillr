import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { UserId } from '@shared/user-id.js';
import { RentAmount } from './rent-amount.js';
import { SecurityDeposit } from './security-deposit.js';
import { MonthlyDueDate } from './monthly-due-date.js';
import { RevisionIndexType } from './revision-index-type.js';
import { LeaseStartDate } from './lease-start-date.js';
import { BillingLine } from './billing-line.js';
import { RevisionDay } from './revision-day.js';
import { RevisionMonth } from './revision-month.js';
import { ReferenceQuarter } from './reference-quarter.js';
import { ReferenceYear } from './reference-year.js';
import { BaseIndexValue } from './base-index-value.js';
import { LeaseCreated } from './events/lease-created.event.js';
import { LeaseBillingLinesConfigured } from './events/lease-billing-lines-configured.event.js';
import { LeaseRevisionParametersConfigured } from './events/lease-revision-parameters-configured.event.js';
import { LeaseAlreadyCreatedException } from './exceptions/lease-already-created.exception.js';
import { LeaseNotCreatedException } from './exceptions/lease-not-created.exception.js';
import { InvalidRevisionDayException } from './exceptions/invalid-revision-day.exception.js';

export interface BillingLineState {
  label: string;
  amountCents: number;
  type: string;
}

export class LeaseAggregate extends AggregateRoot {
  private userId!: UserId;
  private entityId!: string;
  private tenantId!: string;
  private unitId!: string;
  private startDate!: LeaseStartDate;
  private rentAmountCents!: RentAmount;
  private securityDepositCents!: SecurityDeposit;
  private monthlyDueDate!: MonthlyDueDate;
  private revisionIndexType!: RevisionIndexType;
  private billingLines: Map<string, BillingLineState> = new Map();
  private revisionDay: RevisionDay | null = null;
  private revisionMonth: RevisionMonth | null = null;
  private referenceQuarter: ReferenceQuarter | null = null;
  private referenceYear: ReferenceYear | null = null;
  private baseIndexValue: BaseIndexValue = BaseIndexValue.empty();
  private created = false;

  static readonly streamName = 'lease';

  create(
    userId: string,
    entityId: string,
    tenantId: string,
    unitId: string,
    startDate: string,
    rentAmountCents: number,
    securityDepositCents: number,
    monthlyDueDate: number,
    revisionIndexType: string,
  ): void {
    if (this.created) {
      throw LeaseAlreadyCreatedException.create();
    }

    const voUserId = UserId.fromString(userId);
    const voStartDate = LeaseStartDate.fromString(startDate);
    const voRentAmount = RentAmount.fromNumber(rentAmountCents);
    const voSecurityDeposit = SecurityDeposit.fromNumber(securityDepositCents);
    const voMonthlyDueDate = MonthlyDueDate.fromNumber(monthlyDueDate);
    const voRevisionIndexType = RevisionIndexType.fromString(revisionIndexType);

    this.apply(
      new LeaseCreated({
        id: this.id,
        entityId,
        userId: voUserId.value,
        tenantId,
        unitId,
        startDate: voStartDate.toISOString(),
        rentAmountCents: voRentAmount.value,
        securityDepositCents: voSecurityDeposit.value,
        monthlyDueDate: voMonthlyDueDate.value,
        revisionIndexType: voRevisionIndexType.value,
      }),
    );
  }

  configureBillingLines(
    billingLines: { label: string; amountCents: number; type: string }[],
  ): void {
    if (!this.created) {
      throw LeaseNotCreatedException.create();
    }

    const validated = billingLines.map((line) => BillingLine.fromPrimitives(line));
    const newPrimitives = validated.map((line) => line.toPrimitives());

    const currentPrimitives = Array.from(this.billingLines.values());
    if (JSON.stringify(currentPrimitives) === JSON.stringify(newPrimitives)) {
      return;
    }

    this.apply(
      new LeaseBillingLinesConfigured({
        leaseId: this.id,
        billingLines: newPrimitives,
      }),
    );
  }

  configureRevisionParameters(
    revisionDay: number,
    revisionMonth: number,
    referenceQuarter: string,
    referenceYear: number,
    baseIndexValue: number | null,
  ): void {
    if (!this.created) {
      throw LeaseNotCreatedException.create();
    }

    const voDay = RevisionDay.fromNumber(revisionDay);
    const voMonth = RevisionMonth.fromNumber(revisionMonth);

    // Validate day is possible for the given month (use a non-leap year as reference)
    const maxDaysInMonth = new Date(2001, revisionMonth, 0).getDate();
    if (revisionDay > maxDaysInMonth) {
      throw InvalidRevisionDayException.invalidDayForMonth(
        revisionDay,
        revisionMonth,
      );
    }

    const voQuarter = ReferenceQuarter.fromString(referenceQuarter);
    const voYear = ReferenceYear.fromNumber(referenceYear);
    const voBaseIndex =
      baseIndexValue !== null
        ? BaseIndexValue.create(baseIndexValue)
        : BaseIndexValue.empty();

    if (
      voDay.value === (this.revisionDay?.value ?? null) &&
      voMonth.value === (this.revisionMonth?.value ?? null) &&
      voQuarter.value === (this.referenceQuarter?.value ?? null) &&
      voYear.value === (this.referenceYear?.value ?? null) &&
      voBaseIndex.value === this.baseIndexValue.value
    ) {
      return;
    }

    this.apply(
      new LeaseRevisionParametersConfigured({
        leaseId: this.id,
        revisionDay: voDay.value,
        revisionMonth: voMonth.value,
        referenceQuarter: voQuarter.value,
        referenceYear: voYear.value,
        baseIndexValue: voBaseIndex.value,
      }),
    );
  }

  @EventHandler(LeaseCreated)
  onLeaseCreated(event: LeaseCreated): void {
    this.userId = UserId.fromString(event.data.userId);
    this.entityId = event.data.entityId;
    this.tenantId = event.data.tenantId;
    this.unitId = event.data.unitId;
    this.startDate = LeaseStartDate.fromString(event.data.startDate);
    this.rentAmountCents = RentAmount.fromNumber(event.data.rentAmountCents);
    this.securityDepositCents = SecurityDeposit.fromNumber(event.data.securityDepositCents);
    this.monthlyDueDate = MonthlyDueDate.fromNumber(event.data.monthlyDueDate);
    this.revisionIndexType = RevisionIndexType.fromString(event.data.revisionIndexType);
    this.created = true;
  }

  @EventHandler(LeaseBillingLinesConfigured)
  onLeaseBillingLinesConfigured(event: LeaseBillingLinesConfigured): void {
    this.billingLines = new Map();
    for (let i = 0; i < event.data.billingLines.length; i++) {
      const line = event.data.billingLines[i];
      this.billingLines.set(i.toString(), {
        label: line.label,
        amountCents: line.amountCents,
        type: line.type,
      });
    }
  }

  @EventHandler(LeaseRevisionParametersConfigured)
  onLeaseRevisionParametersConfigured(
    event: LeaseRevisionParametersConfigured,
  ): void {
    this.revisionDay = RevisionDay.fromNumber(event.data.revisionDay);
    this.revisionMonth = RevisionMonth.fromNumber(event.data.revisionMonth);
    this.referenceQuarter = ReferenceQuarter.fromString(
      event.data.referenceQuarter,
    );
    this.referenceYear = ReferenceYear.fromNumber(event.data.referenceYear);
    this.baseIndexValue =
      event.data.baseIndexValue !== null
        ? BaseIndexValue.create(event.data.baseIndexValue)
        : BaseIndexValue.empty();
  }
}
