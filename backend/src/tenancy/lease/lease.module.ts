import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { LeaseAggregate } from './lease.aggregate.js';
import { CreateALeaseHandler } from './commands/create-a-lease.handler.js';
import { ConfigureLeaseBillingLinesHandler } from './commands/configure-lease-billing-lines.handler.js';
import { ConfigureLeaseRevisionParametersHandler } from './commands/configure-lease-revision-parameters.handler.js';

@Module({
  imports: [CqrxModule.forFeature([LeaseAggregate])],
  providers: [CreateALeaseHandler, ConfigureLeaseBillingLinesHandler, ConfigureLeaseRevisionParametersHandler],
})
export class LeaseDomainModule {}
