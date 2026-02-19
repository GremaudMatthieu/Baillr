import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createClerkClient } from '@clerk/backend';
import { EmailService } from '../email/email.service.js';
import {
  renderAlertEmailHtml,
} from '../email/templates/alert-email.template.js';
import { AlertDetectionService, type DetectedAlert } from './alert-detection.service.js';
import { AlertPreferenceFinder } from '../../presentation/alert-preference/finders/alert-preference.finder.js';
import { AlertLogFinder } from '../../presentation/alert-preference/finders/alert-log.finder.js';
import { AlertLogWriter } from '../../presentation/alert-preference/writers/alert-log.writer.js';
import { EntityFinder } from '../../presentation/entity/finders/entity.finder.js';
import { AlertType } from '../../presentation/alert-preference/alert-type.enum.js';

@Injectable()
export class SendAlertsService {
  private readonly logger = new Logger(SendAlertsService.name);
  private readonly appUrl: string;
  private readonly clerkClient;

  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly emailService: EmailService,
    private readonly alertDetectionService: AlertDetectionService,
    private readonly alertPreferenceFinder: AlertPreferenceFinder,
    private readonly alertLogFinder: AlertLogFinder,
    private readonly alertLogWriter: AlertLogWriter,
  ) {
    this.appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    this.clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY ?? '',
    });
  }

  @Cron('0 8 * * *')
  async handleCron(): Promise<void> {
    this.logger.log('Starting daily alert detection...');

    try {
      const entities = await this.entityFinder.findAll();

      for (const entity of entities) {
        await this.processEntityAlerts(entity.id, entity.userId, entity.name, entity.email);
      }

      this.logger.log(`Daily alert detection complete. Processed ${entities.length} entities.`);
    } catch (error) {
      this.logger.error('Alert detection failed', error);
    }
  }

  async processEntityAlerts(
    entityId: string,
    userId: string,
    entityName: string,
    entityEmail: string,
  ): Promise<{ sent: boolean; alertCount: number }> {
    // 1. Check preferences — filter by enabled alert types
    const preferences =
      await this.alertPreferenceFinder.findAllByEntityAndUser(entityId, userId);
    const enabledTypes = new Set<string>();

    // Default: all enabled if no preferences saved
    if (preferences.length === 0) {
      for (const type of Object.values(AlertType)) {
        enabledTypes.add(type);
      }
    } else {
      for (const pref of preferences) {
        if (pref.enabled) enabledTypes.add(pref.alertType);
      }
    }

    if (enabledTypes.size === 0) {
      return { sent: false, alertCount: 0 };
    }

    // 2. Detect alerts per enabled type
    const unpaidAlerts = enabledTypes.has(AlertType.UNPAID_RENT)
      ? await this.alertDetectionService.detectUnpaidAlerts(entityId, userId, this.appUrl)
      : [];
    const insuranceAlerts = enabledTypes.has(AlertType.INSURANCE_EXPIRING)
      ? await this.alertDetectionService.detectInsuranceAlerts(entityId, userId, this.appUrl)
      : [];
    const escalationAlerts = enabledTypes.has(AlertType.ESCALATION_THRESHOLD)
      ? await this.alertDetectionService.detectEscalationAlerts(entityId, userId, this.appUrl)
      : [];

    // 3. Filter already-sent alerts (idempotency) — batch query per type
    const filterAlreadySent = async (
      alerts: DetectedAlert[],
      alertType: string,
    ): Promise<DetectedAlert[]> => {
      if (alerts.length === 0) return [];
      const sentIds = await this.alertLogFinder.findSentReferenceIds(
        entityId,
        userId,
        alertType,
        alerts.map((a) => a.referenceId),
      );
      return alerts.filter((a) => !sentIds.has(a.referenceId));
    };

    const newUnpaid = await filterAlreadySent(unpaidAlerts, AlertType.UNPAID_RENT);
    const newInsurance = await filterAlreadySent(insuranceAlerts, AlertType.INSURANCE_EXPIRING);
    const newEscalation = await filterAlreadySent(escalationAlerts, AlertType.ESCALATION_THRESHOLD);

    const totalAlerts = newUnpaid.length + newInsurance.length + newEscalation.length;
    if (totalAlerts === 0) {
      return { sent: false, alertCount: 0 };
    }

    // 4. Resolve recipient email from Clerk
    const recipientEmail = await this.resolveUserEmail(userId);
    if (!recipientEmail) {
      this.logger.warn(
        `No email found for user ${userId}, skipping alerts for entity "${entityName}" (${entityId})`,
      );
      return { sent: false, alertCount: 0 };
    }

    // 5. Render digest email
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const html = renderAlertEmailHtml({
      entityName,
      date: dateStr,
      appUrl: this.appUrl,
      unpaidAlerts: newUnpaid.map((a) => a.alertItem),
      insuranceAlerts: newInsurance.map((a) => a.alertItem),
      escalationAlerts: newEscalation.map((a) => a.alertItem),
    });

    // 6. Send email
    const escapedName = entityName.replace(/[\\\"]/g, '\\$&');
    const from = `"${escapedName}" <${this.emailService.from}>`;
    const subject = `Baillr — Alertes pour ${entityName} — ${dateStr}`;

    // BCC entity email only if it's different from recipient (audit trail)
    const bcc =
      entityEmail && entityEmail !== recipientEmail ? entityEmail : undefined;

    await this.emailService.sendWithAttachment({
      to: recipientEmail,
      from,
      bcc,
      subject,
      html,
    });

    // 7. Log all sent alerts for idempotency (batch write)
    const allAlertLogs = [
      ...newUnpaid.map((a) => ({ entityId, userId, alertType: AlertType.UNPAID_RENT, referenceId: a.referenceId })),
      ...newInsurance.map((a) => ({ entityId, userId, alertType: AlertType.INSURANCE_EXPIRING, referenceId: a.referenceId })),
      ...newEscalation.map((a) => ({ entityId, userId, alertType: AlertType.ESCALATION_THRESHOLD, referenceId: a.referenceId })),
    ];

    await this.alertLogWriter.createMany(allAlertLogs);

    this.logger.log(
      `Sent ${totalAlerts} alert(s) for entity "${entityName}" (${entityId})`,
    );

    return { sent: true, alertCount: totalAlerts };
  }

  private async resolveUserEmail(userId: string): Promise<string | null> {
    try {
      const user = await this.clerkClient.users.getUser(userId);
      const primary = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId,
      );
      return primary?.emailAddress ?? null;
    } catch (error) {
      this.logger.warn(`Failed to resolve email for user ${userId}`, error);
      return null;
    }
  }
}
