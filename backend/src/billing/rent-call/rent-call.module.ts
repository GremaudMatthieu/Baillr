import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { RentCallAggregate } from './rent-call.aggregate.js';

@Module({
  imports: [CqrxModule.forFeature([RentCallAggregate])],
})
export class RentCallDomainModule {}
