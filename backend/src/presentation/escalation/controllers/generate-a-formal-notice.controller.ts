import {
  Controller,
  Post,
  Param,
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
import { GenerateAFormalNoticeCommand } from '@recovery/escalation/commands/generate-a-formal-notice.command';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../../rent-call/finders/rent-call.finder.js';
import { EscalationFinder } from '../finders/escalation.finder.js';
import { FormalNoticePdfAssembler } from '../services/formal-notice-pdf-assembler.service.js';

@Controller('entities/:entityId/rent-calls/:rentCallId/escalation')
export class GenerateAFormalNoticeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
    private readonly escalationFinder: EscalationFinder,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly assembler: FormalNoticePdfAssembler,
  ) {}

  @Post('formal-notice')
  @HttpCode(200)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
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

    // Dispatch command to record escalation event
    await this.commandBus.execute(
      new GenerateAFormalNoticeCommand(rentCallId, entityId, rentCall.tenantId),
    );

    // Load escalation status for assembler (tier1 date if any)
    const escalation = await this.escalationFinder.findByRentCallId(rentCallId, userId);

    const pdfData = this.assembler.assemble({
      rentCall: {
        month: rentCall.month,
        totalAmountCents: rentCall.totalAmountCents,
        remainingBalanceCents: rentCall.remainingBalanceCents,
      },
      tenant: rentCall.tenant,
      unit: rentCall.unit,
      lease: rentCall.lease,
      entity: rentCall.entity,
      escalation: escalation ? { tier1SentAt: escalation.tier1SentAt } : null,
    });

    const buffer = await this.pdfGenerator.generateFormalNoticePdf(pdfData);

    const safeName = sanitizeForFilename(getTenantLastName(rentCall.tenant));
    const filename = `mise-en-demeure-${safeName}-${rentCall.month}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
