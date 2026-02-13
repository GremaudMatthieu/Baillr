import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { RentCallAggregate } from '../rent-call.aggregate.js';
import {
  SendRentCallsByEmailCommand,
  SendResult,
} from './send-rent-calls-by-email.command.js';
// NB: PdfAssembler injected via NestJS DI — presentation→handler coupling acceptable for DI
import { RentCallPdfAssembler } from '../../../presentation/rent-call/services/rent-call-pdf-assembler.service.js';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { EmailService } from '@infrastructure/email/email.service';
import { renderRentCallEmailHtml } from '@infrastructure/email/templates/rent-call-email.template';
import { formatMonthLabel } from '@infrastructure/document/format-euro.util';
import { formatTenantDisplayName, getTenantLastName } from '@infrastructure/shared/format-tenant-name.util';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util';

@CommandHandler(SendRentCallsByEmailCommand)
export class SendRentCallsByEmailHandler implements ICommandHandler<
  SendRentCallsByEmailCommand,
  SendResult
> {
  private readonly logger = new Logger(SendRentCallsByEmailHandler.name);

  constructor(
    private readonly assembler: RentCallPdfAssembler,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly emailService: EmailService,
    @InjectAggregateRepository(RentCallAggregate)
    private readonly repository: AggregateRepository<RentCallAggregate>,
  ) {}

  async execute(command: SendRentCallsByEmailCommand): Promise<SendResult> {
    const { unsentRentCalls } = command;

    if (unsentRentCalls.length === 0) {
      return { sent: 0, failed: 0, totalAmountCents: 0, failures: [] };
    }

    this.logger.log(
      `Starting batch send: ${unsentRentCalls.length} rent calls for entity ${command.entityId}, month ${command.month}`,
    );

    let sent = 0;
    let failed = 0;
    let totalAmountCents = 0;
    const failures: string[] = [];
    const fromAddress = this.emailService.from;

    for (const rentCall of unsentRentCalls) {
      const tenantName = formatTenantDisplayName(rentCall.tenant);
      const tenantEmail = rentCall.tenant.email;

      // Check tenant has email
      if (!tenantEmail || tenantEmail.trim() === '') {
        failed++;
        failures.push(`${tenantName} (email manquant)`);
        continue;
      }

      try {
        // Generate PDF
        const pdfData = this.assembler.assembleFromRentCall(
          rentCall,
          rentCall.tenant,
          rentCall.unit,
          rentCall.lease,
          rentCall.entity,
          rentCall.entity.bankAccounts,
        );
        const pdfBuffer = await this.pdfGenerator.generateRentCallPdf(pdfData);

        // Build email HTML
        const billingPeriod = formatMonthLabel(rentCall.month);
        const emailHtml = renderRentCallEmailHtml({
          entityName: rentCall.entity.name,
          billingPeriod,
          totalAmountCents: rentCall.totalAmountCents,
          dueDate: rentCall.lease.monthlyDueDate,
        });

        // Build filename
        const safeName = sanitizeForFilename(getTenantLastName(rentCall.tenant));
        const filename = `appel-loyer-${safeName}-${rentCall.month}.pdf`;

        // Send email with BCC to entity owner
        // RFC 5322: quote display name and escape inner quotes
        const entityEmail = rentCall.entity.email;
        const safeEntityName = rentCall.entity.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        await this.emailService.sendWithAttachment({
          to: tenantEmail,
          bcc: entityEmail || undefined,
          subject: `Avis d'échéance — ${billingPeriod}`,
          html: emailHtml,
          attachments: [{ filename, content: pdfBuffer }],
          from: `"${safeEntityName}" <${fromAddress}>`,
        });

        // Mark aggregate as sent
        await this.markAsSent(rentCall.id, tenantEmail);

        sent++;
        totalAmountCents += rentCall.totalAmountCents;
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed to send rent call ${rentCall.id} to ${tenantEmail}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        failures.push(`${tenantName} (erreur d'envoi)`);
      }
    }

    this.logger.log(
      `Batch send complete: ${sent} sent, ${failed} failed, total ${totalAmountCents} cents`,
    );

    return { sent, failed, totalAmountCents, failures };
  }

  private async markAsSent(rentCallId: string, recipientEmail: string): Promise<void> {
    const aggregate = await this.repository.load(rentCallId);
    aggregate.markAsSent(new Date(), recipientEmail);
    await this.repository.save(aggregate);
  }
}
