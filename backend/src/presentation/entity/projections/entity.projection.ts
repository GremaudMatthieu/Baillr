import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { EntityCreatedData } from '@portfolio/entity/events/entity-created.event';
import type { EntityUpdatedData } from '@portfolio/entity/events/entity-updated.event';

@Injectable()
export class EntityProjection implements OnModuleInit {
  private readonly logger = new Logger(EntityProjection.name);
  private reconnectAttempts = 0;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting entity projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['entity_'] }),
    });

    subscription.on('data', ({ event }) => {
      if (!event) return;
      this.reconnectAttempts = 0;
      void this.handleEvent(event.type, event.data as Record<string, unknown>);
    });

    subscription.on('error', (error: Error) => {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
      this.logger.error(`Entity projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting entity projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'EntityCreated':
          await this.onEntityCreated(data as unknown as EntityCreatedData);
          break;
        case 'EntityUpdated':
          await this.onEntityUpdated(data as unknown as EntityUpdatedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for entity ${(data as { id: string }).id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onEntityCreated(data: EntityCreatedData): Promise<void> {
    await this.prisma.ownershipEntity.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        type: data.type,
        name: data.name,
        siret: data.siret,
        addressStreet: data.address.street,
        addressPostalCode: data.address.postalCode,
        addressCity: data.address.city,
        addressCountry: data.address.country,
        addressComplement: data.address.complement,
        legalInformation: data.legalInformation,
      },
      update: {},
    });
    this.logger.log(`Projected EntityCreated for ${data.id}`);
  }

  private async onEntityUpdated(data: EntityUpdatedData): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.siret !== undefined) updateData.siret = data.siret;
    if (data.legalInformation !== undefined) updateData.legalInformation = data.legalInformation;
    if (data.address !== undefined) {
      updateData.addressStreet = data.address.street;
      updateData.addressPostalCode = data.address.postalCode;
      updateData.addressCity = data.address.city;
      updateData.addressCountry = data.address.country;
      updateData.addressComplement = data.address.complement;
    }

    const exists = await this.prisma.ownershipEntity.findUnique({
      where: { id: data.id },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `EntityUpdated received for ${data.id} but no read model exists — EntityCreated may have been missed`,
      );
      return;
    }
    await this.prisma.ownershipEntity.update({
      where: { id: data.id },
      data: updateData,
    });
    this.logger.log(`Projected EntityUpdated for ${data.id}`);
  }
}
