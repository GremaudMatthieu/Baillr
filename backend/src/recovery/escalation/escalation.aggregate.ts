import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { EscalationInitiated } from './events/escalation-initiated.event.js';
import { ReminderEmailSent } from './events/reminder-email-sent.event.js';
import { FormalNoticeGenerated } from './events/formal-notice-generated.event.js';
import { StakeholderNotificationGenerated } from './events/stakeholder-notification-generated.event.js';

export class EscalationAggregate extends AggregateRoot {
  private rentCallId!: string;
  private entityId!: string;
  private tenantId!: string;
  private initiated = false;
  private tier1SentAt: Date | null = null;
  private tier1RecipientEmail: string | null = null;
  private tier2SentAt: Date | null = null;
  private tier3SentAt: Date | null = null;

  static readonly streamName = 'escalation';

  initiate(rentCallId: string, entityId: string, tenantId: string): void {
    if (this.initiated) {
      return; // no-op guard for replays
    }

    this.apply(
      new EscalationInitiated({
        rentCallId,
        entityId,
        tenantId,
      }),
    );
  }

  @EventHandler(EscalationInitiated)
  onEscalationInitiated(event: EscalationInitiated): void {
    this.rentCallId = event.data.rentCallId;
    this.entityId = event.data.entityId;
    this.tenantId = event.data.tenantId;
    this.initiated = true;
  }

  sendReminderEmail(recipientEmail: string, sentAt: Date): void {
    if (this.tier1SentAt !== null) {
      return; // no-op guard: already sent
    }

    this.apply(
      new ReminderEmailSent({
        rentCallId: this.rentCallId,
        tier1SentAt: sentAt.toISOString(),
        recipientEmail,
      }),
    );
  }

  @EventHandler(ReminderEmailSent)
  onReminderEmailSent(event: ReminderEmailSent): void {
    this.tier1SentAt = new Date(event.data.tier1SentAt);
    this.tier1RecipientEmail = event.data.recipientEmail;
  }

  generateFormalNotice(sentAt: Date): void {
    if (this.tier2SentAt !== null) {
      return; // no-op guard: already generated
    }

    this.apply(
      new FormalNoticeGenerated({
        rentCallId: this.rentCallId,
        tier2SentAt: sentAt.toISOString(),
      }),
    );
  }

  @EventHandler(FormalNoticeGenerated)
  onFormalNoticeGenerated(event: FormalNoticeGenerated): void {
    this.tier2SentAt = new Date(event.data.tier2SentAt);
  }

  generateStakeholderNotifications(sentAt: Date): void {
    if (this.tier3SentAt !== null) {
      return; // no-op guard: already generated
    }

    this.apply(
      new StakeholderNotificationGenerated({
        rentCallId: this.rentCallId,
        tier3SentAt: sentAt.toISOString(),
      }),
    );
  }

  @EventHandler(StakeholderNotificationGenerated)
  onStakeholderNotificationGenerated(event: StakeholderNotificationGenerated): void {
    this.tier3SentAt = new Date(event.data.tier3SentAt);
  }
}
