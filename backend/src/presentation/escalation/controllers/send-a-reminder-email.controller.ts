import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EmailService } from '@infrastructure/email/email.service';
import { formatMonthLabel } from '@infrastructure/document/format-euro.util';
import { formatTenantDisplayName } from '@infrastructure/shared/format-tenant-name.util';
import {
  renderReminderEmailHtml,
  type ReminderEmailData,
} from '@infrastructure/email/templates/reminder-email.template';
import { SendAReminderEmailCommand } from '@recovery/escalation/commands/send-a-reminder-email.command';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../../rent-call/finders/rent-call.finder.js';

@Controller('entities/:entityId/rent-calls/:rentCallId/escalation')
export class SendAReminderEmailController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
    private readonly emailService: EmailService,
  ) {}

  @Post('reminder')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @CurrentUser() userId: string,
  ): Promise<{ sent: boolean }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const rentCall = await this.rentCallFinder.findByIdAndEntity(rentCallId, entityId, userId);
    if (!rentCall) {
      throw new NotFoundException('Rent call not found');
    }

    const tenantEmail = rentCall.tenant.email;
    if (!tenantEmail) {
      throw new NotFoundException('Tenant has no email address');
    }

    // Dispatch command to record escalation event
    await this.commandBus.execute(
      new SendAReminderEmailCommand(rentCallId, entityId, rentCall.tenantId, tenantEmail),
    );

    // Compute days late
    const [yearStr, monthStr] = rentCall.month.split('-');
    const dueDay = rentCall.lease.monthlyDueDate;
    const dueDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, dueDay);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = today.getTime() - dueDate.getTime();
    const daysLate = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Find default bank account for IBAN/BIC
    const defaultBank = rentCall.entity.bankAccounts.find((ba) => ba.isDefault);

    const emailData: ReminderEmailData = {
      tenantName: formatTenantDisplayName(rentCall.tenant),
      amount: rentCall.remainingBalanceCents ?? rentCall.totalAmountCents,
      daysLate,
      entityName: entity.name,
      entityIban: defaultBank?.iban ?? '',
      entityBic: defaultBank?.bic ?? '',
      period: formatMonthLabel(rentCall.month),
    };

    const html = renderReminderEmailHtml(emailData);

    const escapedEntityName = entity.name.replace(/["\\]/g, '\\$&');
    const from = `"${escapedEntityName}" <${this.emailService.from}>`;

    await this.emailService.sendWithAttachment({
      from,
      to: tenantEmail,
      bcc: entity.email || undefined,
      subject: `Rappel de loyer impayé — ${formatMonthLabel(rentCall.month)}`,
      html,
    });

    return { sent: true };
  }
}
