import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { AnnualChargesRecordedData } from '@indexation/annual-charges/events/annual-charges-recorded.event';

@Injectable()
export class AnnualChargesProjection implements OnModuleInit {
  private readonly logger = new Logger(AnnualChargesProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting annual charges projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['annual-charges_'] }),
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
      const delay = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        30_000,
      );
      this.logger.error(
        `Annual charges projection subscription error: ${error.message}`,
      );
      this.logger.log(
        `Reconnecting annual charges projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidData(data: Record<string, unknown>): boolean {
    return (
      typeof data.annualChargesId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.userId === 'string' &&
      typeof data.fiscalYear === 'number' &&
      Array.isArray(data.charges) &&
      typeof data.totalAmountCents === 'number'
    );
  }

  private async handleEvent(
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      switch (eventType) {
        case 'AnnualChargesRecorded':
          if (!this.isValidData(data)) {
            this.logger.error(
              `Invalid AnnualChargesRecorded event data for ${data.annualChargesId}`,
            );
            return;
          }
          await this.onAnnualChargesRecorded(
            data as unknown as AnnualChargesRecordedData,
          );
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for ${data.annualChargesId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onAnnualChargesRecorded(
    data: AnnualChargesRecordedData,
  ): Promise<void> {
    await this.prisma.annualCharges.upsert({
      where: {
        entityId_fiscalYear: {
          entityId: data.entityId,
          fiscalYear: data.fiscalYear,
        },
      },
      create: {
        id: data.annualChargesId,
        entityId: data.entityId,
        userId: data.userId,
        fiscalYear: data.fiscalYear,
        charges: data.charges,
        totalAmountCents: data.totalAmountCents,
      },
      update: {
        charges: data.charges,
        totalAmountCents: data.totalAmountCents,
      },
    });
    this.logger.log(
      `Projected AnnualChargesRecorded for ${data.annualChargesId} (fiscal year ${data.fiscalYear})`,
    );
  }
}
