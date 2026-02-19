import { Global, Module } from '@nestjs/common';
import { BridgeService } from './bridge.service.js';

@Global()
@Module({
  providers: [BridgeService],
  exports: [BridgeService],
})
export class OpenBankingModule {}
