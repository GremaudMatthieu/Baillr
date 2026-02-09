import { Module } from '@nestjs/common';
import { EntityDomainModule } from './entity/entity.module.js';

@Module({
  imports: [EntityDomainModule],
  exports: [EntityDomainModule],
})
export class PortfolioModule {}
