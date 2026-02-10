import { Event } from 'nestjs-cqrx';

export interface BankAccountRemovedData {
  id: string;
  entityId: string;
  accountId: string;
}

export class BankAccountRemoved extends Event<BankAccountRemovedData> {
  constructor(data: BankAccountRemovedData) {
    super(data);
  }
}
