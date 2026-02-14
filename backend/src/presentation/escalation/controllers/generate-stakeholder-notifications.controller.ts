import {
  Controller,
  Post,
  Param,
  Body,
  Res,
  ParseUUIDPipe,
  UnauthorizedException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util';
import { getTenantLastName } from '@infrastructure/shared/format-tenant-name.util';
import { GenerateStakeholderNotificationsCommand } from '@recovery/escalation/commands/generate-stakeholder-notifications.command';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../../rent-call/finders/rent-call.finder.js';
import { EscalationFinder } from '../finders/escalation.finder.js';
import { StakeholderLetterPdfAssembler } from '../services/stakeholder-letter-pdf-assembler.service.js';
import { StakeholderNotificationDto } from '../dto/stakeholder-notification.dto.js';

const RECIPIENT_LABELS: Record<string, string> = {
  insurance: 'assureur',
  lawyer: 'avocat',
  guarantor: 'garant',
};

@Controller('entities/:entityId/rent-calls/:rentCallId/escalation')
export class GenerateStakeholderNotificationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
    private readonly escalationFinder: EscalationFinder,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly assembler: StakeholderLetterPdfAssembler,
  ) {}

  @Post('stakeholder-notifications')
  @HttpCode(200)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @Body() dto: StakeholderNotificationDto,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const rentCall = await this.rentCallFinder.findByIdAndEntity(rentCallId, entityId, userId);
    if (!rentCall) {
      throw new NotFoundException('Rent call not found');
    }

    // Dispatch command to record escalation event (idempotent)
    await this.commandBus.execute(
      new GenerateStakeholderNotificationsCommand(rentCallId, entityId, rentCall.tenantId),
    );

    // Load escalation status for assembler
    const escalation = await this.escalationFinder.findByRentCallId(rentCallId, userId);

    const pdfData = this.assembler.assemble({
      recipientType: dto.recipientType,
      rentCall: {
        month: rentCall.month,
        totalAmountCents: rentCall.totalAmountCents,
        remainingBalanceCents: rentCall.remainingBalanceCents,
      },
      tenant: rentCall.tenant,
      unit: rentCall.unit,
      lease: rentCall.lease,
      entity: rentCall.entity,
      escalation: escalation
        ? { tier1SentAt: escalation.tier1SentAt, tier2SentAt: escalation.tier2SentAt }
        : null,
    });

    const buffer = await this.pdfGenerator.generateStakeholderLetterPdf(pdfData);

    const safeName = sanitizeForFilename(getTenantLastName(rentCall.tenant));
    const recipientLabel = RECIPIENT_LABELS[dto.recipientType] ?? dto.recipientType;
    const filename = `signalement-${recipientLabel}-${safeName}-${rentCall.month}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
