import { Module } from '@nestjs/common';
import { TenantDomainModule } from './tenant/tenant.module.js';

@Module({
  imports: [TenantDomainModule],
  exports: [TenantDomainModule],
})
export class TenancyModule {}
