import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PdfGeneratorService } from '@infrastructure/document/pdf-generator.service';
import { Ar24Service } from '@infrastructure/registered-mail/ar24.service';
import { DispatchViaRegisteredMailCommand } from '@recovery/escalation/commands/dispatch-via-registered-mail.command';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../../rent-call/finders/rent-call.finder.js';
import { EscalationFinder } from '../finders/escalation.finder.js';
import { FormalNoticePdfAssembler } from '../services/formal-notice-pdf-assembler.service.js';

@Controller('entities/:entityId/rent-calls/:rentCallId/escalation')
export class SendFormalNoticeViaRegisteredMailController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
    private readonly escalationFinder: EscalationFinder,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly assembler: FormalNoticePdfAssembler,
    private readonly ar24: Ar24Service,
  ) {}

  @Post('formal-notice/registered-mail')
  @HttpCode(202)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @CurrentUser() userId: string,
  ): Promise<{
    trackingId: string;
    status: string;
    costCentsTtc: number;
  }> {
    if (!this.ar24.isAvailable) {
      throw new BadRequestException('Registered mail service is not configured');
    }

    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const rentCall = await this.rentCallFinder.findByIdAndEntity(
      rentCallId,
      entityId,
      userId,
    );
    if (!rentCall) {
      throw new NotFoundException('Rent call not found');
    }

    const escalation = await this.escalationFinder.findByRentCallId(
      rentCallId,
      userId,
    );
    if (!escalation || !escalation.tier2SentAt) {
      throw new BadRequestException(
        'Formal notice must be generated before sending via registered mail',
      );
    }
    if (escalation.registeredMailTrackingId) {
      throw new BadRequestException(
        'Registered mail has already been dispatched for this escalation',
      );
    }

    // Generate PDF
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
      escalation: { tier1SentAt: escalation.tier1SentAt },
    });
    const pdfBuffer = await this.pdfGenerator.generateFormalNoticePdf(pdfData);

    // Upload PDF to AR24
    const { fileId } = await this.ar24.uploadAttachment(
      pdfBuffer,
      `mise-en-demeure-${rentCall.month}.pdf`,
    );

    // Send letter via AR24
    const result = await this.ar24.sendLetter({
      recipientFirstName: rentCall.tenant.firstName ?? '',
      recipientLastName: rentCall.tenant.lastName,
      recipientCompany: rentCall.tenant.companyName ?? undefined,
      recipientEmail: rentCall.tenant.email,
      recipientAddress1: rentCall.tenant.addressStreet ?? '',
      recipientCity: rentCall.tenant.addressCity ?? '',
      recipientPostalCode: rentCall.tenant.addressPostalCode ?? '',
      attachmentIds: [fileId],
      senderFirstName: '',
      senderLastName: entity.name,
      senderCompany: entity.name,
    });

    const cost = this.ar24.getCost();

    // Record dispatch in aggregate
    await this.commandBus.execute(
      new DispatchViaRegisteredMailCommand(
        rentCallId,
        entityId,
        rentCall.tenantId,
        result.trackingNumber,
        'ar24',
        cost.costCentsTtc,
      ),
    );

    return {
      trackingId: result.trackingNumber,
      status: result.status,
      costCentsTtc: cost.costCentsTtc,
    };
  }
}
