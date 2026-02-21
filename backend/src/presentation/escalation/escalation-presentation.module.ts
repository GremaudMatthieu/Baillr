import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { RentCallPresentationModule } from '../rent-call/rent-call-presentation.module.js';
import { EscalationAggregate } from '@recovery/escalation/escalation.aggregate';
import { SendAReminderEmailHandler } from '@recovery/escalation/commands/send-a-reminder-email.handler';
import { GenerateAFormalNoticeHandler } from '@recovery/escalation/commands/generate-a-formal-notice.handler';
import { GenerateStakeholderNotificationsHandler } from '@recovery/escalation/commands/generate-stakeholder-notifications.handler';
import { DispatchViaRegisteredMailHandler } from '@recovery/escalation/commands/dispatch-via-registered-mail.handler';
import { UpdateRegisteredMailStatusHandler } from '@recovery/escalation/commands/update-registered-mail-status.handler';
import { SendAReminderEmailController } from './controllers/send-a-reminder-email.controller.js';
import { GenerateAFormalNoticeController } from './controllers/generate-a-formal-notice.controller.js';
import { GenerateStakeholderNotificationsController } from './controllers/generate-stakeholder-notifications.controller.js';
import { GetEscalationStatusController } from './controllers/get-escalation-status.controller.js';
import { GetBatchEscalationStatusController } from './controllers/get-batch-escalation-status.controller.js';
import { SendFormalNoticeViaRegisteredMailController } from './controllers/send-formal-notice-via-registered-mail.controller.js';
import { GetRegisteredMailCostController } from './controllers/get-registered-mail-cost.controller.js';
import { Ar24WebhookController } from './controllers/ar24-webhook.controller.js';
import { GetRegisteredMailStatusController } from './controllers/get-registered-mail-status.controller.js';
import { GetEscalationStatusHandler } from './queries/get-escalation-status.handler.js';
import { GetBatchEscalationStatusHandler } from './queries/get-batch-escalation-status.handler.js';
import { EscalationProjection } from './projections/escalation.projection.js';
import { EscalationFinder } from './finders/escalation.finder.js';
import { FormalNoticePdfAssembler } from './services/formal-notice-pdf-assembler.service.js';
import { StakeholderLetterPdfAssembler } from './services/stakeholder-letter-pdf-assembler.service.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([EscalationAggregate]),
    EntityPresentationModule,
    RentCallPresentationModule,
  ],
  controllers: [
    SendAReminderEmailController,
    GenerateAFormalNoticeController,
    GenerateStakeholderNotificationsController,
    GetEscalationStatusController,
    GetBatchEscalationStatusController,
    SendFormalNoticeViaRegisteredMailController,
    GetRegisteredMailCostController,
    Ar24WebhookController,
    GetRegisteredMailStatusController,
  ],
  providers: [
    SendAReminderEmailHandler,
    GenerateAFormalNoticeHandler,
    GenerateStakeholderNotificationsHandler,
    DispatchViaRegisteredMailHandler,
    UpdateRegisteredMailStatusHandler,
    GetEscalationStatusHandler,
    GetBatchEscalationStatusHandler,
    EscalationProjection,
    EscalationFinder,
    FormalNoticePdfAssembler,
    StakeholderLetterPdfAssembler,
  ],
  exports: [EscalationFinder],
})
export class EscalationPresentationModule {}
