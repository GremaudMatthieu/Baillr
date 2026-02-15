import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { CalculateChargeRegularizationDto } from '../dto/calculate-charge-regularization.dto.js';
import { RegularizationCalculationService } from '../services/regularization-calculation.service.js';
import { CalculateChargeRegularizationCommand } from '@indexation/charge-regularization/commands/calculate-charge-regularization.command';

@Controller('entities/:entityId/charge-regularization')
export class CalculateChargeRegularizationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly calculationService: RegularizationCalculationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: CalculateChargeRegularizationDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const statements = await this.calculationService.calculate(
      entityId,
      userId,
      dto.fiscalYear,
    );

    await this.commandBus.execute(
      new CalculateChargeRegularizationCommand(
        dto.id,
        entityId,
        userId,
        dto.fiscalYear,
        statements,
      ),
    );
  }
}
