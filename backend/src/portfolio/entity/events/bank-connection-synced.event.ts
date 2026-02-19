import { Event } from 'nestjs-cqrx';

export interface BankConnectionSyncedData {
  id: string;
  entityId: string;
  connectionId: string;
  lastSyncedAt: string;
}

export class BankConnectionSynced extends Event<BankConnectionSyncedData> {
  constructor(data: BankConnectionSyncedData) {
    super(data);
  }
}
