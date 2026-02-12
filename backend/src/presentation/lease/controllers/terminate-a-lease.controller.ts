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
import { TerminateALeaseDto } from '../dto/terminate-a-lease.dto.js';
import { TerminateALeaseCommand } from '@tenancy/lease/commands/terminate-a-lease.command';
import { LeaseFinder } from '../finders/lease.finder.js';

@Controller('leases/:id/terminate')
export class TerminateALeaseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly leaseFinder: LeaseFinder,
  ) {}

  @Put()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateALeaseDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const lease = await this.leaseFinder.findByIdAndUser(id, userId);
    if (!lease) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(new TerminateALeaseCommand(id, dto.endDate));
  }
}
