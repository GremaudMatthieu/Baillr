import { Global, Module } from '@nestjs/common';
import { InseeApiService } from './insee-api.service.js';

@Global()
@Module({
  providers: [InseeApiService],
  exports: [InseeApiService],
})
export class InseeModule {}
