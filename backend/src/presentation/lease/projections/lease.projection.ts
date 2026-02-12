import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { LeaseCreatedData } from '@tenancy/lease/events/lease-created.event';

@Injectable()
export class LeaseProjection implements OnModuleInit {
  private readonly logger = new Logger(LeaseProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting lease projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['lease_'] }),
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
      this.logger.error(`Lease projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting lease projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'LeaseCreated':
          await this.onLeaseCreated(data as unknown as LeaseCreatedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for lease ${(data as { id: string }).id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onLeaseCreated(data: LeaseCreatedData): Promise<void> {
    await this.prisma.lease.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        entityId: data.entityId,
        userId: data.userId,
        tenantId: data.tenantId,
        unitId: data.unitId,
        startDate: new Date(data.startDate),
        rentAmountCents: data.rentAmountCents,
        securityDepositCents: data.securityDepositCents,
        monthlyDueDate: data.monthlyDueDate,
        revisionIndexType: data.revisionIndexType,
      },
      update: {},
    });
    this.logger.log(`Projected LeaseCreated for ${data.id}`);
  }
}
