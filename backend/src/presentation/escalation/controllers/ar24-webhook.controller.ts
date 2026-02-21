import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { Public } from '@infrastructure/auth/public.decorator';
import { UpdateRegisteredMailStatusCommand } from '@recovery/escalation/commands/update-registered-mail-status.command';
import { EscalationFinder } from '../finders/escalation.finder.js';
import { Ar24WebhookDto } from '../dto/ar24-webhook.dto.js';

const AR24_WEBHOOK_IPS = ['185.183.140.195'];

@Controller('webhooks')
export class Ar24WebhookController {
  private readonly logger = new Logger(Ar24WebhookController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly escalationFinder: EscalationFinder,
  ) {}

  @Public()
  @Post('ar24')
  @HttpCode(200)
  async handle(
    @Body() payload: Ar24WebhookDto,
    @Req() req: Request,
  ): Promise<{ received: true }> {
    // IP whitelisting — enforced in all environments except test
    if (process.env.NODE_ENV !== 'test') {
      const clientIp = req.ip ?? req.socket.remoteAddress ?? '';
      const normalizedIp = clientIp.replace('::ffff:', '');
      if (!AR24_WEBHOOK_IPS.includes(normalizedIp)) {
        this.logger.warn(
          `AR24 webhook rejected: unauthorized IP ${normalizedIp}`,
        );
        throw new ForbiddenException('Unauthorized IP');
      }
    }

    this.logger.log(
      `AR24 webhook received: mail=${payload.id_mail}, state=${payload.new_state}`,
    );

    // Find escalation by tracking ID
    const escalation =
      await this.escalationFinder.findByRegisteredMailTrackingId(
        payload.id_mail,
      );
    if (!escalation) {
      this.logger.warn(
        `AR24 webhook: no escalation found for mail ID ${payload.id_mail}`,
      );
      return { received: true };
    }

    await this.commandBus.execute(
      new UpdateRegisteredMailStatusCommand(
        escalation.rentCallId,
        payload.new_state,
        payload.proof_url ?? null,
      ),
    );

    return { received: true };
  }
}
