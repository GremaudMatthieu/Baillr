import { Event } from 'nestjs-cqrx';

export interface BankConnectionExpiredData {
  id: string;
  entityId: string;
  connectionId: string;
}

export class BankConnectionExpired extends Event<BankConnectionExpiredData> {
  constructor(data: BankConnectionExpiredData) {
    super(data);
  }
}
