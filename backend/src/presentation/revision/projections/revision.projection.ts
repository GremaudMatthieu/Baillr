import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { RentRevisionCalculatedData } from '@indexation/revision/events/rent-revision-calculated.event';

@Injectable()
export class RevisionProjection implements OnModuleInit {
  private readonly logger = new Logger(RevisionProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting revision projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['revision_'] }),
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
        `Revision projection subscription error: ${error.message}`,
      );
      this.logger.log(
        `Reconnecting revision projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidRentRevisionCalculatedData(
    data: Record<string, unknown>,
  ): boolean {
    return (
      typeof data.revisionId === 'string' &&
      typeof data.leaseId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.userId === 'string' &&
      typeof data.tenantId === 'string' &&
      typeof data.unitId === 'string' &&
      typeof data.tenantName === 'string' &&
      typeof data.unitLabel === 'string' &&
      typeof data.currentRentCents === 'number' &&
      typeof data.newRentCents === 'number' &&
      typeof data.differenceCents === 'number' &&
      typeof data.baseIndexValue === 'number' &&
      typeof data.baseIndexQuarter === 'string' &&
      typeof data.newIndexValue === 'number' &&
      typeof data.newIndexQuarter === 'string' &&
      typeof data.newIndexYear === 'number' &&
      typeof data.revisionIndexType === 'string' &&
      typeof data.calculatedAt === 'string'
    );
  }

  private async handleEvent(
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      switch (eventType) {
        case 'RentRevisionCalculated':
          if (!this.isValidRentRevisionCalculatedData(data)) {
            this.logger.error(
              `Invalid RentRevisionCalculated event data for revision ${data.revisionId}`,
            );
            return;
          }
          await this.onRentRevisionCalculated(
            data as unknown as RentRevisionCalculatedData,
          );
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for revision ${data.revisionId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onRentRevisionCalculated(
    data: RentRevisionCalculatedData,
  ): Promise<void> {
    const existing = await this.prisma.revision.findUnique({
      where: { id: data.revisionId },
    });
    if (existing) {
      this.logger.warn(
        `Revision ${data.revisionId} already exists — skipping projection (idempotent)`,
      );
      return;
    }

    await this.prisma.revision.create({
      data: {
        id: data.revisionId,
        leaseId: data.leaseId,
        entityId: data.entityId,
        userId: data.userId,
        tenantId: data.tenantId,
        unitId: data.unitId,
        tenantName: data.tenantName,
        unitLabel: data.unitLabel,
        currentRentCents: data.currentRentCents,
        newRentCents: data.newRentCents,
        differenceCents: data.differenceCents,
        baseIndexValue: data.baseIndexValue,
        baseIndexQuarter: data.baseIndexQuarter,
        newIndexValue: data.newIndexValue,
        newIndexQuarter: data.newIndexQuarter,
        newIndexYear: data.newIndexYear,
        revisionIndexType: data.revisionIndexType,
        calculatedAt: new Date(data.calculatedAt),
      },
    });
    this.logger.log(`Projected RentRevisionCalculated for ${data.revisionId}`);
  }
}
