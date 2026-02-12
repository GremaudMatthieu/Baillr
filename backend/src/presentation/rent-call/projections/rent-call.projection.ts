import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { RentCallGeneratedData } from '@billing/rent-call/events/rent-call-generated.event';

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
}
