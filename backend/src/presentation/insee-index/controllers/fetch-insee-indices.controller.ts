import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { InseeIndexFinder } from '../finders/insee-index.finder.js';
import { InseeApiService } from '@infrastructure/insee/insee-api.service';
import { InseeApiUnavailableException } from '@infrastructure/insee/insee-api-unavailable.exception';
import { RecordAnInseeIndexCommand } from '@indexation/insee-index/commands/record-an-insee-index.command';

interface FetchSummary {
  fetched: number;
  newIndices: number;
  skipped: number;
}

@Controller('entities/:entityId/insee-indices')
export class FetchInseeIndicesController {
  private readonly logger = new Logger(FetchInseeIndicesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly inseeIndexFinder: InseeIndexFinder,
    private readonly inseeApiService: InseeApiService,
  ) {}

  @Post('fetch')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<FetchSummary> {
    const entity = await this.entityFinder.findByIdAndUserId(
      entityId,
      userId,
    );
    if (!entity) {
      throw new UnauthorizedException();
    }

    try {
      const indices = await this.inseeApiService.fetchLatestIndices();
      let newIndices = 0;
      let skipped = 0;

      for (const index of indices) {
        const exists =
          await this.inseeIndexFinder.existsByTypeQuarterYearEntity(
            index.type,
            index.quarter,
            index.year,
            entityId,
          );

        if (exists) {
          skipped++;
          continue;
        }

        await this.commandBus.execute(
          new RecordAnInseeIndexCommand(
            randomUUID(),
            index.type,
            index.quarter,
            index.year,
            index.value,
            entityId,
            userId,
            'auto',
          ),
        );
        newIndices++;
      }

      this.logger.log(
        `Fetched ${indices.length} INSEE indices for entity ${entityId}: ${newIndices} new, ${skipped} skipped`,
      );

      return {
        fetched: indices.length,
        newIndices,
        skipped,
      };
    } catch (error) {
      if (error instanceof InseeApiUnavailableException) {
        throw new HttpException(
          'Le service INSEE est temporairement indisponible. Saisissez les indices manuellement.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error;
    }
  }
}
