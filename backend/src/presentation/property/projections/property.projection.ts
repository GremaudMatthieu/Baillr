import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { PropertyCreatedData } from '@portfolio/property/events/property-created.event';
import type { PropertyUpdatedData } from '@portfolio/property/events/property-updated.event';

@Injectable()
export class PropertyProjection implements OnModuleInit {
  private readonly logger = new Logger(PropertyProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting property projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['property_'] }),
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
      this.logger.error(`Property projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting property projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'PropertyCreated':
          await this.onPropertyCreated(data as unknown as PropertyCreatedData);
          break;
        case 'PropertyUpdated':
          await this.onPropertyUpdated(data as unknown as PropertyUpdatedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for property ${(data as { id: string }).id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onPropertyCreated(data: PropertyCreatedData): Promise<void> {
    await this.prisma.property.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        entityId: data.entityId,
        userId: data.userId,
        name: data.name,
        type: data.type,
        addressStreet: data.address.street,
        addressPostalCode: data.address.postalCode,
        addressCity: data.address.city,
        addressCountry: data.address.country,
        addressComplement: data.address.complement,
      },
      update: {},
    });
    this.logger.log(`Projected PropertyCreated for ${data.id}`);
  }

  private async onPropertyUpdated(data: PropertyUpdatedData): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.address !== undefined) {
      updateData.addressStreet = data.address.street;
      updateData.addressPostalCode = data.address.postalCode;
      updateData.addressCity = data.address.city;
      updateData.addressCountry = data.address.country;
      updateData.addressComplement = data.address.complement;
    }

    const exists = await this.prisma.property.findUnique({
      where: { id: data.id },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `PropertyUpdated received for ${data.id} but no read model exists — PropertyCreated may have been missed`,
      );
      return;
    }
    await this.prisma.property.update({
      where: { id: data.id },
      data: updateData,
    });
    this.logger.log(`Projected PropertyUpdated for ${data.id}`);
  }
}
