import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { WaterMeterReadingsEnteredData } from '@indexation/water-meter-readings/events/water-meter-readings-entered.event';

@Injectable()
export class WaterMeterReadingsProjection implements OnModuleInit {
  private readonly logger = new Logger(WaterMeterReadingsProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting water meter readings projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['water-meter-readings_'] }),
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
      this.logger.error(`Water meter readings projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting water meter readings projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidData(data: Record<string, unknown>): boolean {
    return (
      typeof data.waterMeterReadingsId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.userId === 'string' &&
      typeof data.fiscalYear === 'number' &&
      Array.isArray(data.readings) &&
      typeof data.totalConsumption === 'number'
    );
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'WaterMeterReadingsEntered':
          if (!this.isValidData(data)) {
            this.logger.error(
              `Invalid WaterMeterReadingsEntered event data for ${data.waterMeterReadingsId}`,
            );
            return;
          }
          await this.onWaterMeterReadingsEntered(data as unknown as WaterMeterReadingsEnteredData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for ${data.waterMeterReadingsId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onWaterMeterReadingsEntered(data: WaterMeterReadingsEnteredData): Promise<void> {
    await this.prisma.waterMeterReadings.upsert({
      where: {
        entityId_fiscalYear: {
          entityId: data.entityId,
          fiscalYear: data.fiscalYear,
        },
      },
      create: {
        id: data.waterMeterReadingsId,
        entityId: data.entityId,
        userId: data.userId,
        fiscalYear: data.fiscalYear,
        readings: data.readings as unknown as import('@prisma/client').Prisma.InputJsonValue,
        totalConsumption: data.totalConsumption,
      },
      update: {
        readings: data.readings as unknown as import('@prisma/client').Prisma.InputJsonValue,
        totalConsumption: data.totalConsumption,
      },
    });
    this.logger.log(
      `Projected WaterMeterReadingsEntered for ${data.waterMeterReadingsId} (fiscal year ${data.fiscalYear})`,
    );
  }
}
