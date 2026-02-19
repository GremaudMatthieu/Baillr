import { Module } from '@nestjs/common';
import { AlertDetectionService } from './alert-detection.service.js';
import { SendAlertsService } from './send-alerts.service.js';
import { AlertPreferencePresentationModule } from '../../presentation/alert-preference/alert-preference-presentation.module.js';
import { EntityPresentationModule } from '../../presentation/entity/entity-presentation.module.js';
import { RentCallPresentationModule } from '../../presentation/rent-call/rent-call-presentation.module.js';
import { TenantPresentationModule } from '../../presentation/tenant/tenant-presentation.module.js';
import { EscalationPresentationModule } from '../../presentation/escalation/escalation-presentation.module.js';

@Module({
  imports: [
    AlertPreferencePresentationModule,
    EntityPresentationModule,
    RentCallPresentationModule,
    TenantPresentationModule,
    EscalationPresentationModule,
  ],
  providers: [AlertDetectionService, SendAlertsService],
  exports: [AlertDetectionService, SendAlertsService],
})
export class SchedulingModule {}
