import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { ChargeCategoryFinder } from '../finders/charge-category.finder.js';
import { ChargeCategorySeeder } from '../charge-category-seeder.js';
import type { ChargeCategory } from '@prisma/client';

@Controller('entities/:entityId/charge-categories')
export class GetChargeCategoriesController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly finder: ChargeCategoryFinder,
    private readonly seeder: ChargeCategorySeeder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: ChargeCategory[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    // Ensure standard categories exist on first access
    await this.seeder.ensureStandardCategories(entityId);

    const categories = await this.finder.findByEntityId(entityId);
    return { data: categories };
  }
}
