import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { EscalationInitiated } from './events/escalation-initiated.event.js';
import { ReminderEmailSent } from './events/reminder-email-sent.event.js';
import { FormalNoticeGenerated } from './events/formal-notice-generated.event.js';
import { StakeholderNotificationGenerated } from './events/stakeholder-notification-generated.event.js';
import { RegisteredMailDispatched } from './events/registered-mail-dispatched.event.js';
import { RegisteredMailStatusUpdated } from './events/registered-mail-status-updated.event.js';

export class EscalationAggregate extends AggregateRoot {
  private rentCallId!: string;
  private entityId!: string;
  private tenantId!: string;
  private initiated = false;
  private tier1SentAt: Date | null = null;
  private tier1RecipientEmail: string | null = null;
  private tier2SentAt: Date | null = null;
  private tier3SentAt: Date | null = null;
  private registeredMailTrackingId: string | null = null;
  private registeredMailProvider: string | null = null;
  private registeredMailCostCents: number | null = null;
  private registeredMailDispatchedAt: Date | null = null;
  private registeredMailStatus: string | null = null;
  private registeredMailProofUrl: string | null = null;

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

  dispatchViaRegisteredMail(trackingId: string, provider: string, costCents: number): void {
    if (this.registeredMailTrackingId !== null) {
      return; // no-op guard: already dispatched
    }
    if (this.tier2SentAt === null) {
      throw new Error('Formal notice must be generated before dispatching via registered mail');
    }

    this.apply(
      new RegisteredMailDispatched({
        rentCallId: this.rentCallId,
        trackingId,
        provider,
        costCents,
        dispatchedAt: new Date().toISOString(),
      }),
    );
  }

  @EventHandler(RegisteredMailDispatched)
  onRegisteredMailDispatched(event: RegisteredMailDispatched): void {
    this.registeredMailTrackingId = event.data.trackingId;
    this.registeredMailProvider = event.data.provider;
    this.registeredMailCostCents = event.data.costCents;
    this.registeredMailDispatchedAt = new Date(event.data.dispatchedAt);
    this.registeredMailStatus = 'waiting';
  }

  updateRegisteredMailStatus(status: string, proofUrl: string | null): void {
    if (this.registeredMailTrackingId === null) {
      return; // no-op guard: no registered mail dispatched
    }

    this.apply(
      new RegisteredMailStatusUpdated({
        rentCallId: this.rentCallId,
        status,
        proofUrl,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  @EventHandler(RegisteredMailStatusUpdated)
  onRegisteredMailStatusUpdated(event: RegisteredMailStatusUpdated): void {
    this.registeredMailStatus = event.data.status;
    this.registeredMailProofUrl = event.data.proofUrl;
  }
}
