import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { ChargeRegularizationCalculatedData } from '@indexation/charge-regularization/events/charge-regularization-calculated.event';
import type { ChargeRegularizationAppliedData } from '@indexation/charge-regularization/events/charge-regularization-applied.event';
import type { ChargeRegularizationSentData } from '@indexation/charge-regularization/events/charge-regularization-sent.event';
import type { ChargeRegularizationSettledData } from '@indexation/charge-regularization/events/charge-regularization-settled.event';

@Injectable()
export class ChargeRegularizationProjection implements OnModuleInit {
  private readonly logger = new Logger(ChargeRegularizationProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting charge regularization projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['charge-regularization_'] }),
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
      this.logger.error(`Charge regularization projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting charge regularization projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidData(data: Record<string, unknown>): boolean {
    return (
      typeof data.chargeRegularizationId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.userId === 'string' &&
      typeof data.fiscalYear === 'number' &&
      Array.isArray(data.statements) &&
      typeof data.totalBalanceCents === 'number'
    );
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'ChargeRegularizationCalculated':
          if (!this.isValidData(data)) {
            this.logger.error(
              `Invalid ChargeRegularizationCalculated event data for ${data.chargeRegularizationId}`,
            );
            return;
          }
          await this.onChargeRegularizationCalculated(
            data as unknown as ChargeRegularizationCalculatedData,
          );
          break;
        case 'ChargeRegularizationApplied':
          if (!this.isValidAppliedData(data)) {
            this.logger.error(
              `Invalid ChargeRegularizationApplied event data for ${data.chargeRegularizationId}`,
            );
            return;
          }
          await this.onChargeRegularizationApplied(
            data as unknown as ChargeRegularizationAppliedData,
          );
          break;
        case 'ChargeRegularizationSent':
          if (!this.isValidSentData(data)) {
            this.logger.error(
              `Invalid ChargeRegularizationSent event data for ${data.chargeRegularizationId}`,
            );
            return;
          }
          await this.onChargeRegularizationSent(
            data as unknown as ChargeRegularizationSentData,
          );
          break;
        case 'ChargeRegularizationSettled':
          if (!this.isValidSettledData(data)) {
            this.logger.error(
              `Invalid ChargeRegularizationSettled event data for ${data.chargeRegularizationId}`,
            );
            return;
          }
          await this.onChargeRegularizationSettled(
            data as unknown as ChargeRegularizationSettledData,
          );
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for ${data.chargeRegularizationId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onChargeRegularizationCalculated(
    data: ChargeRegularizationCalculatedData,
  ): Promise<void> {
    await this.prisma.chargeRegularization.upsert({
      where: {
        entityId_fiscalYear: {
          entityId: data.entityId,
          fiscalYear: data.fiscalYear,
        },
      },
      create: {
        id: data.chargeRegularizationId,
        entityId: data.entityId,
        userId: data.userId,
        fiscalYear: data.fiscalYear,
        statements: data.statements as unknown as object[],
        totalBalanceCents: data.totalBalanceCents,
      },
      update: {
        statements: data.statements as unknown as object[],
        totalBalanceCents: data.totalBalanceCents,
      },
    });
    this.logger.log(
      `Projected ChargeRegularizationCalculated for ${data.chargeRegularizationId} (fiscal year ${data.fiscalYear})`,
    );
  }

  private isValidAppliedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.chargeRegularizationId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.fiscalYear === 'number' &&
      typeof data.appliedAt === 'string'
    );
  }

  private async onChargeRegularizationApplied(
    data: ChargeRegularizationAppliedData,
  ): Promise<void> {
    const existing = await this.prisma.chargeRegularization.findUnique({
      where: {
        entityId_fiscalYear: {
          entityId: data.entityId,
          fiscalYear: data.fiscalYear,
        },
      },
    });
    if (!existing) {
      this.logger.warn(
        `ChargeRegularization ${data.chargeRegularizationId} not found for applied projection — skipping`,
      );
      return;
    }

    await this.prisma.chargeRegularization.update({
      where: { id: existing.id },
      data: { appliedAt: new Date(data.appliedAt) },
    });
    this.logger.log(
      `Projected ChargeRegularizationApplied for ${data.chargeRegularizationId} (fiscal year ${data.fiscalYear})`,
    );
  }

  private isValidSentData(data: Record<string, unknown>): boolean {
    return (
      typeof data.chargeRegularizationId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.fiscalYear === 'number' &&
      typeof data.sentAt === 'string'
    );
  }

  private async onChargeRegularizationSent(
    data: ChargeRegularizationSentData,
  ): Promise<void> {
    const existing = await this.prisma.chargeRegularization.findUnique({
      where: {
        entityId_fiscalYear: {
          entityId: data.entityId,
          fiscalYear: data.fiscalYear,
        },
      },
    });
    if (!existing) {
      this.logger.warn(
        `ChargeRegularization ${data.chargeRegularizationId} not found for sent projection — skipping`,
      );
      return;
    }

    await this.prisma.chargeRegularization.update({
      where: { id: existing.id },
      data: { sentAt: new Date(data.sentAt) },
    });
    this.logger.log(
      `Projected ChargeRegularizationSent for ${data.chargeRegularizationId} (fiscal year ${data.fiscalYear})`,
    );
  }

  private isValidSettledData(data: Record<string, unknown>): boolean {
    return (
      typeof data.chargeRegularizationId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.fiscalYear === 'number' &&
      typeof data.settledAt === 'string'
    );
  }

  private async onChargeRegularizationSettled(
    data: ChargeRegularizationSettledData,
  ): Promise<void> {
    const existing = await this.prisma.chargeRegularization.findUnique({
      where: {
        entityId_fiscalYear: {
          entityId: data.entityId,
          fiscalYear: data.fiscalYear,
        },
      },
    });
    if (!existing) {
      this.logger.warn(
        `ChargeRegularization ${data.chargeRegularizationId} not found for settled projection — skipping`,
      );
      return;
    }

    await this.prisma.chargeRegularization.update({
      where: { id: existing.id },
      data: { settledAt: new Date(data.settledAt) },
    });
    this.logger.log(
      `Projected ChargeRegularizationSettled for ${data.chargeRegularizationId} (fiscal year ${data.fiscalYear})`,
    );
  }
}
