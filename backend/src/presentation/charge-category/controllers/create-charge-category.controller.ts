import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { CreateChargeCategoryDto } from '../dto/create-charge-category.dto.js';
import type { ChargeCategory } from '@prisma/client';

function slugify(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

@Controller('entities/:entityId/charge-categories')
export class CreateChargeCategoryController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: CreateChargeCategoryDto,
    @CurrentUser() userId: string,
  ): Promise<{ data: ChargeCategory }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const slug = slugify(dto.label);
    if (!slug) {
      throw new BadRequestException('Le nom doit contenir des caractères alphanumériques');
    }

    const existing = await this.prisma.chargeCategory.findUnique({
      where: { entityId_slug: { entityId, slug } },
    });
    if (existing) {
      throw new ConflictException('Une catégorie avec ce nom existe déjà');
    }

    const category = await this.prisma.chargeCategory.create({
      data: {
        entityId,
        slug,
        label: dto.label.trim(),
        isStandard: false,
      },
    });

    return { data: category };
  }
}
