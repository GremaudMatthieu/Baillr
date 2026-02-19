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
import { RecoveryModule } from './recovery/recovery.module';
import { IndexationModule } from './indexation/indexation.module';
import { EntityPresentationModule } from './presentation/entity/entity-presentation.module';
import { PropertyPresentationModule } from './presentation/property/property-presentation.module';
import { TenantPresentationModule } from './presentation/tenant/tenant-presentation.module';
import { LeasePresentationModule } from './presentation/lease/lease-presentation.module';
import { RentCallPresentationModule } from './presentation/rent-call/rent-call-presentation.module';
import { EscalationPresentationModule } from './presentation/escalation/escalation-presentation.module';
import { BankStatementPresentationModule } from './presentation/bank-statement/bank-statement-presentation.module';
import { InseeIndexPresentationModule } from './presentation/insee-index/insee-index-presentation.module';
import { RevisionPresentationModule } from './presentation/revision/revision-presentation.module';
import { AnnualChargesPresentationModule } from './presentation/annual-charges/annual-charges-presentation.module';
import { ChargeCategoryPresentationModule } from './presentation/charge-category/charge-category-presentation.module';
import { WaterMeterReadingsPresentationModule } from './presentation/water-meter-readings/water-meter-readings-presentation.module';
import { ChargeRegularizationPresentationModule } from './presentation/charge-regularization/charge-regularization-presentation.module';
import { OpenBankingPresentationModule } from './presentation/open-banking/open-banking-presentation.module';
import { AccountingPresentationModule } from './presentation/accounting/accounting-presentation.module';
import { AlertPreferencePresentationModule } from './presentation/alert-preference/alert-preference-presentation.module';
import { DocumentModule } from './infrastructure/document/document.module';
import { EmailModule } from './infrastructure/email/email.module';
import { BankImportModule } from './infrastructure/bank-import/bank-import.module';
import { OpenBankingModule } from './infrastructure/open-banking/open-banking.module';
import { SchedulingModule } from './infrastructure/scheduling/scheduling.module';
import { ScheduleModule } from '@nestjs/schedule';
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
    EmailModule,
    BankImportModule,
    OpenBankingModule,
    PortfolioModule,
    TenancyModule,
    BillingModule,
    RecoveryModule,
    IndexationModule,
    EntityPresentationModule,
    PropertyPresentationModule,
    TenantPresentationModule,
    LeasePresentationModule,
    RentCallPresentationModule,
    EscalationPresentationModule,
    BankStatementPresentationModule,
    InseeIndexPresentationModule,
    RevisionPresentationModule,
    AnnualChargesPresentationModule,
    ChargeCategoryPresentationModule,
    WaterMeterReadingsPresentationModule,
    ChargeRegularizationPresentationModule,
    OpenBankingPresentationModule,
    AccountingPresentationModule,
    AlertPreferencePresentationModule,
    ScheduleModule.forRoot(),
    SchedulingModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ClerkAuthGuard }],
})
export class AppModule {}
