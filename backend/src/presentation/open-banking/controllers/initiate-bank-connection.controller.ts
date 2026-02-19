import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { BridgeService } from '@infrastructure/open-banking/bridge.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { InitiateBankConnectionDto } from '../dto/initiate-bank-connection.dto.js';

@Controller('entities/:entityId/bank-accounts/:bankAccountId')
export class InitiateBankConnectionController {
  constructor(
    private readonly bridge: BridgeService,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
    @CurrentUser() userId: string,
    @Body() dto: InitiateBankConnectionDto,
  ): Promise<{ link: string; reference: string }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const callbackUrl = `${frontendUrl}/bank-connections/callback?entityId=${entityId}&bankAccountId=${bankAccountId}`;

    const session = await this.bridge.createConnectSession(
      entityId,
      callbackUrl,
      dto.institutionId ? parseInt(dto.institutionId, 10) : undefined,
    );

    return { link: session.url, reference: session.id };
  }
}
