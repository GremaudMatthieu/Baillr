import { Global, Module } from '@nestjs/common';
import { Ar24Service } from './ar24.service.js';

@Global()
@Module({
  providers: [Ar24Service],
  exports: [Ar24Service],
})
export class RegisteredMailModule {}
