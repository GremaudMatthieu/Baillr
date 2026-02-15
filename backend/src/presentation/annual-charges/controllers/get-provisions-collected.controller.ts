import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { PrismaService } from '@infrastructure/database/prisma.service.js';

interface ProvisionDetail {
  chargeCategoryId: string | null;
  categoryLabel: string;
  totalCents: number;
}

interface ProvisionsResponse {
  totalProvisionsCents: number;
  details: ProvisionDetail[];
}

@Controller('entities/:entityId/provisions')
export class GetProvisionsCollectedController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fiscalYear') fiscalYearStr: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: ProvisionsResponse }> {
    if (!fiscalYearStr) {
      throw new BadRequestException('fiscalYear query parameter is required');
    }

    const fiscalYear = parseInt(fiscalYearStr, 10);
    if (isNaN(fiscalYear)) {
      throw new BadRequestException('fiscalYear must be a valid integer');
    }

    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    // Query paid rent calls for this entity and fiscal year
    const rentCalls = await this.prisma.rentCall.findMany({
      where: {
        entityId,
        month: { startsWith: `${fiscalYear}-` },
        paidAt: { not: null },
      },
      select: {
        billingLines: true,
      },
    });

    // Aggregate billing lines by chargeCategoryId
    const detailMap = new Map<string, { chargeCategoryId: string | null; categoryLabel: string; totalCents: number }>();

    for (const rc of rentCalls) {
      const lines = rc.billingLines as Array<{
        chargeCategoryId?: string | null;
        categoryLabel?: string;
        amountCents: number;
        // Legacy fields for backward compatibility
        label?: string;
        type?: string;
        category?: string | null;
      }>;
      if (!Array.isArray(lines)) continue;

      for (const line of lines) {
        // New format: { chargeCategoryId, categoryLabel, amountCents }
        if (line.chargeCategoryId) {
          const key = `cat:${line.chargeCategoryId}`;
          const existing = detailMap.get(key);
          if (existing) {
            existing.totalCents += line.amountCents;
          } else {
            detailMap.set(key, {
              chargeCategoryId: line.chargeCategoryId,
              categoryLabel: line.categoryLabel ?? 'Inconnu',
              totalCents: line.amountCents,
            });
          }
        } else if (line.type === 'provision') {
          // Legacy format: { label, amountCents, type, category }
          const category = line.category ?? null;
          const key = category !== null ? `legacy-cat:${category}` : `legacy-label:${line.label}`;
          const existing = detailMap.get(key);
          if (existing) {
            existing.totalCents += line.amountCents;
          } else {
            detailMap.set(key, {
              chargeCategoryId: null,
              categoryLabel: line.label ?? 'Inconnu',
              totalCents: line.amountCents,
            });
          }
        }
        // Legacy "option" type lines are skipped (no charge category, no provision)
      }
    }

    const details: ProvisionDetail[] = Array.from(detailMap.values());

    const totalProvisionsCents = details.reduce(
      (sum, d) => sum + d.totalCents,
      0,
    );

    return {
      data: {
        totalProvisionsCents,
        details,
      },
    };
  }
}
