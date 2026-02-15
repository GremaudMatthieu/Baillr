import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { ChargeRegularizationAggregate } from '../charge-regularization.aggregate.js';
import {
  SendChargeRegularizationCommand,
  type SendResult,
} from './send-charge-regularization.command.js';
import type { StatementPrimitives } from '../regularization-statement.js';
import { ChargeRegularizationPdfAssembler } from '../../../presentation/charge-regularization/services/charge-regularization-pdf-assembler.service.js';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { EmailService } from '@infrastructure/email/email.service';
import { renderChargeRegularizationEmailHtml } from '@infrastructure/email/templates/charge-regularization-email.template';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util';
import { ChargeRegularizationFinder } from '../../../presentation/charge-regularization/finders/charge-regularization.finder.js';
import { EntityFinder } from '../../../presentation/entity/finders/entity.finder.js';
import { TenantFinder } from '../../../presentation/tenant/finders/tenant.finder.js';
import { UnitFinder } from '../../../presentation/property/finders/unit.finder.js';

@CommandHandler(SendChargeRegularizationCommand)
export class SendChargeRegularizationHandler
  implements ICommandHandler<SendChargeRegularizationCommand, SendResult>
{
  private readonly logger = new Logger(SendChargeRegularizationHandler.name);

  constructor(
    private readonly assembler: ChargeRegularizationPdfAssembler,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly emailService: EmailService,
    private readonly chargeRegularizationFinder: ChargeRegularizationFinder,
    private readonly entityFinder: EntityFinder,
    private readonly tenantFinder: TenantFinder,
    private readonly unitFinder: UnitFinder,
    @InjectAggregateRepository(ChargeRegularizationAggregate)
    private readonly repository: AggregateRepository<ChargeRegularizationAggregate>,
  ) {}

  async execute(command: SendChargeRegularizationCommand): Promise<SendResult> {
    const { chargeRegularizationId, entityId, userId, fiscalYear } = command;

    const regularization =
      await this.chargeRegularizationFinder.findByEntityAndYear(
        entityId,
        fiscalYear,
      );

    if (!regularization) {
      return { sent: 0, failed: 0, failures: [] };
    }

    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      return { sent: 0, failed: 0, failures: [] };
    }

    const statements =
      regularization.statements as unknown as StatementPrimitives[];

    if (statements.length === 0) {
      return { sent: 0, failed: 0, failures: [] };
    }

    this.logger.log(
      `Starting batch send: ${statements.length} regularization statements for entity ${entityId}, fiscal year ${fiscalYear}`,
    );

    let sent = 0;
    let failed = 0;
    const failures: string[] = [];
    const fromAddress = this.emailService.from;

    for (const statement of statements) {
      const tenant = await this.tenantFinder.findByIdAndUser(
        statement.tenantId,
        userId,
      );

      if (!tenant) {
        failed++;
        failures.push(`${statement.tenantName} (locataire introuvable)`);
        continue;
      }

      if (!tenant.email || tenant.email.trim() === '') {
        failed++;
        failures.push(`${statement.tenantName} (email manquant)`);
        continue;
      }

      try {
        // Fetch unit+property for PDF
        const unitWithProperty = await this.unitFinder.findByIdWithProperty(
          statement.unitId,
          userId,
        );

        // Generate PDF
        const pdfData = this.assembler.assembleFromStatement(
          regularization,
          statement,
          entity,
          tenant,
          unitWithProperty?.property ?? null,
        );
        const buffer =
          await this.pdfGenerator.generateChargeRegularizationPdf(pdfData);

        // Build email HTML
        const emailHtml = renderChargeRegularizationEmailHtml({
          entityName: entity.name,
          tenantName: statement.tenantName,
          fiscalYear,
          totalShareCents: statement.totalShareCents,
          totalProvisionsPaidCents: statement.totalProvisionsPaidCents,
          balanceCents: statement.balanceCents,
        });

        // Build filename
        const safeName = sanitizeForFilename(
          tenant.companyName ?? tenant.lastName,
        );
        const filename = `regularisation-charges-${safeName}-${fiscalYear}.pdf`;

        // Send email with BCC to entity owner
        const entityEmail = entity.email?.trim() || null;
        const safeEntityName = entity.name
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"');

        await this.emailService.sendWithAttachment({
          to: tenant.email,
          bcc: entityEmail ?? undefined,
          subject: `Décompte de régularisation des charges — ${fiscalYear}`,
          html: emailHtml,
          attachments: [{ filename, content: buffer }],
          from: `"${safeEntityName}" <${fromAddress}>`,
        });

        sent++;
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed to send regularization to ${tenant.email}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        failures.push(`${statement.tenantName} (erreur d'envoi)`);
      }
    }

    // Mark aggregate as sent
    if (sent > 0) {
      const aggregate = await this.repository.load(chargeRegularizationId);
      aggregate.markAsSent(entityId, userId, fiscalYear, sent);
      await this.repository.save(aggregate);
    }

    this.logger.log(
      `Batch send complete: ${sent} sent, ${failed} failed`,
    );

    return { sent, failed, failures };
  }
}
