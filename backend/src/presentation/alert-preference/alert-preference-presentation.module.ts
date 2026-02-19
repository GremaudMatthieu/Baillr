import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { AlertPreferenceController } from './controllers/alert-preference.controller.js';
import { AlertPreferenceFinder } from './finders/alert-preference.finder.js';
import { AlertLogFinder } from './finders/alert-log.finder.js';
import { AlertLogWriter } from './writers/alert-log.writer.js';
import { GetAlertPreferencesHandler } from './queries/get-alert-preferences.handler.js';
import { UpdateAlertPreferencesHandler } from './commands/update-alert-preferences.handler.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [AlertPreferenceController],
  providers: [
    AlertPreferenceFinder,
    AlertLogFinder,
    AlertLogWriter,
    GetAlertPreferencesHandler,
    UpdateAlertPreferencesHandler,
  ],
  exports: [AlertPreferenceFinder, AlertLogFinder, AlertLogWriter],
})
export class AlertPreferencePresentationModule {}
