import {
  Controller,
  Get,
  Param,
  Res,
  ParseUUIDPipe,
  ParseIntPipe,
  NotFoundException,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { TenantFinder } from '../../tenant/finders/tenant.finder.js';
import { UnitFinder } from '../../property/finders/unit.finder.js';
import { ChargeRegularizationFinder } from '../finders/charge-regularization.finder.js';
import { ChargeRegularizationPdfAssembler } from '../services/charge-regularization-pdf-assembler.service.js';
import type { StatementPrimitives } from '@indexation/charge-regularization/regularization-statement';

@Controller('entities/:entityId/charge-regularization')
export class GetChargeRegularizationPdfController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly tenantFinder: TenantFinder,
    private readonly unitFinder: UnitFinder,
    private readonly chargeRegularizationFinder: ChargeRegularizationFinder,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly assembler: ChargeRegularizationPdfAssembler,
  ) {}

  @Get(':fiscalYear/pdf/:leaseId')
  @HttpCode(200)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('fiscalYear', ParseIntPipe) fiscalYear: number,
    @Param('leaseId', ParseUUIDPipe) leaseId: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const regularization =
      await this.chargeRegularizationFinder.findByEntityAndYear(
        entityId,
        fiscalYear,
      );
    if (!regularization) {
      throw new NotFoundException('Charge regularization not found');
    }

    const statements = regularization.statements as unknown as StatementPrimitives[];
    const statement = statements.find((s) => s.leaseId === leaseId);
    if (!statement) {
      throw new NotFoundException('Statement not found for this lease');
    }

    const tenant = await this.tenantFinder.findByIdAndUser(
      statement.tenantId,
      userId,
    );
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const unitWithProperty = await this.unitFinder.findByIdWithProperty(
      statement.unitId,
      userId,
    );

    const pdfData = this.assembler.assembleFromStatement(
      regularization,
      statement,
      entity,
      tenant,
      unitWithProperty?.property ?? null,
    );

    const buffer =
      await this.pdfGenerator.generateChargeRegularizationPdf(pdfData);

    const safeName = sanitizeForFilename(
      tenant.companyName ?? tenant.lastName,
    );
    const filename = `regularisation-charges-${safeName}-${fiscalYear}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
    res.end(buffer);
  }
}
