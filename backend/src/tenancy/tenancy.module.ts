import { Module } from '@nestjs/common';
import { TenantDomainModule } from './tenant/tenant.module.js';
import { LeaseDomainModule } from './lease/lease.module.js';

@Module({
  imports: [TenantDomainModule, LeaseDomainModule],
  exports: [TenantDomainModule, LeaseDomainModule],
})
export class TenancyModule {}
