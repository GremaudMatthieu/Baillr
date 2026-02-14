import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { IndexRecordedData } from '@indexation/insee-index/events/index-recorded.event';

@Injectable()
export class InseeIndexProjection implements OnModuleInit {
  private readonly logger = new Logger(InseeIndexProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting INSEE index projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['insee-index_'] }),
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
      this.logger.error(
        `INSEE index projection subscription error: ${error.message}`,
      );
      this.logger.log(
        `Reconnecting INSEE index projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidIndexRecordedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.indexId === 'string' &&
      typeof data.type === 'string' &&
      typeof data.quarter === 'string' &&
      typeof data.year === 'number' &&
      typeof data.value === 'number' &&
      typeof data.entityId === 'string' &&
      typeof data.userId === 'string'
    );
  }

  private async handleEvent(
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      switch (eventType) {
        case 'IndexRecorded':
          if (!this.isValidIndexRecordedData(data)) {
            this.logger.error(
              `Invalid IndexRecorded event data for index ${data.indexId}`,
            );
            return;
          }
          await this.onIndexRecorded(data as unknown as IndexRecordedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for index ${data.indexId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onIndexRecorded(data: IndexRecordedData): Promise<void> {
    const existing = await this.prisma.inseeIndex.findUnique({
      where: { id: data.indexId },
    });
    if (existing) {
      this.logger.warn(
        `InseeIndex ${data.indexId} already exists — skipping projection (idempotent)`,
      );
      return;
    }

    await this.prisma.inseeIndex.create({
      data: {
        id: data.indexId,
        type: data.type,
        quarter: data.quarter,
        year: data.year,
        value: data.value,
        entityId: data.entityId,
        userId: data.userId,
      },
    });
    this.logger.log(`Projected IndexRecorded for ${data.indexId}`);
  }
}
