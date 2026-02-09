import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { OwnershipEntity } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetEntitiesQuery } from '../queries/get-entities.query.js';

@Controller('entities')
export class GetEntitiesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(@CurrentUser() userId: string): Promise<{ data: OwnershipEntity[] }> {
    const entities: OwnershipEntity[] = await this.queryBus.execute(new GetEntitiesQuery(userId));
    return { data: entities };
  }
}
