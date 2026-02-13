import { Global, Module } from '@nestjs/common';
import { BankStatementParserService } from './bank-statement-parser.service.js';

@Global()
@Module({
  providers: [BankStatementParserService],
  exports: [BankStatementParserService],
})
export class BankImportModule {}
