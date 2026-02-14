import {
  Controller,
  Get,
  Param,
  Res,
  ParseUUIDPipe,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util';
import { getTenantLastName } from '@infrastructure/shared/format-tenant-name.util';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../finders/rent-call.finder.js';
import { PaymentFinder } from '../finders/payment.finder.js';
import { ReceiptPdfAssembler } from '../services/receipt-pdf-assembler.service.js';

@Controller('entities/:entityId/rent-calls')
export class GetReceiptPdfController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
    private readonly paymentFinder: PaymentFinder,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly assembler: ReceiptPdfAssembler,
  ) {}

  @Get(':rentCallId/receipt')
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

    if (!rentCall.paymentStatus) {
      throw new BadRequestException('Aucun paiement enregistré pour cet appel de loyer');
    }

    const payments = await this.paymentFinder.findByRentCallId(rentCallId, entityId);

    const pdfData = this.assembler.assembleFromRentCall(
      rentCall,
      rentCall.tenant,
      rentCall.unit,
      rentCall.lease,
      rentCall.entity,
      rentCall.entity.bankAccounts,
      payments,
    );

    const buffer = await this.pdfGenerator.generateReceiptPdf(pdfData);

    const safeName = sanitizeForFilename(getTenantLastName(rentCall.tenant));
    const filenamePrefix =
      rentCall.paymentStatus === 'paid' || rentCall.paymentStatus === 'overpaid'
        ? 'quittance'
        : 'recu-paiement';
    const filename = `${filenamePrefix}-${safeName}-${rentCall.month}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
