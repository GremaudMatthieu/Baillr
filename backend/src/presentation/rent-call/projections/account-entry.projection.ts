import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { RentCallGeneratedData } from '@billing/rent-call/events/rent-call-generated.event';
import type { PaymentRecordedData } from '@billing/rent-call/events/payment-recorded.event';
import type { ChargeRegularizationAppliedData } from '@indexation/charge-regularization/events/charge-regularization-applied.event';

@Injectable()
export class AccountEntryProjection implements OnModuleInit {
  private readonly logger = new Logger(AccountEntryProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting account entry projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['rent-call_', 'charge-regularization_'] }),
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
      this.logger.error(`Account entry projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting account entry projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidRentCallGeneratedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.rentCallId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.tenantId === 'string' &&
      typeof data.month === 'string' &&
      typeof data.totalAmountCents === 'number'
    );
  }

  private isValidPaymentRecordedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.rentCallId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.transactionId === 'string' &&
      typeof data.amountCents === 'number' &&
      typeof data.recordedAt === 'string'
    );
  }

  private isValidChargeRegularizationAppliedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.chargeRegularizationId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.fiscalYear === 'number' &&
      Array.isArray(data.statements) &&
      typeof data.appliedAt === 'string'
    );
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'RentCallGenerated':
          if (!this.isValidRentCallGeneratedData(data)) {
            this.logger.error(
              `Invalid RentCallGenerated event data for account entry ${data.rentCallId}`,
            );
            return;
          }
          await this.onRentCallGenerated(data as unknown as RentCallGeneratedData);
          break;
        case 'PaymentRecorded':
          if (!this.isValidPaymentRecordedData(data)) {
            this.logger.error(
              `Invalid PaymentRecorded event data for account entry ${data.rentCallId}`,
            );
            return;
          }
          await this.onPaymentRecorded(data as unknown as PaymentRecordedData);
          break;
        case 'ChargeRegularizationApplied':
          if (!this.isValidChargeRegularizationAppliedData(data)) {
            this.logger.error(
              `Invalid ChargeRegularizationApplied event data for ${data.chargeRegularizationId}`,
            );
            return;
          }
          await this.onChargeRegularizationApplied(
            data as unknown as ChargeRegularizationAppliedData,
          );
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for account entry: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async getLatestBalance(tenantId: string, entityId: string): Promise<number> {
    const latest = await this.prisma.accountEntry.findFirst({
      where: { tenantId, entityId },
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      select: { balanceCents: true },
    });
    return latest?.balanceCents ?? 0;
  }

  private async onRentCallGenerated(data: RentCallGeneratedData): Promise<void> {
    // Idempotent: check if debit entry already exists for this rent call
    const existing = await this.prisma.accountEntry.findFirst({
      where: { referenceId: data.rentCallId, category: 'rent_call' },
    });
    if (existing) {
      return;
    }

    const currentBalance = await this.getLatestBalance(data.tenantId, data.entityId);
    // Debit: tenant owes money → balance goes more negative
    const newBalance = currentBalance - data.totalAmountCents;

    await this.prisma.accountEntry.create({
      data: {
        entityId: data.entityId,
        tenantId: data.tenantId,
        type: 'debit',
        category: 'rent_call',
        description: `Appel de loyer ${data.month}`,
        amountCents: data.totalAmountCents,
        balanceCents: newBalance,
        referenceId: data.rentCallId,
        referenceMonth: data.month,
        entryDate: new Date(),
      },
    });
    this.logger.log(`Projected AccountEntry debit for rent call ${data.rentCallId}`);
  }

  private async onPaymentRecorded(data: PaymentRecordedData): Promise<void> {
    // Idempotent: check if credit entry already exists for this transaction
    const existing = await this.prisma.accountEntry.findFirst({
      where: { referenceId: data.transactionId, category: 'payment' },
    });
    if (existing) {
      return;
    }

    // Resolve tenantId from the rent call
    const rentCall = await this.prisma.rentCall.findUnique({
      where: { id: data.rentCallId },
      select: { tenantId: true, month: true, totalAmountCents: true },
    });
    if (!rentCall) {
      this.logger.warn(
        `RentCall ${data.rentCallId} not found for AccountEntry projection — skipping`,
      );
      return;
    }

    const currentBalance = await this.getLatestBalance(rentCall.tenantId, data.entityId);
    // Credit: tenant pays → balance goes more positive
    const newBalance = currentBalance + data.amountCents;

    await this.prisma.accountEntry.create({
      data: {
        entityId: data.entityId,
        tenantId: rentCall.tenantId,
        type: 'credit',
        category: 'payment',
        description: `Paiement ${data.payerName ?? ''} — ${rentCall.month}`,
        amountCents: data.amountCents,
        balanceCents: newBalance,
        referenceId: data.transactionId,
        referenceMonth: rentCall.month,
        entryDate: data.paymentDate ? new Date(data.paymentDate) : new Date(data.recordedAt),
      },
    });
    this.logger.log(`Projected AccountEntry credit for payment ${data.transactionId}`);

    // Check for overpayment: if total paid exceeds total amount
    const payments = await this.prisma.payment.findMany({
      where: { rentCallId: data.rentCallId },
    });
    const totalPaidCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
    const overpaymentCents = totalPaidCents - rentCall.totalAmountCents;

    if (overpaymentCents > 0) {
      // Check if overpayment credit already exists
      const existingOverpayment = await this.prisma.accountEntry.findFirst({
        where: { referenceId: data.transactionId, category: 'overpayment_credit' },
      });
      if (!existingOverpayment) {
        const balanceAfterOverpayment = newBalance;
        // Overpayment credit is INFORMATIONAL ONLY — the balance already accounts for the full payment amount.
        // amountCents shows only the overpayment portion, but balanceCents is the same as the payment credit's balance
        // because we do NOT add to balance again — it's already included in the payment credit above.
        await this.prisma.accountEntry.create({
          data: {
            entityId: data.entityId,
            tenantId: rentCall.tenantId,
            type: 'credit',
            category: 'overpayment_credit',
            description: `Trop-perçu — ${rentCall.month}`,
            amountCents: overpaymentCents,
            balanceCents: balanceAfterOverpayment,
            referenceId: data.transactionId,
            referenceMonth: rentCall.month,
            entryDate: data.paymentDate ? new Date(data.paymentDate) : new Date(data.recordedAt),
          },
        });
        this.logger.log(
          `Projected AccountEntry overpayment credit for payment ${data.transactionId} (${overpaymentCents} cents)`,
        );
      }
    }
  }

  private async onChargeRegularizationApplied(
    data: ChargeRegularizationAppliedData,
  ): Promise<void> {
    interface StatementData {
      tenantId: string;
      balanceCents: number;
    }
    const statements = data.statements as StatementData[];

    for (const statement of statements) {
      // Skip zero-balance statements
      if (statement.balanceCents === 0) {
        continue;
      }

      const referenceId = `${data.chargeRegularizationId}-${statement.tenantId}`;

      // Idempotency: check if entry already exists
      const existing = await this.prisma.accountEntry.findFirst({
        where: { referenceId, category: 'charge_regularization' },
      });
      if (existing) {
        continue;
      }

      const isDebit = statement.balanceCents > 0;
      const amountCents = Math.abs(statement.balanceCents);

      const currentBalance = await this.getLatestBalance(statement.tenantId, data.entityId);
      const newBalance = isDebit
        ? currentBalance - amountCents
        : currentBalance + amountCents;

      const description = isDebit
        ? `Régularisation des charges — ${data.fiscalYear}`
        : `Avoir régularisation des charges — ${data.fiscalYear}`;

      await this.prisma.accountEntry.create({
        data: {
          entityId: data.entityId,
          tenantId: statement.tenantId,
          type: isDebit ? 'debit' : 'credit',
          category: 'charge_regularization',
          description,
          amountCents,
          balanceCents: newBalance,
          referenceId,
          referenceMonth: `${data.fiscalYear}-12`,
          entryDate: new Date(data.appliedAt),
        },
      });
      this.logger.log(
        `Projected AccountEntry ${isDebit ? 'debit' : 'credit'} for charge regularization ${data.chargeRegularizationId}, tenant ${statement.tenantId}`,
      );
    }
  }
}
