import {
  Controller,
  Get,
  Param,
  Res,
  ParseUUIDPipe,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { sanitizeForFilename } from '@infrastructure/shared/sanitize-filename.util';
import { getTenantLastName } from '@infrastructure/shared/format-tenant-name.util';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { TenantFinder } from '../../tenant/finders/tenant.finder.js';
import { LeaseFinder } from '../../lease/finders/lease.finder.js';
import { RevisionFinder } from '../finders/revision.finder.js';
import { RevisionLetterPdfAssembler } from '../services/revision-letter-pdf-assembler.service.js';

@Controller('entities/:entityId/revisions')
export class DownloadRevisionLetterController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly tenantFinder: TenantFinder,
    private readonly leaseFinder: LeaseFinder,
    private readonly revisionFinder: RevisionFinder,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly assembler: RevisionLetterPdfAssembler,
  ) {}

  @Get(':revisionId/letter')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const revision = await this.revisionFinder.findByIdAndEntity(revisionId, entityId);
    if (!revision || revision.status !== 'approved') {
      throw new NotFoundException('Revision not found or not approved');
    }

    const tenant = await this.tenantFinder.findByIdAndUser(revision.tenantId, userId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const lease = await this.leaseFinder.findByIdAndUser(revision.leaseId, userId);
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    const pdfData = this.assembler.assemble(revision, entity, tenant, lease);
    const buffer = await this.pdfGenerator.generateRevisionLetterPdf(pdfData);

    const safeName = sanitizeForFilename(getTenantLastName(tenant));
    const filename = `lettre-revision-${safeName}-${revision.newIndexYear}-${revision.newIndexQuarter}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
    res.end(buffer);
  }
}
