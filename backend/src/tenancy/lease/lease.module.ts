import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { LeaseAggregate } from './lease.aggregate.js';
import { CreateALeaseHandler } from './commands/create-a-lease.handler.js';

@Module({
  imports: [CqrxModule.forFeature([LeaseAggregate])],
  providers: [CreateALeaseHandler],
})
export class LeaseDomainModule {}
