import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { RentCallAggregate } from './rent-call.aggregate.js';
import { GenerateRentCallsForMonthHandler } from './commands/generate-rent-calls-for-month.handler.js';

@Module({
  imports: [CqrxModule.forFeature([RentCallAggregate])],
  providers: [GenerateRentCallsForMonthHandler],
})
export class RentCallDomainModule {}
