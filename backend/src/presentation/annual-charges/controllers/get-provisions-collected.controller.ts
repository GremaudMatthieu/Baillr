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
  label: string;
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

    // Extract provision-type billing lines and aggregate by label
    const detailMap = new Map<string, number>();

    for (const rc of rentCalls) {
      const lines = rc.billingLines as Array<{
        label: string;
        amountCents: number;
        type: string;
      }>;
      if (!Array.isArray(lines)) continue;

      for (const line of lines) {
        if (line.type === 'provision') {
          const current = detailMap.get(line.label) ?? 0;
          detailMap.set(line.label, current + line.amountCents);
        }
      }
    }

    const details: ProvisionDetail[] = Array.from(detailMap.entries()).map(
      ([label, totalCents]) => ({ label, totalCents }),
    );

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
