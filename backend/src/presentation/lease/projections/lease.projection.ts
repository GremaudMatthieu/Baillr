import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { LeaseCreatedData } from '@tenancy/lease/events/lease-created.event';
import type { LeaseBillingLinesConfiguredData } from '@tenancy/lease/events/lease-billing-lines-configured.event';
import type { LeaseRevisionParametersConfiguredData } from '@tenancy/lease/events/lease-revision-parameters-configured.event';

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
        case 'LeaseBillingLinesConfigured':
          await this.onLeaseBillingLinesConfigured(
            data as unknown as LeaseBillingLinesConfiguredData,
          );
          break;
        case 'LeaseRevisionParametersConfigured':
          await this.onLeaseRevisionParametersConfigured(
            data as unknown as LeaseRevisionParametersConfiguredData,
          );
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

  private async onLeaseBillingLinesConfigured(
    data: LeaseBillingLinesConfiguredData,
  ): Promise<void> {
    const updated = await this.prisma.lease.updateMany({
      where: { id: data.leaseId },
      data: {
        billingLines:
          data.billingLines as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });
    if (updated.count === 0) {
      this.logger.warn(
        `Lease ${data.leaseId} not found for LeaseBillingLinesConfigured — skipping projection`,
      );
      return;
    }
    this.logger.log(`Projected LeaseBillingLinesConfigured for ${data.leaseId}`);
  }

  private async onLeaseRevisionParametersConfigured(
    data: LeaseRevisionParametersConfiguredData,
  ): Promise<void> {
    const updated = await this.prisma.lease.updateMany({
      where: { id: data.leaseId },
      data: {
        revisionDay: data.revisionDay,
        revisionMonth: data.revisionMonth,
        referenceQuarter: data.referenceQuarter,
        referenceYear: data.referenceYear,
        baseIndexValue: data.baseIndexValue,
      },
    });
    if (updated.count === 0) {
      this.logger.warn(
        `Lease ${data.leaseId} not found for LeaseRevisionParametersConfigured — skipping projection`,
      );
      return;
    }
    this.logger.log(
      `Projected LeaseRevisionParametersConfigured for ${data.leaseId}`,
    );
  }
}
