import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { AlertPreference } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { UpdateAlertPreferencesCommand } from './update-alert-preferences.command.js';
import { AlertPreferenceFinder } from '../finders/alert-preference.finder.js';

@CommandHandler(UpdateAlertPreferencesCommand)
export class UpdateAlertPreferencesHandler
  implements ICommandHandler<UpdateAlertPreferencesCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertPreferenceFinder: AlertPreferenceFinder,
  ) {}

  async execute(
    command: UpdateAlertPreferencesCommand,
  ): Promise<AlertPreference[]> {
    for (const pref of command.preferences) {
      await this.prisma.alertPreference.upsert({
        where: {
          entityId_userId_alertType: {
            entityId: command.entityId,
            userId: command.userId,
            alertType: pref.alertType,
          },
        },
        update: { enabled: pref.enabled },
        create: {
          entityId: command.entityId,
          userId: command.userId,
          alertType: pref.alertType,
          enabled: pref.enabled,
        },
      });
    }

    return this.alertPreferenceFinder.findAllByEntityAndUser(
      command.entityId,
      command.userId,
    );
  }
}
