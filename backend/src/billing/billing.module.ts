import { Module } from '@nestjs/common';
import { RentCallDomainModule } from './rent-call/rent-call.module.js';
import { BankStatementModule } from './bank-statement/bank-statement.module.js';
import { PaymentMatchingModule } from './payment-matching/payment-matching.module.js';

@Module({
  imports: [RentCallDomainModule, BankStatementModule, PaymentMatchingModule],
  exports: [RentCallDomainModule, BankStatementModule, PaymentMatchingModule],
})
export class BillingModule {}
