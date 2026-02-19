import { Controller, Get } from '@nestjs/common';
import { BridgeService } from '@infrastructure/open-banking/bridge.service';

@Controller('open-banking')
export class GetOpenBankingStatusController {
  constructor(private readonly bridge: BridgeService) {}

  @Get('status')
  handle(): { available: boolean } {
    return { available: this.bridge.isAvailable };
  }
}
