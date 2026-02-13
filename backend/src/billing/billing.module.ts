import { Module } from '@nestjs/common';
import { RentCallDomainModule } from './rent-call/rent-call.module.js';
import { BankStatementModule } from './bank-statement/bank-statement.module.js';

@Module({
  imports: [RentCallDomainModule, BankStatementModule],
  exports: [RentCallDomainModule, BankStatementModule],
})
export class BillingModule {}
