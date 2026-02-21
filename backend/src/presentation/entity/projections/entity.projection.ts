import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { EntityCreatedData } from '@portfolio/entity/events/entity-created.event';
import type { EntityUpdatedData } from '@portfolio/entity/events/entity-updated.event';
import type { BankAccountAddedData } from '@portfolio/entity/events/bank-account-added.event';
import type { BankAccountUpdatedData } from '@portfolio/entity/events/bank-account-updated.event';
import type { BankAccountRemovedData } from '@portfolio/entity/events/bank-account-removed.event';
import type { EntityLatePaymentDelayConfiguredData } from '@portfolio/entity/events/entity-late-payment-delay-configured.event';
import type { BankConnectionLinkedData } from '@portfolio/entity/events/bank-connection-linked.event';
import type { BankConnectionDisconnectedData } from '@portfolio/entity/events/bank-connection-disconnected.event';
import type { BankConnectionExpiredData } from '@portfolio/entity/events/bank-connection-expired.event';
import type { BankConnectionSyncedData } from '@portfolio/entity/events/bank-connection-synced.event';

@Injectable()
export class EntityProjection implements OnModuleInit {
  private readonly logger = new Logger(EntityProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

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
      this.processingChain = this.processingChain.then(() =>
        this.handleEvent(event.type, event.data as Record<string, unknown>),
      );
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
        case 'BankAccountAdded':
          await this.onBankAccountAdded(data as unknown as BankAccountAddedData);
          break;
        case 'BankAccountUpdated':
          await this.onBankAccountUpdated(data as unknown as BankAccountUpdatedData);
          break;
        case 'BankAccountRemoved':
          await this.onBankAccountRemoved(data as unknown as BankAccountRemovedData);
          break;
        case 'EntityLatePaymentDelayConfigured':
          await this.onEntityLatePaymentDelayConfigured(
            data as unknown as EntityLatePaymentDelayConfiguredData,
          );
          break;
        case 'BankConnectionLinked':
          await this.onBankConnectionLinked(data as unknown as BankConnectionLinkedData);
          break;
        case 'BankConnectionDisconnected':
          await this.onBankConnectionDisconnected(
            data as unknown as BankConnectionDisconnectedData,
          );
          break;
        case 'BankConnectionExpired':
          await this.onBankConnectionExpired(data as unknown as BankConnectionExpiredData);
          break;
        case 'BankConnectionSynced':
          await this.onBankConnectionSynced(data as unknown as BankConnectionSyncedData);
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
        email: data.email ?? '',
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
    if (data.email !== undefined) updateData.email = data.email;
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

  private async onBankAccountAdded(data: BankAccountAddedData): Promise<void> {
    await this.prisma.bankAccount.upsert({
      where: { id: data.accountId },
      create: {
        id: data.accountId,
        entityId: data.entityId,
        type: data.type,
        label: data.label,
        iban: data.iban,
        bic: data.bic,
        bankName: data.bankName,
        isDefault: data.isDefault,
      },
      update: {},
    });
    this.logger.log(`Projected BankAccountAdded ${data.accountId} for entity ${data.entityId}`);
  }

  private async onBankAccountUpdated(data: BankAccountUpdatedData): Promise<void> {
    const exists = await this.prisma.bankAccount.findUnique({
      where: { id: data.accountId },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `BankAccountUpdated received for ${data.accountId} but no read model exists — BankAccountAdded may have been missed`,
      );
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.iban !== undefined) updateData.iban = data.iban;
    if (data.bic !== undefined) updateData.bic = data.bic;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    await this.prisma.bankAccount.update({
      where: { id: data.accountId },
      data: updateData,
    });
    this.logger.log(`Projected BankAccountUpdated ${data.accountId} for entity ${data.entityId}`);
  }

  private async onBankAccountRemoved(data: BankAccountRemovedData): Promise<void> {
    const exists = await this.prisma.bankAccount.findUnique({
      where: { id: data.accountId },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `BankAccountRemoved received for ${data.accountId} but no read model exists`,
      );
      return;
    }

    await this.prisma.bankAccount.delete({
      where: { id: data.accountId },
    });
    this.logger.log(`Projected BankAccountRemoved ${data.accountId} for entity ${data.entityId}`);
  }

  private async onEntityLatePaymentDelayConfigured(
    data: EntityLatePaymentDelayConfiguredData,
  ): Promise<void> {
    const exists = await this.prisma.ownershipEntity.findUnique({
      where: { id: data.id },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `EntityLatePaymentDelayConfigured received for ${data.id} but no read model exists`,
      );
      return;
    }
    await this.prisma.ownershipEntity.update({
      where: { id: data.id },
      data: { latePaymentDelayDays: data.latePaymentDelayDays },
    });
    this.logger.log(`Projected EntityLatePaymentDelayConfigured for ${data.id}`);
  }

  private async onBankConnectionLinked(data: BankConnectionLinkedData): Promise<void> {
    await this.prisma.bankConnection.upsert({
      where: { bankAccountId: data.bankAccountId },
      create: {
        id: data.connectionId,
        entityId: data.entityId,
        bankAccountId: data.bankAccountId,
        provider: data.provider,
        institutionId: data.institutionId,
        institutionName: data.institutionName,
        requisitionId: data.requisitionId,
        agreementId: data.agreementId,
        agreementExpiry: new Date(data.agreementExpiry),
        accountIds: data.accountIds,
        status: data.status,
      },
      update: {
        id: data.connectionId,
        entityId: data.entityId,
        provider: data.provider,
        institutionId: data.institutionId,
        institutionName: data.institutionName,
        requisitionId: data.requisitionId,
        agreementId: data.agreementId,
        agreementExpiry: new Date(data.agreementExpiry),
        accountIds: data.accountIds,
        status: data.status,
      },
    });
    this.logger.log(
      `Projected BankConnectionLinked ${data.connectionId} for entity ${data.entityId}`,
    );
  }

  private async onBankConnectionDisconnected(data: BankConnectionDisconnectedData): Promise<void> {
    const exists = await this.prisma.bankConnection.findUnique({
      where: { id: data.connectionId },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `BankConnectionDisconnected received for ${data.connectionId} but no read model exists`,
      );
      return;
    }

    await this.prisma.bankConnection.update({
      where: { id: data.connectionId },
      data: { status: 'disconnected' },
    });
    this.logger.log(
      `Projected BankConnectionDisconnected ${data.connectionId} for entity ${data.entityId}`,
    );
  }

  private async onBankConnectionExpired(data: BankConnectionExpiredData): Promise<void> {
    const exists = await this.prisma.bankConnection.findUnique({
      where: { id: data.connectionId },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `BankConnectionExpired received for ${data.connectionId} but no read model exists`,
      );
      return;
    }

    await this.prisma.bankConnection.update({
      where: { id: data.connectionId },
      data: { status: 'expired' },
    });
    this.logger.log(
      `Projected BankConnectionExpired ${data.connectionId} for entity ${data.entityId}`,
    );
  }

  private async onBankConnectionSynced(data: BankConnectionSyncedData): Promise<void> {
    const exists = await this.prisma.bankConnection.findUnique({
      where: { id: data.connectionId },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `BankConnectionSynced received for ${data.connectionId} but no read model exists`,
      );
      return;
    }

    await this.prisma.bankConnection.update({
      where: { id: data.connectionId },
      data: { lastSyncedAt: new Date(data.lastSyncedAt) },
    });
    this.logger.log(
      `Projected BankConnectionSynced ${data.connectionId} for entity ${data.entityId}`,
    );
  }
}
