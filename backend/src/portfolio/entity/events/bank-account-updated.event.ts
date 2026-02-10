import { Event } from 'nestjs-cqrx';

export interface BankAccountUpdatedData {
  id: string;
  entityId: string;
  accountId: string;
  label?: string;
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;
  isDefault?: boolean;
}

export class BankAccountUpdated extends Event<BankAccountUpdatedData> {
  constructor(data: BankAccountUpdatedData) {
    super(data);
  }
}
