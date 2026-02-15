import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { ApplyChargeRegularizationCommand } from '@indexation/charge-regularization/commands/apply-charge-regularization.command.js';

@Controller('entities/:entityId/charge-regularizations/:fiscalYear/apply')
export class ApplyChargeRegularizationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('fiscalYear', ParseIntPipe) fiscalYear: number,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const id = `${entityId}-${fiscalYear}`;

    await this.commandBus.execute(
      new ApplyChargeRegularizationCommand(
        id,
        entityId,
        userId,
        fiscalYear,
      ),
    );
  }
}
