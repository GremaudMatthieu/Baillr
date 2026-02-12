import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { UserId } from '@shared/user-id.js';
import { RentAmount } from './rent-amount.js';
import { SecurityDeposit } from './security-deposit.js';
import { MonthlyDueDate } from './monthly-due-date.js';
import { RevisionIndexType } from './revision-index-type.js';
import { LeaseStartDate } from './lease-start-date.js';
import { LeaseCreated } from './events/lease-created.event.js';
import { LeaseAlreadyCreatedException } from './exceptions/lease-already-created.exception.js';

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
}
