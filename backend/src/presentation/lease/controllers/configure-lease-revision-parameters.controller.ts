import {
  Controller,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { ConfigureLeaseRevisionParametersDto } from '../dto/configure-lease-revision-parameters.dto.js';
import { ConfigureLeaseRevisionParametersCommand } from '@tenancy/lease/commands/configure-lease-revision-parameters.command';
import { LeaseFinder } from '../finders/lease.finder.js';

@Controller('leases/:id/revision-parameters')
export class ConfigureLeaseRevisionParametersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly leaseFinder: LeaseFinder,
  ) {}

  @Put()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfigureLeaseRevisionParametersDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const lease = await this.leaseFinder.findByIdAndUser(id, userId);
    if (!lease) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new ConfigureLeaseRevisionParametersCommand(
        id,
        dto.revisionDay,
        dto.revisionMonth,
        dto.referenceQuarter,
        dto.referenceYear,
        dto.baseIndexValue ?? null,
      ),
    );
  }
}
