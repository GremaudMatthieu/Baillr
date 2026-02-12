import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { RentCallGenerated } from './events/rent-call-generated.event.js';
import { RentCallNotCreatedException } from './exceptions/rent-call-not-created.exception.js';

export class RentCallAggregate extends AggregateRoot {
  private rentCallId!: string;
  private entityId!: string;
  private leaseId!: string;
  private tenantId!: string;
  private unitId!: string;
  private month!: string;
  private rentAmountCents!: number;
  private billingLines: Array<{ label: string; amountCents: number; type: string }> = [];
  private totalAmountCents!: number;
  private isProRata = false;
  private occupiedDays!: number;
  private totalDaysInMonth!: number;
  private created = false;

  static readonly streamName = 'rent-call';

  generate(
    entityId: string,
    userId: string,
    leaseId: string,
    tenantId: string,
    unitId: string,
    month: string,
    rentAmountCents: number,
    billingLines: Array<{ label: string; amountCents: number; type: string }>,
    totalAmountCents: number,
    isProRata: boolean,
    occupiedDays: number,
    totalDaysInMonth: number,
  ): void {
    if (this.created) {
      return; // no-op guard for replays
    }

    this.apply(
      new RentCallGenerated({
        rentCallId: this.id,
        entityId,
        userId,
        leaseId,
        tenantId,
        unitId,
        month,
        rentAmountCents,
        billingLines,
        totalAmountCents,
        isProRata,
        occupiedDays,
        totalDaysInMonth,
      }),
    );
  }

  @EventHandler(RentCallGenerated)
  onRentCallGenerated(event: RentCallGenerated): void {
    this.rentCallId = event.data.rentCallId;
    this.entityId = event.data.entityId;
    this.leaseId = event.data.leaseId;
    this.tenantId = event.data.tenantId;
    this.unitId = event.data.unitId;
    this.month = event.data.month;
    this.rentAmountCents = event.data.rentAmountCents;
    this.billingLines = event.data.billingLines;
    this.totalAmountCents = event.data.totalAmountCents;
    this.isProRata = event.data.isProRata;
    this.occupiedDays = event.data.occupiedDays;
    this.totalDaysInMonth = event.data.totalDaysInMonth;
    this.created = true;
  }
}
