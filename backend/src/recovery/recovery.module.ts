import { Module } from '@nestjs/common';
import { EscalationDomainModule } from './escalation/escalation.module.js';

@Module({
  imports: [EscalationDomainModule],
  exports: [EscalationDomainModule],
})
export class RecoveryModule {}
