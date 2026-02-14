import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { EscalationAggregate } from './escalation.aggregate.js';

@Module({
  imports: [CqrxModule.forFeature([EscalationAggregate])],
})
export class EscalationDomainModule {}
