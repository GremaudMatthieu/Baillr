import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { TenantRegisteredData } from '@tenancy/tenant/events/tenant-registered.event';
import type { TenantUpdatedData } from '@tenancy/tenant/events/tenant-updated.event';

@Injectable()
export class TenantProjection implements OnModuleInit {
  private readonly logger = new Logger(TenantProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting tenant projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['tenant_'] }),
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
      this.logger.error(`Tenant projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting tenant projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'TenantRegistered':
          await this.onTenantRegistered(data as unknown as TenantRegisteredData);
          break;
        case 'TenantUpdated':
          await this.onTenantUpdated(data as unknown as TenantUpdatedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for tenant ${(data as { id: string }).id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onTenantRegistered(data: TenantRegisteredData): Promise<void> {
    await this.prisma.tenant.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        entityId: data.entityId,
        userId: data.userId,
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        siret: data.siret,
        email: data.email,
        phoneNumber: data.phoneNumber,
        addressStreet: data.address.street,
        addressPostalCode: data.address.postalCode,
        addressCity: data.address.city,
        addressComplement: data.address.complement,
        insuranceProvider: data.insuranceProvider ?? null,
        policyNumber: data.policyNumber ?? null,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      },
      update: {},
    });
    this.logger.log(`Projected TenantRegistered for ${data.id}`);
  }

  private async onTenantUpdated(data: TenantUpdatedData): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.siret !== undefined) updateData.siret = data.siret;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.address !== undefined) {
      updateData.addressStreet = data.address.street;
      updateData.addressPostalCode = data.address.postalCode;
      updateData.addressCity = data.address.city;
      updateData.addressComplement = data.address.complement;
    }
    if (data.insuranceProvider !== undefined) updateData.insuranceProvider = data.insuranceProvider;
    if (data.policyNumber !== undefined) updateData.policyNumber = data.policyNumber;
    if (data.renewalDate !== undefined)
      updateData.renewalDate = data.renewalDate ? new Date(data.renewalDate) : null;

    const exists = await this.prisma.tenant.findUnique({
      where: { id: data.id },
      select: { id: true },
    });
    if (!exists) {
      this.logger.warn(
        `TenantUpdated received for ${data.id} but no read model exists — TenantRegistered may have been missed`,
      );
      return;
    }
    await this.prisma.tenant.update({
      where: { id: data.id },
      data: updateData,
    });
    this.logger.log(`Projected TenantUpdated for ${data.id}`);
  }
}
