import { Module } from '@nestjs/common';
import { RentCallDomainModule } from './rent-call/rent-call.module.js';

@Module({
  imports: [RentCallDomainModule],
  exports: [RentCallDomainModule],
})
export class BillingModule {}
