import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';

@Controller('entities/:entityId/charge-categories')
export class DeleteChargeCategoryController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly prisma: PrismaService,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const category = await this.prisma.chargeCategory.findFirst({
      where: { id, entityId },
    });
    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }

    if (category.isStandard) {
      throw new ForbiddenException(
        'Les catégories standard ne peuvent pas être supprimées',
      );
    }

    try {
      await this.prisma.chargeCategory.delete({ where: { id, entityId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        const usageCount = await this.prisma.leaseBillingLine.count({
          where: { chargeCategoryId: id },
        });
        throw new ConflictException(
          `Cette catégorie est utilisée par ${usageCount} ${usageCount > 1 ? 'baux' : 'bail'}`,
        );
      }
      throw error;
    }
  }
}
