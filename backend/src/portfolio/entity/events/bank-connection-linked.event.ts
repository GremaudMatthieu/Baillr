import { Event } from 'nestjs-cqrx';

export interface BankConnectionLinkedData {
  id: string;
  entityId: string;
  connectionId: string;
  bankAccountId: string;
  provider: string;
  institutionId: string;
  institutionName: string;
  requisitionId: string;
  agreementId: string;
  agreementExpiry: string;
  accountIds: string[];
  status: string;
}

export class BankConnectionLinked extends Event<BankConnectionLinkedData> {
  constructor(data: BankConnectionLinkedData) {
    super(data);
  }
}
