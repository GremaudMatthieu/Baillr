import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { RentCallGenerated } from './events/rent-call-generated.event.js';
import { RentCallSent } from './events/rent-call-sent.event.js';
import { PaymentRecorded } from './events/payment-recorded.event.js';
import { RentCallNotCreatedException } from './exceptions/rent-call-not-created.exception.js';

export interface PaymentEntry {
  transactionId: string;
  bankStatementId: string | null;
  amountCents: number;
  payerName: string;
  paymentDate: Date;
  recordedAt: Date;
  paymentMethod: string;
  paymentReference: string | null;
}

export class RentCallAggregate extends AggregateRoot {
  private rentCallId!: string;
  private entityId!: string;
  private leaseId!: string;
  private tenantId!: string;
  private unitId!: string;
  private month!: string;
  private rentAmountCents!: number;
  private billingLines: Array<{ chargeCategoryId: string; categoryLabel: string; amountCents: number }> = [];
  private totalAmountCents!: number;
  private isProRata = false;
  private occupiedDays!: number;
  private totalDaysInMonth!: number;
  private created = false;
  private sentAt: Date | null = null;
  private recipientEmail: string | null = null;
  private paidAt: Date | null = null;
  private paidAmountCents: number | null = null;
  private payments: PaymentEntry[] = [];

  static readonly streamName = 'rent-call';

  generate(
    entityId: string,
    userId: string,
    leaseId: string,
    tenantId: string,
    unitId: string,
    month: string,
    rentAmountCents: number,
    billingLines: Array<{ chargeCategoryId: string; categoryLabel: string; amountCents: number }>,
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

  markAsSent(sentAt: Date, recipientEmail: string): void {
    if (!this.created) {
      throw RentCallNotCreatedException.create();
    }
    if (this.sentAt !== null) {
      return; // no-op guard: already sent
    }

    this.apply(
      new RentCallSent({
        rentCallId: this.id,
        sentAt: sentAt.toISOString(),
        recipientEmail,
        entityId: this.entityId,
        tenantId: this.tenantId,
      }),
    );
  }

  @EventHandler(RentCallSent)
  onRentCallSent(event: RentCallSent): void {
    this.sentAt = new Date(event.data.sentAt);
    this.recipientEmail = event.data.recipientEmail;
  }

  get totalPaidCents(): number {
    return this.payments.reduce((sum, p) => sum + p.amountCents, 0);
  }

  get isFullyPaid(): boolean {
    return this.totalPaidCents >= this.totalAmountCents;
  }

  get isPartiallyPaid(): boolean {
    return this.totalPaidCents > 0 && this.totalPaidCents < this.totalAmountCents;
  }

  get remainingBalanceCents(): number {
    return Math.max(0, this.totalAmountCents - this.totalPaidCents);
  }

  get overpaymentCents(): number {
    return Math.max(0, this.totalPaidCents - this.totalAmountCents);
  }

  recordPayment(
    transactionId: string,
    bankStatementId: string | null,
    amountCents: number,
    payerName: string,
    paymentDate: string,
    recordedAt: Date,
    userId: string,
    paymentMethod: string = 'bank_transfer',
    paymentReference: string | null = null,
  ): void {
    if (!this.created) {
      throw RentCallNotCreatedException.create();
    }
    if (this.isFullyPaid) {
      return; // no-op guard: already fully paid or overpaid
    }

    this.apply(
      new PaymentRecorded({
        rentCallId: this.id,
        entityId: this.entityId,
        userId,
        transactionId,
        bankStatementId,
        amountCents,
        payerName,
        paymentDate,
        recordedAt: recordedAt.toISOString(),
        paymentMethod,
        paymentReference,
      }),
    );
  }

  @EventHandler(PaymentRecorded)
  onPaymentRecorded(event: PaymentRecorded): void {
    this.payments.push({
      transactionId: event.data.transactionId,
      bankStatementId: event.data.bankStatementId,
      amountCents: event.data.amountCents,
      payerName: event.data.payerName,
      paymentDate: new Date(event.data.paymentDate),
      recordedAt: new Date(event.data.recordedAt),
      paymentMethod: event.data.paymentMethod ?? 'bank_transfer',
      paymentReference: event.data.paymentReference ?? null,
    });

    this.paidAmountCents = this.totalPaidCents;
    if (this.isFullyPaid) {
      this.paidAt = new Date(event.data.recordedAt);
    }
  }
}
