import { Controller, Get } from '@nestjs/common';
import { Public } from '@infrastructure/auth/public.decorator';
import { Ar24Service } from '@infrastructure/registered-mail/ar24.service';

@Controller('registered-mail')
export class GetRegisteredMailStatusController {
  constructor(private readonly ar24: Ar24Service) {}

  @Public()
  @Get('status')
  handle(): { available: boolean } {
    return { available: this.ar24.isAvailable };
  }
}
