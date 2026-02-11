import { Module } from '@nestjs/common';
import { EntityDomainModule } from './entity/entity.module.js';
import { PropertyDomainModule } from './property/property.module.js';

@Module({
  imports: [EntityDomainModule, PropertyDomainModule],
  exports: [EntityDomainModule, PropertyDomainModule],
})
export class PortfolioModule {}
