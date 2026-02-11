import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { UnitCreatedData } from '@portfolio/property/unit/events/unit-created.event.js';
import type { UnitUpdatedData } from '@portfolio/property/unit/events/unit-updated.event.js';

@Injectable()
export class UnitProjection implements OnModuleInit {
  private readonly logger = new Logger(UnitProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting unit projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['unit_'] }),
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
      this.logger.error(`Unit projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting unit projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'UnitCreated':
          await this.onUnitCreated(data as unknown as UnitCreatedData);
          break;
        case 'UnitUpdated':
          await this.onUnitUpdated(data as unknown as UnitUpdatedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for unit ${(data as { id: string }).id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onUnitCreated(data: UnitCreatedData): Promise<void> {
    await this.prisma.unit.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        propertyId: data.propertyId,
        userId: data.userId,
        identifier: data.identifier,
        type: data.type,
        floor: data.floor,
        surfaceArea: data.surfaceArea,
        billableOptions: data.billableOptions,
      },
      update: {},
    });
    this.logger.log(`Projected UnitCreated for ${data.id}`);
  }

  private async onUnitUpdated(data: UnitUpdatedData): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.identifier !== undefined) updateData.identifier = data.identifier;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.floor !== undefined) updateData.floor = data.floor;
    if (data.surfaceArea !== undefined) updateData.surfaceArea = data.surfaceArea;
    if (data.billableOptions !== undefined) updateData.billableOptions = data.billableOptions;

    const exists = await this.prisma.unit.findUnique({
      where: { id: data.id },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `UnitUpdated received for ${data.id} but no read model exists — UnitCreated may have been missed`,
      );
      return;
    }
    await this.prisma.unit.update({
      where: { id: data.id },
      data: updateData,
    });
    this.logger.log(`Projected UnitUpdated for ${data.id}`);
  }
}
