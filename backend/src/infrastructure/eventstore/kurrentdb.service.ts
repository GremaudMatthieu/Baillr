import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { KurrentDBClient } from '@kurrent/kurrentdb-client';

@Injectable()
export class KurrentDbService implements OnModuleDestroy {
  private readonly logger = new Logger(KurrentDbService.name);
  readonly client: KurrentDBClient;

  constructor() {
    const connectionString =
      process.env.KURRENTDB_CONNECTION_STRING ?? 'kurrentdb://localhost:2113?tls=false';
    this.client = KurrentDBClient.connectionString(connectionString);
    this.logger.log('KurrentDB client initialized');
  }

  async onModuleDestroy() {
    await this.client.dispose();
    this.logger.log('KurrentDB client disposed');
  }
}
