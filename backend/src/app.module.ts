import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrxModule } from 'nestjs-cqrx';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EventStoreModule } from './infrastructure/eventstore/eventstore.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { ClerkAuthGuard } from './infrastructure/auth/clerk-auth.guard';
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
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ClerkAuthGuard }],
})
export class AppModule {}
