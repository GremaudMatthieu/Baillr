import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { RentCallPresentationModule } from '../rent-call/rent-call-presentation.module.js';
import { EscalationAggregate } from '@recovery/escalation/escalation.aggregate';
import { SendAReminderEmailHandler } from '@recovery/escalation/commands/send-a-reminder-email.handler';
import { GenerateAFormalNoticeHandler } from '@recovery/escalation/commands/generate-a-formal-notice.handler';
import { GenerateStakeholderNotificationsHandler } from '@recovery/escalation/commands/generate-stakeholder-notifications.handler';
import { SendAReminderEmailController } from './controllers/send-a-reminder-email.controller.js';
import { GenerateAFormalNoticeController } from './controllers/generate-a-formal-notice.controller.js';
import { GenerateStakeholderNotificationsController } from './controllers/generate-stakeholder-notifications.controller.js';
import { GetEscalationStatusController } from './controllers/get-escalation-status.controller.js';
import { GetBatchEscalationStatusController } from './controllers/get-batch-escalation-status.controller.js';
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
  ],
  providers: [
    SendAReminderEmailHandler,
    GenerateAFormalNoticeHandler,
    GenerateStakeholderNotificationsHandler,
    EscalationProjection,
    EscalationFinder,
    FormalNoticePdfAssembler,
    StakeholderLetterPdfAssembler,
  ],
  exports: [EscalationFinder],
})
export class EscalationPresentationModule {}
