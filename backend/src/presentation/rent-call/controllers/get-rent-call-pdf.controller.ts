import {
  Controller,
  Get,
  Param,
  Res,
  ParseUUIDPipe,
  NotFoundException,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util';
import { getTenantLastName } from '@infrastructure/shared/format-tenant-name.util';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../finders/rent-call.finder.js';
import { RentCallPdfAssembler } from '../services/rent-call-pdf-assembler.service.js';

@Controller('entities/:entityId/rent-calls')
export class GetRentCallPdfController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly assembler: RentCallPdfAssembler,
  ) {}

  @Get(':rentCallId/pdf')
  @HttpCode(200)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @CurrentUser() userId: string,
    // @Res() bypasses NestJS JSON serialization — required for binary PDF response
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

    const pdfData = this.assembler.assembleFromRentCall(
      rentCall,
      rentCall.tenant,
      rentCall.unit,
      rentCall.lease,
      rentCall.entity,
      rentCall.entity.bankAccounts,
    );

    const buffer = await this.pdfGenerator.generateRentCallPdf(pdfData);

    const safeName = sanitizeForFilename(getTenantLastName(rentCall.tenant));
    const filename = `appel-loyer-${safeName}-${rentCall.month}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
