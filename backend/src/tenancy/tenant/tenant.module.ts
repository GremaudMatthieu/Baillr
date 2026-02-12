import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { TenantAggregate } from './tenant.aggregate.js';
import { RegisterATenantHandler } from './commands/register-a-tenant.handler.js';
import { UpdateATenantHandler } from './commands/update-a-tenant.handler.js';

@Module({
  imports: [CqrxModule.forFeature([TenantAggregate])],
  providers: [RegisterATenantHandler, UpdateATenantHandler],
})
export class TenantDomainModule {}
