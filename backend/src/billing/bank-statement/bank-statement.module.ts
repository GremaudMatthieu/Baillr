import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { BankStatementAggregate } from './bank-statement.aggregate.js';

@Module({
  imports: [CqrxModule.forFeature([BankStatementAggregate])],
})
export class BankStatementModule {}
