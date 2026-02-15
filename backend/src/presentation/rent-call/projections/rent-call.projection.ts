import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { RentCallGeneratedData } from '@billing/rent-call/events/rent-call-generated.event';
import type { RentCallSentData } from '@billing/rent-call/events/rent-call-sent.event';
import type { PaymentRecordedData } from '@billing/rent-call/events/payment-recorded.event';

@Injectable()
export class RentCallProjection implements OnModuleInit {
  private readonly logger = new Logger(RentCallProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting rent call projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['rent-call_'] }),
    });

    subscription.on('data', ({ event }) => {
      if (!event) return;
      this.reconnectAttempts = 0;
      this.processingChain = this.processingChain.then(() =>
        this.handleEvent(event.type, event.data as Record<string, unknown>),
      );
    });

    subscription.on('error', (error: Error) => {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
      this.logger.error(`Rent call projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting rent call projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidRentCallGeneratedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.rentCallId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.userId === 'string' &&
      typeof data.leaseId === 'string' &&
      typeof data.tenantId === 'string' &&
      typeof data.unitId === 'string' &&
      typeof data.month === 'string' &&
      typeof data.rentAmountCents === 'number' &&
      typeof data.totalAmountCents === 'number' &&
      typeof data.isProRata === 'boolean' &&
      Array.isArray(data.billingLines)
    );
  }

  private isValidPaymentRecordedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.rentCallId === 'string' &&
      typeof data.transactionId === 'string' &&
      typeof data.amountCents === 'number' &&
      typeof data.recordedAt === 'string'
    );
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'RentCallGenerated':
          if (!this.isValidRentCallGeneratedData(data)) {
            this.logger.error(
              `Invalid RentCallGenerated event data for rent call ${data.rentCallId}`,
            );
            return;
          }
          await this.onRentCallGenerated(data as unknown as RentCallGeneratedData);
          break;
        case 'RentCallSent':
          await this.onRentCallSent(data as unknown as RentCallSentData);
          break;
        case 'PaymentRecorded':
          if (!this.isValidPaymentRecordedData(data)) {
            this.logger.error(
              `Invalid PaymentRecorded event data for rent call ${data.rentCallId}`,
            );
            return;
          }
          await this.onPaymentRecorded(data as unknown as PaymentRecordedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for rent call ${data.rentCallId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onRentCallGenerated(data: RentCallGeneratedData): Promise<void> {
    const existing = await this.prisma.rentCall.findUnique({
      where: { id: data.rentCallId },
    });
    if (existing) {
      this.logger.warn(
        `RentCall ${data.rentCallId} already exists — skipping projection (idempotent)`,
      );
      return;
    }

    const billingLines = Array.isArray(data.billingLines)
      ? (data.billingLines as import('@prisma/client').Prisma.InputJsonValue)
      : [];

    await this.prisma.rentCall.create({
      data: {
        id: data.rentCallId,
        entityId: data.entityId,
        userId: data.userId,
        leaseId: data.leaseId,
        tenantId: data.tenantId,
        unitId: data.unitId,
        month: data.month,
        rentAmountCents: data.rentAmountCents,
        billingLines,
        totalAmountCents: data.totalAmountCents,
        isProRata: data.isProRata,
        occupiedDays: data.occupiedDays ?? null,
        totalDaysInMonth: data.totalDaysInMonth ?? null,
      },
    });
    this.logger.log(`Projected RentCallGenerated for ${data.rentCallId}`);
  }

  private async onRentCallSent(data: RentCallSentData): Promise<void> {
    const existing = await this.prisma.rentCall.findUnique({
      where: { id: data.rentCallId },
    });
    if (!existing) {
      this.logger.warn(
        `RentCall ${data.rentCallId} not found for RentCallSent projection — skipping`,
      );
      return;
    }

    await this.prisma.rentCall.update({
      where: { id: data.rentCallId },
      data: {
        sentAt: new Date(data.sentAt),
        recipientEmail: data.recipientEmail,
      },
    });
    this.logger.log(`Projected RentCallSent for ${data.rentCallId}`);
  }

  private async onPaymentRecorded(data: PaymentRecordedData): Promise<void> {
    const existing = await this.prisma.rentCall.findUnique({
      where: { id: data.rentCallId },
    });
    if (!existing) {
      this.logger.warn(
        `RentCall ${data.rentCallId} not found for PaymentRecorded projection — skipping`,
      );
      return;
    }

    // Create Payment row (idempotent: catch P2002 unique violation on transactionId)
    try {
      await this.prisma.payment.create({
        data: {
          rentCallId: data.rentCallId,
          entityId: data.entityId,
          transactionId: data.transactionId,
          bankStatementId: data.bankStatementId ?? null,
          amountCents: data.amountCents,
          payerName: data.payerName ?? '',
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(data.recordedAt),
          paymentMethod: data.paymentMethod ?? 'bank_transfer',
          paymentReference: data.paymentReference ?? null,
          recordedAt: new Date(data.recordedAt),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(
          `Payment with transactionId ${data.transactionId} already exists — skipping (idempotent)`,
        );
      } else {
        throw error;
      }
    }

    // Compute total paid from all Payment rows
    const payments = await this.prisma.payment.findMany({
      where: { rentCallId: data.rentCallId },
    });
    const totalPaidCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
    const totalAmountCents = existing.totalAmountCents;

    let paymentStatus: string;
    if (totalPaidCents >= totalAmountCents) {
      paymentStatus = totalPaidCents > totalAmountCents ? 'overpaid' : 'paid';
    } else {
      paymentStatus = 'partial';
    }

    const remainingBalanceCents = Math.max(0, totalAmountCents - totalPaidCents);
    const overpaymentCents = Math.max(0, totalPaidCents - totalAmountCents);
    const isFullyPaid = paymentStatus === 'paid' || paymentStatus === 'overpaid';

    // Base fields always updated
    const updateData: Record<string, unknown> = {
      paidAmountCents: totalPaidCents,
      paymentStatus,
      remainingBalanceCents,
      overpaymentCents,
    };

    // Scalar payment fields only set on final payment (not overwritten by each partial)
    if (isFullyPaid) {
      updateData.paidAt = existing.paidAt ?? new Date(data.recordedAt);
      updateData.transactionId = data.transactionId;
      updateData.bankStatementId = data.bankStatementId ?? null;
      updateData.payerName = data.payerName ?? null;
      updateData.paymentDate = data.paymentDate ? new Date(data.paymentDate) : null;
      updateData.paymentMethod = data.paymentMethod ?? 'bank_transfer';
      updateData.paymentReference = data.paymentReference ?? null;
    } else {
      updateData.paidAt = null;
    }

    await this.prisma.rentCall.update({
      where: { id: data.rentCallId },
      data: updateData,
    });
    this.logger.log(`Projected PaymentRecorded for ${data.rentCallId} (status: ${paymentStatus})`);
  }
}
