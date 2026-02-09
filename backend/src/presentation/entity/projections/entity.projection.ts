import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';

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
          await this.onEntityCreated(data);
          break;
        case 'EntityUpdated':
          await this.onEntityUpdated(data);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for entity ${data.id as string}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onEntityCreated(data: Record<string, unknown>): Promise<void> {
    const address = data.address as Record<string, string>;
    await this.prisma.ownershipEntity.upsert({
      where: { id: data.id as string },
      create: {
        id: data.id as string,
        userId: data.userId as string,
        type: data.type as string,
        name: data.name as string,
        siret: (data.siret as string) ?? null,
        addressStreet: address.street,
        addressPostalCode: address.postalCode,
        addressCity: address.city,
        addressCountry: address.country,
        addressComplement: address.complement ?? null,
        legalInformation: (data.legalInformation as string) ?? null,
      },
      update: {},
    });
    this.logger.log(`Projected EntityCreated for ${data.id as string}`);
  }

  private async onEntityUpdated(data: Record<string, unknown>): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.siret !== undefined) updateData.siret = data.siret;
    if (data.legalInformation !== undefined) updateData.legalInformation = data.legalInformation;
    if (data.address !== undefined) {
      const address = data.address as Record<string, string>;
      updateData.addressStreet = address.street;
      updateData.addressPostalCode = address.postalCode;
      updateData.addressCity = address.city;
      updateData.addressCountry = address.country;
      updateData.addressComplement = address.complement ?? null;
    }

    const id = data.id as string;
    const exists = await this.prisma.ownershipEntity.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `EntityUpdated received for ${id} but no read model exists — EntityCreated may have been missed`,
      );
      return;
    }
    await this.prisma.ownershipEntity.update({
      where: { id },
      data: updateData,
    });
    this.logger.log(`Projected EntityUpdated for ${id}`);
  }
}
