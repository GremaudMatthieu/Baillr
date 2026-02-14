import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import type { EscalationInitiatedData } from '@recovery/escalation/events/escalation-initiated.event';
import type { ReminderEmailSentData } from '@recovery/escalation/events/reminder-email-sent.event';
import type { FormalNoticeGeneratedData } from '@recovery/escalation/events/formal-notice-generated.event';
import type { StakeholderNotificationGeneratedData } from '@recovery/escalation/events/stakeholder-notification-generated.event';

@Injectable()
export class EscalationProjection implements OnModuleInit {
  private readonly logger = new Logger(EscalationProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting escalation projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['escalation_'] }),
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
      this.logger.error(`Escalation projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting escalation projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private isValidEscalationInitiatedData(data: Record<string, unknown>): boolean {
    return (
      typeof data.rentCallId === 'string' &&
      typeof data.entityId === 'string' &&
      typeof data.tenantId === 'string'
    );
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'EscalationInitiated':
          if (!this.isValidEscalationInitiatedData(data)) {
            this.logger.error(
              `Invalid EscalationInitiated event data for rent call ${data.rentCallId}`,
            );
            return;
          }
          await this.onEscalationInitiated(data as unknown as EscalationInitiatedData);
          break;
        case 'ReminderEmailSent':
          await this.onReminderEmailSent(data as unknown as ReminderEmailSentData);
          break;
        case 'FormalNoticeGenerated':
          await this.onFormalNoticeGenerated(data as unknown as FormalNoticeGeneratedData);
          break;
        case 'StakeholderNotificationGenerated':
          await this.onStakeholderNotificationGenerated(
            data as unknown as StakeholderNotificationGeneratedData,
          );
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for escalation ${data.rentCallId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onEscalationInitiated(data: EscalationInitiatedData): Promise<void> {
    const existing = await this.prisma.escalation.findUnique({
      where: { rentCallId: data.rentCallId },
    });
    if (existing) {
      this.logger.warn(
        `Escalation for rent call ${data.rentCallId} already exists — skipping (idempotent)`,
      );
      return;
    }

    // userId not in domain event — resolve from rent call record
    const rentCall = await this.prisma.rentCall.findUnique({
      where: { id: data.rentCallId },
      select: { userId: true },
    });
    if (!rentCall) {
      this.logger.error(
        `RentCall ${data.rentCallId} not found — cannot project EscalationInitiated`,
      );
      return;
    }

    await this.prisma.escalation.create({
      data: {
        rentCallId: data.rentCallId,
        entityId: data.entityId,
        userId: rentCall.userId,
        tenantId: data.tenantId,
      },
    });
    this.logger.log(`Projected EscalationInitiated for rent call ${data.rentCallId}`);
  }

  private async onReminderEmailSent(data: ReminderEmailSentData): Promise<void> {
    const existing = await this.prisma.escalation.findUnique({
      where: { rentCallId: data.rentCallId },
    });
    if (!existing) {
      this.logger.warn(
        `Escalation for rent call ${data.rentCallId} not found for ReminderEmailSent — skipping`,
      );
      return;
    }

    await this.prisma.escalation.update({
      where: { rentCallId: data.rentCallId },
      data: {
        tier1SentAt: new Date(data.tier1SentAt),
        tier1RecipientEmail: data.recipientEmail,
      },
    });
    this.logger.log(`Projected ReminderEmailSent for rent call ${data.rentCallId}`);
  }

  private async onFormalNoticeGenerated(data: FormalNoticeGeneratedData): Promise<void> {
    const existing = await this.prisma.escalation.findUnique({
      where: { rentCallId: data.rentCallId },
    });
    if (!existing) {
      this.logger.warn(
        `Escalation for rent call ${data.rentCallId} not found for FormalNoticeGenerated — skipping`,
      );
      return;
    }

    await this.prisma.escalation.update({
      where: { rentCallId: data.rentCallId },
      data: {
        tier2SentAt: new Date(data.tier2SentAt),
      },
    });
    this.logger.log(`Projected FormalNoticeGenerated for rent call ${data.rentCallId}`);
  }

  private async onStakeholderNotificationGenerated(
    data: StakeholderNotificationGeneratedData,
  ): Promise<void> {
    const existing = await this.prisma.escalation.findUnique({
      where: { rentCallId: data.rentCallId },
    });
    if (!existing) {
      this.logger.warn(
        `Escalation for rent call ${data.rentCallId} not found for StakeholderNotificationGenerated — skipping`,
      );
      return;
    }

    await this.prisma.escalation.update({
      where: { rentCallId: data.rentCallId },
      data: {
        tier3SentAt: new Date(data.tier3SentAt),
      },
    });
    this.logger.log(`Projected StakeholderNotificationGenerated for rent call ${data.rentCallId}`);
  }
}
