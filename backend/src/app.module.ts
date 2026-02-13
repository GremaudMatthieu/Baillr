import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrxModule } from 'nestjs-cqrx';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EventStoreModule } from './infrastructure/eventstore/eventstore.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { ClerkAuthGuard } from './infrastructure/auth/clerk-auth.guard';
import { PortfolioModule } from './portfolio/portfolio.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { BillingModule } from './billing/billing.module';
import { EntityPresentationModule } from './presentation/entity/entity-presentation.module';
import { PropertyPresentationModule } from './presentation/property/property-presentation.module';
import { TenantPresentationModule } from './presentation/tenant/tenant-presentation.module';
import { LeasePresentationModule } from './presentation/lease/lease-presentation.module';
import { RentCallPresentationModule } from './presentation/rent-call/rent-call-presentation.module';
import { DocumentModule } from './infrastructure/document/document.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    CqrxModule.forRoot({
      eventstoreConnectionString: process.env.KURRENTDB_CONNECTION_STRING,
    }),
    DatabaseModule,
    EventStoreModule,
    AuthModule,
    DocumentModule,
    PortfolioModule,
    TenancyModule,
    BillingModule,
    EntityPresentationModule,
    PropertyPresentationModule,
    TenantPresentationModule,
    LeasePresentationModule,
    RentCallPresentationModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ClerkAuthGuard }],
})
export class AppModule {}
