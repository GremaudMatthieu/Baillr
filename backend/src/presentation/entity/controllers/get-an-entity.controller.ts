import { Controller, Get, Param, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { OwnershipEntity } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetAnEntityQuery } from '../queries/get-an-entity.query.js';

@Controller('entities')
export class GetAnEntityController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: OwnershipEntity }> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    const entity: OwnershipEntity = await this.queryBus.execute(new GetAnEntityQuery(id, userId));
    return { data: entity };
  }
}
