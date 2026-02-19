import { Event } from 'nestjs-cqrx';

export interface BankConnectionDisconnectedData {
  id: string;
  entityId: string;
  connectionId: string;
}

export class BankConnectionDisconnected extends Event<BankConnectionDisconnectedData> {
  constructor(data: BankConnectionDisconnectedData) {
    super(data);
  }
}
